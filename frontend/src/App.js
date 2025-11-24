import React from 'react';
import { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { useState } from 'react';
import config from './config';
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

    const [authChecked, setAuthChecked] = useState(false); // one successful session check done at least once
    const [isAuthed, setIsAuthed] = useState(false); // current auth state
    const [checkingSession, setCheckingSession] = useState(false); // currently performing a session check

    const performSessionCheck = async () => {
        setCheckingSession(true);
        try {
            const res = await fetch(`${config.API_URL}/api/login/session`, { credentials: 'include' });
            if (res.ok) {
                const data = await res.json();
                if (data.authenticated) {
                    setIsAuthed(true);
                    localStorage.setItem('role', data.user.role);
                    localStorage.setItem('email', data.user.email);
                } else {
                    setIsAuthed(false);
                }
            } else if (res.status === 401) {
                setIsAuthed(false);
            }
        } catch {
            setIsAuthed(false);
        } finally {
            setAuthChecked(true);
            setCheckingSession(false);
        }
    };

    // Initial mount check
    useEffect(() => {
        performSessionCheck();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Listen for auth change events (e.g. after successful login)
    useEffect(() => {
        const handler = () => performSessionCheck();
        window.addEventListener('auth-changed', handler);
        return () => window.removeEventListener('auth-changed', handler);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const RequireAuth = ({ children }) => {
        // While checking, show loading to avoid premature redirect right after login
        // Trigger a check if not yet checked and not currently checking
        if (!authChecked && !checkingSession) {
            performSessionCheck();
            return <div>Loading...</div>;
        }
        if (checkingSession) {
            return <div>Loading...</div>;
        }
        if (isAuthed) return children;
        return <Navigate to="/" replace />;
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