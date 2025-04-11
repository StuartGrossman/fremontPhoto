import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import './PhotoGallery.css';

function PhotoGallery() {
  const { id } = useParams();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  useEffect(() => {
    const fetchQrCode = async () => {
      try {
        const qrCodeRef = doc(db, 'qrCodes', id);
        const qrCodeDoc = await getDoc(qrCodeRef);

        if (!qrCodeDoc.exists()) {
          setError('Camera not found');
          return;
        }

        const qrCodeData = qrCodeDoc.data();
        setQrCode(qrCodeData);
      } catch (error) {
        setError('Error fetching camera information: ' + error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQrCode();
  }, [id]);

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
        title: `Photos from Camera ${qrCode.id}`,
        url: shareUrl
      }).catch(console.error);
    } else {
      navigator.clipboard.writeText(shareUrl)
        .then(() => alert('Link copied to clipboard!'))
        .catch(console.error);
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
        <h1>Photos from Camera {qrCode.id}</h1>
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
    </div>
  );
}

export default PhotoGallery; 