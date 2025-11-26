import React, { useState } from 'react';
import { useAuth } from '../auth/AuthProvider';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/sidebar.css';

const Sidebar = () => {
    const [isSidebarCollapsed, setSidebarCollapsed] = useState(true);
    const { role } = useAuth();
    const navigate = useNavigate();

    const toggleSidebar = () => {
        setSidebarCollapsed(!isSidebarCollapsed);
        // Remove 'active' class from all menu items when collapsing
        if (!isSidebarCollapsed) {
            const activeItems = document.querySelectorAll('.menu li.active');
            activeItems.forEach(item => item.classList.remove('active'));
        }
    };

    const handleMenuToggle = (event) => {
        const parentLi = event.currentTarget.parentElement;
        parentLi.classList.toggle('active');
    
        if (isSidebarCollapsed) {
            setSidebarCollapsed(false);
        }
    };

        const handleLogout = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/login/logout', {
                method: 'POST',
                credentials: 'include', // Important for sending cookies
            });

            if (response.ok) {
                // Clear localStorage
                localStorage.removeItem('auth');
                localStorage.removeItem('userEmail'); // Clear any other user data if stored
                localStorage.removeItem('role');
                // Redirect to login
                navigate('/');
            } else {
                console.error('Logout failed');
                // Still clear local data and redirect
                localStorage.removeItem('auth');
                navigate('/');
            }
        } catch (error) {
            console.error('Logout error:', error);
            // Still clear local data and redirect on error
            localStorage.removeItem('auth');
            navigate('/');
        }
    };

    return (
        <nav className={`sidebar ${isSidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="brand">
                <img 
                    src={process.env.PUBLIC_URL + '/innovasian-icon.jpg'}
                    className="logo"
                />
                <div className="hamburger" onClick={toggleSidebar}>
                    &#9776;
                </div>
            </div>
            <ul className="menu">
                <li>
                    <Link to="/dashboard" title="Dashboard">
                        <span className="icon">🏠</span>
                        <span className="text">Dashboard</span>
                    </Link>
                </li>
                <li>
                    <a href="#" className="dropdown-toggle" onClick={handleMenuToggle} title="Inventory">
                        <span className="icon">📦</span>
                        <span className="text">Inventory</span>
                        <span className="arrow">▶</span>
                    </a>
                    <ul className="submenu">
                        <Link to="/inventory">View Items</Link>
                        <Link to="/categories">Categories</Link>
                    </ul>
                </li>
                <li>
                    <a href="#" className="dropdown-toggle" onClick={handleMenuToggle}>
                        <span className="icon">🛒</span>
                        <span className="text">Orders</span>
                        <span className="arrow">▼</span>
                    </a>
                    <ul className="submenu">
                        <Link to="/orders/view">View Orders</Link>
                        <Link to="/orders/pending">Pending Orders</Link>
                    </ul>
                </li>
                <li>
                    <a href="#" className="dropdown-toggle" onClick={handleMenuToggle}>
                        <span className="icon">📊</span>
                        <span className="text">Reports</span>
                        <span className="arrow">▼</span>
                    </a>
                    <ul className="submenu">
                        <Link to="/reports/sales">Sales Reports</Link>
                        <Link to="/reports/inventory">Inventory Reports</Link>
                    </ul>
                </li>
                <li>
                    <Link to="/settings" title="Settings">
                        <span className="icon">⚙️</span>
                        <span className="text">Settings</span>
                    </Link>
                </li>
                {role === 'Administrator' && (
                <li>
                    <Link to="/logs" title="System Logs">
                        <span className="icon">🧾</span>
                        <span className="text">Logs</span>
                    </Link>
                </li>
                )}
                {role === 'Administrator' && (
                <li>
                    <Link to="/users" title="Users">
                        <span className="icon">👥</span>
                        <span className="text">Users</span>
                    </Link>
                </li>
                )}
                <li>
                    <a href="https://www.facebook.com/innovasianenterprise/">
                        <span className="icon">❓</span>
                        <span className="text">Help/Support</span>
                    </a>
                </li>
                <li className="logout-item">
                    <a href="#" onClick={handleLogout} title="Logout">
                        <span className="icon">🚪</span>
                        <span className="text">Logout</span>
                    </a>
                </li>
            </ul>
        </nav>
    );
};

export default Sidebar;
