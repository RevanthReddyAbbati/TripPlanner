// Free, keyless map services (OpenStreetMap ecosystem). All calls are made from the browser.
// Usage policies: Nominatim allows ~1 request/second, so search input is debounced in the UI.
// For heavy production traffic, point these URLs at your own instances or a paid provider.
import type { Destination, GeoPoint, Interest, Place } from '../types';
import { slug } from '../lib/format';

const NOMINATIM = 'https://nominatim.openstreetmap.org';
const OSRM = 'https://router.project-osrm.org';
const OVERPASS = 'https://overpass-api.de/api/interpreter';

export interface SearchResult extends GeoPoint {
  id: string;
  name: string;
  label: string;
  type: string;
}

export async function searchPlaces(q: string, opts: { near?: GeoPoint; signal?: AbortSignal; countryCodes?: string } = {}): Promise<SearchResult[]> {
  if (q.trim().length < 2) return [];
  const params = new URLSearchParams({ q, format: 'jsonv2', addressdetails: '0', limit: '8' });
  if (opts.countryCodes) params.set('countrycodes', opts.countryCodes);
  if (opts.near) {
    const d = 1.2;
    params.set('viewbox', `${opts.near.lon - d},${opts.near.lat + d},${opts.near.lon + d},${opts.near.lat - d}`);
  }
  const res = await fetch(`${NOMINATIM}/search?${params}`, { signal: opts.signal, headers: { 'Accept-Language': 'en' } });
  if (!res.ok) throw new Error(`Search failed (${res.status})`);
  const data = (await res.json()) as Array<{ place_id: number; lat: string; lon: string; display_name: string; name?: string; type: string }>;
  return data.map((r) => ({
    id: String(r.place_id),
    lat: Number(r.lat),
    lon: Number(r.lon),
    name: r.name || r.display_name.split(',')[0],
    label: r.display_name,
    type: r.type,
  }));
}

export async function reverseGeocode(p: GeoPoint, signal?: AbortSignal): Promise<string | null> {
  const params = new URLSearchParams({ lat: String(p.lat), lon: String(p.lon), format: 'jsonv2', zoom: '16' });
  try {
    const res = await fetch(`${NOMINATIM}/reverse?${params}`, { signal, headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return null;
    const r = (await res.json()) as { name?: string; display_name?: string };
    return r.name || r.display_name?.split(',').slice(0, 2).join(',') || null;
  } catch {
    return null;
  }
}

export interface RouteResult {
  coords: [number, number][];
  distanceKm: number;
  durationMin: number;
}

const routeCache = new Map<string, RouteResult>();

/** Driving route through the given points. Returns null if the routing service is unavailable. */
export async function fetchRoute(points: GeoPoint[], signal?: AbortSignal): Promise<RouteResult | null> {
  if (points.length < 2) return null;
  const key = points.map((p) => `${p.lon.toFixed(5)},${p.lat.toFixed(5)}`).join(';');
  const hit = routeCache.get(key);
  if (hit) return hit;
  try {
    const res = await fetch(`${OSRM}/route/v1/driving/${key}?overview=full&geometries=geojson`, { signal });
    if (!res.ok) return null;
    const data = (await res.json()) as { routes?: Array<{ geometry: { coordinates: [number, number][] }; distance: number; duration: number }> };
    const r = data.routes?.[0];
    if (!r) return null;
    const out: RouteResult = {
      coords: r.geometry.coordinates.map(([lon, lat]) => [lat, lon]),
      distanceKm: r.distance / 1000,
      durationMin: r.duration / 60,
    };
    routeCache.set(key, out);
    return out;
  } catch {
    return null;
  }
}

/** Build a destination for any town using OpenStreetMap attractions within ~15 km. */
export async function discoverDestination(center: SearchResult, signal?: AbortSignal): Promise<Destination> {
  const places = await fetchAttractions(center, 15000, signal).catch(() => []);
  return {
    id: 'custom-' + slug(center.name) + '-' + center.id.slice(-4),
    name: center.name,
    state: center.label.split(',').slice(-2, -1)[0]?.trim() ?? '',
    summary: places.length
      ? `${places.length} places found on OpenStreetMap. Review them and remove what you don't want.`
      : 'Custom destination. Add places from the map or search.',
    tags: Array.from(new Set(places.map((p) => p.category))).slice(0, 4),
    costIndex: 1,
    bestMonths: [],
    lat: center.lat,
    lon: center.lon,
    places,
    source: 'custom',
  };
}

interface OverpassEl {
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export async function fetchAttractions(c: GeoPoint, radius = 15000, signal?: AbortSignal): Promise<Place[]> {
  const q = `[out:json][timeout:20];
(
  nwr(around:${radius},${c.lat},${c.lon})[tourism~"^(attraction|museum|viewpoint|zoo|theme_park|gallery)$"][name];
  nwr(around:${radius},${c.lat},${c.lon})[natural=beach][name];
  nwr(around:${radius},${c.lat},${c.lon})[historic~"^(fort|castle|monument|palace|ruins)$"][name];
  nwr(around:${radius},${c.lat},${c.lon})[waterway=waterfall][name];
);
out center 60;`;
  const res = await fetch(OVERPASS, { method: 'POST', body: 'data=' + encodeURIComponent(q), signal, headers: { 'Content-Type': 'application/x-www-form-urlencoded' } });
  if (!res.ok) throw new Error('Overpass unavailable');
  const data = (await res.json()) as { elements: OverpassEl[] };
  const seen = new Set<string>();
  const out: Place[] = [];
  for (const e of data.elements) {
    const name = e.tags?.['name:en'] || e.tags?.name;
    const lat = e.lat ?? e.center?.lat;
    const lon = e.lon ?? e.center?.lon;
    if (!name || lat == null || lon == null) continue;
    const k = name.toLowerCase();
    if (seen.has(k)) continue;
    seen.add(k);
    const t = e.tags ?? {};
    const category: Interest = t.natural === 'beach' ? 'beaches'
      : t.historic ? 'history'
      : t.waterway === 'waterfall' ? 'nature'
      : t.tourism === 'museum' || t.tourism === 'gallery' ? 'culture'
      : t.tourism === 'viewpoint' ? 'nature'
      : t.tourism === 'theme_park' || t.tourism === 'zoo' ? 'adventure'
      : 'culture';
    const durationMin = category === 'beaches' ? 90 : category === 'nature' ? 75 : t.tourism === 'theme_park' ? 240 : 60;
    out.push({
      id: `osm-${e.id}`,
      name,
      lat,
      lon,
      category,
      durationMin,
      cost: 0,
      bestTime: category === 'beaches' || t.tourism === 'viewpoint' ? 'sunset' : category === 'history' ? 'morning' : 'any',
      priority: t.wikipedia || t.wikidata ? 4 : 3,
      note: 'From OpenStreetMap. Check hours and entry fee locally.',
      source: 'osm',
    });
  }
  return out.slice(0, 30);
}
