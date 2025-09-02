import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AnimatedText from './AnimatedText';
import './Registration.css';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post('http://localhost:5038/register', formData);
      // Pass registration details (such as email, phone and OTP) to the verify-OTP page
      navigate('/verify-otp', { state: response.data.verificationData });
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed');
    }
    setLoading(false);
  };

  return (
    <div className="main-container">
      {/* Left Section: Animated heading and subtitle */}
      <div className="left-section">
      <AnimatedText text="Start Your Business Journey Today" />

        <p className="subtitle">
          Join us and elevate your business today.
        </p>
      </div>

      {/* Right Section: Signup Form */}
      <div className="right-section">
        <form className="signup-form" onSubmit={handleSubmit}>
          <h2>Register</h2>
          {error && <div className="error-message">{error}</div>}
          
          <div className="input-group">
            <input 
              type="text" 
              name="name" 
              placeholder=" " 
              required
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
            <label>Name</label>
          </div>
          
          <div className="input-group">
            <input 
              type="email" 
              name="email" 
              placeholder=" " 
              required
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
            <label>Email</label>
          </div>
          
          <div className="input-group">
            <input 
              type="tel" 
              name="phone" 
              placeholder=" " 
              required
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
            <label>Phone</label>
          </div>
          
          <div className="input-group">
            <input 
              type="password" 
              name="password" 
              placeholder=" " 
              required
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <label>Password</label>
          </div>
          
          <button className="cta-button" type="submit" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Register;
