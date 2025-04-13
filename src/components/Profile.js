import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.js';
import './Profile.css';
import jsPDF from 'jspdf';

function Profile() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generatingLabel, setGeneratingLabel] = useState(null);
  const [creatingTestCamera, setCreatingTestCamera] = useState(false);
  const [success, setSuccess] = useState(null);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(null);
  const [editingCamera, setEditingCamera] = useState(null);
  const [newCameraName, setNewCameraName] = useState('');

  useEffect(() => {
    const fetchCameras = async () => {
      if (!currentUser) return;

      try {
        const userProfileRef = doc(db, 'users', currentUser.uid);
        const userProfileDoc = await getDoc(userProfileRef);

        if (userProfileDoc.exists()) {
          const userProfile = userProfileDoc.data();
          const camerasWithPhotos = await Promise.all(
            (userProfile.cameras || []).map(async (camera) => {
              const qrCodeRef = doc(db, 'qrCodes', camera.id);
              const qrCodeDoc = await getDoc(qrCodeRef);
              if (qrCodeDoc.exists()) {
                const qrCodeData = qrCodeDoc.data();
                return {
                  ...camera,
                  photos: qrCodeData.photos || []
                };
              }
              return camera;
            })
          );
          setCameras(camerasWithPhotos);
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
      const trackingNumber = `FPC${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
      const labelData = {
        trackingNumber,
        carrier: 'USPS',
        status: 'Generated',
        createdAt: new Date().toISOString(),
        qrCodeId: cameraId,
        userId: currentUser.uid
      };

      // Add to shippingLabels collection
      const shippingLabelsRef = collection(db, 'shippingLabels');
      await addDoc(shippingLabelsRef, labelData);

      // Update user's profile
      const userProfileRef = doc(db, 'users', currentUser.uid);
      const userProfileDoc = await getDoc(userProfileRef);
      if (userProfileDoc.exists()) {
        const userProfile = userProfileDoc.data();
        const updatedCameras = userProfile.cameras.map(camera => {
          if (camera.id === cameraId) {
            return { ...camera, shippingLabel: labelData };
          }
          return camera;
        });
        await updateDoc(userProfileRef, { cameras: updatedCameras });
        setCameras(prevCameras => prevCameras.map(camera => {
          if (camera.id === cameraId) {
            return { ...camera, shippingLabel: labelData };
          }
          return camera;
        }));
      }

      setSuccess('Shipping label generated successfully!');
    } catch (error) {
      console.error('Error generating shipping label:', error);
      setError('Failed to generate shipping label: ' + error.message);
    } finally {
      setGeneratingLabel(null);
    }
  };

  const handleViewLabel = (camera) => {
    setSelectedLabel(camera.shippingLabel);
    setShowLabelModal(true);
  };

  const handleDownloadLabel = () => {
    if (!selectedLabel) return;

    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text('Fremont Photo Co - Shipping Label', 20, 20);
    doc.setFontSize(12);
    doc.text(`Tracking Number: ${selectedLabel.trackingNumber}`, 20, 30);
    doc.text(`Carrier: ${selectedLabel.carrier}`, 20, 40);
    doc.text(`Status: ${selectedLabel.status}`, 20, 50);
    doc.text(`Created: ${new Date(selectedLabel.createdAt).toLocaleString()}`, 20, 60);
    doc.save(`shipping-label-${selectedLabel.trackingNumber}.pdf`);
  };

  const handleRenameCamera = async (cameraId, newName) => {
    try {
      const userProfileRef = doc(db, 'users', currentUser.uid);
      const userProfileDoc = await getDoc(userProfileRef);
      
      if (userProfileDoc.exists()) {
        const userProfile = userProfileDoc.data();
        const updatedCameras = userProfile.cameras.map(camera => {
          if (camera.id === cameraId) {
            return { ...camera, name: newName };
          }
          return camera;
        });
        
        await updateDoc(userProfileRef, { cameras: updatedCameras });
        setCameras(prevCameras => prevCameras.map(camera => {
          if (camera.id === cameraId) {
            return { ...camera, name: newName };
          }
          return camera;
        }));
        
        setEditingCamera(null);
        setNewCameraName('');
        setSuccess('Camera name updated successfully!');
      }
    } catch (error) {
      console.error('Error renaming camera:', error);
      setError('Failed to rename camera: ' + error.message);
    }
  };

  const startEditing = (camera) => {
    setEditingCamera(camera.id);
    setNewCameraName(camera.name);
  };

  const LabelModal = () => {
    if (!showLabelModal || !selectedLabel) return null;

    return (
      <div className="modal-overlay" onClick={() => setShowLabelModal(false)}>
        <div className="modal-content" onClick={e => e.stopPropagation()}>
          <h2>Shipping Label Details</h2>
          <div className="label-details">
            <p><strong>Tracking Number:</strong> {selectedLabel.trackingNumber}</p>
            <p><strong>Carrier:</strong> {selectedLabel.carrier}</p>
            <p><strong>Status:</strong> {selectedLabel.status}</p>
            <p><strong>Created:</strong> {new Date(selectedLabel.createdAt).toLocaleString()}</p>
          </div>
          <div className="modal-actions">
            <button 
              className="download-label-btn"
              onClick={handleDownloadLabel}
            >
              Download Label
            </button>
            <button 
              className="close-modal"
              onClick={() => setShowLabelModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
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
      <div className="profile-header">
        <h1>My Cameras</h1>
      </div>
      {success && <div className="success-message">{success}</div>}
      <div className="cameras-grid">
        {cameras.map(camera => (
          <div 
            key={camera.id} 
            className="camera-card"
            onClick={() => !generatingLabel && !editingCamera && handleCameraClick(camera.id)}
          >
            {editingCamera === camera.id ? (
              <div className="camera-edit-form" onClick={e => e.stopPropagation()}>
                <input
                  type="text"
                  value={newCameraName}
                  onChange={(e) => setNewCameraName(e.target.value)}
                  className="camera-name-input"
                  placeholder="Enter new camera name"
                />
                <div className="edit-actions">
                  <button 
                    className="save-btn"
                    onClick={() => handleRenameCamera(camera.id, newCameraName)}
                  >
                    Save
                  </button>
                  <button 
                    className="cancel-btn"
                    onClick={() => {
                      setEditingCamera(null);
                      setNewCameraName('');
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="camera-header">
                  <h2>{camera.name}</h2>
                  <button 
                    className="edit-name-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      startEditing(camera);
                    }}
                  >
                    <i className="fas fa-edit"></i>
                  </button>
                </div>
                <div className="camera-info">
                  <p className="status">Status: {camera.status}</p>
                  <p className="photos-count">Photos: {Array.isArray(camera.photos) ? camera.photos.length : 0}</p>
                  {camera.shippingLabel && (
                    <p className="tracking">Tracking: {camera.shippingLabel.trackingNumber}</p>
                  )}
                </div>
                <div className="camera-actions">
                  {camera.shippingLabel ? (
                    <button 
                      className="view-label-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleViewLabel(camera);
                      }}
                    >
                      View Shipping Label
                    </button>
                  ) : (
                    <button 
                      className="generate-label-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGenerateLabel(camera.id);
                      }}
                      disabled={generatingLabel === camera.id}
                    >
                      {generatingLabel === camera.id ? 'Generating...' : 'Ready to Ship'}
                    </button>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
      <LabelModal />
    </div>
  );
}

export default Profile; 