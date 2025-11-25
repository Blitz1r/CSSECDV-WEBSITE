const Transaction = require('../models/TransactionModel');
const { enforceAction } = require('../middleware/authorization');

// Fetch recent transactions
const getRecentTransactions = async (req, res) => {
    try {
        if (!enforceAction(req, res, 'Transaction', 'read')) return;
        // Retrieve the most recent 5 transactions, sorted by timestamp
        const transactions = await Transaction.find().sort({ timestamp: -1 }).limit(5);
        res.status(200).json({ message: 'Recent transactions retrieved successfully', transactions });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving transactions' });
    }
};
module.exports = { getRecentTransactions };