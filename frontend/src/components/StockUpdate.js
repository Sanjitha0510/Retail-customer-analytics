import React, { useState } from 'react';
import axios from 'axios';
import './StockUpdate.css';

const StockUpdate = ({ action }) => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stocks, setStocks] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) return;
    
    setLoading(true);
    const data = new FormData();
    data.append('file', file);

    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5038/stock/upload', data, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        }
      });
      setFile(null);
      alert('File uploaded successfully!');
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload file');
    }
    setLoading(false);
  };

  const fetchStocks = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5038/stock/view', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStocks(response.data);
    } catch (err) {
      setError('Failed to fetch stocks');
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="stock-update-container">
      {action === 'add' ? (
        <div className="upload-section">
          <h2>Upload Inventory File</h2>
          <form onSubmit={handleSubmit} className="upload-form">
            <div 
              className={`drag-drop-area ${dragActive ? 'drag-active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="drag-drop-content">
                <span className="upload-icon">📁</span>
                <p>Drag and drop your file here or</p>
                <input
                  type="file"
                  id="file-upload"
                  onChange={(e) => setFile(e.target.files[0])}
                  className="file-input"
                />
                <label htmlFor="file-upload" className="file-label">
                  Choose File
                </label>
                {file && <p className="selected-file">Selected: {file.name}</p>}
              </div>
            </div>
            <button 
              className={`upload-button ${loading ? 'loading' : ''}`} 
              disabled={loading || !file}
            >
              {loading ? 'Uploading...' : 'Upload File'}
            </button>
            {error && <div className="error-message">{error}</div>}
          </form>
        </div>
      ) : (
        <div className="view-section">
          <div className="header">
            <h2>Uploaded Files</h2>
            <button className="refresh-button" onClick={fetchStocks}>
              ↻ Refresh
            </button>
          </div>
          <div className="table-container">
            <table className="files-table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Uploaded At</th>
                </tr>
              </thead>
              <tbody>
                {stocks.map((stock) => (
                  <tr key={stock._id}>
                    <td>
                      <a href={`http://localhost:5038/uploads/${stock.filename}`}>
                        {stock.originalName}
                      </a>
                    </td>
                    <td>{new Date(stock.uploadedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default StockUpdate;