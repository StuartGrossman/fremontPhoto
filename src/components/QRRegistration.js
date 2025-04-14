import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.js';
import './QRRegistration.css';

function QRRegistration() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const registerCamera = async () => {
      try {
        console.log('Starting camera registration process...');
        console.log('QR Code ID:', id);
        console.log('Current User:', currentUser?.uid);

        const qrCodeRef = doc(db, 'qrCodes', id);
        console.log('Fetching QR code document...');
        const qrCodeDoc = await getDoc(qrCodeRef);

        if (!qrCodeDoc.exists()) {
          console.error('QR code not found:', id);
          setError('QR code not found');
          setLoading(false);
          return;
        }

        const qrCodeData = qrCodeDoc.data();
        console.log('QR Code Data:', qrCodeData);
        
        // If user is not logged in, show login prompt
        if (!currentUser) {
          console.log('User not logged in, showing login prompt');
          setShowLoginPrompt(true);
          setLoading(false);
          return;
        }

        // First, update the user's profile document
        const userProfileRef = doc(db, 'users', currentUser.uid);
        console.log('Fetching user profile...');
        const userProfileDoc = await getDoc(userProfileRef);
        
        if (userProfileDoc.exists()) {
          console.log('Updating existing user profile...');
          const userProfile = userProfileDoc.data();
          const cameras = userProfile.cameras || [];
          
          // Check if camera already exists in user's profile
          if (!cameras.some(camera => camera.id === id)) {
            const newCamera = {
              id: id,
              name: `Camera ${qrCodeData.id}`,
              status: 'Registered',
              createdAt: new Date()
            };
            console.log('Adding new camera to user profile:', newCamera);
            await updateDoc(userProfileRef, {
              cameras: [...cameras, newCamera]
            });
          } else {
            console.log('Camera already exists in user profile');
          }
        } else {
          console.log('Creating new user profile...');
          const newUserProfile = {
            uid: currentUser.uid,
            email: currentUser.email,
            isAdmin: false,
            cameras: [{
              id: id,
              name: `Camera ${qrCodeData.id}`,
              status: 'Registered',
              createdAt: new Date()
            }],
            createdAt: new Date()
          };
          console.log('New user profile data:', newUserProfile);
          await setDoc(userProfileRef, newUserProfile);
        }

        // Try to update the QR code, but don't let it block the success state
        try {
          if (!qrCodeData.userId) {
            console.log('Updating QR code with user ID...');
            const updateData = {
              userId: currentUser.uid,
              status: 'Registered'
            };
            console.log('QR code update data:', updateData);
            await updateDoc(qrCodeRef, updateData);
          } else {
            console.log('QR code already has a user:', qrCodeData.userId);
          }
        } catch (qrError) {
          console.warn('QR code update failed, but continuing:', qrError);
          // Don't set error state here, as the registration was still successful
        }

        console.log('Registration successful, redirecting to profile...');
        setSuccess(true);
        setLoading(false);
        // Add a small delay before redirect to show success message
        setTimeout(() => {
          navigate('/profile');
        }, 1500);
      } catch (error) {
        console.error('Registration error details:', {
          error: error.message,
          code: error.code,
          stack: error.stack,
          data: error.data
        });
        setError('Error registering camera: ' + error.message);
        setLoading(false);
      }
    };

    registerCamera();
  }, [id, currentUser, navigate]);

  const handleLogin = async () => {
    try {
      console.log('Attempting Google login...');
      await loginWithGoogle();
      console.log('Google login successful');
    } catch (error) {
      console.error('Login error:', error);
      setError('Failed to login: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="qr-registration">
        <div className="loading">Registering camera...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-registration">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="qr-registration">
        <div className="success">Camera registered successfully! Redirecting...</div>
      </div>
    );
  }

  if (showLoginPrompt) {
    return (
      <div className="qr-registration">
        <div className="login-prompt">
          <h2>Please Login to Register Camera</h2>
          <button onClick={handleLogin} className="login-button">
            Login with Google
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default QRRegistration; 