const EARTH_RADIUS_MILES = 3958.8;
const KM_PER_MILE = 1.609344;

export type LatLng = { lat: number; lng: number };

/** Accepts finite numbers only. NaN, Infinity, and strings are rejected. */
export function isValidCoordinate(point: LatLng): boolean {
  return (
    Number.isFinite(point.lat) &&
    Number.isFinite(point.lng) &&
    point.lat >= -90 &&
    point.lat <= 90 &&
    point.lng >= -180 &&
    point.lng <= 180
  );
}

/**
 * Straight-line (great-circle) distance in miles. This is not a road distance.
 * Callers must label it as "straight line" in any customer-facing text.
 */
export function haversineMiles(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_MILES * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

export function milesToKm(miles: number): number {
  return miles * KM_PER_MILE;
}

/** Rounds to one decimal place for display and API output. */
export function roundMiles(miles: number): number {
  return Math.round(miles * 10) / 10;
}
