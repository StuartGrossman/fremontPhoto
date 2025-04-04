const mockStorage = {
  ref: jest.fn().mockReturnThis(),
  child: jest.fn().mockReturnThis(),
  put: jest.fn().mockResolvedValue({
    ref: {
      getDownloadURL: jest.fn().mockResolvedValue('https://example.com/image.jpg')
    }
  }),
  getDownloadURL: jest.fn().mockResolvedValue('https://example.com/image.jpg'),
  delete: jest.fn().mockResolvedValue()
};

export default mockStorage; 