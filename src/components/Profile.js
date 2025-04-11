import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase.js';
import './Profile.css';

function Profile() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingLabel, setGeneratingLabel] = useState(null);

  useEffect(() => {
    const fetchCameras = async () => {
      if (!currentUser) return;

      try {
        const q = query(
          collection(db, 'qrCodes'),
          where('userId', '==', currentUser.uid)
        );
        const querySnapshot = await getDocs(q);
        const camerasData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setCameras(camerasData);
      } catch (err) {
        setError('Error fetching cameras');
        console.error('Error fetching cameras:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCameras();
  }, [currentUser]);

  const handleCameraClick = (cameraId) => {
    navigate(`/gallery/${cameraId}`);
  };

  const handleGenerateLabel = async (cameraId, e) => {
    e.stopPropagation(); // Prevent card click
    setGeneratingLabel(cameraId);

    try {
      // Generate a fake tracking number
      const trackingNumber = `FP${Math.random().toString(36).substring(2, 15)}`;
      const labelUrl = `https://example.com/labels/${trackingNumber}.pdf`;
      
      // Update the camera document in Firestore
      const cameraRef = doc(db, 'qrCodes', cameraId);
      await updateDoc(cameraRef, {
        shippingLabel: {
          trackingNumber,
          labelUrl,
          createdAt: new Date().toISOString(),
          status: 'generated'
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
                  createdAt: new Date().toISOString(),
                  status: 'generated'
                }
              }
            : camera
        )
      );
    } catch (err) {
      console.error('Error generating shipping label:', err);
      setError('Error generating shipping label');
    } finally {
      setGeneratingLabel(null);
    }
  };

  if (loading) {
    return <div className="loading">Loading your cameras...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="profile">
      <h1>Your Cameras</h1>
      {cameras.length === 0 ? (
        <p>You haven't registered any cameras yet.</p>
      ) : (
        <div className="cameras-grid">
          {cameras.map(camera => (
            <div
              key={camera.id}
              className="camera-card"
              onClick={() => handleCameraClick(camera.id)}
            >
              <div className="camera-info">
                <h2>Camera {camera.id}</h2>
                <p>Status: {camera.status || 'Active'}</p>
                {camera.photos && (
                  <p>Photos: {camera.photos.length}</p>
                )}
                {camera.shippingLabel && (
                  <p>Tracking: {camera.shippingLabel.trackingNumber}</p>
                )}
                <button
                  className="generate-label-btn"
                  onClick={(e) => handleGenerateLabel(camera.id, e)}
                  disabled={generatingLabel === camera.id}
                >
                  {generatingLabel === camera.id ? 'Generating...' : 'Generate Shipping Label'}
                </button>
              </div>
              {camera.qrCodeUrl && (
                <div className="qr-code-preview">
                  <img
                    src={camera.qrCodeUrl}
                    alt={`QR Code for camera ${camera.id}`}
                    width="100"
                    height="100"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Profile; 