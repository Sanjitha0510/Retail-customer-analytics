import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './login.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`http://localhost:5038/login`, formData);
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-container">
      <button className="back-button" onClick={() => navigate('/')}>
        Back to Home
      </button>
      <div className="login-card">
        <div className="login-header">
          <div className="logo-icon">
            <span>R</span>
          </div>
          <h2 className="login-title">Login</h2>
        </div>
        
        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="error-message">{error}</div>}
          <input
            type="email"
            className="input-field"
            placeholder="Email"
            required
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
          <input
            type="password"
            className="input-field"
            placeholder="Password"
            required
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          />
          <button 
            className="primary-button" 
            type="submit" 
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="footer-links">
          <button className="footer-link" onClick={() => navigate('/register')}>
            Don't have an account? Sign Up
          </button>
        </div>
        
        <div className="forgot-password">
          <button className="forgot-link" onClick={() => navigate('/forgot-password')}>
            Forgot Password?
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
