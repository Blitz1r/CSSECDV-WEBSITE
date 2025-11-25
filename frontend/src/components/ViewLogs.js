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
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
            });
            if (!response.ok) {
                console.error('Failed to fetch logs:', response.status);
                setLogs([]);
                return;
            }
            const data = await response.json();
            const logsPayload = Array.isArray(data.logs) ? data.logs : (Array.isArray(data.transactions) ? data.transactions : []);
            setLogs(logsPayload);
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
                                    <th>Type</th>
                                    <th>Action</th>
                                    <th>Level</th>
                                    <th>Timestamp</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log, index) => {
                                    const email = log.userEmail || log.Useremail || '';
                                    const type = log.eventType || '';
                                    const level = log.level || '';
                                    const ts = log.timestamp ? new Date(log.timestamp).toLocaleString() : '';
                                    return (
                                        <tr key={index}>
                                            <td>{email}</td>
                                            <td>{type}</td>
                                            <td>{log.action}</td>
                                            <td>{level}</td>
                                            <td>{ts}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ViewLogs;