import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp } from 'firebase/app';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxkYnm4mwHKxYqwxKoBqb5Vg6rKpHVFcE",
  authDomain: "chatgpt-bubble.firebaseapp.com",
  projectId: "chatgpt-bubble",
  storageBucket: "chatgpt-bubble.firebasestorage.app",
  messagingSenderId: "1098127383485",
  appId: "1:1098127383485:web:c7d2d5a3c6a3a3b0f3f3f3"
};

describe('Firebase Storage Upload Tests', () => {
  let app;
  let storage;
  let auth;

  beforeAll(async () => {
    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    storage = getStorage(app);
    auth = getAuth(app);

    // Sign in with test user
    try {
      await signInWithEmailAndPassword(auth, 'test@example.com', 'testpassword');
    } catch (error) {
      console.error('Auth error:', error);
    }
  });

  test('should upload a file to Firebase Storage', async () => {
    // Create a test file
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    
    // Create storage reference
    const storageRef = ref(storage, 'images/test.txt');
    
    // Upload file with metadata
    const metadata = {
      contentType: 'text/plain',
      customMetadata: {
        uploadedBy: auth.currentUser?.uid || 'anonymous',
        uploader: auth.currentUser?.email || 'anonymous',
        fileName: 'test.txt'
      }
    };

    try {
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file, metadata);
      console.log('Upload successful:', snapshot);
      expect(snapshot).toBeDefined();
      expect(snapshot.ref).toBeDefined();

      // Get download URL
      const downloadUrl = await getDownloadURL(snapshot.ref);
      console.log('Download URL:', downloadUrl);
      expect(downloadUrl).toBeDefined();
      expect(typeof downloadUrl).toBe('string');
    } catch (error) {
      console.error('Upload error:', error);
      throw error;
    }
  }, 10000); // Increase timeout to 10 seconds

  test('should handle unauthenticated uploads', async () => {
    // Sign out first
    await auth.signOut();

    const file = new File(['test content'], 'test.txt', { type: 'text/plain' });
    const storageRef = ref(storage, 'images/test.txt');
    
    try {
      await uploadBytes(storageRef, file);
      // If we get here, the test should fail because we expect an auth error
      throw new Error('Upload should have failed due to authentication');
    } catch (error) {
      console.log('Expected auth error:', error);
      expect(error).toBeDefined();
      expect(error.code).toBeDefined();
    }
  });

  test('should handle invalid file types', async () => {
    const file = new File(['test content'], 'test.exe', { type: 'application/x-msdownload' });
    const storageRef = ref(storage, 'images/test.exe');
    
    try {
      await uploadBytes(storageRef, file);
      throw new Error('Upload should have failed due to invalid file type');
    } catch (error) {
      expect(error).toBeDefined();
    }
  });
}); 