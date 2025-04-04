import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase.js';
import { QRCodeSVG } from 'qrcode.react';
import './QRViewer.css';

function QRViewer() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [generatingLabel, setGeneratingLabel] = useState(false);

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const qrDoc = await getDoc(doc(db, 'qrCodes', id));
        if (!qrDoc.exists()) {
          setError('QR code not found');
          setLoading(false);
          return;
        }
        setQrCode({ id: qrDoc.id, ...qrDoc.data() });
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch QR code');
        setLoading(false);
      }
    };

    fetchQrCode();
  }, [id]);

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
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!qrCode) {
    return <div className="error">QR code not found</div>;
  }

  const currentUrl = `${window.location.origin}/qr/${id}`;

  return (
    <div className="qr-viewer">
      <div className="qr-details">
        <div className="qr-code-section">
          <h2>QR Code Details</h2>
          <div className="qr-code">
            <QRCodeSVG value={currentUrl} size={200} />
          </div>
          <p className="qr-url">{currentUrl}</p>
        </div>

        <div className="photo-section">
          <h3>Photos</h3>
          <div className="photo-upload">
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileSelect}
              disabled={uploading}
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
          <div className="photo-grid">
            {qrCode.photos && qrCode.photos.map((photoUrl, index) => (
              <div key={index} className="photo-item">
                <img src={photoUrl} alt={`Upload ${index + 1}`} />
                <button
                  className="delete-photo-btn"
                  onClick={() => handleDeletePhoto(photoUrl)}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="shipping-section">
          <h3>Shipping Label</h3>
          {qrCode.shippingLabel ? (
            <div className="shipping-info">
              <p><strong>Tracking Number:</strong> {qrCode.shippingLabel.trackingNumber}</p>
              <p><strong>Carrier:</strong> {qrCode.shippingLabel.carrier}</p>
              <p><strong>Status:</strong> {qrCode.shippingLabel.status}</p>
              <p><strong>Created:</strong> {new Date(qrCode.shippingLabel.createdAt).toLocaleString()}</p>
            </div>
          ) : (
            <button
              className="generate-label-btn"
              onClick={handleGenerateLabel}
              disabled={generatingLabel}
            >
              {generatingLabel ? 'Generating...' : 'Generate Shipping Label'}
            </button>
          )}
        </div>

        <div className="actions">
          <button className="delete-qr-btn" onClick={handleDeleteQr}>
            Delete QR Code
          </button>
        </div>
      </div>
    </div>
  );
}

export default QRViewer; 