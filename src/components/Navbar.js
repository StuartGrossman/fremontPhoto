import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import './Navbar.css';

function Navbar() {
  const { currentUser, isAdmin, loginWithGoogle, logout } = useAuth();

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

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-logo">
          Fremont Photo Co
        </Link>
        <ul className="nav-menu">
          <li className="nav-item">
            <Link to="/" className="nav-links">Home</Link>
          </li>
          {currentUser && (
            <li className="nav-item">
              <Link to="/profile" className="nav-links">Profile</Link>
            </li>
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