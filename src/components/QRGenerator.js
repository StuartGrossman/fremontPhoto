import React, { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import './QRGenerator.css';

const QRGenerator = () => {
  const [qrData, setQrData] = useState('');
  const [generatedQR, setGeneratedQR] = useState(null);
  const { currentUser } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!qrData.trim()) return;

    try {
      // Generate QR code
      const qrId = Math.random().toString(36).substring(2, 15);
      const qrCode = {
        id: qrId,
        data: qrData,
        createdAt: new Date(),
        status: 'active',
        createdBy: currentUser.uid
      };

      // Save to Firestore
      const docRef = await addDoc(collection(db, 'qrCodes'), qrCode);
      setGeneratedQR({ ...qrCode, docId: docRef.id });
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  return (
    <div className="qr-generator">
      <h2>Generate QR Code</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="qrData">Enter Data for QR Code:</label>
          <input
            type="text"
            id="qrData"
            value={qrData}
            onChange={(e) => setQrData(e.target.value)}
            placeholder="Enter text or URL"
            required
          />
        </div>
        <button type="submit">Generate QR Code</button>
      </form>

      {generatedQR && (
        <div className="qr-result">
          <h3>Generated QR Code</h3>
          <div className="qr-code">
            <QRCodeSVG value={generatedQR.data} size={200} />
          </div>
          <p>QR Code ID: {generatedQR.id}</p>
          <a href={`/qr/${generatedQR.id}`} className="view-link">
            View QR Code Details
          </a>
        </div>
      )}
    </div>
  );
};

export default QRGenerator; 