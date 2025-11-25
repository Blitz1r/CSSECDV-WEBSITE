// models/Item.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemName: { type: String, required: true, minlength: [3, 'Item name must be at least 3 characters'] },
    category: { type: String, required: true, minlength: [3, 'Category must be at least 3 characters'] },
    status: { type: String, required: true, minlength: [3, 'Status must be at least 3 characters'] },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    description: { type: String, required: true, minlength: [3, 'Description must be at least 3 characters'] },
    quantity: { type: Number, default: 1, required: false, min: [0, 'Quantity cannot be negative'] }
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
