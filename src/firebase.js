import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: "AIzaSyDGmkVtl3Odnqn9UXFdqEqroTNxlgtrA0E",
  authDomain: "chatgpt-bubble.firebaseapp.com",
  databaseURL: "https://chatgpt-bubble-default-rtdb.firebaseio.com",
  projectId: "chatgpt-bubble",
  storageBucket: "chatgpt-bubble.firebasestorage.app",
  messagingSenderId: "243626997827",
  appId: "1:243626997827:web:be6ac2b8110d09c6c93cf6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Firebase Storage and get a reference to the service
export const storage = getStorage(app);

export default app; 