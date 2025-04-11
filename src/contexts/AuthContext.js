import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '../firebase.js';
import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from 'firebase/auth';

const googleProvider = new GoogleAuthProvider();

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  const refreshUser = async (user) => {
    if (user) {
      // Force refresh the token to get the latest claims
      await user.getIdToken(true);
      const idTokenResult = await user.getIdTokenResult();
      const userWithClaims = {
        ...user,
        customClaims: idTokenResult.claims
      };
      setCurrentUser(userWithClaims);
      setIsAdmin(!!idTokenResult.claims.admin);
    } else {
      setCurrentUser(null);
      setIsAdmin(false);
    }
    setLoading(false);
  };

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    } catch (error) {
      console.error('Error signing in with Google:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
      throw error;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, refreshUser);
    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    loading,
    refreshUser,
    loginWithGoogle,
    logout,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 