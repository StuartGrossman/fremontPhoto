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
  const { currentUser } = useAuth();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [generatingLabel, setGeneratingLabel] = useState(false);

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const qrCodeRef = doc(db, 'qrCodes', id);
        const qrCodeDoc = await getDoc(qrCodeRef);

        if (!qrCodeDoc.exists()) {
          setError('QR code not found');
          return;
        }

        const qrCodeData = qrCodeDoc.data();
        
        // Update the QR code with the user's ID if it doesn't have one
        if (!qrCodeData.userId && currentUser) {
          await updateDoc(qrCodeRef, {
            userId: currentUser.uid,
            status: 'Registered'
          });
          qrCodeData.userId = currentUser.uid;
          qrCodeData.status = 'Registered';
        }

        setQrCode(qrCodeData);
      } catch (error) {
        setError('Error fetching QR code: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQrCode();
  }, [id, currentUser]);

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

  const handleDeleteQr = async () => {
    if (!window.confirm('Are you sure you want to delete this QR code? This action cannot be undone.')) {
      return;
    }

    try {
      // Delete photos from Storage
      if (qrCode.photos && qrCode.photos.length > 0) {
        const deletePromises = qrCode.photos.map(photoUrl => {
          const photoRef = ref(storage, photoUrl);
          return deleteObject(photoRef);
        });
        await Promise.all(deletePromises);
      }

      // Delete QR code document
      await deleteDoc(doc(db, 'qrCodes', id));
      navigate('/admin');
    } catch (err) {
      setError('Failed to delete QR code');
    }
  };

  const handleGenerateLabel = async () => {
    setGeneratingLabel(true);
    try {
      // Simulate label generation
      const shippingLabel = {
        trackingNumber: `TRK${Date.now()}`,
        carrier: 'USPS',
        status: 'In Transit',
        createdAt: new Date()
      };

      await updateDoc(doc(db, 'qrCodes', id), {
        shippingLabel
      });

      setQrCode(prev => ({
        ...prev,
        shippingLabel
      }));
    } catch (err) {
      setError('Failed to generate shipping label');
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
          <button
            className="share-btn"
            onClick={() => {
              const galleryUrl = `${window.location.origin}/gallery/${id}`;
              if (navigator.share) {
                navigator.share({
                  title: `Photos from Camera ${qrCode.id}`,
                  url: galleryUrl
                }).catch(console.error);
              } else {
                navigator.clipboard.writeText(galleryUrl)
                  .then(() => alert('Gallery link copied to clipboard!'))
                  .catch(console.error);
              }
            }}
          >
            Share Public Gallery
          </button>
          <button className="back-btn" onClick={() => navigate(-1)}>
            Back to Profile
          </button>
        </div>
      </div>

      <div className="qr-viewer-content">
        <div className="qr-code-section">
          <h2>QR Code</h2>
          <div className="qr-code-image">
            <img
              src={qrCode.qrCodeUrl}
              alt={`QR Code for camera ${qrCode.id}`}
              width="200"
              height="200"
            />
          </div>
          <button
            className="download-btn"
            onClick={() => window.open(qrCode.qrCodeUrl, '_blank')}
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
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default QRViewer; 