const Logs = require('../models/LoggerModel');

// Fetch recent transactions
const getAllLogs = async (req, res) => {
    try {
        const Logs = await Logs.find().sort({ timestamp: -1 });
        res.status(200).json({ message: 'Recent transactions retrieved successfully', transactions });
    } catch (error) {
        res.status(500).json({ message: 'Error retrieving transactions' });
    }
};

const addLog = async (email, action) => {
    try {
        const newLog = new Logs({
            Useremail: email,
            action: action
        });
        await newLog.save();
    } catch (error) {
        console.error('Error adding log:', error);
    }
}
module.exports = { getAllLogs, addLog };
