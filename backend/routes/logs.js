const express = require('express');
const { getAllLogs, addLog } = require('../controllers/loggerController');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth);

// GET route to all logs
router.get('/', getAllLogs);
router.get('add', addLog);
module.exports = router;