const express = require('express');
const { loginUser, resetPassword, logoutUser, sessionInfo, verifySecurityAnswer, getSecurityQuestion,requestSecurity,verifySecurityAnswerForgot } = require('../controllers/loginController');
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

// security question retrival
router.get('/security-question', getSecurityQuestion);

router.post('/request-security', requestSecurity);

router.post('/verify-security-forgot', verifySecurityAnswerForgot);

module.exports = router;
