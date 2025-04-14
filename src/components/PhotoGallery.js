import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase.js';
import { useAuth } from '../contexts/AuthContext.js';
import './PhotoGallery.css';

function PhotoGallery() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    console.log('Gallery - Component Mounted:', { id, currentUser: currentUser?.uid });
    
    const qrCodeRef = doc(db, 'qrCodes', id);
    console.log('Gallery - Setting up listener for QR code:', id);
    
    const unsubscribe = onSnapshot(qrCodeRef, 
      (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          console.log('Gallery - QR Code Update Received:', {
            id: id,
            albumName: data.albumName,
            userId: data.userId,
            currentUser: currentUser?.uid,
            isOwner: currentUser?.uid === data.userId,
            previousAlbumName: qrCode?.albumName,
            hasChanged: data.albumName !== qrCode?.albumName
          });
          
          setQrCode(data);
          setNewAlbumName(data.albumName || `Photos from Camera ${id}`);
          setLoading(false);
        } else {
          console.log('Gallery - QR Code Not Found:', id);
          setError('QR code not found');
          setLoading(false);
        }
      },
      (err) => {
        console.error('Gallery - Listener Error:', {
          error: err,
          code: err.code,
          message: err.message
        });
        setError('Failed to load QR code');
        setLoading(false);
      }
    );

    return () => {
      console.log('Gallery - Cleaning up listener for QR code:', id);
      unsubscribe();
    };
  }, [id, currentUser]);

  useEffect(() => {
    console.log('Current User:', {
      uid: currentUser?.uid,
      email: currentUser?.email,
      isLoggedIn: !!currentUser
    });
  }, [currentUser]);

  useEffect(() => {
    if (qrCode && currentUser) {
      console.log('Ownership Check:', {
        qrCodeUserId: qrCode.userId,
        currentUserId: currentUser.uid,
        isOwner: currentUser.uid === qrCode.userId
      });
    }
  }, [qrCode, currentUser]);

  const handlePhotoSelect = (photoUrl) => {
    setSelectedPhotos(prev => {
      if (prev.includes(photoUrl)) {
        return prev.filter(url => url !== photoUrl);
      } else {
        return [...prev, photoUrl];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(qrCode.photos || []);
    }
    setSelectAll(!selectAll);
  };

  const handleDownloadSelected = () => {
    selectedPhotos.forEach(photoUrl => {
      const link = document.createElement('a');
      link.href = photoUrl;
      link.download = `photo-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleShare = () => {
    const shareUrl = window.location.href;
    if (navigator.share) {
      navigator.share({
        title: qrCode.albumName || `Photos from Camera ${id}`,
        url: shareUrl
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('Link copied to clipboard!'))
        .catch(console.error);
    }
  };

  const handleUpdateAlbumName = async () => {
    if (!currentUser) {
      setError('You must be logged in to rename the album');
      return;
    }

    try {
      console.log('Gallery - Attempting to Rename Album:', {
        id: id,
        newName: newAlbumName,
        userId: currentUser.uid,
        qrCodeUserId: qrCode?.userId,
        currentAlbumName: qrCode?.albumName
      });

      const qrCodeRef = doc(db, 'qrCodes', id);
      await updateDoc(qrCodeRef, {
        albumName: newAlbumName,
        updatedAt: new Date()
      });
      
      console.log('Gallery - Album Name Update Successful');
      
      setQrCode(prev => ({
        ...prev,
        albumName: newAlbumName
      }));
      setShowRenameModal(false);
      setSuccess('Album name updated successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Gallery - Rename Error:', {
        error: error,
        code: error.code,
        message: error.message,
        details: error.details
      });
      setError('Failed to update album name: ' + error.message);
    }
  };

  if (loading) {
    return (
      <div className="photo-gallery">
        <div className="loading">Loading photos...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="photo-gallery">
        <div className="error">{error}</div>
      </div>
    );
  }

  if (!qrCode || !qrCode.photos || qrCode.photos.length === 0) {
    return (
      <div className="photo-gallery">
        <div className="error">No photos found for this camera</div>
      </div>
    );
  }

  return (
    <div className="photo-gallery">
      <div className="gallery-header">
        <h1>
          {qrCode.albumName || `Photos from Camera ${id}`}
          {currentUser && currentUser.uid === qrCode.userId && (
            <>
              {console.log('Rendering edit button for owner:', currentUser.uid)}
              <button 
                className="edit-name-btn"
                onClick={() => setShowRenameModal(true)}
                title="Rename Album"
              >
                <i className="fas fa-edit"></i>
              </button>
            </>
          )}
        </h1>
        <div className="gallery-actions">
          <button
            className="share-btn"
            onClick={handleShare}
          >
            Share Gallery
          </button>
          <button
            className="select-all-btn"
            onClick={handleSelectAll}
          >
            {selectAll ? 'Deselect All' : 'Select All'}
          </button>
          {selectedPhotos.length > 0 && (
            <button
              className="download-btn"
              onClick={handleDownloadSelected}
            >
              Download Selected ({selectedPhotos.length})
            </button>
          )}
        </div>
      </div>
      {success && <div className="success-message">{success}</div>}
      <div className="photos-grid">
        {qrCode.photos.map((photo, index) => (
          <div
            key={index}
            className={`photo-item ${selectedPhotos.includes(photo) ? 'selected' : ''}`}
            onClick={() => handlePhotoSelect(photo)}
          >
            <img
              src={photo}
              alt={`Photo ${index + 1}`}
              loading="lazy"
            />
            <div className="photo-overlay">
              <span className="photo-number">{index + 1}</span>
              {selectedPhotos.includes(photo) && (
                <span className="checkmark">✓</span>
              )}
            </div>
          </div>
        ))}
      </div>

      {showRenameModal && (
        <div className="modal-overlay">
          <div className="modal">
            <h2>Rename Album</h2>
            <input
              type="text"
              value={newAlbumName}
              onChange={(e) => setNewAlbumName(e.target.value)}
              className="album-name-input"
              placeholder="Enter album name"
            />
            <div className="modal-actions">
              <button 
                className="save-btn"
                onClick={handleUpdateAlbumName}
              >
                Save
              </button>
              <button 
                className="cancel-btn"
                onClick={() => {
                  setShowRenameModal(false);
                  setNewAlbumName(qrCode.albumName || `Photos from Camera ${id}`);
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PhotoGallery; 