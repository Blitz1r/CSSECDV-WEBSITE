// routes/category.js
const express = require('express');
const { addCategory, removeCategory, getCategories } = require('../controllers/categoryController.js');
const { requireAuth } = require('../middleware/authorization');
const router = express.Router();

router.use(requireAuth);

// Route to add a new item
router.post('/add', addCategory);

// Route to delete an item
router.delete('/delete/:id', removeCategory);

// Route to delete an item
router.get('/all', getCategories);

module.exports = router;
