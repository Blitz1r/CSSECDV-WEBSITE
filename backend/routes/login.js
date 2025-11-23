const express = require('express');
const { loginUser, resetPassword, logoutUser } = require('../controllers/loginController');
const router = express.Router();

// Login
router.post('/', loginUser);

// Reset password
router.post('/reset-password', resetPassword);

// Logout
router.post('/logout', logoutUser);

module.exports = router;
