const bcrypt = require('bcrypt');
const crypto = require('crypto');
const User = require('../models/UserModel');
const { validatePassword, describePolicy } = require('../utils/passwordPolicy');
const { addLog } = require('./loggerController');

// Account lockout configuration
const MAX_LOGIN_ATTEMPTS = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5', 10);
const LOCK_TIME_MINUTES = parseInt(process.env.LOCK_TIME_MINUTES || '15', 10);
const PASSWORD_HISTORY_LIMIT = parseInt(process.env.PASSWORD_HISTORY_LIMIT || '5', 10);
const LOCK_TIME_MS = LOCK_TIME_MINUTES * 60 * 1000;

// In-memory pending map: token -> { userId, expires }
const pendingSecurity = new Map();
const SECURITY_TOKEN_MS = 5 * 60 * 1000; // 5 minutes

function createSecurityToken(userId) {
    const token = crypto.randomBytes(24).toString('hex');
    pendingSecurity.set(token, { userId, expires: Date.now() + SECURITY_TOKEN_MS });
    return token;
}

function consumeSecurityToken(token) {
    const entry = pendingSecurity.get(token);
    if (!entry) return null;
    if (entry.expires < Date.now()) {
        pendingSecurity.delete(token);
        return null;
    }
    pendingSecurity.delete(token);
    return entry.userId;
}

// POST /api/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            await addLog({ eventType: 'auth_attempt', action: 'Login failed: unknown email', level: 'SECURITY', meta: { email } });
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // If account is locked, block login
        if (user.lockUntil && user.lockUntil.getTime && user.lockUntil.getTime() > Date.now()) {
            const msRemaining = user.lockUntil.getTime() - Date.now();
            const minutes = Math.ceil(msRemaining / 60000);
            await addLog({ eventType: 'auth_attempt', action: 'Login blocked: account locked', level: 'SECURITY', userEmail: user.email, userId: user._id.toString(), meta: { minutesRemaining: minutes } });
            return res.status(423).json({ success: false, message: `Account locked. Try again in about ${minutes} minute(s).` });
        }

        let passwordMatches = false;
        if (user.password && user.password.startsWith('$2')) {
            // Already hashed
            passwordMatches = await bcrypt.compare(password, user.password);
        } else {
            // Plaintext legacy password; compare directly then upgrade to hash and initialize history
            if (password === user.password) {
                passwordMatches = true;
                const hashed = await bcrypt.hash(password, 10);
                user.password = hashed;
                if (!user.passwordHistory) {
                    user.passwordHistory = [];
                }
                if (!user.passwordHistory.includes(hashed)) {
                    user.passwordHistory.unshift(hashed);
                }
                // Trim history to limit if env var set (mirrors model constant)
                const limit = PASSWORD_HISTORY_LIMIT;
                if (user.passwordHistory.length > limit) {
                    user.passwordHistory = user.passwordHistory.slice(0, limit);
                }
                await user.save();
            }
        }

        if (!passwordMatches) {
            // Increment failed attempts and lock if threshold reached
            user.failedLoginAttempts = (user.failedLoginAttempts || 0) + 1;
            if (user.failedLoginAttempts >= MAX_LOGIN_ATTEMPTS) {
                user.lockUntil = new Date(Date.now() + LOCK_TIME_MS);
                user.failedLoginAttempts = 0; // reset counter after locking
                user.lastFailedLoginAt = new Date();
                user.lastUseAt = new Date();
                await user.save();
                await addLog({ eventType: 'auth_attempt', action: 'Account locked after max failures', level: 'SECURITY', userEmail: user.email, userId: user._id.toString(), meta: { maxAttempts: MAX_LOGIN_ATTEMPTS } });
                return res.status(423).json({ success: false, message: 'Account locked due to too many failed attempts. Try again later.' });
            } else {
                await user.save();
                await addLog({ eventType: 'auth_attempt', action: 'Login failed: invalid password', level: 'SECURITY', userEmail: user.email, userId: user._id.toString(), meta: { failedLoginAttempts: user.failedLoginAttempts } });
                user.lastFailedLoginAt = new Date();
                user.lastUseAt = new Date();
                await user.save();
                return res.status(401).json({ success: false, message: 'Invalid email or password' });
            }
        }

        // Ensure role exists (backfill legacy users without role)
        if (!user.role) {
            user.role = 'Guest';
        }

        // Successful password: clear lock counters
        if (user.failedLoginAttempts || user.lockUntil) {
            user.failedLoginAttempts = 0;
            user.lockUntil = null;
        }
        await user.save();

        // Two-step: issue security token & question; session not yet established
        const token = createSecurityToken(user._id.toString());
        await addLog({ eventType: 'auth_attempt', action: 'Password phase passed; security question issued', level: 'INFO', userEmail: user.email, userId: user._id.toString()});
        return res.json({
            success: true,
            securityRequired: true,
            token,
            email: user.email,
            securityQuestion: user.securityQuestion
        });
    } catch (error) {
        console.error('Error during login:', error);
        await addLog({ eventType: 'error', action: 'Login controller exception', level: 'ERROR', meta: { message: error.message } });
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

// POST /api/login/reset-password
const resetPassword = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
    }
    try {
        const policy = validatePassword(password);
        if (!policy.valid) {
            await addLog({ eventType: 'validation_failure', action: 'Password reset failed policy', level: 'WARN', userEmail: email, meta: { errors: policy.errors } });
            return res.status(400).json({ message: policy.errors.join('\n'), policy: describePolicy() });
        }
        const user = await User.findOne({ email });
        if (!user) {
            await addLog({ eventType: 'validation_failure', action: 'Password reset unknown email', level: 'WARN', meta: { email } });
            return res.status(404).json({ message: 'No account found with that email' });
        }
        // Enforce minimum password age
        if (!user.canChangePassword()) {
            const minutesLeft = user.passwordAgeRemainingMinutes();
            return res.status(400).json({ message: `Password was changed too recently. Try again in ${minutesLeft} minute(s).` });
        }
        // Prevent password reuse against current and history
        if (await user.isPasswordReused(password)) {
            await addLog({ eventType: 'validation_failure', action: 'Password reuse attempt', level: 'SECURITY', userEmail: user.email, userId: user._id.toString()});
            return res.status(400).json({ message: 'Cannot reuse a previous password. Choose a new one.', policy: describePolicy() });
        }
        const oldHash = user.password && user.password.startsWith('$2') ? user.password : null;
        const newHash = await bcrypt.hash(password, 10);
        // Maintain history (store old hash if exists and not already stored)
        if (oldHash) {
            if (!user.passwordHistory) user.passwordHistory = [];
            if (!user.passwordHistory.includes(oldHash)) {
                user.passwordHistory.unshift(oldHash);
            }
        }
        user.password = newHash;
        if (!user.passwordHistory) user.passwordHistory = [];
        // Optionally also track new hash for future comparisons (not required if checking current password separately)
        if (!user.passwordHistory.includes(newHash)) {
            user.passwordHistory.unshift(newHash);
        }
        const limit = parseInt(process.env.PASSWORD_HISTORY_LIMIT || '5', 10);
        if (user.passwordHistory.length > limit) {
            user.passwordHistory = user.passwordHistory.slice(0, limit);
        }
        user.lastPasswordChange = new Date();
        await user.save();
        await addLog({ eventType: 'auth_attempt', action: 'Password reset successful', level: 'INFO', userEmail: user.email, userId: user._id.toString()});
        return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Password reset error:', error);
        await addLog({ eventType: 'error', action: 'Password reset controller exception', level: 'ERROR', meta: { message: error.message } });
        return res.status(500).json({ message: 'Server error' });
    }
};

// POST /api/login/logout
const logoutUser = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        // express-session default cookie name is 'connect.sid'
        res.clearCookie('connect.sid', { httpOnly: true, secure: false });
        return res.json({ success: true });
    });
};
const verifyUserAccess = async (req, res) => {
    const { answer } = req.body;
    
    if (!answer) {
        return res.status(400).json({ 
            success: false, 
            message: 'Answer is required' 
        });
    }

    try {
        // Get the current logged-in user from session
        const userEmail = req.session?.email;
        const userId = req.session?.userId;

        if (!userEmail || !userId) {
            return res.status(401).json({ 
                success: false, 
                message: 'Not authenticated' 
            });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Verify the security answer (case-insensitive comparison)
        if (String(user.securityAnswer).trim().toLowerCase() !== String(answer).trim().toLowerCase()) {
            await addLog({ 
                eventType: 'auth_attempt', 
                action: 'User management access denied: incorrect security answer', 
                level: 'SECURITY', 
                userEmail: user.email, 
                userId: user._id.toString()
            });
            return res.status(401).json({ 
                success: false, 
                message: 'Incorrect answer' 
            });
        }

        // Success - log the access
        await addLog({ 
            eventType: 'auth_attempt', 
            action: 'User management access granted', 
            level: 'INFO', 
            userEmail: user.email, 
            userId: user._id.toString()
        });

        return res.json({ 
            success: true, 
            message: 'Access granted' 
        });

    } catch (error) {
        console.error('Verify user access error:', error);
        await addLog({ 
            eventType: 'error', 
            action: 'User access verification failed', 
            level: 'ERROR', 
            meta: { message: error.message } 
        });
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};
// GET /api/login/session - return current authenticated session info
const sessionInfo = (req, res) => {
    if (!req.session || !req.session.userId) {
        return res.status(401).json({ authenticated: false });
    }
    return res.json({
        authenticated: true,
        user: {
            email: req.session.email,
            role: req.session.role || 'Guest'
        },
        previousLastUseAt: req.session.previousLastUseAt || null
    });
};
const requestSecurity = async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email required' });
    
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });
        
        // Generate token
        const token = createSecurityToken(user._id.toString());
        return res.json({ success: true, token, message: 'Security check initiated' });
    } catch (err) {
        return res.status(500).json({ success: false, message: err.message });
    }
};
const getSecurityQuestion = async (req, res) => {
    // Frontend sends GET /?email=... so we look in req.query
    const email = req.query.email || req.body.email; 

    if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }
    try {
        // Just look up the user. DO NOT consume the token here.
        const user = await User.findOne({ email });
        if (!user) {   
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        return res.json({ success: true, securityQuestion: user.securityQuestion });
    } catch (error) {
        console.error('Get security question error:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
        
const verifySecurityAnswer = async (req, res) => {
    const { token, answer } = req.body;
    if (!token || !answer) {
        return res.status(400).json({ success: false, message: 'Email and answer are required' });
    }
    try {
        const userId = consumeSecurityToken(token);
        if (!userId) {
            return res.status(400).json({ success: false, message: 'Invalid Re-Enter Username and Password' });
        }
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        if (String(user.securityAnswer).trim().toLowerCase() !== String(answer).trim().toLowerCase()) {
            await addLog({ eventType: 'auth_attempt', action: 'Security question failed', level: 'SECURITY', userEmail: user.email, userId: user._id.toString()});
            return res.status(401).json({ success: false, message: 'Incorrect security answer' });
        }
        // Capture previous last use BEFORE updating
        const previousLastUse = user.lastUseAt ? user.lastUseAt.toISOString() : null;
        // Update timestamps
        const now = new Date();
        user.lastSuccessfulLoginAt = now;
        user.lastUseAt = now;
        await user.save();
        // Establish session now
        req.session.userId = user._id.toString();
        req.session.email = user.email;
        req.session.role = user.role;
        req.session.previousLastUseAt = previousLastUse;
        await addLog({ eventType: 'auth_attempt', action: 'Login successful', level: 'INFO', userEmail: user.email, userId: user._id.toString(), meta: { previousLastUse } });
        return res.json({ success: true, user: { email: user.email, role: user.role }, previousLastUseAt: previousLastUse });
    } catch (error) {
        console.error('Security verification error:', error);
        await addLog({ eventType: 'error', action: 'Security verification exception', level: 'ERROR', meta: { message: error.message } });
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};
const verifySecurityAnswerForgot = async (req, res) => {
    const { token, answer } = req.body;
    if (!token || !answer) return res.status(400).json({ success: false, message: 'Required fields missing' });

    try {
        const userId = consumeSecurityToken(token); // Deletes old token
        if (!userId) return res.status(400).json({ success: false, message: 'Session expired. Please start over.' });

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        // Check Answer
        if (String(user.securityAnswer).trim().toLowerCase() !== String(answer).trim().toLowerCase()) {
            await addLog({ eventType: 'auth_attempt', action: 'Security failed', level: 'WARN', userEmail: user.email });
            
            // IMPORTANT: Generate NEW token so user can try again
            const newToken = createSecurityToken(user._id.toString());
            
            return res.status(401).json({ 
                success: false, 
                message: 'Incorrect answer',
                newToken: newToken // Frontend needs this
            });
        }

        // Success - Update User & Session
        const now = new Date();
        user.lastSuccessfulLoginAt = now;
        user.lastUseAt = now;
        await user.save();
        
        // Allow password reset or login
        req.session.userId = user._id.toString();
        req.session.email = user.email;
        req.session.role = user.role;
        
        return res.json({ success: true, user: { email: user.email } });

    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = { 
    loginUser,
    resetPassword,
    logoutUser,
    sessionInfo,
    verifySecurityAnswer,
    getSecurityQuestion,
    requestSecurity,
    verifySecurityAnswerForgot,
    verifyUserAccess
};
