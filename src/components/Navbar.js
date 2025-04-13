import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import './Navbar.css';

function Navbar() {
  const { currentUser, isAdmin, loginWithGoogle, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
    } catch (error) {
      console.error('Failed to login with Google:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Fremont Photo Co
        </Link>
        <div className="menu-icon" onClick={toggleMenu}>
          {isMenuOpen ? (
            <i className="fas fa-times" style={{ fontSize: '1.5rem', color: '#4a90e2' }} />
          ) : (
            <i className="fas fa-bars" style={{ fontSize: '1.5rem', color: '#4a90e2' }} />
          )}
        </div>
        <ul className={`nav-menu ${isMenuOpen ? 'active' : ''}`}>
          {!isAdmin && (
            <li className="nav-item">
              <Link to="/" className="nav-links" onClick={() => setIsMenuOpen(false)}>Home</Link>
            </li>
          )}
          {currentUser && !isAdmin && (
            <li className="nav-item">
              <Link to="/profile" className="nav-links" onClick={() => setIsMenuOpen(false)}>Profile</Link>
            </li>
          )}
          {isAdmin && (
            <>
              <li className="nav-item">
                <Link to="/admin" className="nav-links" onClick={() => setIsMenuOpen(false)}>Admin Dashboard</Link>
              </li>
            </>
          )}
          <li className="nav-item">
            {currentUser ? (
              <button onClick={handleLogout} className="nav-links">Logout</button>
            ) : (
              <button onClick={handleLogin} className="nav-links">Login with Google</button>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar; 