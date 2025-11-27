const Category = require('../models/CategoryModel');
const { enforceAction } = require('../middleware/authorization');
const { addLog } = require('./loggerController');

// Controller function to handle adding a category
const addCategory = async (req, res) => {
    const { categName } = req.body;

    // Input validation with logging
    if (!categName || typeof categName !== 'string' || categName.trim().length === 0) {
        await addLog({ eventType: 'validation_failure', action: 'Category creation: invalid categName', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { field: 'categName' } });
        return res.status(400).json({ message: 'Category name is required' });
    }

    try {
        if (!enforceAction(req, res, 'Category', 'create')) return;
        const newCategory = new Category({
            categName: categName
        });

        await newCategory.save();
        res.status(201).json({ message: 'Category added successfully', newCategory });
    } catch (error) {
        console.error('Error adding category:', error);
        await addLog({ eventType: 'error', action: 'Category creation failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ message: 'Error adding category' });
    }
};

const removeCategory = async (req, res) => {
    const { id } = req.params;

    // Validate ID format
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
        await addLog({ eventType: 'validation_failure', action: 'Category deletion: invalid ID', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { field: 'id' } });
        return res.status(400).json({ message: 'Valid category ID is required' });
    }

    try {
        if (!enforceAction(req, res, 'Category', 'delete')) return;
        const deletedCategory = await Category.findByIdAndDelete(id);

        if (!deletedCategory) {
            await addLog({ eventType: 'validation_failure', action: 'Category deletion: category not found', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { categoryId: id } });
            return res.status(404).json({ message: 'Category not found' });
        }

        res.status(200).json({ message: 'Category removed successfully', deletedCategory });
    } catch (error) {
        console.error('Error removing category:', error);
        await addLog({ eventType: 'error', action: 'Category deletion failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ message: 'Error removing category' });
    }
};

// Controller function to get all categories
const getCategories = async (req, res) => {
    try {
        if (!enforceAction(req, res, 'Category', 'read')) return;
        const categories = await Category.find();
        res.status(200).json({ message: 'Categories retrieved successfully', categories });
    } catch (error) {
        console.error('Error retrieving categories:', error);
        await addLog({ eventType: 'error', action: 'Category retrieval failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ message: 'Error retrieving categories' });
    }
};

module.exports = { addCategory, removeCategory, getCategories};
