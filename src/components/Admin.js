import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { QRCodeSVG } from 'qrcode.react';
import { db } from '../firebase';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import './Admin.css';

const Admin = () => {
  const { currentUser } = useAuth();
  const [qrData, setQrData] = useState('');
  const [generatedQR, setGeneratedQR] = useState(null);
  const [qrCodes, setQrCodes] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!qrData.trim()) return;

    try {
      setLoading(true);
      const qrId = Math.random().toString(36).substring(2, 15);
      const qrCode = {
        id: qrId,
        data: qrData,
        createdAt: new Date(),
        status: 'active',
        createdBy: currentUser.uid
      };

      const docRef = await addDoc(collection(db, 'qrCodes'), qrCode);
      setGeneratedQR({ ...qrCode, docId: docRef.id });
      setQrData('');
      fetchQRCodes(); // Refresh the list
    } catch (error) {
      console.error('Error generating QR code:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchQRCodes = async () => {
    try {
      const qrCodesRef = collection(db, 'qrCodes');
      const qrQuery = query(qrCodesRef, where('createdBy', '==', currentUser.uid));
      const querySnapshot = await getDocs(qrQuery);
      const codes = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setQrCodes(codes);
    } catch (error) {
      console.error('Error fetching QR codes:', error);
    }
  };

  React.useEffect(() => {
    fetchQRCodes();
  }, []);

  return (
    <div className="admin-container">
      <h1>Admin Dashboard</h1>
      <div className="admin-content">
        <div className="qr-section">
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
            <button type="submit" disabled={loading}>
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>
          </form>

          {generatedQR && (
            <div className="qr-result">
              <h3>Generated QR Code</h3>
              <div className="qr-code">
                <QRCodeSVG value={generatedQR.data} size={200} />
              </div>
              <p>QR Code ID: {generatedQR.id}</p>
            </div>
          )}
        </div>

        <div className="qr-list">
          <h2>Your QR Codes</h2>
          {qrCodes.length === 0 ? (
            <p>No QR codes generated yet</p>
          ) : (
            <div className="qr-grid">
              {qrCodes.map((qr) => (
                <div key={qr.id} className="qr-item">
                  <div className="qr-code">
                    <QRCodeSVG value={qr.data} size={150} />
                  </div>
                  <div className="qr-info">
                    <p><strong>ID:</strong> {qr.id}</p>
                    <p><strong>Data:</strong> {qr.data}</p>
                    <p><strong>Created:</strong> {new Date(qr.createdAt.toDate()).toLocaleString()}</p>
                    <p><strong>Status:</strong> {qr.status}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin; 