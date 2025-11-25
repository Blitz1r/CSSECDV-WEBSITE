import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import Sidebar from './Sidebar';
import config from '../config';
import { formatCurrency } from '../utils/currency';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    Title,
    Tooltip,
    Legend
);

const SalesReports = () => {
    const [salesData, setSalesData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalSales, setTotalSales] = useState(0);
    const [salesByCategory, setSalesByCategory] = useState({});
    const [chartData, setChartData] = useState(null);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${config.API_URL}/api/orders`, { credentials: 'include' });
            const data = await response.json();
            setSalesData(data);
            
  
            const total = data.reduce((sum, order) => sum + (order.price || 0), 0);
            setTotalSales(total);

            
            const byCategory = {};
            data.forEach(order => {
                const category = order.category || order.itemName || 'Other';
                byCategory[category] = (byCategory[category] || 0) + (order.price || 0);
            });
            setSalesByCategory(byCategory);

            const monthlyData = {};
            data.forEach(order => {
                const date = new Date(order.date);
                const monthKey = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
                monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (order.price || 0);
            });

            const sortedMonths = Object.keys(monthlyData).sort((a, b) => new Date(a) - new Date(b));
            const monthlyValues = sortedMonths.map(m => monthlyData[m]);

            setChartData({
                labels: sortedMonths,
                datasets: [
                    {
                        label: 'Monthly Sales',
                        data: monthlyValues,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                    },
                ],
            });
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const salesOptions = {
        responsive: true,
        plugins: {
            legend: {
                position: 'top',
            },
            title: {
                display: true,
                text: 'Monthly Sales',
            },
        },
    };

    return (
        <div className="container">
            <Sidebar />
            <div className="main-content">
                <header>
                    <div className="header-content">
                        <input type="text" placeholder="Search sales reports..." />
                        <div className="user-profile">
                            <span className="emoji">😊</span>
                            <span>Username</span>
                        </div>
                    </div>
                </header>
                <div className="reports">
                    <h2>Sales Reports</h2>
                    {loading ? (
                        <div>Loading...</div>
                    ) : (
                        <>
                            <div className="report-card">
                                <h3>Total Sales</h3>
                                <p>{formatCurrency(totalSales)}</p>
                            </div>
                            <div className="report-card">
                                <h3>Sales by Category</h3>
                                <ul>
                                    {Object.entries(salesByCategory).map(([category, amount]) => (
                                        <li key={category}>
                                            {category}: {formatCurrency(amount)}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                            <div className="report-card">
                                <h3>Sales Graph</h3>
                                {chartData && <Bar data={chartData} options={salesOptions} />}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SalesReports;
