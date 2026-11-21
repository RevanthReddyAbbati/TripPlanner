import { describe, expect, it } from 'vitest';
import type { Destination, TripInput } from '../types';
import { DESTINATIONS, ORIGIN_CITIES, findDestination } from '../data/destinations';
import { generateTrip } from './planner';
import { computeBudget, suggestSavings } from './budget';
import { insertStop, moveStop, removeStop } from './edit';

const goaTrip = (over: Partial<TripInput> = {}): TripInput => ({
  name: 'Goa and Gokarna',
  origin: ORIGIN_CITIES.find((c) => c.name === 'Hyderabad')!,
  destinations: ['north-goa', 'south-goa', 'gokarna'].map((id) => findDestination(id)!) as Destination[],
  startDate: '2026-11-21',
  days: 6,
  travelers: 4,
  budgetPerPerson: 10000,
  transport: 'bus_ac',
  returnTransport: 'bus_nonac',
  localTransport: 'scooter',
  stay: 'budget',
  food: 'mixed',
  pace: 'balanced',
  interests: ['beaches', 'history', 'nightlife', 'nature'],
  overnightTravel: true,
  ...over,
});

describe('catalog', () => {
  it('has unique place ids and valid coordinates', () => {
    const ids = new Set<string>();
    DESTINATIONS.forEach((d) =>
      d.places.forEach((p) => {
        expect(ids.has(p.id)).toBe(false);
        ids.add(p.id);
        expect(p.lat).toBeGreaterThan(6);
        expect(p.lat).toBeLessThan(37);
        expect(p.lon).toBeGreaterThan(68);
        expect(p.lon).toBeLessThan(98);
      }),
    );
  });
});

describe('generateTrip', () => {
  const trip = generateTrip(goaTrip());

  it('creates one plan per day with correct dates', () => {
    expect(trip.days).toHaveLength(6);
    expect(trip.days[0].date).toBe('2026-11-21');
    expect(trip.days[5].date).toBe('2026-11-26');
  });

  it('builds outbound, hop and return legs', () => {
    expect(trip.legs).toHaveLength(4);
    expect(trip.legs[0].from.name).toBe('Hyderabad');
    expect(trip.legs[0].overnight).toBe(true);
    expect(trip.legs.at(-1)!.to.name).toBe('Hyderabad');
  });

  it('schedules visits at every destination', () => {
    const visited = new Set(trip.days.flatMap((d) => d.stops).filter((s) => s.kind === 'visit').map((s) => s.destinationId));
    expect(visited).toEqual(new Set(['north-goa', 'south-goa', 'gokarna']));
  });

  it('never double-books a place', () => {
    const ids = trip.days.flatMap((d) => d.stops).filter((s) => s.placeId).map((s) => s.placeId);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('keeps visit stops in time order without overlaps', () => {
    trip.days.forEach((d) => {
      const visits = d.stops.filter((s) => s.kind === 'visit' || s.kind === 'meal');
      for (let i = 1; i < visits.length; i++) expect(visits[i].start).toBeGreaterThanOrEqual(visits[i - 1].end);
    });
  });

  it('respects opening hours', () => {
    const places = new Map(DESTINATIONS.flatMap((d) => d.places).map((p) => [p.id, p]));
    trip.days.flatMap((d) => d.stops).forEach((s) => {
      const p = s.placeId ? places.get(s.placeId) : undefined;
      if (p?.open) expect(s.start).toBeGreaterThanOrEqual(Number(p.open.slice(0, 2)) * 60 + Number(p.open.slice(3)));
      if (p?.close) expect(s.end).toBeLessThanOrEqual(Number(p.close.slice(0, 2)) * 60 + Number(p.close.slice(3)));
    });
  });

  it('fits the ₹10,000 cap for the sample group', () => {
    const b = computeBudget(trip);
    expect(b.perPerson).toBeGreaterThan(5000);
    expect(b.perPerson).toBeLessThanOrEqual(10000);
  });

  it('is deterministic apart from ids', () => {
    const strip = (t: ReturnType<typeof generateTrip>) => t.days.map((d) => d.stops.map((s) => `${s.start}-${s.title}`));
    expect(strip(generateTrip(goaTrip()))).toEqual(strip(trip));
  });
});

describe('budget', () => {
  it('flights cost more than buses', () => {
    const bus = computeBudget(generateTrip(goaTrip())).perPerson;
    const fly = computeBudget(generateTrip(goaTrip({ transport: 'flight', returnTransport: 'flight' }))).perPerson;
    expect(fly).toBeGreaterThan(bus);
  });

  it('suggests savings for an expensive trip', () => {
    const t = generateTrip(goaTrip({ transport: 'flight', returnTransport: 'flight', stay: 'luxury', food: 'premium' }));
    const s = suggestSavings(t);
    expect(s.length).toBeGreaterThan(0);
    expect(s[0].saving).toBeGreaterThan(0);
  });
});

describe('editing', () => {
  const trip = generateTrip(goaTrip());
  const day = trip.days.find((d) => d.stops.filter((s) => !s.fixed).length >= 2)!;

  it('removes a stop', () => {
    const target = day.stops.find((s) => !s.fixed)!;
    expect(removeStop(day, target.id).stops.find((s) => s.id === target.id)).toBeUndefined();
  });

  it('moves a stop and keeps the day ordered', () => {
    const movable = day.stops.filter((s) => !s.fixed);
    const next = moveStop(day, movable[1].id, -1);
    const visits = next.stops.filter((s) => !s.fixed);
    for (let i = 1; i < visits.length; i++) expect(visits[i].start).toBeGreaterThanOrEqual(visits[i - 1].start);
  });

  it('inserts a custom stop', () => {
    const next = insertStop(day, { kind: 'custom', title: 'Shopping', cost: 300, durationMin: 60 });
    expect(next.stops.some((s) => s.title === 'Shopping')).toBe(true);
  });
});

describe('real train timetables', () => {
  it('times the outbound leg by a verified train when one runs that day', async () => {
    const { corridor } = await import('../data/transport');
    const t = corridor('Bengaluru', 'gokarna')?.trains.find((x) => x.number === '16595');
    if (!t) return; // data not present in this checkout
    const trip = generateTrip(
      goaTrip({
        origin: ORIGIN_CITIES.find((c) => c.name === 'Bengaluru')!,
        destinations: [findDestination('gokarna')!],
        days: 4,
        transport: 'train_sl',
        returnTransport: 'train_sl',
      }),
    );
    const out = trip.legs[0];
    const [h, m] = t.departs.split(':').map(Number);
    expect(out.departAbs).toBe(h * 60 + m);
    expect(out.durationMin).toBe(t.durationMin);
  });
});
