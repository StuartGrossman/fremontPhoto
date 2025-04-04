import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { useParams } from 'react-router-dom';
import QRViewer from '../components/QRViewer';
import { db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

// Mock useParams
jest.mock('react-router-dom', () => ({
  useParams: jest.fn()
}));

// Mock Firebase functions
jest.mock('../firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      where: jest.fn(),
      getDocs: jest.fn()
    }))
  }
}));

describe('QRViewer Component', () => {
  const mockQRData = {
    id: 'test123',
    data: 'https://example.com',
    createdAt: { toDate: () => new Date() },
    status: 'active'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ id: 'test123' });
  });

  test('displays loading state initially', () => {
    render(<QRViewer />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('displays QR code data when found', async () => {
    // Mock successful Firestore query
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
    // Mock empty Firestore query
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
    // Mock Firestore error
    db.collection.mockReturnValue({
      where: jest.fn().mockReturnThis(),
      getDocs: jest.fn().mockRejectedValue(new Error('Firestore error'))
    });

    render(<QRViewer />);

    await waitFor(() => {
      expect(screen.getByText('Error fetching QR code')).toBeInTheDocument();
    });
  });
}); 