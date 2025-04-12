import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
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

  useEffect(() => {
    const registerCamera = async () => {
      try {
        const qrCodeRef = doc(db, 'qrCodes', id);
        const qrCodeDoc = await getDoc(qrCodeRef);

        if (!qrCodeDoc.exists()) {
          setError('QR code not found');
          setLoading(false);
          return;
        }

        const qrCodeData = qrCodeDoc.data();
        
        // If user is not logged in, show login prompt
        if (!currentUser) {
          setShowLoginPrompt(true);
          setLoading(false);
          return;
        }

        // Update the QR code with the user's ID if it doesn't have one
        if (!qrCodeData.userId) {
          await updateDoc(qrCodeRef, {
            userId: currentUser.uid,
            status: 'Registered'
          });
          qrCodeData.userId = currentUser.uid;
          qrCodeData.status = 'Registered';
        }

        // Create or update the user's profile document
        const userProfileRef = doc(db, 'users', currentUser.uid);
        const userProfileDoc = await getDoc(userProfileRef);
        
        if (userProfileDoc.exists()) {
          const userProfile = userProfileDoc.data();
          const cameras = userProfile.cameras || [];
          
          // Check if camera already exists in user's profile
          if (!cameras.some(camera => camera.id === id)) {
            await updateDoc(userProfileRef, {
              cameras: [...cameras, {
                id: id,
                name: `Camera ${qrCodeData.id}`,
                status: 'Registered',
                createdAt: new Date()
              }]
            });
          }
        } else {
          // Create new user profile with the camera
          await updateDoc(userProfileRef, {
            cameras: [{
              id: id,
              name: `Camera ${qrCodeData.id}`,
              status: 'Registered',
              createdAt: new Date()
            }],
            createdAt: new Date()
          });
        }

        // Redirect to profile page
        navigate('/profile');
      } catch (error) {
        setError('Error registering camera: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    registerCamera();
  }, [id, currentUser, navigate]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      // After successful login, the useEffect will run again and handle the redirection
    } catch (error) {
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