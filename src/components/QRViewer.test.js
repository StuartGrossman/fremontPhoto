import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QRViewer } from './QRViewer';
import { useAuth } from '../contexts/AuthContext';
import { storage, db } from '../firebase';
import { collection, query, where, getDocs, doc, updateDoc } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

// Mock Firebase modules
jest.mock('../firebase', () => ({
  storage: {
    ref: jest.fn(),
  },
  db: {
    collection: jest.fn(),
    query: jest.fn(),
    where: jest.fn(),
    doc: jest.fn(),
    updateDoc: jest.fn(),
  },
}));

// Mock Firebase Storage methods
jest.mock('firebase/storage', () => ({
  ref: jest.fn(),
  uploadBytesResumable: jest.fn(),
  getDownloadURL: jest.fn(),
}));

// Mock Firebase Firestore methods
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  getDocs: jest.fn(),
  doc: jest.fn(),
  updateDoc: jest.fn(),
}));

// Mock Auth Context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('QRViewer Component', () => {
  const mockUser = {
    uid: 'test-uid',
    getIdToken: jest.fn().mockResolvedValue('test-token'),
  };

  const mockQRCode = {
    id: 'test-qr-id',
    data: 'test-data',
    createdAt: { toDate: () => new Date() },
    status: 'active',
    photos: [],
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Setup auth context
    useAuth.mockReturnValue({ currentUser: mockUser });

    // Setup Firestore mocks
    getDocs.mockResolvedValue({
      empty: false,
      docs: [{ id: 'test-doc-id' }],
    });

    // Setup Storage mocks
    uploadBytesResumable.mockImplementation(() => ({
      on: (event, onProgress, onError, onComplete) => {
        if (event === 'state_changed') {
          // Simulate progress
          onProgress({ bytesTransferred: 50, totalBytes: 100 });
          // Simulate completion
          onComplete();
        }
      },
    }));

    getDownloadURL.mockResolvedValue('https://example.com/test-image.jpg');
  });

  test('renders QR code details', async () => {
    render(<QRViewer />);
    
    await waitFor(() => {
      expect(screen.getByText('QR Code Details')).toBeInTheDocument();
      expect(screen.getByText(mockQRCode.id)).toBeInTheDocument();
      expect(screen.getByText(mockQRCode.data)).toBeInTheDocument();
    });
  });

  test('handles file selection', async () => {
    render(<QRViewer />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/select files/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
    });
  });

  test('handles file removal', async () => {
    render(<QRViewer />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/select files/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const removeButton = screen.getByRole('button', { name: /×/i });
    fireEvent.click(removeButton);
    
    await waitFor(() => {
      expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
    });
  });

  test('shows upload progress', async () => {
    render(<QRViewer />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/select files/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const uploadButton = screen.getByRole('button', { name: /upload files/i });
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });
  });

  test('handles successful upload', async () => {
    render(<QRViewer />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/select files/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const uploadButton = screen.getByRole('button', { name: /upload files/i });
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(uploadBytesResumable).toHaveBeenCalled();
      expect(getDownloadURL).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  test('handles upload errors', async () => {
    // Mock upload error
    uploadBytesResumable.mockImplementation(() => ({
      on: (event, onProgress, onError) => {
        if (event === 'state_changed') {
          onError(new Error('Upload failed'));
        }
      },
    }));

    render(<QRViewer />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/select files/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const uploadButton = screen.getByRole('button', { name: /upload files/i });
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(screen.getByText(/error uploading/i)).toBeInTheDocument();
    });
  });

  test('blocks upload when not authenticated', async () => {
    // Mock unauthenticated user
    useAuth.mockReturnValue({ currentUser: null });

    render(<QRViewer />);
    
    const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const input = screen.getByLabelText(/select files/i);
    
    fireEvent.change(input, { target: { files: [file] } });
    
    const uploadButton = screen.getByRole('button', { name: /upload files/i });
    fireEvent.click(uploadButton);
    
    await waitFor(() => {
      expect(uploadBytesResumable).not.toHaveBeenCalled();
    });
  });
}); 