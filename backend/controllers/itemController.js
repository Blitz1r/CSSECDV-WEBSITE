// controllers/itemController.js
const Item = require('../models/ItemModel');
const Transaction = require('../models/TransactionModel');
const { guestFilterQuery, enforceAction } = require('../middleware/authorization');

const LOW_STOCK_THRESHOLD = 10;
const NO_STOCK_THRESHOLD = 0;

// Add a new item
const addItem = async (req, res) => {
    const { itemName, category, price, description, quantity } = req.body;

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
        res.status(500).json({ message: 'Error adding item', error });
    }
};

// Get all items
const getItems = async (req, res) => {
    try {
        const items = await Item.find(guestFilterQuery(req));
        res.status(200).json(items);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching items', error });
    }
};

// Update an item
const updateItem = async (req, res) => {
    const { id } = req.params;
    const { itemName, category, status, price, description, quantity } = req.body;

    try {
        const item = await Item.findById(id);
        if (!item) {
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
        res.status(500).json({ message: 'Error updating item', error });
    }
};

// Delete an item
const deleteItem = async (req, res) => {
    const { id } = req.params;

    try {
        const item = await Item.findById(id);
        if (!item) {
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
        res.status(500).json({ message: 'Error deleting item', error });
    }
};

// Increment item quantity
const incrementItem = async (req, res) => {
    const { id } = req.params;
    const incrementAmount = 1;

    try {
        const item = await Item.findById(id);
        if (!item) {
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
        res.status(500).json({ message: 'Error incrementing item quantity', error });
    }
};

// Decrement item quantity
const decrementItem = async (req, res) => {
    const { id } = req.params;
    const decrementAmount = 1;

    try {
        const item = await Item.findById(id);
        if (!item) {
            return res.status(404).json({ message: 'Item not found' });
        }

        if (!enforceAction(req, res, 'Item', 'update', item.owner)) return; // treat quantity change as update

        if (item.quantity <= 0) {
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
        res.status(500).json({ message: 'Error decrementing item quantity', error });
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