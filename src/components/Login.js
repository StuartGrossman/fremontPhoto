import React from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.js';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import './Login.css';

const Login = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const handleGoogleSignIn = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate('/');
    } catch (error) {
      console.error('Error signing in with Google:', error);
    }
  };

  if (currentUser) {
    navigate('/');
    return null;
  }

  return (
    <div className="login-container">
      <div className="login-content">
        <h1>Welcome to QR Code Generator</h1>
        <p>Please sign in to continue</p>
        <button className="google-signin-button" onClick={handleGoogleSignIn}>
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google logo" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login; 