import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { auth } from '../firebase.js';
import { signOut } from 'firebase/auth';
import './Navbar.css';

function Navbar() {
  const { currentUser } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">QR Code System</Link>
      </div>
      <div className="navbar-links">
        {currentUser ? (
          <>
            <Link to="/admin">Admin Dashboard</Link>
            <span className="user-email">{currentUser.email}</span>
            <button className="nav-button" onClick={handleLogout}>
              Logout
            </button>
          </>
        ) : (
          <Link to="/login">Login</Link>
        )}
      </div>
    </nav>
  );
}

export default Navbar; 