const bcrypt = require('bcrypt');
const User = require('../models/UserModel');
const { validatePassword, describePolicy } = require('../utils/passwordPolicy');

// POST /api/login
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        let passwordMatches = false;
        if (user.password && user.password.startsWith('$2')) {
            // Already hashed
            passwordMatches = await bcrypt.compare(password, user.password);
        } else {
            // Plaintext legacy password; compare directly then upgrade to hash
            if (password === user.password) {
                passwordMatches = true;
                const hashed = await bcrypt.hash(password, 10);
                user.password = hashed;
                await user.save();
            }
        }

        if (!passwordMatches) {
            return res.status(401).json({ success: false, message: 'Invalid email or password' });
        }

        // Ensure role exists (backfill legacy users without role)
        if (!user.role) {
            user.role = 'Guest';
            await user.save();
        }

        // Set session attributes including role
        req.session.userId = user._id.toString();
        req.session.email = user.email;
        req.session.role = user.role;

        return res.json({ success: true, user: { email: user.email, role: user.role } });
    } catch (error) {
        console.error('Error during login:', error);
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
            return res.status(400).json({ message: policy.errors.join('\n'), policy: describePolicy() });
        }
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ message: 'No account found with that email' });
        }
        const hashed = await bcrypt.hash(password, 10);
        user.password = hashed;
        await user.save();
        return res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        console.error('Password reset error:', error);
        return res.status(500).json({ message: `Server error: ${error.message}` });
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
        }
    });
};

module.exports = { loginUser, resetPassword, logoutUser, sessionInfo };
