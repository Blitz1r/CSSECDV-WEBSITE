const express = require('express');
const { getAllLogs, addLog, logAccessDenied } = require('../controllers/loggerController');
const { requireAuth, requireRole } = require('../middleware/authorization');
const router = express.Router();

// Special endpoint for frontend to report access denials (any authenticated user)
// This must be BEFORE the admin-only middleware
router.post('/access-denied', requireAuth, logAccessDenied);

// Authentication first then admin role enforcement for remaining log routes
router.use(requireAuth, requireRole('Administrator'));

// GET all logs (admin only)
router.get('/', getAllLogs);
// Add a log entry (admin only)
router.post('/add', addLog);

module.exports = router;