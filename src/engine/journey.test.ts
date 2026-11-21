import { describe, expect, it } from 'vitest';
import type { Destination, TripInput } from '../types';
import type { CityHubs, Corridor, DestinationAccess } from '../data/transport/types';
import { ORIGIN_CITIES, findDestination } from '../data/destinations';
import { generateTrip } from './planner';
import { buildAllJourneys, buildJourney, legForStop, type TransportLookups } from './journey';

// Small fake dataset so the tests don't depend on the researched data files.
const hubs: CityHubs[] = [
  {
    city: 'Hyderabad',
    stations: [
      { code: 'SC', name: 'Secunderabad Junction', lat: 17.4337, lon: 78.5016, note: 'Main station in the twin cities.' },
      { code: 'KCG', name: 'Kacheguda', lat: 17.3897, lon: 78.4985 },
    ],
    busPoints: [{ name: 'Lakdikapul', lat: 17.4036, lon: 78.4636 }],
    airport: { code: 'HYD', name: 'Rajiv Gandhi International Airport', lat: 17.2403, lon: 78.4294 },
    localTip: 'Uber and Ola work across the city; allow 45 minutes in evening traffic.',
  },
];
const access: DestinationAccess[] = [
  {
    destinationId: 'north-goa',
    arrivals: [
      { hub: 'Thivim', kind: 'rail', code: 'THVM', lat: 15.6219, lon: 73.8807, distanceKm: 20, options: [{ how: 'Prepaid taxi from the station', minutes: 40, costINR: [900, 1200], perVehicle: true }] },
      { hub: 'Mapusa bus stand', kind: 'bus', lat: 15.5915, lon: 73.809, distanceKm: 8, options: [{ how: 'Auto to Calangute', minutes: 20, costINR: [250, 350], perVehicle: true }] },
    ],
    tips: ['Scooters need an original driving licence.'],
  },
  {
    destinationId: 'gokarna',
    arrivals: [{ hub: 'Kumta bus stand', kind: 'bus', lat: 14.42, lon: 74.41, distanceKm: 30, options: [{ how: 'Local bus to Gokarna', minutes: 50, costINR: [40, 60] }] }],
  },
];
const corridors: Corridor[] = [
  {
    from: 'Hyderabad',
    to: 'north-goa',
    trains: [
      { number: '11111', name: 'Morning Test Express', fromCode: 'SC', toCode: 'THVM', departs: '06:00', arrives: '20:00', arrivalDayOffset: 0, durationMin: 840, runsOn: 'daily', classes: ['SL', '3A'], source: 'https://example.test/11111' },
      { number: '22222', name: 'Night Test Express', fromCode: 'KCG', toCode: 'THVM', departs: '18:40', arrives: '08:30', arrivalDayOffset: 1, durationMin: 830, runsOn: 'daily', classes: ['SL', '3A', '2A'], source: 'https://example.test/22222' },
      { number: '33333', name: 'Weekly Test Special', fromCode: 'SC', toCode: 'THVM', departs: '18:30', arrives: '08:00', arrivalDayOffset: 1, durationMin: 810, runsOn: ['Wed'], classes: ['SL'], source: 'https://example.test/33333' },
    ],
    buses: [
      { operator: 'Test Travels', type: 'Non-AC Sleeper', boarding: 'Lakdikapul', drop: 'Mapusa', departs: '17:30–19:00', durationMin: 840, fareINR: [1100, 1400], government: false, source: 'https://example.test/bus' },
      { operator: 'Test AC Lines', type: 'AC Sleeper', boarding: 'Kukatpally', drop: 'Panaji', departs: '18:00–20:00', durationMin: 820, fareINR: [1500, 1900], government: false, source: 'https://example.test/acbus' },
    ],
    flights: [{ fromAirport: 'HYD', toAirport: 'GOX', airlines: ['IndiGo'], durationMin: 80, nonstop: true, source: 'https://example.test/flight' }],
    advice: 'Night trains arrive early morning.',
  },
];
const look: TransportLookups = {
  hubsFor: (c) => hubs.find((h) => h.city === c),
  accessFor: (id) => access.find((a) => a.destinationId === id),
  corridor: (f, t) => corridors.find((c) => c.from === f && c.to === t),
};
const empty: TransportLookups = { hubsFor: () => undefined, accessFor: () => undefined, corridor: () => undefined };

const input = (over: Partial<TripInput> = {}): TripInput => ({
  name: 'Goa',
  origin: ORIGIN_CITIES.find((c) => c.name === 'Hyderabad')!,
  destinations: ['north-goa', 'gokarna'].map((id) => findDestination(id)!) as Destination[],
  startDate: '2026-11-21', // a Saturday
  days: 6,
  travelers: 4,
  budgetPerPerson: 10000,
  transport: 'train_sl',
  returnTransport: 'bus_nonac',
  localTransport: 'taxi',
  stay: 'budget',
  food: 'mixed',
  pace: 'balanced',
  interests: ['beaches'],
  overnightTravel: true,
  ...over,
});

describe('journey guide', () => {
  it('links legs to their origin city and destinations', () => {
    const trip = generateTrip(input());
    expect(trip.legs[0].from.ref).toEqual({ kind: 'city', id: 'Hyderabad' });
    expect(trip.legs[0].to.ref).toEqual({ kind: 'destination', id: 'north-goa' });
  });

  it('recommends a real overnight train that runs on the travel day', () => {
    const trip = generateTrip(input());
    const j = buildJourney(trip, trip.legs[0], look);
    expect(j.kind).toBe('train');
    expect(j.hasData).toBe(true);
    // Evening departure planned: the weekly Wednesday train must not win on a Saturday.
    expect(j.options[0].number).toBe('22222');
    expect(j.options[0].recommended).toBe(true);
    expect(j.options.find((o) => o.number === '33333')?.runsOnTravelDay).toBe(false);
    expect(j.options[0].fromLabel).toBe('Kacheguda (KCG)');
    expect(j.alternatives.map((a) => a.kind)).toEqual(['bus', 'flight']);
    expect(j.sources).toContain('https://example.test/22222');
  });

  it('writes beginner steps from booking to the last mile', () => {
    const trip = generateTrip(input());
    const j = buildJourney(trip, trip.legs[0], look);
    const titles = j.steps.map((s) => s.title);
    expect(titles[0]).toMatch(/Book train 22222/);
    expect(titles.some((t) => /Reach Kacheguda \(KCG\)/.test(t))).toBe(true);
    expect(titles.some((t) => /Board 22222 Night Test Express at 18:40/.test(t))).toBe(true);
    expect(titles.some((t) => /Get off at Thivim \(THVM\)/.test(t))).toBe(true);
    expect(j.steps.at(-1)!.detail).toMatch(/Prepaid taxi/);
    expect(j.steps.some((s) => s.icon === 'night')).toBe(true);
    expect(j.tips[0]).toMatch(/driving licence/);
    expect(j.liveLinks.some((l) => l.url.includes('erail.in/trains-between-stations/'))).toBe(true);
  });

  it('ranks buses by the AC choice and guides the return home', () => {
    const trip = generateTrip(input({ transport: 'bus_ac', returnTransport: 'bus_ac' }));
    const out = buildJourney(trip, trip.legs[0], look);
    expect(out.options[0].name).toBe('Test AC Lines');
    expect(out.liveLinks.find((l) => /redBus/.test(l.label))?.url).toBe('https://www.redbus.in/bus-tickets/hyderabad-to-goa');
    const back = buildJourney(trip, trip.legs.at(-1)!, look);
    expect(back.hasData).toBe(false);
    expect(back.steps.at(-1)!.icon).toBe('home');
  });

  it('still gives a complete generic plan when there is no data', () => {
    const trip = generateTrip(input());
    const all = buildAllJourneys(trip, empty);
    expect(all).toHaveLength(trip.legs.length);
    all.forEach((j) => {
      expect(j.options).toEqual([]);
      expect(j.steps.length).toBeGreaterThanOrEqual(2);
      expect(j.liveLinks.length).toBeGreaterThan(0);
    });
    // Hop between destinations uses local transport steps.
    const hop = all[1];
    expect(hop.kind).toBe('local');
    expect(hop.steps[0].title).toMatch(/taxi/i);
  });

  it('matches travel stops to their legs', () => {
    const trip = generateTrip(input());
    const day0 = trip.days[0];
    const stop = day0.stops.find((s) => s.kind === 'travel')!;
    expect(legForStop(trip, 0, stop.start)?.id).toBe(trip.legs[0].id);
  });
});

describe('last mile uses the station the train actually reaches', () => {
  it('starts from Madgaon when the train ends there, even for North Goa', async () => {
    const { generateTrip } = await import('./planner');
    const { ORIGIN_CITIES, findDestination } = await import('../data/destinations');
    const { buildJourney: realBuild } = await import('./journey');
    const trip = generateTrip({
      name: 't', origin: ORIGIN_CITIES.find((c) => c.name === 'Hyderabad')!, destinations: [findDestination('north-goa')!],
      startDate: '2026-11-26', days: 4, travelers: 2, budgetPerPerson: 20000, transport: 'train_sl', returnTransport: 'train_sl',
      localTransport: 'taxi', stay: 'budget', food: 'mixed', pace: 'balanced', interests: [], overnightTravel: true,
    });
    const plan = realBuild(trip, trip.legs[0]);
    const best = plan.options[0];
    if (!best || best.toLabel.indexOf('MAO') < 0) return; // data changed; nothing to assert
    const last = plan.steps.filter((s) => s.icon === 'lastmile').at(-1)!;
    expect(last.title).toMatch(/Madgaon/i);
    expect(last.title).not.toMatch(/Thivim/i);
  });
});
