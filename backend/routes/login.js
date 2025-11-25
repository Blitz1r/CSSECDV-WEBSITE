const express = require('express');
const { loginUser, resetPassword, logoutUser, sessionInfo, verifySecurityAnswer } = require('../controllers/loginController');
const router = express.Router();

// Login
router.post('/', loginUser);

// Reset password
router.post('/reset-password', resetPassword);

// Logout
router.post('/logout', logoutUser);

// Session info
router.get('/session', sessionInfo);

// Security answer verification (second step)
router.post('/verify-security', verifySecurityAnswer);

module.exports = router;
