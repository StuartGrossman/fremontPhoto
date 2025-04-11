import React, { useState, useEffect, useCallback } from 'react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext.js';
import './AdminManagement.css';

const AdminManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingUser, setProcessingUser] = useState(null);
  const auth = getAuth();
  const db = getFirestore();
  const { refreshUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        setError('Please sign in to manage users');
        return;
      }

      const idToken = await user.getIdToken();

      const response = await fetch('https://us-central1-chatgpt-bubble.cloudfunctions.net/listUsers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const data = await response.json();
      setUsers(data.users);
    } catch (error) {
      console.error('Fetch users error:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const setAdminStatus = async (userId, email, makeAdmin) => {
    try {
      setProcessingUser(userId);
      setError(null);
      
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Not authenticated');
      }

      // Check if there are any admin users in Firestore
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const hasAdmins = querySnapshot.docs.some(doc => doc.data().isAdmin === true);
      const isFirstUser = querySnapshot.docs.length === 0;

      const idToken = await user.getIdToken();
      
      const response = await fetch('https://us-central1-chatgpt-bubble.cloudfunctions.net/setAdminClaim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({
          targetUserId: userId,
          isAdmin: makeAdmin,
          isFirstUser: isFirstUser || !hasAdmins
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to set admin status: ${response.statusText}`);
      }

      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, isAdmin: makeAdmin } : user
        )
      );

      // If the current user is the one being modified, refresh their token
      if (user.uid === userId) {
        await refreshUser(user);
      }

      // Refresh the user list to get updated data
      await fetchUsers();
    } catch (err) {
      console.error('Set admin status error:', err);
      setError(err.message || 'Failed to set admin status');
    } finally {
      setProcessingUser(null);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="admin-management">
      <h2>User Management</h2>
      <div className="warning-banner">
        ⚠️ This is a temporary page for setting up initial admin users.
      </div>
      <table>
        <thead>
          <tr>
            <th>Email</th>
            <th>Status</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id}>
              <td>{user.email}</td>
              <td>{user.isAdmin ? 'Admin' : 'User'}</td>
              <td>
                <button
                  onClick={() => setAdminStatus(user.id, user.email, !user.isAdmin)}
                  disabled={processingUser === user.id}
                >
                  {processingUser === user.id
                    ? 'Processing...'
                    : user.isAdmin
                    ? 'Remove Admin'
                    : 'Make Admin'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminManagement; 