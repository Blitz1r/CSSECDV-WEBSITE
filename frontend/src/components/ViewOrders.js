import React, { useEffect, useState, useCallback } from 'react';
import '../styles/orders.css';
import Sidebar from './Sidebar';
import OrderTable from './OrderTable';
import OrderForm from './OrderForm';
import config from '../config';
import {formatCurrency} from '../utils/currency';
const ViewOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    // fetchOrders is now reusable
    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            const response = await fetch(`${config.API_URL}/api/orders`);
            const data = await response.json();
            setOrders(data);
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    const handleOrderSubmit = async (newOrder) => {
        await fetchOrders();
    };

    const handleOrderDelete = async (orderId) => {
        try {
            console.log('Deleting orderId:', orderId);
            setOrders(prev => prev.filter(order => (order._id || order.orderID) !== orderId));

            const response = await fetch(`${config.API_URL}/api/orders/delete/${orderId}`, {
                method: 'DELETE'
            });

            console.log('Delete response status:', response.status);

            if (response.ok) {
                // Re-fetch authoritative list to ensure UI matches backend
                await fetchOrders();
            } else {
                // if delete failed, refetch to restore state and show error
                console.error('Failed to delete order, status:', response.status);
                await fetchOrders();
            }
        } catch (error) {
            console.error('Error deleting order:', error);
            // revert / re-sync
            await fetchOrders();
        }
    };

    return (
        <div className="container">
            <Sidebar />
            <div className="main-content">
                <header>
                    {/* Header content */}
                </header>
                <div className="orders">
                    <h2>View All Orders</h2>
                    {loading ? (
                        <div>Loading...</div>
                    ) : (
                        <>
                            <OrderForm onSubmit={handleOrderSubmit} />
                            <OrderTable orders={orders} onDelete={handleOrderDelete} formatCurrency={formatCurrency} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ViewOrders;
