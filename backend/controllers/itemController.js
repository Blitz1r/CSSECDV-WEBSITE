// controllers/itemController.js
const Item = require('../models/ItemModel');
const Transaction = require('../models/TransactionModel');
const { guestFilterQuery, enforceAction } = require('../middleware/authorization');
const { addLog } = require('./loggerController');

const LOW_STOCK_THRESHOLD = 10;
const NO_STOCK_THRESHOLD = 0;

// Add a new item
const addItem = async (req, res) => {
    const { itemName, category, description } = req.body;
    let { price, quantity } = req.body;

    // Convert string inputs to numbers if needed
    if (typeof price === 'string') price = parseFloat(price);
    if (typeof quantity === 'string') quantity = parseInt(quantity, 10);

    // Input validation with logging
    if (!itemName || typeof itemName !== 'string' || itemName.trim().length === 0) {
        await addLog({ eventType: 'validation_failure', action: 'Item creation: invalid itemName', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { field: 'itemName' } });
        return res.status(400).json({ message: 'Item name is required' });
    }
    if (price === undefined || isNaN(price) || price < 0) {
        await addLog({ eventType: 'validation_failure', action: 'Item creation: invalid price', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { field: 'price', value: req.body.price } });
        return res.status(400).json({ message: 'Valid price is required' });
    }
    if (quantity === undefined || isNaN(quantity) || quantity < 0 || !Number.isInteger(quantity)) {
        await addLog({ eventType: 'validation_failure', action: 'Item creation: invalid quantity', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { field: 'quantity', value: req.body.quantity } });
        return res.status(400).json({ message: 'Valid quantity is required' });
    }

    try {
        // Determine initial status based on quantity
        let status = 'In Stock';
        if (quantity <= NO_STOCK_THRESHOLD) {
            status = 'Out of Stock';
        } else if (quantity <= LOW_STOCK_THRESHOLD) {
            status = 'Low Stock';
        }

        if (!enforceAction(req, res, 'Item', 'create')) return;
        const newItem = new Item({
            itemName,
            category,
            status,
            price,
            description,
            quantity,
            owner: req.session.userId
        });

        await newItem.save();
        
        await Transaction.create({
                    name: itemName,
                    action: "was added."
                });
        // Create a transaction record

        res.status(201).json({ message: 'Item added successfully', newItem });
    } catch (error) {
        console.error('Error adding item:', error);
        await addLog({ eventType: 'error', action: 'Item creation failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ message: 'Error adding item' });
    }
};

// Get all items
const getItems = async (req, res) => {
    try {
        const items = await Item.find(guestFilterQuery(req));
        res.status(200).json(items);
    } catch (error) {
        console.error('Error fetching items:', error);
        await addLog({ eventType: 'error', action: 'Fetch items failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ message: 'Error fetching items' });
    }
};

// Update an item
const updateItem = async (req, res) => {
    const { id } = req.params;
    const { itemName, category, status, price, description, quantity } = req.body;

    try {
        const item = await Item.findById(id);
        if (!item) {
            await addLog({ eventType: 'validation_failure', action: 'Item update: item not found', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { itemId: id } });
            return res.status(404).json({ message: 'Item not found' });
        }

        if (!enforceAction(req, res, 'Item', 'update', item.owner)) return;

        item.itemName = itemName;
        item.category = category;
        item.status = status;
        item.price = price;
        item.description = description;
        item.quantity = quantity;
        const updatedItem = await item.save();

        // Create a transaction record
        const transaction = new Transaction({
            name: itemName,
            action: `was updated.`
        });
        await transaction.save();
        res.status(200).json({ message: 'Item updated successfully', updatedItem });
    } catch (error) {
        console.error('Error updating item:', error);
        await addLog({ eventType: 'error', action: 'Item update failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ message: 'Error updating item' });
    }
};

// Delete an item
const deleteItem = async (req, res) => {
    const { id } = req.params;

    try {
        const item = await Item.findById(id);
        if (!item) {
            await addLog({ eventType: 'validation_failure', action: 'Item deletion: item not found', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { itemId: id } });
            return res.status(404).json({ message: 'Item not found' });
        }

        if (!enforceAction(req, res, 'Item', 'delete', item.owner)) return;

        const deletedItem = await Item.findByIdAndDelete(id);

        // deletedItem is defined if we reached here

        // Create a transaction record
        const transaction = new Transaction({
            name: deletedItem.itemName,
            action: 'was deleted.'
        });
        await transaction.save();

        res.status(200).json({ message: 'Item deleted successfully' });
    } catch (error) {
        console.error('Error deleting item:', error);
        await addLog({ eventType: 'error', action: 'Item deletion failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ message: 'Error deleting item' });
    }
};

// Increment item quantity
const incrementItem = async (req, res) => {
    const { id } = req.params;
    const incrementAmount = 1;

    try {
        const item = await Item.findById(id);
        if (!item) {
            await addLog({ eventType: 'validation_failure', action: 'Item increment: item not found', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { itemId: id } });
            return res.status(404).json({ message: 'Item not found' });
        }

        if (!enforceAction(req, res, 'Item', 'update', item.owner)) return; // treat quantity change as update

        const newQuantity = item.quantity + incrementAmount;
        let newStatus = 'In Stock';
        if (newQuantity <= NO_STOCK_THRESHOLD) {
            newStatus = 'Out of Stock';
        } else if (newQuantity <= LOW_STOCK_THRESHOLD) {
            newStatus = 'Low Stock';
        }

        const updatedItem = await Item.findByIdAndUpdate(
            id,
            { 
                $inc: { quantity: incrementAmount },
                status: newStatus
            },
            { new: true }
        );

        // Create a transaction record
        const transaction = new Transaction({
            name: item.itemName,
            action: 'was incremented by 1.'
        });
        await transaction.save();

        res.status(200).json({ 
            success: true, 
            message: 'Item quantity successfully incremented',
            updateItem: updatedItem
        });
    } catch (error) {
        console.error('Error incrementing item quantity:', error);
        await addLog({ eventType: 'error', action: 'Item increment failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ message: 'Error incrementing item quantity' });
    }
};

// Decrement item quantity
const decrementItem = async (req, res) => {
    const { id } = req.params;
    const decrementAmount = 1;

    try {
        const item = await Item.findById(id);
        if (!item) {
            await addLog({ eventType: 'validation_failure', action: 'Item decrement: item not found', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { itemId: id } });
            return res.status(404).json({ message: 'Item not found' });
        }

        if (!enforceAction(req, res, 'Item', 'update', item.owner)) return; // treat quantity change as update

        if (item.quantity <= 0) {
            await addLog({ eventType: 'validation_failure', action: 'Item decrement: quantity already zero', level: 'WARN', userEmail: req.session?.email, userId: req.session?.userId, meta: { itemId: id } });
            return res.status(400).json({ message: 'Cannot decrement. Quantity already at 0.' });
        }

        const newQuantity = item.quantity - decrementAmount;
        let newStatus = 'In Stock';
        if (newQuantity <= NO_STOCK_THRESHOLD) {
            newStatus = 'Out of Stock';
        } else if (newQuantity <= LOW_STOCK_THRESHOLD) {
            newStatus = 'Low Stock';
        }

        const updatedItem = await Item.findByIdAndUpdate(
            id,
            { 
                $inc: { quantity: -decrementAmount },
                status: newStatus
            },
            { new: true }
        );

        // Create a transaction record
        const transaction = new Transaction({
            name: item.itemName,
            action: 'was decremented by 1.'
        });
        await transaction.save();

        res.status(200).json({ 
            success: true,
            message: 'Item quantity successfully decremented',
            updateItem: updatedItem
        });
    } catch (error) {
        console.error('Error decrementing item quantity:', error);
        await addLog({ eventType: 'error', action: 'Item decrement failed', level: 'ERROR', userEmail: req.session?.email, userId: req.session?.userId, meta: { message: error.message } });
        res.status(500).json({ message: 'Error decrementing item quantity' });
    }
};

module.exports = { 
    addItem, 
    getItems, 
    updateItem, 
    deleteItem, 
    incrementItem, 
    decrementItem 
};