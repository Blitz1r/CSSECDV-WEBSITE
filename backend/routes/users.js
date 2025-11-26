const express = require('express');
const { requireAuth } = require('../middleware/authorization');
const { 
    getAllUsers,
    getManagersAndAdministrators,
    getUsersByRole,
    getUserById,
    createUser,
    updateUserRole,
    deleteUser
} = require('../controllers/userController');
const router = express.Router();

router.use(requireAuth);

// Middleware to check if user is Admin
const isAdministrator = (req, res, next) => {
    if (!req.session || req.session.role !== 'Administrator') {
        return res.status(403).json({ 
            success: false, 
            message: 'Forbidden. Admin access required.' 
        });
    }
    next();
};

// Middleware to check if user is Manager or Admin
const isManagerOrAdministrator = (req, res, next) => {
    if (!req.session || !['Manager', 'Administrator'].includes(req.session.role)) {
        return res.status(403).json({ 
            success: false, 
            message: 'Forbidden. Manager or Admin access required.' 
        });
    }
    next();
};

router.get('/managers-administrators',isManagerOrAdministrator, getManagersAndAdministrators);

// GET users by specific role
// Example: /api/users/role/Manager
router.get('/role/:role', isManagerOrAdministrator, getUsersByRole);

// CREATE new user (Administrator only)
// Example: POST /api/users
router.post('/', isAdministrator, createUser);

// GET single user by ID
// Example: /api/users/507f1f77bcf86cd799439011
router.get('/:id', isManagerOrAdministrator, getUserById);

// UPDATE user role (Administrator only)
// Example: PUT /api/users/507f1f77bcf86cd799439011/role
router.put('/:id/role', isAdministrator, updateUserRole);

// DELETE user (Administrator only)
// Example: DELETE /api/users/507f1f77bcf86cd799439011
router.delete('/:id', isAdministrator, deleteUser);
module.exports = router;