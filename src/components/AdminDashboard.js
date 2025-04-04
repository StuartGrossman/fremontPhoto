import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, deleteDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase.js';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.js';
import { QRCodeSVG } from 'qrcode.react';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [qrToDelete, setQrToDelete] = useState(null);

  useEffect(() => {
    if (!currentUser) {
      setError('Please log in to access the admin dashboard');
      setLoading(false);
      return;
    }

    const fetchQrCodes = async () => {
      try {
        const qrCodesRef = collection(db, 'qrCodes');
        const q = query(qrCodesRef, orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const codes = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        
        setQrCodes(codes);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching QR codes:', err);
        setError('Failed to fetch QR codes. Please check your permissions.');
        setLoading(false);
      }
    };

    fetchQrCodes();
  }, [currentUser]);

  const handleGenerateQr = async () => {
    if (!currentUser) {
      setError('Please log in to generate QR codes');
      return;
    }

    setGenerating(true);
    try {
      const qrCodesRef = collection(db, 'qrCodes');
      const newQrDoc = await addDoc(qrCodesRef, {
        createdAt: serverTimestamp(),
        photos: [],
        shippingLabel: null,
        createdBy: currentUser.uid
      });

      // Add the new QR code to the local state
      setQrCodes(prev => [{
        id: newQrDoc.id,
        createdAt: new Date(),
        photos: [],
        shippingLabel: null,
        createdBy: currentUser.uid
      }, ...prev]);

      // Navigate to the new QR code
      navigate(`/qr/${newQrDoc.id}`);
    } catch (err) {
      console.error('Error generating QR code:', err);
      if (err.code === 'permission-denied') {
        setError('Permission denied. Please check your Firestore rules.');
      } else {
        setError('Failed to generate QR code. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteClick = (e, qr) => {
    e.stopPropagation();
    setQrToDelete(qr);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!qrToDelete) return;

    setDeletingId(qrToDelete.id);
    try {
      // Delete photos from Storage
      if (qrToDelete.photos && qrToDelete.photos.length > 0) {
        const deletePromises = qrToDelete.photos.map(photoUrl => {
          const photoRef = ref(storage, photoUrl);
          return deleteObject(photoRef);
        });
        await Promise.all(deletePromises);
      }

      // Delete QR code document
      await deleteDoc(doc(db, 'qrCodes', qrToDelete.id));
      
      // Update local state
      setQrCodes(prev => prev.filter(qr => qr.id !== qrToDelete.id));
    } catch (err) {
      console.error('Error deleting QR code:', err);
      if (err.code === 'permission-denied') {
        setError('Permission denied. Please check your Firestore rules.');
      } else {
        setError('Failed to delete QR code');
      }
    } finally {
      setDeletingId(null);
      setShowDeleteModal(false);
      setQrToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setQrToDelete(null);
  };

  const handleCardClick = (qrId) => {
    navigate(`/qr/${qrId}`);
  };

  if (!currentUser) {
    return <div className="error">Please log in to access the admin dashboard</div>;
  }

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <button 
          className="generate-qr-btn"
          onClick={handleGenerateQr}
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate New QR Code'}
        </button>
      </div>
      
      <div className="qr-codes-grid">
        {qrCodes.map(qr => (
          <div 
            key={qr.id} 
            className="qr-code-card"
            onClick={() => handleCardClick(qr.id)}
          >
            <div className="qr-code-info">
              <div className="qr-code-image">
                <QRCodeSVG 
                  value={`${window.location.origin}/qr/${qr.id}`}
                  size={150}
                  level="H"
                  includeMargin={true}
                />
              </div>
              <p>Created: {new Date(qr.createdAt?.toDate()).toLocaleString()}</p>
              {qr.shippingLabel ? (
                <div className="shipping-info">
                  <p><strong>Tracking:</strong> {qr.shippingLabel.trackingNumber}</p>
                  <p><strong>Carrier:</strong> {qr.shippingLabel.carrier}</p>
                  <p><strong>Status:</strong> {qr.shippingLabel.status}</p>
                </div>
              ) : (
                <div className="no-shipping-label">
                  <p>No Shipping Label</p>
                </div>
              )}
              {qr.photos && qr.photos.length > 0 && (
                <p><strong>Photos:</strong> {qr.photos.length}</p>
              )}
            </div>
            <div className="qr-code-actions">
              <button
                className="delete-btn"
                onClick={(e) => handleDeleteClick(e, qr)}
                disabled={deletingId === qr.id}
              >
                {deletingId === qr.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete this QR code? This action cannot be undone.</p>
            <div className="modal-actions">
              <button 
                className="modal-btn cancel-btn"
                onClick={handleDeleteCancel}
              >
                Cancel
              </button>
              <button 
                className="modal-btn delete-btn"
                onClick={handleDeleteConfirm}
                disabled={deletingId === qrToDelete?.id}
              >
                {deletingId === qrToDelete?.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard; 