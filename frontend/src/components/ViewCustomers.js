import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Customers1.css';

const ViewCustomers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5038/api/customersdetails', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setCustomers(response.data);
        setError('');
      } catch (err) {
        setError('Failed to load customer data');
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  return (
    <div className="customer-container">
      <h1 className="customer-title">Customer Profiles</h1>
      {loading ? (
        <div className="loading-state">Loading customers...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : customers.length === 0 ? (
        <div className="empty-state">No customer records found</div>
      ) : (
        <div className="table-container">
          <table className="customer-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Phone Number</th>
                <th>Customer Type</th>
                <th>Loyalty Points</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={index}>
                  <td>{customer.customer_id}</td>
                  <td>{customer.phone_number}</td>
                  <td>{customer.customer_type}</td>
                  <td>{customer.loyalty_points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewCustomers;
