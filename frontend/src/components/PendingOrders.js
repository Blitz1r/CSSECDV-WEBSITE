import React, { useEffect, useState } from 'react';
import '../styles/orders.css';
import Sidebar from './Sidebar';
import OrderTable from './OrderTable';
import OrderForm from './OrderForm';
import config from '../config';

const PendingOrders = () => {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPendingOrders = async () => {
        try {
            const response = await fetch(`${config.API_URL}/api/orders`, { credentials: 'include' });
            if (!response.ok) {
                console.error('Failed to fetch orders:', response.status);
                return setPendingOrders([]);
            }
            const data = await response.json();
            // Filter only pending orders
            const pending = data.filter(order => order.status === 'Pending');
            setPendingOrders(pending);
            setLoading(false);
        } catch (error) {
            console.error('Error fetching pending orders:', error);
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingOrders();
    }, []);

    // OrderForm already creates the order and passes back created DB doc.
    const handleOrderSubmit = async () => {
        await fetchPendingOrders();
    };

    const handleOrderDelete = async (orderId) => {
        try {
            const response = await fetch(`${config.API_URL}/api/orders/delete/${orderId}`, { method: 'DELETE', credentials: 'include' });
            if (!response.ok) {
                console.error('Failed to delete order:', response.status);
            }
            await fetchPendingOrders();
        } catch (error) {
            console.error('Error deleting order:', error);
        }
    };

    return (
        <div className="container">
            <Sidebar />
            <div className="main-content">
                <div className="orders">
                    <h2>Pending Orders</h2>
                    {loading ? (
                        <div>Loading...</div>
                    ) : (
                        <>
                            <OrderForm onSubmit={handleOrderSubmit} />
                            <OrderTable 
                                orders={pendingOrders}
                                onDelete={handleOrderDelete}
                            />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PendingOrders;