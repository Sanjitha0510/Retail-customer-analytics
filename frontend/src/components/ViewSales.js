import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ViewSales.css';

const ViewSales = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5038/api/sales', {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        setSales(response.data);
        setError('');
      } catch (err) {
        console.error('Error fetching sales:', err);
        setError('Failed to load sales data');
      } finally {
        setLoading(false);
      }
    };
    fetchSales();
  }, []);

  return (
    <div className="sales-container">
      <h1 className="sales-title">Sales History</h1>
      {loading ? (
        <div className="loading-state">Loading sales data...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : sales.length === 0 ? (
        <div className="empty-state">No sales data found</div>
      ) : (
        <div className="table-container">
          <table className="sales-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Products</th>
                <th>Quantity</th>
                <th>Total</th>
                <th>Date</th>
                <th>Order Type</th>
                <th>Location</th>
              </tr>
            </thead>
            <tbody>
              {sales.map((sale, index) => (
                <tr key={index}>
                  <td>{sale.customer_id}</td>
                  <td>{sale.products}</td>
                  <td>{sale.quantity}</td>
                  <td>₹{sale.total?.toFixed(2) || '0.00'}</td>
                  <td>{new Date(sale.date).toLocaleDateString()}</td>
                  <td>{sale.order_type}</td>
                  <td>{sale.location}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewSales;
