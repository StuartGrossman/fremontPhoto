import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Welcome to QR Code Manager</h1>
        <p>Manage your QR codes and track shipments in one place</p>
        <div className="cta-buttons">
          <Link to="/login" className="cta-button primary">
            Login
          </Link>
          <Link to="/login" className="cta-button secondary">
            Sign Up
          </Link>
        </div>
      </div>
      <div className="features-section">
        <div className="feature-card">
          <h3>QR Code Generation</h3>
          <p>Create and manage QR codes for your products</p>
        </div>
        <div className="feature-card">
          <h3>Photo Management</h3>
          <p>Upload and organize photos for each QR code</p>
        </div>
        <div className="feature-card">
          <h3>Shipping Tracking</h3>
          <p>Generate and track shipping labels</p>
        </div>
      </div>
    </div>
  );
}

export default Home; 