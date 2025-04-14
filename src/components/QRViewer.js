import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase.js';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '../contexts/AuthContext.js';
import './QRViewer.css';

function QRViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, isAdmin, loginWithGoogle } = useAuth();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [generatingLabel, setGeneratingLabel] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [success, setSuccess] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const qrCodeRef = doc(db, 'qrCodes', id);
        const qrCodeDoc = await getDoc(qrCodeRef);

        if (!qrCodeDoc.exists()) {
          setError('QR code not found. Please check the URL or contact support.');
          setLoading(false);
          return;
        }

        const qrCodeData = qrCodeDoc.data();
        
        // If the QR code data is incomplete, update it
        if (!qrCodeData.id) {
          await updateDoc(qrCodeRef, {
            id: id,
            status: qrCodeData.status || 'Active',
            userId: qrCodeData.userId || null
          });
          qrCodeData.id = id;
          qrCodeData.status = qrCodeData.status || 'Active';
          qrCodeData.userId = qrCodeData.userId || null;
        }
        
        // If user is not logged in, show login prompt
        if (!currentUser) {
          setShowLoginPrompt(true);
          setQrCode(qrCodeData);
          setLoading(false);
          return;
        }

        // If user is not admin, save the camera to their profile and redirect
        if (!isAdmin) {
          // Update the QR code with the user's ID if it doesn't have one
          if (!qrCodeData.userId) {
            console.log('Updating QR code with user ID...');
            const updateData = {
              userId: currentUser.uid,
              status: 'Registered',
              updatedAt: new Date()
            };
            console.log('QR code update data:', updateData);
            await updateDoc(qrCodeRef, updateData);
            console.log('QR code updated successfully');
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
          return;
        }

        setQrCode(qrCodeData);
      } catch (error) {
        setError('Error fetching QR code: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQrCode();
  }, [id, currentUser, isAdmin, navigate]);

  const handleLogin = async () => {
    try {
      await loginWithGoogle();
      // After successful login, the useEffect will run again and handle the redirection
    } catch (error) {
      setError('Failed to login: ' + error.message);
    }
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) return;

    setUploading(true);
    try {
      const uploadPromises = selectedFiles.map(async (file) => {
        const storageRef = ref(storage, `qr-codes/${id}/${file.name}`);
        await uploadBytes(storageRef, file);
        return getDownloadURL(storageRef);
      });

      const downloadURLs = await Promise.all(uploadPromises);
      
      const updatedPhotos = [...(qrCode.photos || []), ...downloadURLs];
      await updateDoc(doc(db, 'qrCodes', id), {
        photos: updatedPhotos
      });

      setQrCode(prev => ({
        ...prev,
        photos: updatedPhotos
      }));
      
      setSelectedFiles([]);
    } catch (err) {
      setError('Failed to upload photos');
    } finally {
      setUploading(false);
    }
  };

  const handleDeletePhoto = async (photoUrl) => {
    try {
      const photoRef = ref(storage, photoUrl);
      await deleteObject(photoRef);

      const updatedPhotos = qrCode.photos.filter(url => url !== photoUrl);
      await updateDoc(doc(db, 'qrCodes', id), {
        photos: updatedPhotos
      });

      setQrCode(prev => ({
        ...prev,
        photos: updatedPhotos
      }));
    } catch (err) {
      setError('Failed to delete photo');
    }
  };

  const handleDeleteQR = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Delete QR code document
      await deleteDoc(doc(db, 'qrCodes', id));
      
      // Delete associated photos from storage
      if (qrCode.photos && qrCode.photos.length > 0) {
        const deletePromises = qrCode.photos.map(photo => {
          const photoRef = ref(storage, photo);
          return deleteObject(photoRef);
        });
        await Promise.all(deletePromises);
      }
      
      // Delete shipping label if exists
      if (qrCode.shippingLabel) {
        const labelRef = ref(storage, qrCode.shippingLabel.labelUrl);
        await deleteObject(labelRef);
      }
      
      navigate('/profile');
    } catch (err) {
      console.error('Error deleting QR code:', err);
      setError('Failed to delete QR code. Please try again.');
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handleGenerateLabel = async () => {
    setGeneratingLabel(true);
    try {
      const labelData = {
        trackingNumber: `TRK${Date.now()}`,
        carrier: 'USPS',
        status: 'In Transit',
        createdAt: new Date().toISOString()
      };

      // Update the QR code document
      await updateDoc(doc(db, 'qrCodes', id), {
        shippingLabel: labelData
      });

      // Update the user's profile if they own this camera
      if (qrCode.userId) {
        const userProfileRef = doc(db, 'users', qrCode.userId);
        const userProfileDoc = await getDoc(userProfileRef);
        
        if (userProfileDoc.exists()) {
          const userProfile = userProfileDoc.data();
          const updatedCameras = userProfile.cameras.map(camera => 
            camera.id === id 
              ? { ...camera, shippingLabel: labelData }
              : camera
          );
          
          await updateDoc(userProfileRef, {
            cameras: updatedCameras
          });
        }
      }

      // Update local state
      setQrCode(prev => ({
        ...prev,
        shippingLabel: labelData
      }));

      setSuccess('Shipping label generated successfully');
    } catch (error) {
      console.error('Error generating label:', error);
      setError('Failed to generate shipping label: ' + error.message);
    } finally {
      setGeneratingLabel(false);
    }
  };

  if (loading) {
    return (
      <div className="qr-viewer">
        <div className="loading">Loading camera information...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="qr-viewer">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (showLoginPrompt) {
    return (
      <div className="qr-viewer">
        <div className="login-prompt">
          <h2>Camera {qrCode?.id} Found!</h2>
          <p>Please login to register this camera to your account.</p>
          <button className="login-btn" onClick={handleLogin}>Login with Google</button>
        </div>
      </div>
    );
  }

  if (!qrCode) {
    return (
      <div className="qr-viewer">
        <div className="error">Camera not found</div>
      </div>
    );
  }

  return (
    <div className="qr-viewer">
      <div className="qr-viewer-header">
        <h1>Camera {qrCode.id}</h1>
        <div className="header-actions">
          <button className="back-btn" onClick={() => navigate(-1)}>
            Back to Profile
          </button>
        </div>
      </div>

      <div className="qr-viewer-content">
        <div className="qr-code-section">
          <h2>QR Code</h2>
          <div className="qr-code-display">
            <QRCodeSVG
              value={`${window.location.origin}/register/${id}`}
              size={256}
              level="H"
              includeMargin={true}
            />
            <p>Scan this QR code to register your camera</p>
          </div>
          <button
            className="download-btn"
            onClick={() => {
              const canvas = document.createElement("canvas");
              const svg = document.querySelector(".qr-code-display svg");
              const svgData = new XMLSerializer().serializeToString(svg);
              const img = new Image();
              img.onload = () => {
                canvas.width = img.width;
                canvas.height = img.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                const pngUrl = canvas.toDataURL("image/png");
                const downloadLink = document.createElement("a");
                downloadLink.href = pngUrl;
                downloadLink.download = `qr-code-${id}.png`;
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
              };
              img.src = "data:image/svg+xml;base64," + btoa(svgData);
            }}
          >
            Download QR Code
          </button>
        </div>

        {qrCode.shippingLabel && (
          <div className="shipping-section">
            <h2>Shipping Information</h2>
            <div className="shipping-info">
              <p><strong>Status:</strong> {qrCode.shippingLabel.status}</p>
              <p><strong>Tracking Number:</strong> {qrCode.shippingLabel.trackingNumber}</p>
              <p><strong>Created:</strong> {new Date(qrCode.shippingLabel.createdAt).toLocaleString()}</p>
              {qrCode.shippingLabel.labelUrl && (
                <button
                  className="download-btn"
                  onClick={() => window.open(qrCode.shippingLabel.labelUrl, '_blank')}
                >
                  Download Shipping Label
                </button>
              )}
            </div>
          </div>
        )}

        {qrCode.photos && qrCode.photos.length > 0 && (
          <div className="photos-section">
            <h2>Uploaded Photos ({qrCode.photos.length})</h2>
            <div className="photos-grid">
              {qrCode.photos.map((photo, index) => (
                <div key={index} className="photo-item">
                  <img
                    src={photo}
                    alt={`Photo ${index + 1} for camera ${qrCode.id}`}
                    onClick={() => window.open(photo, '_blank')}
                  />
                  <p>Uploaded: {new Date(qrCode.createdAt?.toDate()).toLocaleString()}</p>
                  {isAdmin && (
                    <button
                      className="delete-photo-btn"
                      onClick={() => handleDeletePhoto(photo)}
                    >
                      Delete
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {isAdmin && (
          <div className="photo-upload">
            <h2>Upload New Photos</h2>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
            />
            {selectedFiles.length > 0 && (
              <div className="selected-files">
                {selectedFiles.map((file, index) => (
                  <div key={index} className="file-item">
                    <span>{file.name}</span>
                    <button
                      className="remove-file"
                      onClick={() => {
                        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              className="upload-btn"
              onClick={handleUpload}
              disabled={selectedFiles.length === 0 || uploading}
            >
              {uploading ? 'Uploading...' : 'Upload Photos'}
            </button>
          </div>
        )}

        {isAdmin && (
          <div className="admin-actions">
            <button 
              className="delete-qr-btn"
              onClick={() => setShowDeleteModal(true)}
              disabled={loading}
            >
              Delete QR Code
            </button>
          </div>
        )}
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete QR Code</h3>
            <p>Are you sure you want to delete this QR code? This action cannot be undone and will permanently delete all associated photos and shipping labels.</p>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn"
                onClick={() => setShowDeleteModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="modal-btn delete-btn"
                onClick={handleDeleteQR}
                disabled={loading}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default QRViewer; 