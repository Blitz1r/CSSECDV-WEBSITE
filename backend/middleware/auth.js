// Authentication and Role-based Authorization Middleware
// Usage examples:
// const { requireAuth, requireRole } = require('./middleware/auth');
// router.get('/admin-only', requireAuth, requireRole('Administrator'), (req,res)=>{ ... });

const { addLog } = require('../controllers/loggerController');

async function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
        await addLog({
            eventType: 'auth_attempt',
            action: 'Unauthenticated access attempt',
            level: 'SECURITY',
            meta: { path: req.path }
        });
        return res.status(401).json({ success: false, message: 'Authentication required' });
    }
    next();
}

function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.session || !req.session.userId) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        const userRole = req.session.role || 'Guest';
        if (allowedRoles.length && !allowedRoles.includes(userRole)) {
            addLog({
                eventType: 'access_denied',
                action: `Role '${userRole}' blocked from resource`,
                level: 'SECURITY',
                userEmail: req.session.email,
                userId: req.session.userId,
                meta: { path: req.path, requiredRoles: allowedRoles }
            });
            return res.status(403).json({ success: false, message: 'Insufficient role privileges' });
        }
        next();
    };
}

module.exports = { requireAuth, requireRole };