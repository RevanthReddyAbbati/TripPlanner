// Deep links to LIVE sources, so travellers can always check today's real timetables and fares.
// Only place names, station/airport codes and a travel date go into these URLs.
//
// Formats:
// - redBus route pages: https://www.redbus.in/bus-tickets/{from}-to-{to} (verified, e.g. hyderabad-to-goa).
// - erail trains between stations: https://erail.in/trains-between-stations/{name}-{CODE}/{name}-{CODE}
//   (pattern seen on erail's own indexed pages; we also always offer a Google search fallback).
// - Google Flights accepts free-text queries via ?q=.

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const under = (s: string) => slugify(s).replace(/-/g, '_');

/** All trains between two stations on erail (live timetable, seats, running days). */
export function erailTrainsBetween(from: { code: string; name: string }, to: { code: string; name: string }): string {
  return `https://erail.in/trains-between-stations/${under(from.name)}-${encodeURIComponent(from.code.toUpperCase())}/${under(to.name)}-${encodeURIComponent(to.code.toUpperCase())}`;
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
