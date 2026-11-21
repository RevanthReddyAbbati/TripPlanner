// Deep links to LIVE sources, so travellers can always check today's real timetables and fares.
// Only place names, station/airport codes and a travel date go into these URLs.
//
// Formats:
// - redBus route pages: https://www.redbus.in/bus-tickets/{from}-to-{to} (verified, e.g. hyderabad-to-goa).
// - erail trains between stations: https://erail.in/trains-between-stations/{name}-{CODE}/{name}-{CODE}?date=DD-Mon-YYYY
//   (verified Nov 2026, including the date parameter; we also always offer a Google search fallback).
// - Google Flights accepts free-text queries via ?q=.

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2026-11-28" → "28-Nov-2026", the format erail's date picker uses. */
export function erailDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${String(d).padStart(2, '0')}-${MONTHS[m - 1]}-${y}`;
}

/** erail's class picker uses numeric codes (checked Nov 2026); unknown classes fall back to all. */
const ERAIL_CLASS: Record<string, string> = { '1A': '0', '2A': '1', '3A': '2', CC: '3', FC: '4', SL: '5', '2S': '6', '3E': '7', GN: '8', EA: '9', EC: '10' };

/**
 * All trains between two stations on erail, for a specific date and class when given.
 * Verified format (Nov 2026): /trains-between-stations/secunderabad-jn-SC/madgaon-MAO?date=26-Nov-2026&class=5&quota=GN
 * The station is resolved by its code, so any name slug works. The page shows which trains run on
 * that date, with fares and seat status per class.
 */
export function erailTrainsBetween(
  from: { code: string; name: string },
  to: { code: string; name: string },
  opts: { date?: string; cls?: string } = {},
): string {
  const path = `https://erail.in/trains-between-stations/${slugify(from.name)}-${encodeURIComponent(from.code.toUpperCase())}/${slugify(to.name)}-${encodeURIComponent(to.code.toUpperCase())}`;
  if (!opts.date) return path;
  const q = new URLSearchParams({ date: erailDate(opts.date), class: (opts.cls && ERAIL_CLASS[opts.cls.toUpperCase()]) ?? '-1', quota: 'GN' });
  return `${path}?${q}`;
}

/** Live running status and schedule of one train. */
export function trainSchedule(number: string): string {
  return `https://erail.in/train-enquiry/${encodeURIComponent(number)}`;
}

/** IRCTC has no stable deep link; this opens the booking home page. */
export const IRCTC_HOME = 'https://www.irctc.co.in/nget/train-search';

/** IRCTC PNR / NTES live train status. */
export const NTES_HOME = 'https://enquiry.indianrail.gov.in/mntes/';

/** redBus route search (city names). */
export function redbusRoute(from: string, to: string): string {
  return `https://www.redbus.in/bus-tickets/${slugify(from)}-to-${slugify(to)}`;
}

/** Google Flights search using a plain-language query. */
export function googleFlights(from: string, to: string, isoDate?: string): string {
  const q = `Flights from ${from} to ${to}${isoDate ? ` on ${isoDate}` : ''}`;
  return `https://www.google.com/travel/flights?q=${encodeURIComponent(q)}`;
}

/** Google search fallback, e.g. "trains from Hyderabad to Madgaon". */
export function googleSearch(query: string): string {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/** Google Maps directions to a point (from the viewer's current location). */
export function mapsDirections(lat: number, lon: number): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lon}`;
}

/** Google Maps directions between two points. */
export function mapsRoute(from: { lat: number; lon: number }, to: { lat: number; lon: number }, mode: 'driving' | 'transit' = 'driving'): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${from.lat},${from.lon}&destination=${to.lat},${to.lon}&travelmode=${mode}`;
}
