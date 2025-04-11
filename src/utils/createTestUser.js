import { db } from '../firebase.js';
import { doc, setDoc } from 'firebase/firestore';

const createTestUser = async () => {
  try {
    const testUserId = 'test-user-' + Date.now();
    await setDoc(doc(db, 'users', testUserId), {
      email: 'test@example.com',
      displayName: 'Test User',
      isAdmin: false,
      createdAt: new Date().toISOString()
    });
    console.log('Test user created successfully with ID:', testUserId);
  } catch (error) {
    console.error('Error creating test user:', error);
  }
};

// Run the function
createTestUser(); 