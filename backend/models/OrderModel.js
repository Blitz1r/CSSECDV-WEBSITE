const mongoose = require('mongoose');

// Define the schema for orders
const orderSchema = new mongoose.Schema({
    orderID: { type: Number, required: true },
    itemName: { type: String, required: true },
    status: { type: String, required: true },
    price: { type: Number, required: true },
    date: { type: Date, required: true },
});

// Create the Order model
const Order = mongoose.model('Order', orderSchema);


// Export the Order model and the addOrder function
module.exports = { Order};

// Example usage to add a test order (can be called where needed)
