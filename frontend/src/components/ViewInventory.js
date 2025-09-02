import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ViewInventory.css';

const ViewInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5038/api/stock', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setInventory(response.data);
        setError('');
      } catch (err) {
        setError('Failed to load inventory');
      } finally {
        setLoading(false);
      }
    };
    fetchInventory();
  }, []);

  return (
    <div className="inventory-container">
      <h1 className="inventory-title">Inventory Overview</h1>
      {loading ? (
        <div className="loading-state">Loading inventory...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : inventory.length === 0 ? (
        <div className="empty-state">No inventory items found</div>
      ) : (
        <div className="table-container">
          <table className="inventory-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Quantity</th>
                <th>MRP</th>
                <th>Selling Price</th>
                <th>Category</th>
              </tr>
            </thead>
            <tbody>
              {inventory.map((item, index) => (
                <tr key={index}>
                  <td>{item.product_name}</td>
                  <td>{item.quantity}</td>
                  <td>₹{item.mrp?.toFixed(2) || '0.00'}</td>
                  <td>₹{item.price?.toFixed(2) || '0.00'}</td>
                  <td>{item.category}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ViewInventory;
