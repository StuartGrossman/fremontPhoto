import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import './Home.css';

function Home() {
  const { loginWithGoogle } = useAuth();

  const handleButtonClick = async (e) => {
    e.preventDefault();
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Failed to login with Google:', error);
    }
  };

  return (
    <div className="home-container">
      <section className="hero-section">
        <div className="hero-content">
          <h1>Fremont Photo Co</h1>
          <p className="subtitle">Local owned and operated in-house film lab located in downtown Las Vegas</p>
          <button onClick={handleButtonClick} className="hero-cta">Get Started</button>
        </div>
        <div className="hero-image">
          <img src="/images/34c4b27b-cc98-42d6-a156-a91ea95edd78.jpeg" alt="Fremont Photo Co Storefront" />
        </div>
      </section>

      <section className="features-section">
        <h2>Why Choose Us</h2>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-image">
              <img src="/images/f8ff14f8-2fcc-46bc-9e27-80030e27b192.jpeg" alt="QR code system" />
            </div>
            <div className="feature-content">
              <h3>Smart QR System</h3>
              <p>Track your film's journey from start to finish with our innovative QR code system.</p>
              <ul>
                <li>Instant shipping labels</li>
                <li>Real-time progress tracking</li>
                <li>Digital delivery notifications</li>
              </ul>
            </div>
          </div>
          
          <div className="feature-card">
            <div className="feature-image">
              <img src="/images/a8408962-4b1b-4873-a68e-b721c489cfd4.jpeg" alt="Shipping process" />
            </div>
            <div className="feature-content">
              <h3>Hassle-Free Shipping</h3>
              <p>We've simplified the shipping process to make it as easy as possible.</p>
              <ul>
                <li>Pre-paid shipping labels</li>
                <li>Secure packaging</li>
                <li>Tracking from start to finish</li>
              </ul>
            </div>
          </div>

          <div className="feature-card">
            <div className="feature-image">
              <img src="/images/b55f88dd-619d-4fab-96a5-44b77269b2cb.jpeg" alt="Film development" />
            </div>
            <div className="feature-content">
              <h3>Professional Development</h3>
              <p>Your film is in expert hands with our state-of-the-art equipment.</p>
              <ul>
                <li>DEV.A Compact Processor</li>
                <li>NORITSU HS-1800 Scanning</li>
                <li>High-resolution digital delivery</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="process-section">
        <h2>How It Works</h2>
        <div className="process-steps">
          <div className="process-step">
            <div className="step-number">1</div>
            <h3>Register Your Camera</h3>
            <p>Scan your camera's QR code to create your account and register your device.</p>
          </div>
          <div className="process-step">
            <div className="step-number">2</div>
            <h3>Ship Your Film</h3>
            <p>Generate a shipping label and send us your film using our pre-paid service.</p>
          </div>
          <div className="process-step">
            <div className="step-number">3</div>
            <h3>Track Progress</h3>
            <p>Monitor your film's journey through our development process in real-time.</p>
          </div>
          <div className="process-step">
            <div className="step-number">4</div>
            <h3>Receive Photos</h3>
            <p>Get notified when your photos are ready and access them digitally.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-content">
          <h2>Ready to Develop Your Film?</h2>
          <p>Join our community of film enthusiasts and experience professional development.</p>
          <button onClick={handleButtonClick} className="cta-button">Start Your Journey</button>
        </div>
      </section>
    </div>
  );
}

export default Home; 