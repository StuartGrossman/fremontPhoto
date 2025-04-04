import { initializeApp } from 'firebase/app';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDxkYnm4mwHKxYqwxKoBqb5Vg6rKpHVFcE",
  authDomain: "chatgpt-bubble.firebaseapp.com",
  projectId: "chatgpt-bubble",
  storageBucket: "chatgpt-bubble.firebasestorage.app",
  messagingSenderId: "1098127383485",
  appId: "1:1098127383485:web:c7d2d5a3c6a3a3b0f3f3f3"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);
const auth = getAuth(app);

async function testUpload() {
  try {
    // Sign in
    console.log('Signing in...');
    await signInWithEmailAndPassword(auth, 'test@example.com', 'testpassword');
    console.log('Signed in successfully');

    // Create test file
    const testFilePath = path.join(__dirname, 'test.txt');
    fs.writeFileSync(testFilePath, 'Test content for upload');
    const fileBuffer = fs.readFileSync(testFilePath);

    // Create file blob
    const file = new Blob([fileBuffer], { type: 'text/plain' });
    file.name = 'test.txt';

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

    console.log('Uploading file...');
    const snapshot = await uploadBytes(storageRef, file, metadata);
    console.log('Upload successful:', snapshot);

    // Get download URL
    const downloadUrl = await getDownloadURL(snapshot.ref);
    console.log('File available at:', downloadUrl);

    // Clean up test file
    fs.unlinkSync(testFilePath);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the test
testUpload(); 