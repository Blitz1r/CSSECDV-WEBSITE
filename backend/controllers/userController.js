const User = require('../models/UserModel');
const bcrypt = require('bcrypt');
const { validatePassword } = require('../utils/passwordPolicy');
const { addLog } = require('./loggerController');

// GET all users (with optional role filtering)
const getAllUsers = async (req, res) => {
    try {
        const { role } = req.query; // Optional: ?role=Manager or ?role=Administrator
        
        let filter = {};
        if (role) {
            filter.role = role;
        }

        const users = await User.find(filter)
            .select('-password -passwordHistory -securityAnswer') // Exclude sensitive fields
            .sort({ createdAt: -1 }); // Newest first

        await addLog({ 
            eventType: 'user_query', 
            action: 'Retrieved users list', 
            level: 'INFO', 
            userId: req.session?.userId,
            meta: { count: users.length, roleFilter: role || 'all' }
        });

        return res.json({ 
            success: true, 
            users,
            count: users.length 
        });
    } catch (error) {
        console.error('Get all users error:', error);
        await addLog({ 
            eventType: 'error', 
            action: 'Failed to retrieve users', 
            level: 'ERROR', 
            meta: { message: error.message } 
        });
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// GET users by specific roles (Managers and Administrators)
const getManagersAndAdministrators = async (req, res) => {
    try {
        const users = await User.find({ 
            role: { $in: ['Manager', 'Administrator'] } 
        })
        .select('-password -passwordHistory -securityAnswer')
        .sort({ role: 1, email: 1 }); // Sort by role, then email

        await addLog({ 
            eventType: 'user_query', 
            action: 'Retrieved managers and administrators', 
            level: 'INFO', 
            userId: req.session?.userId,
            meta: { count: users.length }
        });

        return res.json({ 
            success: true, 
            users,
            count: users.length 
        });
    } catch (error) {
        console.error('Get managers and administrators error:', error);
        await addLog({ 
            eventType: 'error', 
            action: 'Failed to retrieve managers and administrators', 
            level: 'ERROR', 
            meta: { message: error.message } 
        });
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// GET users by role (flexible)
const getUsersByRole = async (req, res) => {
    try {
        const { role } = req.params; // e.g., /users/role/Manager

        if (!role) {
            return res.status(400).json({ 
                success: false, 
                message: 'Role parameter is required' 
            });
        }

        const users = await User.find({ role })
            .select('-password -passwordHistory -securityAnswer')
            .sort({ email: 1 });

        await addLog({ 
            eventType: 'user_query', 
            action: `Retrieved users by role: ${role}`, 
            level: 'INFO', 
            userId: req.session?.userId,
            meta: { role, count: users.length }
        });

        return res.json({ 
            success: true, 
            users,
            role,
            count: users.length 
        });
    } catch (error) {
        console.error('Get users by role error:', error);
        await addLog({ 
            eventType: 'error', 
            action: 'Failed to retrieve users by role', 
            level: 'ERROR', 
            meta: { message: error.message } 
        });
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// GET single user by ID
const getUserById = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id)
            .select('-password -passwordHistory -securityAnswer');

        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        await addLog({ 
            eventType: 'user_query', 
            action: 'Retrieved user by ID', 
            level: 'INFO', 
            userId: req.session?.userId,
            meta: { queriedUserId: id }
        });

        return res.json({ 
            success: true, 
            user 
        });
    } catch (error) {
        console.error('Get user by ID error:', error);
        await addLog({ 
            eventType: 'error', 
            action: 'Failed to retrieve user by ID', 
            level: 'ERROR', 
            meta: { message: error.message } 
        });
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// CREATE new user (Administrator only)
const createUser = async (req, res) => {
    try {
        const { email, password, role, securityAnswer } = req.body;

        // Validate required fields
        if (!email || !password || !role || !securityAnswer) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required: email, password, role, securityAnswer' 
            });
        }
        // Validate password policy
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be 6+ chars and contain a number and special character (!@#$%^&*)' 
            });
        }

        // Validate role
        const validRoles = ['Administrator', 'Manager'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
            });
        }

        // Validate password policy
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            return res.status(400).json({ 
                success: false, 
                message: passwordCheck.errors.join('. ') 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                message: 'User with this email already exists' 
            });
        }

        // Create new user with the default security question
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            password: hashedPassword,
            role,
            securityQuestion: 'What is your most memorable moment?',
            securityAnswer,
            passwordHistory: [hashedPassword],
            lastPasswordChange: new Date()
        });

        await newUser.save();

        await addLog({ 
            eventType: 'user_created', 
            action: `New user created: ${email}`, 
            level: 'INFO', 
            userId: req.session?.userId,
            meta: { newUserId: newUser._id.toString(), role }
        });

        return res.status(201).json({ 
            success: true, 
            message: 'User created successfully',
            user: {
                id: newUser._id,
                email: newUser.email,
                role: newUser.role,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        await addLog({ 
            eventType: 'error', 
            action: 'Failed to create user', 
            level: 'ERROR', 
            meta: { message: error.message } 
        });
        return res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
};
const createPublicUser = async (req, res) => {
    try {
        const { email, password, securityAnswer } = req.body;

        // Validate required fields
        if (!email || !password || !securityAnswer) {
            return res.status(400).json({ 
                success: false, 
                message: 'All fields are required: email, password, securityAnswer' 
            });
        }
        // Validate password policy
        const passwordRegex = /^(?=.*[0-9])(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,}$/;
        if (!passwordRegex.test(password)) {
            return res.status(400).json({ 
                success: false, 
                message: 'Password must be 6+ chars and contain a number and special character (!@#$%^&*)' 
            });
        }
        const role = 'Guest'; // Default role for public registration
        // Validate password policy
        const passwordCheck = validatePassword(password);
        if (!passwordCheck.valid) {
            return res.status(400).json({ 
                success: false, 
                message: passwordCheck.errors.join('. ') 
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ 
                success: false, 
                message: 'User with this email already exists' 
            });
        }

        // Create new user with the default security question
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({
            email,
            password: hashedPassword,
            role,
            securityQuestion: 'What is your most memorable moment?',
            securityAnswer,
            passwordHistory: [hashedPassword],
            lastPasswordChange: new Date()
        });

        await newUser.save();

        await addLog({ 
            eventType: 'user_created', 
            action: `New user created: ${email}`, 
            level: 'INFO', 
            userId: req.session?.userId,
            meta: { newUserId: newUser._id.toString(), role }
        });

        return res.status(201).json({ 
            success: true, 
            message: 'User created successfully',
            user: {
                id: newUser._id,
                email: newUser.email,
                role: newUser.role,
                createdAt: newUser.createdAt
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        await addLog({ 
            eventType: 'error', 
            action: 'Failed to create user', 
            level: 'ERROR', 
            meta: { message: error.message } 
        });
        return res.status(500).json({ 
            success: false, 
            message: 'Server error: ' + error.message 
        });
    }
};
// UPDATE user role (Administrator only)
const updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;

        const validRoles = ['Administrator', 'Manager'];
        if (!validRoles.includes(role)) {
            return res.status(400).json({ 
                success: false, 
                message: `Invalid role. Must be one of: ${validRoles.join(', ')}` 
            });
        }

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        const oldRole = user.role;
        user.role = role;
        await user.save();

        await addLog({ 
            eventType: 'user_update', 
            action: `Role changed from ${oldRole} to ${role}`, 
            level: 'INFO', 
            userId: req.session?.userId,
            userEmail: user.email,
            meta: { targetUserId: id, oldRole, newRole: role }
        });

        return res.json({ 
            success: true, 
            message: 'User role updated successfully',
            user: {
                id: user._id,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Update user role error:', error);
        await addLog({ 
            eventType: 'error', 
            action: 'Failed to update user role', 
            level: 'ERROR', 
            meta: { message: error.message } 
        });
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

// DELETE user (Administrator only)
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const user = await User.findById(id);
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'User not found' 
            });
        }

        // Prevent deleting self
        if (req.session.userId === id) {
            return res.status(400).json({ 
                success: false, 
                message: 'Cannot delete your own account' 
            });
        }

        const userEmail = user.email;
        const userRole = user.role;

        await User.findByIdAndDelete(id);

        await addLog({ 
            eventType: 'user_deleted', 
            action: `User deleted: ${userEmail}`, 
            level: 'SECURITY', 
            userId: req.session?.userId,
            meta: { deletedUserId: id, deletedUserEmail: userEmail, deletedUserRole: userRole }
        });

        return res.json({ 
            success: true, 
            message: 'User deleted successfully' 
        });
    } catch (error) {
        console.error('Delete user error:', error);
        await addLog({ 
            eventType: 'error', 
            action: 'Failed to delete user', 
            level: 'ERROR', 
            meta: { message: error.message } 
        });
        return res.status(500).json({ 
            success: false, 
            message: 'Server error' 
        });
    }
};

module.exports = {
    getAllUsers,
    getManagersAndAdministrators,
    getUsersByRole,
    getUserById,
    createUser,
    updateUserRole,
    deleteUser,
    createPublicUser,
};

