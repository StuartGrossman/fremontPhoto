import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { LogProvider } from './utils/logger.js';
import PrivateRoute from './components/PrivateRoute.js';
import AdminRoute from './components/AdminRoute.js';
import Home from './components/Home.js';
import AdminDashboard from './components/AdminDashboard.js';
import QRViewer from './components/QRViewer.js';
import PhotoGallery from './components/PhotoGallery.js';
import AdminManagement from './components/AdminManagement.js';
import Navbar from './components/Navbar.js';
import Profile from './components/Profile.js';
import './App.css';

function AppRoutes() {
  const { currentUser, isAdmin } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={
          isAdmin ? (
            <Navigate to="/admin" replace />
          ) : (
            <Home />
          )
        }
      />
      <Route path="/profile" element={<Profile />} />
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminDashboard />
          </AdminRoute>
        }
      />
      <Route
        path="/giveAdm"
        element={
          <AdminRoute>
            <AdminManagement />
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
      <Route path="/gallery/:id" element={<PhotoGallery />} />
    </Routes>
  );
}

function App() {
  return (
    <AuthProvider>
      <LogProvider>
        <div className="app">
          <Navbar />
          <div className="content">
            <AppRoutes />
          </div>
        </div>
      </LogProvider>
    </AuthProvider>
  );
}

export default App; 