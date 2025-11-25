const mongoose = require('mongoose');

const loggerSchema = new mongoose.Schema({
    userEmail: { type: String },
    userId: { type: String },
    eventType: { type: String, required: true }, // e.g., auth_attempt, validation_failure, access_denied, error
    action: { type: String, required: true }, // human readable summary
    level: { type: String, enum: ['INFO','WARN','ERROR','SECURITY'], default: 'INFO' },
    meta: { type: Object },
    timestamp: { type: Date, default: Date.now }
}, { timestamps: false });

module.exports = mongoose.model('logs', loggerSchema);