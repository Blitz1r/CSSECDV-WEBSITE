const bcrypt = require('bcrypt');
const User = require('../models/UserModel');

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

        // Set session attributes
        req.session.userId = user._id.toString();
        req.session.email = user.email;

        return res.json({ success: true, user: { email: user.email } });
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

module.exports = { loginUser, resetPassword, logoutUser };
