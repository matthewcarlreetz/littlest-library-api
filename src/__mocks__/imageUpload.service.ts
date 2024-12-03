export const ImageUploadService = jest.fn().mockImplementation(() => ({
  uploadImage: jest.fn().mockResolvedValue('http://mocked-image-url.com'),
}));
