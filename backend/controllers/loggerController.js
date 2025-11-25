const Log = require('../models/LoggerModel');

// GET /api/logs (admin only via route middleware)
const getAllLogs = async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 }).limit(500); // cap output
        res.status(200).json({ success: true, logs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Unable to retrieve logs' });
    }
};

// Internal logging helper (non-route): accepts event details
const addLog = async ({ eventType, action, level='INFO', userEmail, userId, meta }) => {
    try {
        await Log.create({ eventType, action, level, userEmail, userId, meta });
    } catch (error) {
        // Avoid throwing further: silent fail with console output only
        console.error('Log write failed:', error.message);
    }
};

module.exports = { getAllLogs, addLog };
