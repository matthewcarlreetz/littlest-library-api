import haversineDistance from 'utils/haversineDistance';
import { Library, Prisma } from '@prisma/client';

describe('haversineDistance', () => {
  let existing: Library;

  beforeEach(() => {
    existing = {
      id: 'asdf1234',
      lat: new Prisma.Decimal(52.52), // Berlin Latitude
      lng: new Prisma.Decimal(13.405), // Berlin Longitude
      creatorId: 1,
    };
  });

  it('should return 0 for the same location', () => {
    const incoming = { lat: 52.52, lng: 13.405 }; // Same coordinates (Berlin)

    const distance = haversineDistance(existing, incoming);

    expect(distance).toBe(0); // Distance should be 0 for the same coordinates
  });

  it('should calculate correct distance for nearby locations', () => {
    const incoming = { lat: 48.8566, lng: 2.3522 }; // Paris coordinates

    const distance = haversineDistance(existing, incoming);

    // The expected distance between Berlin and Paris in feet
    const expectedDistance = 2_878_816; // Approx. value

    expect(Math.abs(distance - expectedDistance)).toBeLessThan(1); // Allowing small margin of error
  });
});
