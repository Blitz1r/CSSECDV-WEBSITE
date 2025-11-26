import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './Sidebar';
import '../styles/inventory.css';
import config from '../config';

const ViewUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showSuccessPopup, setShowSuccessPopup] = useState(false);
    
    // Form state for creating new user
    const [isAddingNew, setIsAddingNew] = useState(false);
    const [newUser, setNewUser] = useState({
        email: '',
        password: '',
        role: 'Manager',
        securityAnswer: ''
    });

    // Edit state
    const [editUserId, setEditUserId] = useState(null);
    const [editFormData, setEditFormData] = useState({
        role: ''
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${config.API_URL}/api/users/managers-administrators`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setUsers(data.users);
                setError('');
            } else {
                setError(data.message || 'Failed to fetch users');
            }
        } catch (err) {
            console.error('Fetch users error:', err);
            setError('Network error. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const toggleAddNew = () => {
        setIsAddingNew(!isAddingNew);
        setNewUser({
            email: '',
            password: '',
            role: 'Manager',
            securityAnswer: ''
        });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setNewUser(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage('');
        
        try {
            const response = await fetch(`${config.API_URL}/api/users`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccessMessage('User created successfully!');
                setShowSuccessPopup(true);
                setTimeout(() => setShowSuccessPopup(false), 3000);
                setIsAddingNew(false);
                setNewUser({
                    email: '',
                    password: '',
                    role: 'Manager',
                    securityAnswer: ''
                });
                fetchUsers();
            } else {
                setError(data.message || 'Failed to create user');
            }
        } catch (err) {
            console.error('Create user error:', err);
            setError('Network error. Please try again.');
        }
    };

    const handleEditClick = (event, user) => {
        event.preventDefault();
        setEditUserId(user._id);
        setEditFormData({
            role: user.role
        });
    };

    const handleEditFormChange = (event) => {
        const { name, value } = event.target;
        setEditFormData((prevData) => ({
            ...prevData,
            [name]: value,
        }));
    };

    const handleEditFormSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSuccessMessage('');

        try {
            const response = await fetch(`${config.API_URL}/api/users/${editUserId}/role`, {
                method: 'PUT',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: editFormData.role })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccessMessage('User role updated successfully!');
                setShowSuccessPopup(true);
                setTimeout(() => setShowSuccessPopup(false), 3000);
                handleCancelClick();
                fetchUsers();
            } else {
                setError(data.message || 'Failed to update role');
            }
        } catch (err) {
            console.error('Update role error:', err);
            setError('Network error. Please try again.');
            fetchUsers();
        }
    };

    const handleCancelClick = () => {
        setEditUserId(null);
        setEditFormData({ role: '' });
    };

    const handleDeleteClick = async (userId, userEmail) => {
        if (!window.confirm(`Are you sure you want to delete ${userEmail}? This action cannot be undone.`)) {
            return;
        }

        setError('');
        setSuccessMessage('');

        try {
            // Optimistic update
            setUsers(prevUsers => prevUsers.filter(user => user._id !== userId));

            const response = await fetch(`${config.API_URL}/api/users/${userId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (response.ok && data.success) {
                setSuccessMessage('User deleted successfully!');
                setShowSuccessPopup(true);
                setTimeout(() => setShowSuccessPopup(false), 3000);
            } else {
                setError(data.message || 'Failed to delete user');
                // Rollback on error
                fetchUsers();
            }
        } catch (err) {
            console.error('Delete user error:', err);
            setError('Network error. Please try again.');
            // Rollback on error
            fetchUsers();
        }
    };

    if (loading) {
        return (
            <div className="container">
                <Sidebar />
                <div className="main-content">
                    <p>Loading users...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="container">
            <Sidebar />

            <div className="main-content">
                <header>
                    <div className="header-content">
                        <h2>Manage Administrator & Manager Accounts</h2>
                        <button className="add-new-item-button" onClick={toggleAddNew}>
                            {isAddingNew ? 'Close Form' : 'Add New User'}
                        </button>
                    </div>
                </header>

                {error && (
                    <div className="error-message" style={{backgroundColor: '#f44336', color: 'white', padding: '12px', marginBottom: '20px', borderRadius: '4px'}}>
                        {error}
                        <button onClick={() => setError('')} style={{marginLeft: '10px', background: 'none', border: 'none', color: 'white', cursor: 'pointer'}}>×</button>
                    </div>
                )}

                {isAddingNew && (
                    <div className="add-item-card">
                        <h2>Add New User</h2>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={newUser.email}
                                    onChange={handleChange}
                                    placeholder="user@example.com"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="password">Password</label>
                                <input
                                    type="password"
                                    id="password"
                                    name="password"
                                    value={newUser.password}
                                    onChange={handleChange}
                                    placeholder="Minimum 6 characters"
                                    required
                                    minLength="6"
                                />
                            </div>

                            <div className="form-group">
                                <label htmlFor="role">Role</label>
                                <select
                                    id="role"
                                    name="role"
                                    value={newUser.role}
                                    onChange={handleChange}
                                    required
                                >
                                    <option value="Administrator">Administrator</option>
                                    <option value="Manager">Manager</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="securityAnswer">Security Answer</label>
                                <p style={{fontSize: '0.9em', color: '#666', marginBottom: '8px'}}>
                                    Question: "What is the Most memorable moment?"
                                </p>
                                <input
                                    type="text"
                                    id="securityAnswer"
                                    name="securityAnswer"
                                    value={newUser.securityAnswer}
                                    onChange={handleChange}
                                    placeholder="Enter the answer"
                                    required
                                />
                            </div>

                            <button type="submit">Add User</button>
                        </form>
                    </div>
                )}

                <div className="inventory-table">
                    <form onSubmit={handleEditFormSubmit}>
                        <table>
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Created At</th>
                                    <th>Last Login</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{textAlign: 'center'}}>No users found</td>
                                    </tr>
                                ) : (
                                    users.map(user => 
                                        editUserId === user._id ? (
                                            <tr key={user._id}>
                                                <td>{user.email}</td>
                                                <td>
                                                    <select
                                                        name="role"
                                                        value={editFormData.role}
                                                        onChange={handleEditFormChange}
                                                        required
                                                    >
                                                        <option value="Administrator">Administrator</option>
                                                        <option value="Manager">Manager</option>
                                                    </select>
                                                </td>
                                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    {user.lastSuccessfulLoginAt 
                                                        ? new Date(user.lastSuccessfulLoginAt).toLocaleString()
                                                        : 'Never'
                                                    }
                                                </td>
                                                <td>
                                                    <button type="submit" className="save-btn">
                                                        Save
                                                    </button>
                                                    <button type="button" onClick={handleCancelClick} className="cancel-btn">
                                                        Cancel
                                                    </button>
                                                </td>
                                            </tr>
                                        ) : (
                                            <tr key={user._id}>
                                                <td>{user.email}</td>
                                                <td>
                                                    <span className={`role-badge ${user.role.toLowerCase()}`}>
                                                        {user.role}
                                                    </span>
                                                </td>
                                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                                <td>
                                                    {user.lastSuccessfulLoginAt 
                                                        ? new Date(user.lastSuccessfulLoginAt).toLocaleString()
                                                        : 'Never'
                                                    }
                                                </td>
                                                <td>
                                                    <button 
                                                        type="button"
                                                        onClick={(event) => handleEditClick(event, user)}
                                                        className="edit-btn"
                                                    >
                                                        Edit
                                                    </button>
                                                    <button 
                                                        type="button"
                                                        onClick={() => handleDeleteClick(user._id, user.email)}
                                                        className="delete-btn"
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        )
                                    )
                                )}
                            </tbody>
                        </table>
                    </form>
                </div>
            </div>

            {showSuccessPopup && (
                <div className="success-popup">
                    <p>{successMessage}</p>
                </div>
            )}
        </div>
    );
};

export default ViewUsers;