const { Order } = require('../models/OrderModel');
const Transaction = require('../models/TransactionModel');
const { guestFilterQuery, enforceAction } = require('../middleware/authorization');
const { addLog } = require('./loggerController');

// Controller function to handle adding an order
const addOrderHandler = async (req, res) => {
    const { orderID, itemName, status, date } = req.body;
    let { price } = req.body;

    // Convert string input to number if needed
    if (typeof price === 'string') price = parseFloat(price);

    if (!itemName || typeof itemName !== 'string' || itemName.trim().length === 0) {
        await addLog({ eventType: 'validation_failure', action: 'Order creation: invalid itemName', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { field: 'itemName' } });
        return res.status(400).json({ message: 'Item name is required' });
    }
    if (price === undefined || isNaN(price) || price < 0) {
        await addLog({ eventType: 'validation_failure', action: 'Order creation: invalid price', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { field: 'price', value: req.body.price } });
        return res.status(400).json({ message: 'Valid price is required' });
    }

    try {
        if (!enforceAction(req, res, 'Order', 'create')) return;
        const createdOrder = await Order.create({ orderID, itemName, status, price, date, owner: req.session.userId });
        await Transaction.create({ name: itemName, action: 'was ordered.' });
        res.status(201).json(createdOrder);
    } catch (error) {
        console.error('Error adding order:', error);
        await addLog({ eventType: 'error', action: 'Order creation failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ message: 'Error adding order' });
    }
};

// Controller function to get all orders
const getOrders = async (req, res) => {
    try {
        const orders = await Order.find(guestFilterQuery(req)); // Fetch filtered orders from the database
        res.json(orders); // Send the orders as a JSON response
    } catch (error) {
        res.status(500).json({ message: 'Error fetching orders' });
    }
};

const updateOrder = async (req, res) => {
    const { id } = req.params;
    const { orderID, itemName, status, price, date } = req.body;
    try {
        const order = await Order.findById(id);
        if (!order) {
            await addLog({ eventType: 'validation_failure', action: 'Order update: order not found', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { orderId: id } });
            return res.status(404).json({ message: 'Order not found' });
        }
        if (!enforceAction(req, res, 'Order', 'update', order.owner)) return;
        if (orderID !== undefined) order.orderID = orderID;
        if (itemName !== undefined) order.itemName = itemName;
        if (status !== undefined) order.status = status;
        if (price !== undefined) order.price = price;
        if (date !== undefined) order.date = date;
        const updated = await order.save();
        await Transaction.create({ name: updated.itemName, action: 'order was updated.' });
        return res.status(200).json(updated);
    } catch (error) {
        return res.status(500).json({ message: 'Error updating order' });
    }
};

const deleteOrder = async (req, res) => {
    const { id } = req.params;

    try {
        const order = await Order.findById(id);
        if (!order) {
            await addLog({ eventType: 'validation_failure', action: 'Order deletion: order not found', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { orderId: id } });
            return res.status(404).json({ message: 'Order not found' });
        }

        if (!enforceAction(req, res, 'Order', 'delete', order.owner)) return;

        const deletedOrder = await Order.findByIdAndDelete(id);

        // Create transaction record
        await Transaction.create({
            name: deletedOrder.itemName,
            action: "was deleted from orders"
        });

        res.status(200).json({ message: 'Order deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting order' });
    }
};

module.exports = { 
    addOrderHandler, 
    getOrders,
    updateOrder,
    deleteOrder 
};
