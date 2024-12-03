export const GeocodingService = jest.fn().mockImplementation(() => ({
  getAddressComponents: jest.fn().mockResolvedValue({
    street: '123 Mock St',
    city: 'Mock City',
    state: 'Mock State',
    zip: '12345',
  }),
}));
