// models/Item.js
const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema({
    itemName: { type: String, required: true },
    category: { type: String, required: true },
    status: { type: String, required: true },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    description: { type: String, required: true },
    quantity: { type: Number, default: 1, required: false, min: [0, 'Quantity cannot be negative'] },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

const Item = mongoose.model('Item', itemSchema);

module.exports = Item;
