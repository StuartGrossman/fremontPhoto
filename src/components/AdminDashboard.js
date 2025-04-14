import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, getDocs, deleteDoc, doc, addDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
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
  const [deleteError, setDeleteError] = useState(null);
  const [deleteSuccess, setDeleteSuccess] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState('all');

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

  // Group QR codes by month
  const groupQrCodesByMonth = () => {
    const grouped = {};
    
    qrCodes.forEach(qr => {
      const date = qr.createdAt?.toDate ? qr.createdAt.toDate() : new Date(qr.createdAt);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      
      if (!grouped[monthYear]) {
        grouped[monthYear] = [];
      }
      grouped[monthYear].push(qr);
    });
    
    return grouped;
  };

  // Get unique months for the filter dropdown
  const getUniqueMonths = () => {
    const months = new Set();
    qrCodes.forEach(qr => {
      const date = qr.createdAt?.toDate ? qr.createdAt.toDate() : new Date(qr.createdAt);
      const monthYear = date.toLocaleString('default', { month: 'long', year: 'numeric' });
      months.add(monthYear);
    });
    return ['all', ...Array.from(months)].sort((a, b) => {
      if (a === 'all') return -1;
      if (b === 'all') return 1;
      return new Date(b) - new Date(a);
    });
  };

  // Filter QR codes based on selected month
  const getFilteredQrCodes = () => {
    const grouped = groupQrCodesByMonth();
    if (selectedMonth === 'all') {
      return grouped;
    }
    return { [selectedMonth]: grouped[selectedMonth] || [] };
  };

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
        createdBy: currentUser.uid,
        status: 'Active',
        userId: null,
        id: null, // This will be updated with the document ID after creation
        albumName: null,
        updatedAt: null
      });

      // Update the document with its own ID
      await updateDoc(newQrDoc, {
        id: newQrDoc.id,
        updatedAt: serverTimestamp()
      });

      // Add the new QR code to the local state
      setQrCodes(prev => [{
        id: newQrDoc.id,
        createdAt: new Date(),
        photos: [],
        shippingLabel: null,
        createdBy: currentUser.uid,
        status: 'Active',
        userId: null,
        albumName: null,
        updatedAt: new Date()
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
    setDeleteError(null);
    setDeleteSuccess(false);

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
      setDeleteSuccess(true);
    } catch (err) {
      console.error('Error deleting QR code:', err);
      if (err.code === 'permission-denied') {
        setDeleteError('Permission denied. Please check your Firestore rules.');
      } else {
        setDeleteError('Failed to delete QR code. Please try again.');
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

  const handleCardClick = (qrCode) => {
    navigate(`/qr/${qrCode.id}`);
  };

  const handleDownloadQR = (e, qrId) => {
    e.stopPropagation();
    
    // Create a canvas element
    const canvas = document.createElement('canvas');
    const svg = document.getElementById(`qr-${qrId}`);
    const box = svg.getBoundingClientRect();
    
    canvas.width = box.width;
    canvas.height = box.height;
    
    // Convert SVG to image
    const img = new Image();
    const svgData = new XMLSerializer().serializeToString(svg);
    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);
    
    img.onload = () => {
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      // Convert canvas to blob
      canvas.toBlob((blob) => {
        const downloadUrl = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `qr-code-${qrId}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
      }, 'image/png');
    };
    
    img.src = url;
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
        <div className="dashboard-controls">
          <select 
            className="month-filter"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
          >
            {getUniqueMonths().map(month => (
              <option key={month} value={month}>
                {month === 'all' ? 'All Months' : month}
              </option>
            ))}
          </select>
          <button 
            className="generate-qr-btn"
            onClick={handleGenerateQr}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate New QR Code'}
          </button>
        </div>
      </div>
      
      {Object.entries(getFilteredQrCodes()).map(([monthYear, codes]) => (
        <div key={monthYear} className="month-section">
          <h2 className="month-header">{monthYear}</h2>
          <div className="qr-codes-grid">
            {codes.map(qr => (
              <div 
                key={qr.id} 
                className="qr-code-card"
                onClick={() => handleCardClick(qr)}
              >
                <div className="qr-code-info">
                  <div className="qr-code-image">
                    <QRCodeSVG 
                      id={`qr-${qr.id}`}
                      value={`${window.location.origin}/register/${qr.id}`}
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
                    <div className="photo-gallery">
                      <h4>Uploaded Photos ({qr.photos.length})</h4>
                      <div className="photo-gallery-container">
                        <div className="photo-carousel">
                          {qr.photos.map((photoUrl, index) => (
                            <div key={index} className="photo-thumbnail">
                              <img 
                                src={photoUrl} 
                                alt={`Photo ${index + 1}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(photoUrl, '_blank');
                                }}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="carousel-controls">
                          <button 
                            className="carousel-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const carousel = e.target.closest('.photo-gallery').querySelector('.photo-carousel');
                              carousel.scrollBy({ left: -200, behavior: 'smooth' });
                            }}
                          >
                            ←
                          </button>
                          <button 
                            className="carousel-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              const carousel = e.target.closest('.photo-gallery').querySelector('.photo-carousel');
                              carousel.scrollBy({ left: 200, behavior: 'smooth' });
                            }}
                          >
                            →
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="qr-code-actions">
                  <button 
                    className="download-btn"
                    onClick={(e) => handleDownloadQR(e, qr.id)}
                  >
                    Download QR
                  </button>
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
        </div>
      ))}

      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Delete QR Code</h3>
            <p>Are you sure you want to delete this QR code? This action cannot be undone.</p>
            {deleteError && <p className="error">{deleteError}</p>}
            {deleteSuccess && <p className="success">QR code deleted successfully!</p>}
            <div className="modal-actions">
              <button className="modal-btn cancel-btn" onClick={handleDeleteCancel}>
                Cancel
              </button>
              <button className="modal-btn delete-btn" onClick={handleDeleteConfirm}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard; 