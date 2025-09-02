import React, { useState } from 'react';
import axios from 'axios';
import './AdvertisementPage.css';
import qrCode from './QR_code.jpg';

const AdvertisementPage = () => {
  const [loading, setLoading] = useState(false);

  const handleWhatsapp = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Create QR popup container
      const qrPopup = document.createElement('div');
      qrPopup.className = 'qr-popup';
      
      // Add QR content
      qrPopup.innerHTML = `
        <div class="qr-content">
          <h2>Log into WhatsApp ChatBot</h2>
          <p>Message automatically with customers using WhatsApp on your browser.</p>
          <div class="qr-steps">
            <p>1. Open WhatsApp on your phone</p>
            <p>2. Tap Menu or Settings</p>
            <p>3. Tap WhatsApp ChatBot</p>
            <p>4. Point your phone at this screen to scan the QR code</p>
          </div>
          <div id="qr-code">
            <img src=${qrCode} alt="WhatsApp QR Code" width="264" height="264" />
          <div class="encryption-note">
            <span>🔒 Your messages are end-to-end encrypted</span>
          </div>
          <button class="close-button">Close</button>
        </div>
      `;
      
      document.body.appendChild(qrPopup);
      
      // Add event listener to close button
      const closeButton = qrPopup.querySelector('.close-button');
      closeButton.addEventListener('click', () => {
        document.body.removeChild(qrPopup);
      });
  
    } catch (error) {
      alert('Failed to generate QR code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInstagramSubscription = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Generate the reel
      const generateResponse = await axios.post(
        'http://localhost:5038/api/generate-reel',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!generateResponse.data.success) {
        throw new Error('Failed to generate video');
      }

      // Post to Instagram
      const postResponse = await axios.post(
        'http://localhost:5038/api/post-reel',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!postResponse.data.success) {
        throw new Error('Failed to post reel');
      }

      alert('Reel posted successfully!');
    } catch (error) {
      let errorMessage = 'Failed to post reel. ';
      if (error.response) {
        errorMessage += error.response.data.error || 'Please try again.';
      } else if (error.request) {
        errorMessage += 'Server not responding. Please try again later.';
      } else {
        errorMessage += error.message;
      }
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="advertisement-container">
      <h1 className="page-title">Advertisement Services</h1>
      <div className="cards-container">
        <div className="subscription-card">
          <div className="card-content">
            <div className="platform-icon">📸</div>
            <h2>Instagram Ads</h2>
            <p className="card-description">
              Automatically generate and post product reels featuring your top 5 selling items
            </p>
            <button 
              className={`subscribe-button ${loading ? 'loading' : ''}`}
              onClick={handleInstagramSubscription}
              disabled={loading}
            >
              {loading ? 'Generating & Posting...' : 'Post Reel'}
            </button>
          </div>
        </div>
        <div className="subscription-card">
          <div className="card-content">
            <div className="platform-icon">📸</div>
            <h2>WhatsApp ChatBot</h2>
            <p className="card-description">
              Get WhatsAPp chatbot to send customer offer retaled messages Automatically.
            </p>
            <button 
              className={`subscribe-button `}
              onClick={handleWhatsapp}
              disabled={loading}
            >
              {loading ? 'QR Generating' : 'Generate QR'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvertisementPage;
