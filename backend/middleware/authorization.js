// Centralized authorization helper (Objective 2.2.1)
// Provides reusable functions for ownership and role-based access decisions.
// Usage examples in controllers:
//   const { assertOwnershipOrElevated, guestFilterQuery } = require('../middleware/authorization');
//   if (!assertOwnershipOrElevated(req, resource.owner)) return; // response already sent
//   const filter = guestFilterQuery(req); // for list endpoints

const { addLog } = require('../controllers/loggerController');
const { accessPolicy } = require('../policy/accessPolicy');

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

module.exports = {
  guestFilterQuery,
  enforceAction
};

// Enforce action via policy map with ownership fallback.
// resourceName: e.g. 'Item', 'Order'
// action: e.g. 'update', 'delete', 'create', 'read'
// ownerId optional for ownership sensitive actions.
function enforceAction(req, res, resourceName, action, ownerId, actionLabel = `${action} ${resourceName}`) {
  const policy = accessPolicy[resourceName];
  if (!policy) {
    return deny(req, res, 500, 'Policy configuration error', `No policy for resource ${resourceName}`);
  }
  const role = userRole(req);
  const uid = userId(req);
  if (!uid) {
    return deny(req, res, 401, 'Authentication required', 'Unauthenticated access attempt');
  }
  // Determine if ownership variant applies
  let allowedRoles = policy[action];
  if (!allowedRoles) {
    return deny(req, res, 403, 'Forbidden', `Action '${action}' not permitted`, { resource: resourceName });
  }
  if (ownerId && ownerId.toString() === uid && policy[`${action}Own`]) {
    // Prefer Own variant if role matches
    const ownRoles = policy[`${action}Own`];
    if (ownRoles.includes(role)) {
      return true;
    }
  }
  // Non-own or elevated roles
  if (allowedRoles.includes(role)) {
    return true;
  }
  // Ownership fallback for Guests trying to perform elevated action
  if (ownerId && ownerId.toString() === uid) {
    // If they own but role not in elevated list and no Own variant matched earlier
    return deny(req, res, 403, 'Forbidden', 'Not permitted for role', { resource: resourceName, action });
  }
  return deny(req, res, 403, 'Forbidden', 'Role lacks permission', { resource: resourceName, action });
}
