import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext.js';
import PrivateRoute from './components/PrivateRoute.js';
import AdminRoute from './components/AdminRoute.js';
import Home from './components/Home.js';
import Login from './components/Login.js';
import AdminDashboard from './components/AdminDashboard.js';
import QRViewer from './components/QRViewer.js';
import Navbar from './components/Navbar.js';
import './App.css';

function App() {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route 
            path="/" 
            element={
              currentUser ? (
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              ) : (
                <Home />
              )
            } 
          />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/qr/:id"
            element={
              <PrivateRoute>
                <QRViewer />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App; 