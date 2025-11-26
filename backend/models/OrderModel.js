const mongoose = require('mongoose');

// Define the schema for orders
const orderSchema = new mongoose.Schema({
    orderID: { type: Number, required: true },
    itemName: { type: String, required: true , minLength: 3, maxLength: 20},
    status: { type: String, required: true },
    price: { type: Number, required: true, min: [0, 'Price cannot be negative'] },
    date: { type: Date, required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
});

// Create the Order model
const Order = mongoose.model('Order', orderSchema);


// Export the Order model and the addOrder function
module.exports = { Order};

// Example usage to add a test order (can be called where needed)
