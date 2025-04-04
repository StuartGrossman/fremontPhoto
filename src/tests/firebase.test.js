import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';

describe('Firebase Integration', () => {
  const testQRData = {
    id: 'test123',
    data: 'https://example.com',
    createdAt: new Date(),
    status: 'active',
    createdBy: 'testUser123'
  };

  let testDocId;

  afterAll(async () => {
    // Clean up test data
    if (testDocId) {
      const docRef = doc(db, 'qrCodes', testDocId);
      await deleteDoc(docRef);
    }
  });

  test('saves QR code data to Firestore', async () => {
    const docRef = await addDoc(collection(db, 'qrCodes'), testQRData);
    testDocId = docRef.id;
    expect(docRef.id).toBeDefined();
  });

  test('retrieves QR code data from Firestore', async () => {
    const qrCodesRef = collection(db, 'qrCodes');
    const qrQuery = query(qrCodesRef, where('id', '==', testQRData.id));
    const querySnapshot = await getDocs(qrQuery);
    
    expect(querySnapshot.empty).toBe(false);
    const docData = querySnapshot.docs[0].data();
    expect(docData.data).toBe(testQRData.data);
    expect(docData.status).toBe(testQRData.status);
  });

  test('handles missing QR codes', async () => {
    const qrCodesRef = collection(db, 'qrCodes');
    const qrQuery = query(qrCodesRef, where('id', '==', 'nonexistent'));
    const querySnapshot = await getDocs(qrQuery);
    
    expect(querySnapshot.empty).toBe(true);
  });
}); 