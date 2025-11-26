const express = require('express');
const { createPublicUser } = require('../controllers/userController');
const router = express.Router();


// Create new public user
router.post('/', createPublicUser);

module.exports = router;