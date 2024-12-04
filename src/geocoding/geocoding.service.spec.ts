import { Test, TestingModule } from '@nestjs/testing';
import { GeocodingService } from './geocoding.service';

global.fetch = jest.fn();

describe('GeocodingService', () => {
  let geocodingService: GeocodingService;
  const mockApiKey = 'mock-api-key';

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeocodingService,
        {
          provide: 'MAPBOX_API_KEY',
          useValue: mockApiKey,
        },
      ],
    }).compile();

    geocodingService = module.get<GeocodingService>(GeocodingService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('reverseGeocode', () => {
    it('should return feature when response is valid', async () => {
      const mockFeature = {
        type: 'Feature',
        id: 'mock-id',
        geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
        properties: {
          mapbox_id: 'mock-mapbox-id',
          feature_type: 'address',
          full_address: '123 Mock Street, New York, NY',
          name: '123 Mock Street',
          context: {
            place: { name: 'New York' },
            region: { name: 'New York' },
            country: { name: 'United States' },
          },
        },
      };

      // Mock the fetch response
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'FeatureCollection',
          features: [mockFeature],
          attribution: '',
        }),
      });

      const result = await geocodingService.reverseGeocode({
        lat: 40.7128,
        lng: -74.006,
      });
      expect(result).toEqual(mockFeature);
      expect(fetch).toHaveBeenCalledWith(
        `https://api.mapbox.com/search/geocode/v6/reverse?longitude=-74.006&latitude=40.7128&types=address&access_token=${mockApiKey}`,
      );
    });

    it('should return undefined if no features found', async () => {
      // Mock the fetch response with no features
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          type: 'FeatureCollection',
          features: [],
          attribution: '',
        }),
      });

      const result = await geocodingService.reverseGeocode({
        lat: 40.7128,
        lng: -74.006,
      });
      expect(result).toBeUndefined();
    });

    it('should throw error if API response is not ok', async () => {
      // Mock the fetch response with an error status
      (fetch as jest.Mock).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal Server Error' }),
      });

      await expect(
        geocodingService.reverseGeocode({ lat: 40.7128, lng: -74.006 }),
      ).rejects.toThrowError('Mapbox API returned status 500');
    });

    it('should return undefined for invalid lat or lng', async () => {
      const result = await geocodingService.reverseGeocode({ lat: 0, lng: 0 });
      expect(result).toBeUndefined();
    });
  });

  describe('getAddressComponents', () => {
    it('should return address components when reverseGeocode is successful', async () => {
      // Mock reverseGeocode method
      jest.spyOn(geocodingService, 'reverseGeocode').mockResolvedValueOnce({
        type: 'Feature',
        id: 'mock-id',
        geometry: { type: 'Point', coordinates: [-74.006, 40.7128] },
        properties: {
          mapbox_id: 'mock-mapbox-id',
          feature_type: 'address',
          full_address: '123 Mock Street, New York, NY',
          name: '123 Mock Street',
          context: {
            place: { name: 'New York' },
            region: { name: 'New York' },
            postcode: { name: '10001' },
            address: { name: '123 Mock Street' },
          },
        },
      });
      const result = await geocodingService.getAddressComponents({
        lat: 40.7128,
        lng: -74.006,
      });

      expect(result).toEqual({
        street: '123 Mock Street',
        city: 'New York',
        state: 'New York',
        zip: '10001',
      });
    });

    it('should return undefined if reverseGeocode returns undefined', async () => {
      jest
        .spyOn(geocodingService, 'reverseGeocode')
        .mockResolvedValueOnce(undefined);
      const result = await geocodingService.getAddressComponents({
        lat: 40.7128,
        lng: -74.006,
      });
      expect(result).toBeUndefined();
    });
  });
});
