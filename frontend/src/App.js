import React from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
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

    const RequireAuth = ({ children }) => {
        const authed = typeof window !== 'undefined' && localStorage.getItem('auth') === 'true';
        return authed ? children : <Navigate to="/" replace />;
    };

    return (
        <Router>
            <ErrorBoundary>
                <Routes>
                    <Route path="/" element={<Login />} />
                    <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
                    <Route path="/inventory" element={<RequireAuth><Inventory /></RequireAuth>} />
                    <Route path="/settings" element={<RequireAuth><Settings /></RequireAuth>} />
                    <Route path="/categories" element={<RequireAuth><Categories /></RequireAuth>} />
                    <Route path="/orders/view" element={<RequireAuth><ViewOrders /></RequireAuth>} />
                    <Route path="/orders/pending" element={<RequireAuth><PendingOrders /></RequireAuth>} />
                    <Route path="/reports/sales" element={<RequireAuth><SalesReports /></RequireAuth>} />
                    <Route path="/reports/inventory" element={<RequireAuth><InventoryReports /></RequireAuth>} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                </Routes>
            </ErrorBoundary>
        </Router>
    );
}

export default App;