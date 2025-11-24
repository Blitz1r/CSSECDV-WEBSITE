// Authentication and Role-based Authorization Middleware
// Usage examples:
// const { requireAuth, requireRole } = require('./middleware/auth');
// router.get('/admin-only', requireAuth, requireRole('Administrator'), (req,res)=>{ ... });

function requireAuth(req, res, next) {
    if (!req.session || !req.session.userId) {
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
            return res.status(403).json({ success: false, message: 'Insufficient role privileges' });
        }
        next();
    };
}

module.exports = { requireAuth, requireRole };