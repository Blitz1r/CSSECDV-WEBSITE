const mongoose = require('mongoose');

const loggerSchema = new mongoose.Schema({
    Useremail: { type: String, required: true }, // e.g., "admin@admin.com"
    action: { type: Object, required: true }, // Specific details of the transaction
    timestamp: { type: Date, default: Date.now }, // When the transaction occurred
});

module.exports = mongoose.model('logs', loggerSchema);