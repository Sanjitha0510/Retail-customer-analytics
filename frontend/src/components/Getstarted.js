import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './GetStarted.css';

const Getstarted = () => {
  const [activeStep, setActiveStep] = useState(1);
  const [completedSteps, setCompletedSteps] = useState(0);
  const [storeData, setStoreData] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    store_name: '',
    address_line_1: '',
    country: '',
    postal_code: ''
  });
  const navigate = useNavigate();
  const totalSteps = 3;

  useEffect(() => {
    const fetchStoreData = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5038/api/stores', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data) {
          setStoreData(response.data);
          setFormData(response.data);
          setCompletedSteps(1);
        }
      } catch (error) {
        console.error('Error fetching store data:', error);
      }
    };

    if (activeStep === 1) fetchStoreData();
  }, [activeStep]);

  const handleImportItems = () => navigate('/upload-inventory');
  const handleUploadSales = () => navigate('/upload-sales');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5038/api/stores', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStoreData(formData);
      setEditMode(false);
      setCompletedSteps(1);
    } catch (error) {
      console.error('Error saving store data:', error);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const progressPercentage = (completedSteps / totalSteps) * 100;

  const renderStepContent = () => {
    switch (activeStep) {
      case 1:
        return (
          <div className="form-container">
            <h2>{storeData ? 'Store Details' : 'Create Store'}</h2>
            
            {storeData && !editMode ? (
              <div className="store-details">
                <p><strong>Store Name:</strong> {storeData.store_name}</p>
                <p><strong>Address:</strong> {storeData.address_line_1}</p>
                <p><strong>Country:</strong> {storeData.country}</p>
                <p><strong>Postal Code:</strong> {storeData.postal_code}</p>
                <button 
                  className="edit-btn" 
                  onClick={() => setEditMode(true)}
                >
                  Edit Details
                </button>
              </div>
            ) : (
              <form className="store-form" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Store Name</label>
                  <input
                    type="text"
                    name="store_name"
                    value={formData.store_name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Address Line 1</label>
                  <input
                    type="text"
                    name="address_line_1"
                    value={formData.address_line_1}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Country</label>
                    <input
                      type="text"
                      name="country"
                      value={formData.country}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Postal Code</label>
                    <input
                      type="text"
                      name="postal_code"
                      value={formData.postal_code}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
                <button type="submit" className="submit-btn">
                  {storeData ? 'Update Store' : 'Create Store'}
                </button>
                {storeData && (
                  <button
                    type="button"
                    className="cancel-btn"
                    onClick={() => setEditMode(false)}
                  >
                    Cancel
                  </button>
                )}
              </form>
            )}
          </div>
        );

      case 2:
        return (
          <div className="inventory-section">
            <h2>Build your inventory</h2>
            <div className="upload-container">
              <div className="upload-area">
                <div className="folder-icon">📁</div>
                <p>Drag and drop your file here or</p>
                <button className="choose-file-btn" onClick={handleImportItems}>
                  Choose File
                </button>
              </div>
              <button className="upload-btn" onClick={handleImportItems}>
                Upload File
              </button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="sales-section">
            <h2>Set up your Sales</h2>
            <div className="upload-container">
              <div className="upload-area">
                <div className="folder-icon">📁</div>
                <p>Drag and drop your file here or</p>
                <button className="choose-file-btn" onClick={handleUploadSales}>
                  Choose File
                </button>
              </div>
              <button className="upload-btn" onClick={handleUploadSales}>
                Upload File
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="get-started-container">
      <div className="get-started-header">
        <h1>Welcome, Mohnish Shri Hari B!</h1>
        <p>Follow our quick checklist to get started with RCA</p>
        <div className="progress-indicator">
          <span>{`${completedSteps}/${totalSteps} Steps Completed`}</span>
          <div className="progress-bar">
            <div 
              className="progress-filled" 
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="checklist-container">
        <div className="checklist-items">
          <div 
            className={`checklist-item ${activeStep === 1 ? 'active' : completedSteps >= 1 ? 'completed' : ''}`}
            onClick={() => setActiveStep(1)}
          >
            <span className={completedSteps >= 1 ? 'check-icon' : 'step-number'}>1</span>
            <span>Create a Store</span>
          </div>
          <div 
            className={`checklist-item ${activeStep === 2 ? 'active' : completedSteps >= 2 ? 'completed' : ''}`}
            onClick={() => setActiveStep(2)}
          >
            <span className={completedSteps >= 2 ? 'check-icon' : 'step-number'}>2</span>
            <span>Build your inventory</span>
          </div>
          <div 
            className={`checklist-item ${activeStep === 3 ? 'active' : ''}`}
            onClick={() => setActiveStep(3)}
          >
            <span className="step-number">3</span>
            <span>Set up your Sales</span>
          </div>
        </div>
        {renderStepContent()}
      </div>
    </div>
  );
};

export default Getstarted;
