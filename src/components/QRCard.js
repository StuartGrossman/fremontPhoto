import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { deleteDoc, doc } from 'firebase/firestore';
import { ref, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase.js';

const QRCard = ({ qrCode }) => {
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();

  const handleCardClick = (id) => {
    navigate(`/qr/${id}`);
  };

  const handleDownloadQR = async (e, id) => {
    e.stopPropagation();
    try {
      const svg = document.getElementById(`qr-${id}`);
      const svgData = new XMLSerializer().serializeToString(svg);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        const pngFile = canvas.toDataURL('image/png');
        const downloadLink = document.createElement('a');
        downloadLink.download = `qr-code-${id}.png`;
        downloadLink.href = pngFile;
        downloadLink.click();
      };
      
      img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
    } catch (err) {
      console.error('Error downloading QR code:', err);
    }
  };

  const handleDeleteClick = async (e, qr) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this QR code? This action cannot be undone.')) {
      return;
    }

    setDeleting(true);
    try {
      // Delete photos from Storage if they exist
      if (qr.photos && qr.photos.length > 0) {
        const deletePromises = qr.photos.map(photoUrl => {
          const photoRef = ref(storage, photoUrl);
          return deleteObject(photoRef);
        });
        await Promise.all(deletePromises);
      }

      // Delete shipping label from Storage if it exists
      if (qr.shippingLabel && qr.shippingLabel.url) {
        const labelRef = ref(storage, qr.shippingLabel.url);
        await deleteObject(labelRef);
      }

      // Delete QR code document from Firestore
      await deleteDoc(doc(db, 'qrCodes', qr.id));
    } catch (err) {
      console.error('Error deleting QR code:', err);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div 
      className="qr-code-card"
      onClick={() => handleCardClick(qrCode.id)}
    >
      <div className="qr-code-info">
        <div className="qr-code-image">
          <QRCodeSVG 
            id={`qr-${qrCode.id}`}
            value={`${window.location.origin}/qr/${qrCode.id}`}
            size={150}
            level="H"
            includeMargin={true}
          />
        </div>
        <p>Created: {new Date(qrCode.createdAt?.toDate()).toLocaleString()}</p>
        {qrCode.shippingLabel ? (
          <div className="shipping-info">
            <p><strong>Tracking:</strong> {qrCode.shippingLabel.trackingNumber}</p>
            <p><strong>Carrier:</strong> {qrCode.shippingLabel.carrier}</p>
            <p><strong>Status:</strong> {qrCode.shippingLabel.status}</p>
          </div>
        ) : (
          <div className="no-shipping-label">
            <p>No Shipping Label</p>
          </div>
        )}
        {qrCode.photos && qrCode.photos.length > 0 && (
          <div className="photo-gallery">
            <h4>Uploaded Photos ({qrCode.photos.length})</h4>
            <div className="photo-carousel">
              {qrCode.photos.map((photoUrl, index) => (
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
        )}
      </div>
      <div className="qr-code-actions">
        <button
          className="download-btn"
          onClick={(e) => handleDownloadQR(e, qrCode.id)}
          title="Download QR Code"
        >
          Download
        </button>
        <button
          className="delete-btn"
          onClick={(e) => handleDeleteClick(e, qrCode)}
          disabled={deleting}
        >
          {deleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </div>
  );
};

export default QRCard; 