import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';

function AdminRoute({ children }) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  // For now, allow any authenticated user to access the admin page
  // You can add more specific admin checks later
  return children;
}

export default AdminRoute; 