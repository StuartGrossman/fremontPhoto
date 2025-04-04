import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase';
import './Login.css';

const Login = () => {
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    try {
      setError('');
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user) {
        navigate('/admin');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setError('Failed to sign in. Please try again.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        <h1>Welcome to QR Code Generator</h1>
        <p>Please sign in to continue</p>
        {error && <div className="error-message">{error}</div>}
        <button onClick={handleGoogleSignIn} className="google-signin-button">
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login; 