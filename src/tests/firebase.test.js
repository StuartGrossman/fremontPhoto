import { db } from '../firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';

describe('Firebase Integration', () => {
  const testQRData = {
    id: 'test123',
    data: 'https://example.com',
    createdAt: new Date(),
    status: 'active',
    createdBy: 'testUser123'
  };

  const testLabel = {
    trackingNumber: 'TEST123456',
    carrier: 'Test Carrier',
    weight: '1.5 kg',
    dimensions: '30x20x10 cm',
    destination: 'Test Address',
    date: new Date().toISOString()
  };

  const testPhoto = {
    url: 'https://example.com/image.jpg',
    uploadedAt: new Date().toISOString(),
    uploadedBy: 'testUser123'
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

  test('updates QR code with shipping label', async () => {
    const docRef = doc(db, 'qrCodes', testDocId);
    await updateDoc(docRef, {
      labelGenerated: true,
      shippingLabel: testLabel
    });

    const updatedDoc = await getDocs(query(collection(db, 'qrCodes'), where('id', '==', testQRData.id)));
    const updatedData = updatedDoc.docs[0].data();
    expect(updatedData.labelGenerated).toBe(true);
    expect(updatedData.shippingLabel).toEqual(testLabel);
  });

  test('updates QR code with photo reference', async () => {
    const docRef = doc(db, 'qrCodes', testDocId);
    await updateDoc(docRef, {
      photos: [testPhoto]
    });

    const updatedDoc = await getDocs(query(collection(db, 'qrCodes'), where('id', '==', testQRData.id)));
    const updatedData = updatedDoc.docs[0].data();
    expect(updatedData.photos).toHaveLength(1);
    expect(updatedData.photos[0].url).toBe(testPhoto.url);
  });

  test('handles missing QR codes', async () => {
    const qrCodesRef = collection(db, 'qrCodes');
    const qrQuery = query(qrCodesRef, where('id', '==', 'nonexistent'));
    const querySnapshot = await getDocs(qrQuery);
    
    expect(querySnapshot.empty).toBe(true);
  });

  test('handles update errors', async () => {
    const invalidDocRef = doc(db, 'qrCodes', 'nonexistent');
    await expect(updateDoc(invalidDocRef, { status: 'error' }))
      .rejects
      .toThrow();
  });
}); 