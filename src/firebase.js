import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDGmkVtl3Odnqn9UXFdqEqroTNxlgtrA0E",
  authDomain: "chatgpt-bubble.firebaseapp.com",
  projectId: "chatgpt-bubble",
  storageBucket: "chatgpt-bubble.appspot.com",
  messagingSenderId: "243626997827",
  appId: "1:243626997827:web:be6ac2b8110d09c6c93cf6"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

export default app; 