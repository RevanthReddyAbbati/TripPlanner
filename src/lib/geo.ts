import type { GeoPoint } from '../types';

const R = 6371;
const rad = (d: number) => (d * Math.PI) / 180;

/** Great-circle distance in km. */
export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const dLat = rad(b.lat - a.lat);
  const dLon = rad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Road distance estimate. Indian roads run ~1.3x the straight line on long legs, more on short hops. */
export function roadKm(a: GeoPoint, b: GeoPoint): number {
  const d = haversineKm(a, b);
  const factor = d < 30 ? 1.45 : d < 150 ? 1.35 : 1.28;
  return Math.round(d * factor);
}

/** Minutes to move between two sightseeing spots in town (local transport, parking, walking). */
export function transferMinutes(a: GeoPoint | undefined, b: GeoPoint | undefined): number {
  if (!a || !b || a.lat == null || b.lat == null) return 20;
  const km = roadKm(a, b);
  if (km < 0.8) return 10;
  return Math.min(150, Math.round(12 + (km / 28) * 60));
}

export function centroid(points: GeoPoint[]): GeoPoint {
  if (!points.length) return { lat: 20.59, lon: 78.96 };
  const s = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lon: acc.lon + p.lon }), { lat: 0, lon: 0 });
  return { lat: s.lat / points.length, lon: s.lon / points.length };
}
