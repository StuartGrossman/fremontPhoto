import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { db, storage } from '../firebase.js';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import './TestPage.css';

function TestPage() {
  const { currentUser, isAdmin } = useAuth();
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const addTestResult = (testName, status, message) => {
    setTestResults(prev => [...prev, {
      testName,
      status,
      message,
      timestamp: new Date().toISOString()
    }]);
  };

  const runAuthTests = async () => {
    setLoading(true);
    try {
      // Test 1: Check if user is authenticated
      if (!currentUser) {
        addTestResult('Authentication', 'Failed', 'User not authenticated');
        return;
      }
      addTestResult('Authentication', 'Success', 'User is authenticated');

      // Test 2: Check if user is admin
      if (!isAdmin) {
        addTestResult('Admin Check', 'Failed', 'User is not an admin');
        return;
      }
      addTestResult('Admin Check', 'Success', 'User is an admin');

      // Test 3: Check user metadata
      addTestResult('User Metadata', 'Success', 
        `Email: ${currentUser.email}, UID: ${currentUser.uid}`);
    } catch (error) {
      addTestResult('Auth Tests', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const runFirestoreTests = async () => {
    setLoading(true);
    try {
      const testDocRef = doc(db, 'testCollection', 'testDocument');
      
      // Test 1: Write to Firestore
      await setDoc(testDocRef, {
        testField: 'testValue',
        timestamp: new Date().toISOString()
      });
      addTestResult('Firestore Write', 'Success', 'Document written successfully');

      // Test 2: Read from Firestore
      const docSnap = await getDoc(testDocRef);
      if (docSnap.exists()) {
        addTestResult('Firestore Read', 'Success', 'Document read successfully');
      } else {
        addTestResult('Firestore Read', 'Failed', 'Document not found');
      }

      // Test 3: Delete from Firestore
      await deleteDoc(testDocRef);
      addTestResult('Firestore Delete', 'Success', 'Document deleted successfully');
    } catch (error) {
      addTestResult('Firestore Tests', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const runStorageTests = async () => {
    setLoading(true);
    try {
      const testFile = new Blob(['Test content'], { type: 'text/plain' });
      const storageRef = ref(storage, 'test/test.txt');

      // Test 1: Upload to Storage
      await uploadBytes(storageRef, testFile);
      addTestResult('Storage Upload', 'Success', 'File uploaded successfully');

      // Test 2: Get Download URL
      const downloadURL = await getDownloadURL(storageRef);
      addTestResult('Storage Download URL', 'Success', 'Download URL obtained');

      // Test 3: Delete from Storage
      await deleteObject(storageRef);
      addTestResult('Storage Delete', 'Success', 'File deleted successfully');
    } catch (error) {
      addTestResult('Storage Tests', 'Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setTestResults([]);
    await runAuthTests();
    await runFirestoreTests();
    await runStorageTests();
  };

  if (!isAdmin) {
    return (
      <div className="test-page">
        <h1>Access Denied</h1>
        <p>This page is only available to admin users.</p>
      </div>
    );
  }

  return (
    <div className="test-page">
      <h1>Admin Test Page</h1>
      <div className="test-controls">
        <button onClick={runAllTests} disabled={loading}>
          Run All Tests
        </button>
        <button onClick={runAuthTests} disabled={loading}>
          Run Auth Tests
        </button>
        <button onClick={runFirestoreTests} disabled={loading}>
          Run Firestore Tests
        </button>
        <button onClick={runStorageTests} disabled={loading}>
          Run Storage Tests
        </button>
      </div>

      <div className="test-results">
        <h2>Test Results</h2>
        {testResults.length === 0 ? (
          <p>No tests run yet. Click a button above to run tests.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Test Name</th>
                <th>Status</th>
                <th>Message</th>
                <th>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {testResults.map((result, index) => (
                <tr key={index} className={result.status.toLowerCase()}>
                  <td>{result.testName}</td>
                  <td>{result.status}</td>
                  <td>{result.message}</td>
                  <td>{new Date(result.timestamp).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default TestPage; 