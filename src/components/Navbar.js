import React from 'react';
import { Link, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { currentUser, logout } = useAuth();

  return (
    <>
      <nav className="navbar">
        <div className="nav-container">
          <Link to="/" className="nav-brand">QR Code App</Link>
          <div className="nav-links">
            {currentUser ? (
              <>
                <Link to="/admin" className="nav-link">Admin</Link>
                <button onClick={logout} className="nav-button">Logout</button>
              </>
            ) : (
              <Link to="/login" className="nav-link">Login</Link>
            )}
          </div>
        </div>
      </nav>
      <div className="content">
        <Outlet />
      </div>
    </>
  );
};

export default Navbar; 