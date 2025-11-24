import React, { useEffect, useState } from 'react';
import '../styles/orders.css';
import Sidebar from './Sidebar';
import OrderTable from './OrderTable';
import OrderForm from './OrderForm';
import config from '../config';

const ViewOrders = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);

    const [totalPages, setTotalPages] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage, setOrdersPerPage] = useState(10);

    useEffect(() => {
        const fetchOrders = async () => {
            try {
                const response = await fetch(`${config.API_URL}/api/orders`, { credentials: 'include' });
                if (!response.ok) {
                    console.error('Failed to fetch orders. Status:', response.status);
                    setOrders([]);
                    setLoading(false);
                    return;
                }
                const data = await response.json();
                setOrders(Array.isArray(data) ? data : []);
                setLoading(false);
            } catch (error) {
                console.error('Error fetching orders:', error);
                setLoading(false);
            }
        };
        fetchOrders();
    }, []);

    const handleOrderSubmit = async (newOrder) => {
        try {
            const response = await fetch(`${config.API_URL}/api/orders/add`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(newOrder)
            });
            if (!response.ok) {
                console.error('Failed to create order. Status:', response.status);
                return;
            }
            const created = await response.json();
            setOrders([...orders, created]);
        } catch (error) {
            console.error('Error creating order:', error);
        }
    };

    const handleOrderDelete = async (orderId) => {
        try {
            const response = await fetch(`${config.API_URL}/api/orders/delete/${orderId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            if (response.ok) {
                setOrders(orders.filter(order => order._id !== orderId));
            } else {
                console.error('Failed to delete order. Status:', response.status);
            }
        } catch (error) {
            console.error('Error deleting order:', error);
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
                            <OrderTable orders={orders} onDelete={handleOrderDelete} />
                            {/* Pagination buttons */}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default ViewOrders;
