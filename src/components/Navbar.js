import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import './Navbar.css';

function Navbar() {
  const { currentUser, isAdmin, loginWithGoogle, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const isProfilePage = location.pathname === '/profile';

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
      navigate('/');
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
          {isAdmin && (
            <li className="nav-item">
              <Link to="/admin" className="nav-links" onClick={() => setIsMenuOpen(false)}>Admin Dashboard</Link>
            </li>
          )}
          <li className="nav-item">
            {currentUser ? (
              <button 
                className="nav-links"
                onClick={handleLogout}
              >
                <i className="fas fa-sign-out-alt"></i>
                <span>Logout</span>
              </button>
            ) : (
              <button 
                className="nav-links"
                onClick={handleLogin}
              >
                <i className="fab fa-google"></i>
                <span>Login with Google</span>
              </button>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}

export default Navbar; 