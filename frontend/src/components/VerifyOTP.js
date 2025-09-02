import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import './VerifyOTP.css';

const VerifyOTP = () => {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const { email, phone, serverOTP } = location.state || {};

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await axios.post(`http://localhost:5038/verify-otp`, {
        email,
        phone,
        enteredOTP: otp,
        serverOTP
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed');
    }
    setLoading(false);
  };

  return (
    <div className="verify-container">
      <div className="verify-card">
        <h1 className="verify-title">Verify OTP</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit} className="verify-form">
          <div className="input-group">
            <input
              type="text"
              placeholder="Enter 6-digit OTP"
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="otp-input"
              maxLength="6"
            />
            <div className="info-text">
              OTP sent to {email} and {phone}
            </div>
          </div>
          
          <button 
            className={`verify-button ${loading ? 'loading' : ''}`} 
            disabled={loading}
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyOTP;
