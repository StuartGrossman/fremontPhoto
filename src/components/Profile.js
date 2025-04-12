import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.js';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingLabel, setGeneratingLabel] = useState(null);
  const [creatingTestCamera, setCreatingTestCamera] = useState(false);

  useEffect(() => {
    const fetchCameras = async () => {
      if (!currentUser) return;

      try {
        const userProfileRef = doc(db, 'users', currentUser.uid);
        const userProfileDoc = await getDoc(userProfileRef);

        if (userProfileDoc.exists()) {
          const userProfile = userProfileDoc.data();
          setCameras(userProfile.cameras || []);
        }
      } catch (error) {
        setError('Error fetching cameras: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCameras();
  }, [currentUser]);

  const handleCameraClick = (cameraId) => {
    navigate(`/gallery/${cameraId}`);
  };

  const handleGenerateLabel = async (cameraId) => {
    setGeneratingLabel(cameraId);

    try {
      // Generate a fake tracking number and label URL
      const trackingNumber = `TRK${Date.now()}`;
      const labelUrl = `https://example.com/labels/${trackingNumber}`;

      // Update the camera document in Firestore
      const cameraRef = doc(db, 'qrCodes', cameraId);
      await updateDoc(cameraRef, {
        shippingLabel: {
          trackingNumber,
          labelUrl,
          createdAt: new Date()
        }
      });

      // Update local state
      setCameras(prevCameras =>
        prevCameras.map(camera =>
          camera.id === cameraId
            ? {
                ...camera,
                shippingLabel: {
                  trackingNumber,
                  labelUrl,
                  createdAt: new Date()
                }
              }
            : camera
        )
      );
    } catch (error) {
      setError('Error generating shipping label: ' + error.message);
    } finally {
      setGeneratingLabel(null);
    }
  };

  const handleAddTestCamera = async () => {
    if (!currentUser) return;
    
    setCreatingTestCamera(true);
    try {
      // Create a new test QR code
      const qrCodesRef = collection(db, 'qrCodes');
      const newQrDoc = await addDoc(qrCodesRef, {
        createdAt: serverTimestamp(),
        photos: [],
        shippingLabel: null,
        createdBy: currentUser.uid,
        status: 'Active',
        userId: null
      });

      // Update the document with its own ID
      await updateDoc(newQrDoc, {
        id: newQrDoc.id
      });

      // Navigate to the registration page
      window.location.href = `/register/${newQrDoc.id}`;
    } catch (error) {
      setError('Error creating test camera: ' + error.message);
    } finally {
      setCreatingTestCamera(false);
    }
  };

  if (loading) {
    return (
      <div className="profile">
        <div className="loading">Loading your cameras...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <div className="profile">
      <h1>My Cameras</h1>
      {loading ? (
        <div className="loading">Loading cameras...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : (
        <>
          <div className="cameras-grid">
            {cameras.map(camera => (
              <div 
                key={camera.id} 
                className="camera-card"
                onClick={() => !generatingLabel && handleCameraClick(camera.id)}
              >
                <h2>{camera.name}</h2>
                <p>Status: {camera.status}</p>
                <p>Photos: {camera.photos?.length || 0}</p>
                {camera.shippingLabel && (
                  <p>Tracking: {camera.shippingLabel.trackingNumber}</p>
                )}
                <button 
                  className="generate-label-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleGenerateLabel(camera.id);
                  }}
                  disabled={generatingLabel === camera.id}
                >
                  {generatingLabel === camera.id ? 'Generating...' : 'Generate Shipping Label'}
                </button>
              </div>
            ))}
          </div>
          
          {/* Test button for QR registration */}
          <div className="test-section">
            <button 
              className="test-registration-button"
              onClick={handleAddTestCamera}
              disabled={creatingTestCamera}
            >
              {creatingTestCamera ? 'Creating Test Camera...' : 'Add Camera 2 (Test)'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Profile; 