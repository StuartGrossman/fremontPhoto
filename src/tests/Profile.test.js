import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Profile from '../components/Profile';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';

// Mock Firebase
jest.mock('../firebase', () => ({
  db: {
    collection: jest.fn(),
    doc: jest.fn()
  }
}));

// Mock Auth Context
jest.mock('../contexts/AuthContext', () => ({
  useAuth: jest.fn()
}));

describe('Profile Component', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com'
  };

  const mockCameras = [
    {
      id: 'camera1',
      name: 'Camera 1',
      status: 'Active',
      photos: ['photo1.jpg', 'photo2.jpg']
    },
    {
      id: 'camera2',
      name: 'Camera 2',
      status: 'Registered',
      photos: ['photo3.jpg']
    }
  ];

  beforeEach(() => {
    useAuth.mockReturnValue({
      currentUser: mockUser,
      isAdmin: false
    });

    // Mock Firestore getDoc
    const mockGetDoc = jest.fn();
    mockGetDoc.mockResolvedValue({
      exists: () => true,
      data: () => ({ cameras: mockCameras })
    });

    db.doc.mockReturnValue({
      get: mockGetDoc
    });
  });

  test('renders loading state initially', () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );
    expect(screen.getByText('Loading your cameras...')).toBeInTheDocument();
  });

  test('displays cameras after loading', async () => {
    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Camera 1')).toBeInTheDocument();
      expect(screen.getByText('Camera 2')).toBeInTheDocument();
    });

    // Check photo counts
    expect(screen.getByText('Photos: 2')).toBeInTheDocument();
    expect(screen.getByText('Photos: 1')).toBeInTheDocument();
  });

  test('generates shipping label', async () => {
    const mockUpdateDoc = jest.fn();
    db.doc.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ cameras: mockCameras })
      }),
      update: mockUpdateDoc
    });

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Camera 1')).toBeInTheDocument();
    });

    // Click generate label button
    fireEvent.click(screen.getByText('Generate Label'));

    // Check if updateDoc was called with correct data
    expect(mockUpdateDoc).toHaveBeenCalledWith(expect.objectContaining({
      shippingLabel: expect.objectContaining({
        trackingNumber: expect.any(String),
        carrier: 'USPS',
        status: 'In Transit'
      })
    }));
  });

  test('displays label modal when view label is clicked', async () => {
    const cameraWithLabel = {
      ...mockCameras[0],
      shippingLabel: {
        trackingNumber: 'TRK123',
        carrier: 'USPS',
        status: 'In Transit',
        createdAt: new Date().toISOString()
      }
    };

    db.doc.mockReturnValue({
      get: jest.fn().mockResolvedValue({
        exists: () => true,
        data: () => ({ cameras: [cameraWithLabel] })
      })
    });

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('View Label')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('View Label'));

    expect(screen.getByText('Shipping Label Details')).toBeInTheDocument();
    expect(screen.getByText('TRK123')).toBeInTheDocument();
  });

  test('handles error state', async () => {
    db.doc.mockReturnValue({
      get: jest.fn().mockRejectedValue(new Error('Failed to fetch cameras'))
    });

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Error fetching cameras/)).toBeInTheDocument();
    });
  });

  test('redirects to gallery on camera click', async () => {
    const mockNavigate = jest.fn();
    jest.mock('react-router-dom', () => ({
      ...jest.requireActual('react-router-dom'),
      useNavigate: () => mockNavigate
    }));

    render(
      <BrowserRouter>
        <Profile />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Camera 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Camera 1'));
    expect(mockNavigate).toHaveBeenCalledWith('/gallery/camera1');
  });
}); 