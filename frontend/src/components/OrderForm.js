// src/components/OrderForm.js
import React, { useState } from 'react';
import config from '../config';

const OrderForm = ({ onSubmit }) => {
  const [orderData, setOrderData] = useState({
    orderID: Date.now(), // Use timestamp for unique ID
    itemName: '',
    status: 'Pending',
    price: '',
    date: new Date().toISOString().split('T')[0]
  });

  const handleChange = (e) => {
    setOrderData({
      ...orderData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate price
    if (parseFloat(orderData.price) < 0) {
      alert('Price cannot be negative');
      return;
    }
    
    try {
      const response = await fetch(`${config.API_URL}/api/orders/add`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(orderData)
      });

      if (response.ok) {
        const created = await response.json();
        onSubmit(created); // Update parent component with DB version
        // Reset form
        setOrderData({
          orderID: Date.now(),
          itemName: '',
          status: 'Pending',
          price: '',
          date: new Date().toISOString().split('T')[0]
        });
      }
    } catch (error) {
      console.error('Error creating order:', error);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        name="itemName"
        value={orderData.itemName}
        onChange={handleChange}
        placeholder="Item Name"
        minLength="3"
        maxLength="20"
        required
      />
      <input
        type="number"
        name="price"
        value={orderData.price}
        onChange={handleChange}
        placeholder="Price"
        required
        min="0"
        step="0.01"
      />
      <select name="status" value={orderData.status} onChange={handleChange}>
        <option value="Pending">Pending</option>
        <option value="Processing">Processing</option>
        <option value="Shipped">Shipped</option>
        <option value="Delivered">Delivered</option>
      </select>
      <input
        type="date"
        name="date"
        value={orderData.date}
        onChange={handleChange}
        required
      />
      <button type="submit">Create Order</button>
    </form>
  );
};

export default OrderForm;