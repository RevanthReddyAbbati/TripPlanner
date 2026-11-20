import type { Trip } from '../types';
import { slug } from './format';

// Share links carry the whole trip, compressed, in the URL hash. Nothing is uploaded anywhere.

function toB64Url(bytes: Uint8Array): string {
  let s = '';
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64Url(s: string): Uint8Array {
  const b = atob(s.replace(/-/g, '+').replace(/_/g, '/'));
  return Uint8Array.from(b, (c) => c.charCodeAt(0));
}

async function pipe(bytes: Uint8Array, stream: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const out = new Blob([bytes]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

export async function encodeTrip(trip: Trip): Promise<string> {
  const json = new TextEncoder().encode(JSON.stringify(trip));
  if (typeof CompressionStream === 'undefined') return 'j' + toB64Url(json);
  return 'z' + toB64Url(await pipe(json, new CompressionStream('deflate-raw')));
}

export async function decodeTrip(data: string): Promise<Trip> {
  const kind = data[0];
  const bytes = fromB64Url(data.slice(1));
  const raw = kind === 'z' ? await pipe(bytes, new DecompressionStream('deflate-raw')) : bytes;
  const trip = JSON.parse(new TextDecoder().decode(raw)) as Trip;
  if (!trip || trip.version !== 1 || !Array.isArray(trip.days)) throw new Error('This link does not contain a valid trip.');
  return trip;
}

export function shareUrl(encoded: string): string {
  const base = location.href.split('#')[0];
  return `${base}#/shared?d=${encoded}`;
}

export function downloadFile(name: string, content: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function exportJSON(trip: Trip) {
  downloadFile(`${slug(trip.input.name) || 'trip'}.itinera.json`, JSON.stringify(trip, null, 2), 'application/json');
}

/** Calendar file with one event per stop (meals and rests skipped). */
export function exportICS(trip: Trip) {
  const pad = (n: number) => String(n).padStart(2, '0');
  const stamp = (iso: string, min: number) => {
    const d = new Date(iso + 'T00:00:00');
    d.setMinutes(d.getMinutes() + Math.round(min));
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}T${pad(d.getHours())}${pad(d.getMinutes())}00`;
  };
  const esc = (s: string) => s.replace(/[\\,;]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Itinera//Trip Planner//EN', 'CALSCALE:GREGORIAN'];
  trip.days.forEach((d) =>
    d.stops
      .filter((s) => s.kind !== 'meal' && s.kind !== 'rest')
      .forEach((s) => {
        lines.push(
          'BEGIN:VEVENT',
          `UID:${s.id}@itinera`,
          `DTSTAMP:${stamp(d.date, 0)}`,
          `DTSTART:${stamp(d.date, s.start)}`,
          `DTEND:${stamp(d.date, s.end)}`,
          `SUMMARY:${esc(s.title)}`,
          ...(s.note ? [`DESCRIPTION:${esc(s.note)}`] : []),
          ...(s.lat != null && s.lon != null ? [`GEO:${s.lat};${s.lon}`] : []),
          'END:VEVENT',
        );
      }),
  );
  lines.push('END:VCALENDAR');
  downloadFile(`${slug(trip.input.name) || 'trip'}.ics`, lines.join('\r\n'), 'text/calendar');
}

export function mapsLink(lat: number, lon: number, name?: string): string {
  const q = name ? `${name} @${lat},${lon}` : `${lat},${lon}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
}

/** Directions from the viewer's current location. */
export function directionsTo(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

export function directionsLink(points: { lat: number; lon: number }[]): string {
  if (points.length < 2) return '';
  const o = points[0];
  const d = points[points.length - 1];
  const w = points.slice(1, -1).slice(0, 8).map((p) => `${p.lat},${p.lon}`).join('|');
  return `https://www.google.com/maps/dir/?api=1&origin=${o.lat},${o.lon}&destination=${d.lat},${d.lon}${w ? `&waypoints=${encodeURIComponent(w)}` : ''}`;
}
