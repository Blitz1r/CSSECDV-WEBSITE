import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './components/login';
import Dashboard from './components/dashboard';
import Inventory from './components/inventory';
import PendingOrders from './components/PendingOrders';
import ViewOrders from './components/ViewOrders';
import SalesReports from './components/SalesReports';
import InventoryReports from './components/InventoryReports';
import Categories from './components/Categories';
import ForgotPassword from './components/ForgotPassword';
import Settings from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
    useEffect(() => {
        const darkMode = localStorage.getItem('darkMode');
        if (darkMode === 'true') {
            document.body.classList.add('dark-mode');
        }
    }, []);

    return (
        <Router>
            <ErrorBoundary>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                    <Route path="/inventory" element={<ProtectedRoute><Inventory /></ProtectedRoute>} />
                    <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                    <Route path="/categories" element={<ProtectedRoute><Categories /></ProtectedRoute>} />
                    <Route path="/orders/view" element={<ProtectedRoute><ViewOrders /></ProtectedRoute>} />
                    <Route path="/orders/pending" element={<ProtectedRoute><PendingOrders /></ProtectedRoute>} />
                    <Route path="/reports/sales" element={<ProtectedRoute><SalesReports /></ProtectedRoute>} />
                    <Route path="/reports/inventory" element={<ProtectedRoute><InventoryReports /></ProtectedRoute>} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                </Routes>
            </ErrorBoundary>
        </Router>
    );
}

export default App;