const { Order } = require('../models/OrderModel');
const Transaction = require('../models/TransactionModel');

// Controller function to handle adding an order
const addOrderHandler = async (req, res) => {
    const { orderID, itemName, status, price, date } = req.body;
    try {
        const createdOrder = await Order.create({ orderID, itemName, status, price, date, owner: req.session.userId });
        await Transaction.create({ name: itemName, action: 'was ordered.' });
        res.status(201).json(createdOrder);
    } catch (error) {
        res.status(500).json({ message: 'Error adding order' });
    }
};

// Controller function to get all orders
const getOrders = async (req, res) => {
    try {
        const role = (req.session.role || 'Guest');
        const filter = role === 'Guest' ? { owner: req.session.userId } : {};
        const orders = await Order.find(filter); // Fetch filtered orders from the database
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
            return res.status(404).json({ message: 'Order not found' });
        }
        const role = (req.session.role || 'Guest');
        const isOwner = order.owner && order.owner.toString() === req.session.userId;
        if (role === 'Guest' && !isOwner) {
            return res.status(403).json({ message: 'Forbidden: cannot modify orders you do not own' });
        }
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
            return res.status(404).json({ message: 'Order not found' });
        }

        const role = (req.session.role || 'Guest');
        const isOwner = order.owner && order.owner.toString() === req.session.userId;
        if (role === 'Guest' && !isOwner) {
            return res.status(403).json({ message: 'Forbidden: cannot delete orders you do not own' });
        }

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
