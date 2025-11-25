import React, { useEffect, useState } from 'react';
import '../styles/logs.css';
import '../styles/orders.css';
import Sidebar from './Sidebar';
import config from '../config';

const ViewLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogs();
    }, []);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${config.API_URL}/api/logs`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                },
                credentials: 'include'
            });
            const data = await response.json();
            setLogs(data.transactions || []);
        } catch (error) {
            console.error('Error fetching logs:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container">
            <Sidebar />
            <div className="main-content">
                <header>
                    <h1>Activity Logs</h1>
                </header>
                <div className="logs">
                    {loading ? (
                        <div>Loading logs...</div>
                    ) : logs.length === 0 ? (
                        <div>No logs found</div>
                    ) : (
                        <table className="logs-table">
                            <thead>
                                <tr>
                                    <th>Email</th>
                                    <th>Action</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, index) => (
                                    <tr key={index}>
                                        <td>{log.Useremail}</td>
                                        <td>{log.action}</td>
                                        <td>{new Date(log.timestamp).toLocaleString()}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewLogs;