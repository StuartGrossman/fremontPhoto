import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';

function AdminRoute({ children }) {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // Debug: Log the user's claims
  console.log('User claims:', currentUser.customClaims);
  console.log('User email:', currentUser.email);

  // Check if the user has admin status
  if (!currentUser.customClaims?.admin) {
    return (
      <div className="error">
        Access denied. You need admin privileges to access this page.
        <p>Current user: {currentUser.email}</p>
        <p>Admin status: {currentUser.customClaims?.admin ? 'Yes' : 'No'}</p>
      </div>
    );
  }

  return children;
}

export default AdminRoute; 