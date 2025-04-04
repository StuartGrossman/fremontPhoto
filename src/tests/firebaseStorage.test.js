import { storage } from '../firebase';
import mockStorage from './mocks/firebaseStorage';

jest.mock('../firebase', () => ({
  storage: mockStorage
}));

describe('Firebase Storage Integration', () => {
  const testFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
  const testPath = 'qrCodes/test123/photos/test.jpg';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('uploads image to Firebase Storage', async () => {
    const result = await storage.ref().child(testPath).put(testFile);
    expect(storage.ref).toHaveBeenCalled();
    expect(storage.child).toHaveBeenCalledWith(testPath);
    expect(storage.put).toHaveBeenCalledWith(testFile);
    expect(result.ref.getDownloadURL).toHaveBeenCalled();
  });

  test('gets download URL for uploaded image', async () => {
    const url = await storage.ref().child(testPath).getDownloadURL();
    expect(storage.ref).toHaveBeenCalled();
    expect(storage.child).toHaveBeenCalledWith(testPath);
    expect(storage.getDownloadURL).toHaveBeenCalled();
    expect(url).toBe('https://example.com/image.jpg');
  });

  test('deletes image from Firebase Storage', async () => {
    await storage.ref().child(testPath).delete();
    expect(storage.ref).toHaveBeenCalled();
    expect(storage.child).toHaveBeenCalledWith(testPath);
    expect(storage.delete).toHaveBeenCalled();
  });

  test('handles upload errors', async () => {
    storage.put.mockRejectedValueOnce(new Error('Upload failed'));
    await expect(storage.ref().child(testPath).put(testFile))
      .rejects
      .toThrow('Upload failed');
  });

  test('handles getDownloadURL errors', async () => {
    storage.getDownloadURL.mockRejectedValueOnce(new Error('URL not found'));
    await expect(storage.ref().child(testPath).getDownloadURL())
      .rejects
      .toThrow('URL not found');
  });
}); 