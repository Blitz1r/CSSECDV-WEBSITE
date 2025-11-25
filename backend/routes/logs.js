const express = require('express');
const { getAllLogs, addLog } = require('../controllers/loggerController');
const { requireAuth, requireRole } = require('../middleware/authorization');
const router = express.Router();

// Authentication first then admin role enforcement for all log routes
router.use(requireAuth, requireRole('Administrator'));

// GET all logs (admin only)
router.get('/', getAllLogs);
// Add a log entry (admin only)
router.post('/add', addLog);

module.exports = router;