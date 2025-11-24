const express = require('express');
const { getRecentTransactions } = require('../controllers/transactionController');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth);

// GET route to fetch 5 transactions
router.get('/', getRecentTransactions);

module.exports = router;
