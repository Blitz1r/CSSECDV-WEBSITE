const express = require('express');
const { requireAuth, requireRole } = require('../middleware/authorization');
const { 
    getAllUsers,
    getManagersAndAdministrators,
    getUsersByRole,
    getUserById,
    createUser,
    updateUserRole,
    deleteUser,
} = require('../controllers/userController');
const router = express.Router();

// Apply authentication to all user routes
router.use(requireAuth);

// GET managers and administrators (Manager or Admin access)
router.get('/managers-administrators', requireRole('Manager', 'Administrator'), getManagersAndAdministrators);

// GET users by specific role (Manager or Admin access)
// Example: /api/users/role/Manager
router.get('/role/:role', requireRole('Manager', 'Administrator'), getUsersByRole);

// CREATE new user (Administrator only)
// Example: POST /api/users
router.post('/', requireRole('Administrator'), createUser);

// GET single user by ID (Manager or Admin access)
// Example: /api/users/507f1f77bcf86cd799439011
router.get('/:id', requireRole('Manager', 'Administrator'), getUserById);

// UPDATE user role (Administrator only)
// Example: PUT /api/users/507f1f77bcf86cd799439011/role
router.put('/:id/role', requireRole('Administrator'), updateUserRole);

// DELETE user (Administrator only)
// Example: DELETE /api/users/507f1f77bcf86cd799439011
router.delete('/:id', requireRole('Administrator'), deleteUser);
module.exports = router;

