import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import QRViewer from '../components/QRViewer';
import { db } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { storage } from '../firebase';

// Mock useParams
jest.mock('react-router-dom', () => ({
  useParams: jest.fn()
}));

// Mock AuthContext
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

// Mock Firebase functions
jest.mock('../firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      where: jest.fn(),
      getDocs: jest.fn()
    }))
  },
  storage: {
    ref: jest.fn(() => ({
      child: jest.fn(),
      put: jest.fn(),
      getDownloadURL: jest.fn()
    }))
  }
}));

describe('QRViewer Component', () => {
  const mockQRData = {
    id: 'test123',
    data: 'https://example.com',
    createdAt: { toDate: () => new Date() },
    status: 'active',
    createdBy: 'testUser123'
  };

  const mockUser = {
    uid: 'testUser123',
    email: 'test@example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ id: 'test123' });
    useAuth.mockReturnValue({ currentUser: mockUser });
  });

  test('displays loading state initially', () => {
    render(<QRViewer />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays QR code data when found', async () => {
    db.collection.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getDocs: jest.fn().mockResolvedValue({
        empty: false,
        docs: [{
          id: 'test123',
          data: () => mockQRData
        }]
      })
    });

    render(<QRViewer />);

    await waitFor(() => {
      expect(screen.getByText('QR Code Details')).toBeInTheDocument();
      expect(screen.getByText(mockQRData.data)).toBeInTheDocument();
      expect(screen.getByText(mockQRData.id)).toBeInTheDocument();
    });
  });

  test('displays error message when QR code not found', async () => {
    db.collection.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getDocs: jest.fn().mockResolvedValue({
        empty: true
      })
    });

    render(<QRViewer />);

    await waitFor(() => {
      expect(screen.getByText('QR Code not found')).toBeInTheDocument();
    });
  });

  test('handles Firestore errors', async () => {
    db.collection.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getDocs: jest.fn().mockRejectedValue(new Error('Firestore error'))
    });

    render(<QRViewer />);

    await waitFor(() => {
      expect(screen.getByText('Error fetching QR code')).toBeInTheDocument();
    });
  });

  test('generates shipping label when button clicked', async () => {
    const mockDocRef = {
      id: 'test123'
    };

    db.collection.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getDocs: jest.fn().mockResolvedValue({
        empty: false,
        docs: [mockDocRef]
      })
    });

    updateDoc.mockResolvedValue();

    render(<QRViewer />);

    await waitFor(() => {
      expect(screen.getByText('Generate Label')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Generate Label'));

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  test('handles photo upload', async () => {
    const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
    const mockDocRef = {
      id: 'test123'
    };

    db.collection.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getDocs: jest.fn().mockResolvedValue({
        empty: false,
        docs: [mockDocRef]
      })
    });

    storage.ref.mockReturnValue({
      child: jest.fn().mockReturnThis(),
      put: jest.fn().mockResolvedValue({
        ref: {
          getDownloadURL: jest.fn().mockResolvedValue('https://example.com/image.jpg')
        }
      })
    });

    updateDoc.mockResolvedValue();

    render(<QRViewer />);

    const fileInput = screen.getByLabelText(/photos/i);
    fireEvent.change(fileInput, { target: { files: [mockFile] } });

    await waitFor(() => {
      expect(storage.ref).toHaveBeenCalled();
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  test('displays error when not authenticated', () => {
    useAuth.mockReturnValue({ currentUser: null });
    render(<QRViewer />);
    expect(screen.getByText('You must be logged in to generate a label')).toBeInTheDocument();
  });
}); 