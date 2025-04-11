import React from 'react';
import { Link } from 'react-router-dom';
import './Home.css';

function Home() {
  return (
    <div className="home-container">
      <div className="hero-section">
        <h1>Fremont Photo Co</h1>
        <p className="subtitle">Local owned and operated in-house film lab located in downtown Las Vegas</p>
        <div className="hero-image">
          <img src="https://picsum.photos/300/300?grayscale" alt="Fremont Photo Co" />
        </div>
      </div>

      <div className="feature-section">
        <h2>Film Development Made Simple</h2>
        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-image">
              <img src="https://picsum.photos/400/300?grayscale" alt="QR code system" />
            </div>
            <h3>QR Code System</h3>
            <p>Each camera comes with a unique QR code. Simply scan it to:</p>
            <ul>
              <li>Generate a shipping label</li>
              <li>Track your film's progress</li>
              <li>Receive notifications when your photos are ready</li>
            </ul>
          </div>
          
          <div className="feature-card">
            <div className="feature-image">
              <img src="https://picsum.photos/400/300?grayscale" alt="Shipping process" />
            </div>
            <h3>Easy Shipping</h3>
            <p>No more trips to the post office. Our system:</p>
            <ul>
              <li>Creates pre-paid shipping labels</li>
              <li>Provides tracking information</li>
              <li>Ensures safe delivery to our lab</li>
            </ul>
          </div>

          <div className="feature-card">
            <div className="feature-image">
              <img src="https://picsum.photos/400/300?grayscale" alt="Film development" />
            </div>
            <h3>Hand Development</h3>
            <p>Your film is developed with care:</p>
            <ul>
              <li>Processed using our DEV.A Compact Automatic Film Processor</li>
              <li>Scanned with our NORITSU HS-1800 for high-resolution results</li>
              <li>Delivered digitally via secure transfer</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="cta-section">
        <h2>Ready to Develop Your Film?</h2>
        <p>Scan your camera's QR code to get started</p>
        <Link to="/qr" className="cta-button">Scan QR Code</Link>
      </div>

      <div className="info-section">
        <h2>About Our Service</h2>
        <div className="info-grid">
          <div className="info-card">
            <div className="info-image">
              <img src="https://picsum.photos/300/200?grayscale" alt="Turnaround time" />
            </div>
            <h3>Turnaround Time</h3>
            <p>Processing times vary based on volume. We offer rush service for C-41 film at an additional 50% per roll.</p>
          </div>
          
          <div className="info-card">
            <div className="info-image">
              <img src="https://picsum.photos/300/200?grayscale" alt="Film types" />
            </div>
            <h3>Film Types</h3>
            <p>We process 35mm, 120, 4x5 & 8x10, and disposable cameras in color negative (C-41) and black and white.</p>
          </div>

          <div className="info-card">
            <div className="info-image">
              <img src="https://picsum.photos/300/200?grayscale" alt="Location" />
            </div>
            <h3>Location</h3>
            <p>623 S 8th St, Las Vegas, NV 89101</p>
            <p>Hours: By appointment only</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home; 