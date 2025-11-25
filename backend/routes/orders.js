const express = require('express');
const { addOrderHandler, getOrders, updateOrder, deleteOrder } = require('../controllers/orderController');
const { requireAuth } = require('../middleware/authorization');
const router = express.Router();

router.use(requireAuth);

// POST route to add an order
router.post('/add', addOrderHandler);

// GET route to fetch all orders
router.get('/', getOrders);

// PUT route to update an order
router.put('/update/:id', updateOrder);

// DELETE route to delete an order
router.delete('/delete/:id', deleteOrder);

module.exports = router;
