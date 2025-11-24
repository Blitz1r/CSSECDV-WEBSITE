const express = require('express');
const { addOrderHandler, getOrders, deleteOrder } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/auth');
const router = express.Router();

router.use(requireAuth);

// POST route to add an order
router.post('/add', addOrderHandler);

// GET route to fetch all orders
router.get('/', getOrders);

// DELETE route to delete an order
router.delete('/delete/:id', deleteOrder);

module.exports = router;
