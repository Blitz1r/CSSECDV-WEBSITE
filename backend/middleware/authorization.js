// Centralized authorization helper (Objective 2.2.1)
// Provides reusable functions for ownership and role-based access decisions.
// Usage examples in controllers:
//   const { assertOwnershipOrElevated, guestFilterQuery } = require('../middleware/authorization');
//   if (!assertOwnershipOrElevated(req, resource.owner)) return; // response already sent
//   const filter = guestFilterQuery(req); // for list endpoints

const { addLog } = require('../controllers/loggerController');

function userRole(req) {
  return (req.session && req.session.role) || 'Guest';
}

function userId(req) {
  return req.session && req.session.userId;
}

// Logs and sends a standardized denial response
function deny(req, res, status, message, reason, extraMeta = {}) {
  addLog({
    eventType: 'access_denied',
    action: reason,
    level: 'SECURITY',
    userEmail: req.session ? req.session.email : undefined,
    userId: userId(req),
    meta: { path: req.originalUrl || req.path, ...extraMeta }
  });
  return res.status(status).json({ success: false, code: status, message });
}

// For list endpoints: if Guest limit to own resources, else return empty filter (all)
function guestFilterQuery(req) {
  return userRole(req) === 'Guest' ? { owner: userId(req) } : {};
}

// Assert that either user has elevated role OR owns the resource.
// Returns true if access granted. If denied, sends response and returns false.
function assertOwnershipOrElevated(req, res, ownerId, actionLabel = 'modify resource') {
  const role = userRole(req);
  const uid = userId(req);
  if (!uid) {
    deny(req, res, 401, 'Authentication required', 'Unauthenticated access attempt');
    return false;
  }
  if (role !== 'Guest') {
    return true; // Elevated roles allowed
  }
  if (!ownerId) {
    deny(req, res, 403, 'Forbidden', 'Guest blocked: resource has no owner', { action: actionLabel });
    return false;
  }
  if (ownerId.toString() !== uid) {
    deny(req, res, 403, 'Forbidden', 'Guest blocked: not resource owner', { action: actionLabel });
    return false;
  }
  return true;
}

module.exports = {
  guestFilterQuery,
  assertOwnershipOrElevated
};
