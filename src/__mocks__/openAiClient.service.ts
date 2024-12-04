export const OpenAIClientService = jest.fn().mockImplementation(() => ({
  createLibraryDescription: jest.fn().mockResolvedValue('Mocked description'),
}));
