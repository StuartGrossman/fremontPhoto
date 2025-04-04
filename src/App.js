import React from 'react';
import { BrowserRouter as Router, Routes, Route, createRoutesFromElements, createBrowserRouter, RouterProvider } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Admin from './components/Admin';
import QRGenerator from './components/QRGenerator';
import QRViewer from './components/QRViewer';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<Navbar />}>
      <Route path="login" element={<Login />} />
      <Route path="admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
      <Route path="qr/:id" element={<QRViewer />} />
    </Route>
  ),
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true
    }
  }
);

function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  );
}

export default App; 