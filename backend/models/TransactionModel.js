// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    name: { type: String, required: true }, // e.g., item name or action subject
    action: { type: String, required: true }, // description of what happened
    timestamp: { type: Date, default: Date.now }, // When the transaction occurred
});

module.exports = mongoose.model('Transaction', transactionSchema);