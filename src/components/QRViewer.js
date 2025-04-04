import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import './QRViewer.css';

const QRViewer = () => {
  const { id } = useParams();
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchQRCode = async () => {
      try {
        const qrCodesRef = collection(db, 'qrCodes');
        const qrQuery = query(qrCodesRef, where('id', '==', id));
        const querySnapshot = await getDocs(qrQuery);
        
        if (querySnapshot.empty) {
          setError('QR Code not found');
        } else {
          const doc = querySnapshot.docs[0];
          setQrCode({ id: doc.id, ...doc.data() });
        }
      } catch (err) {
        setError('Error fetching QR code');
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQRCode();
  }, [id]);

  if (loading) return <div className="qr-viewer">Loading...</div>;
  if (error) return <div className="qr-viewer error">{error}</div>;
  if (!qrCode) return <div className="qr-viewer">QR Code not found</div>;

  return (
    <div className="qr-viewer">
      <h2>QR Code Details</h2>
      <div className="qr-details">
        <div className="qr-code">
          <QRCodeSVG value={qrCode.data} size={200} />
        </div>
        <div className="qr-info">
          <p><strong>ID:</strong> {qrCode.id}</p>
          <p><strong>Data:</strong> {qrCode.data}</p>
          <p><strong>Created:</strong> {new Date(qrCode.createdAt.toDate()).toLocaleString()}</p>
          <p><strong>Status:</strong> {qrCode.status}</p>
        </div>
      </div>
    </div>
  );
};

export default QRViewer; 