import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AuthProvider } from '../contexts/AuthContext';
import Admin from '../components/Admin';
import { db } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';

// Mock Firebase functions
jest.mock('../firebase', () => ({
  db: {
    collection: jest.fn(() => ({
      addDoc: jest.fn(),
      where: jest.fn(),
      getDocs: jest.fn()
    }))
  }
}));

// Mock AuthContext
const mockUser = {
  uid: 'testUser123',
  email: 'test@example.com'
};

const mockAuthContext = {
  currentUser: mockUser,
  logout: jest.fn()
};

describe('Admin Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  const renderAdmin = () => {
    return render(
      <AuthProvider value={mockAuthContext}>
        <Admin />
      </AuthProvider>
    );
  };

  test('renders admin dashboard', () => {
    renderAdmin();
    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Generate QR Code')).toBeInTheDocument();
  });

  test('handles QR code generation', async () => {
    renderAdmin();
    
    const input = screen.getByPlaceholderText('Enter text or URL');
    const button = screen.getByText('Generate QR Code');

    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(button);

    await waitFor(() => {
      expect(db.collection).toHaveBeenCalledWith('qrCodes');
    });
  });

  test('displays loading state during generation', async () => {
    renderAdmin();
    
    const input = screen.getByPlaceholderText('Enter text or URL');
    const button = screen.getByText('Generate QR Code');

    fireEvent.change(input, { target: { value: 'https://example.com' } });
    fireEvent.click(button);

    expect(screen.getByText('Generating...')).toBeInTheDocument();
  });

  test('validates input before submission', () => {
    renderAdmin();
    
    const button = screen.getByText('Generate QR Code');
    fireEvent.click(button);

    expect(db.collection).not.toHaveBeenCalled();
  });
}); 