import { Library } from '@prisma/client';

const haversineDistance = (
  existing: Library,
  incoming: { lat: number; lng: number },
) => {
  const { lat: lat1, lng: lng1 } = existing;
  const { lat: lat2, lng: lng2 } = incoming;

  const R = 6371; // Radius of the Earth in kilometers
  const degToRad = Math.PI / 180; // Degrees to radians conversion factor

  // Convert latitude and longitude from degrees to radians
  const lat1Rad = lat1.toNumber() * degToRad;
  const lon1Rad = lng1.toNumber() * degToRad;
  const lat2Rad = lat2 * degToRad;
  const lon2Rad = lng2 * degToRad;

  // Differences in coordinates
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;

  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distanceInKm = R * c;

  const distanceInFeet = distanceInKm * 3280.84; // 1 km = 3280.84 feet

  return distanceInFeet;
};

export default haversineDistance;
