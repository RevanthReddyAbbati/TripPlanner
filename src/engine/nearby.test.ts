import { describe, expect, it } from 'vitest';
import type { Destination, TripInput } from '../types';
import { DESTINATIONS, ORIGIN_CITIES, findDestination } from '../data/destinations';
import { EXCURSIONS } from '../data/nearby';
import { generateTrip } from './planner';
import { bestDayFor, nearbyForInput, nearbySuggestions } from './nearby';
import { haversineKm } from '../lib/geo';

const input = (ids: string[], over: Partial<TripInput> = {}): TripInput => ({
  name: 'Test',
  origin: ORIGIN_CITIES[0],
  destinations: ids.map((id) => findDestination(id)!) as Destination[],
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
  interests: ['beaches', 'history'],
  overnightTravel: true,
  ...over,
});

describe('excursion data', () => {
  it('covers every catalog destination with real, nearby coordinates', () => {
    const ids = new Set<string>();
    DESTINATIONS.forEach((d) => {
      const list = EXCURSIONS.filter((e) => e.nearDestinationId === d.id);
      expect(list.length, d.id).toBeGreaterThanOrEqual(2);
      list.forEach((e) => {
        expect(ids.has(e.id)).toBe(false);
        ids.add(e.id);
        // Straight-line distance must be plausible for the stated road distance.
        const crow = haversineKm(d, e);
        expect(crow, e.id).toBeLessThanOrEqual(e.distanceKm * 1.05 + 5);
        expect(e.transportCostINR[0]).toBeLessThanOrEqual(e.transportCostINR[1]);
        expect(e.why).not.toMatch(/—/);
      });
    });
  });
});

describe('nearbySuggestions', () => {
  const trip = generateTrip(input(['north-goa', 'south-goa', 'gokarna']));
  const all = nearbySuggestions(trip);

  it('suggests curated day trips near the trip', () => {
    expect(all.some((s) => s.kind === 'day-trip' && s.title === 'Murudeshwar')).toBe(true);
  });

  it('suggests catalog destinations within reach that are not in the trip', () => {
    const hampi = all.find((s) => s.kind === 'add-destination' && s.title === 'Hampi');
    expect(hampi).toBeDefined();
    expect(hampi!.action).toMatchObject({ type: 'add-destination', destinationId: 'hampi' });
    expect(all.some((s) => s.kind === 'add-destination' && ['North Goa', 'South Goa', 'Gokarna'].includes(s.title))).toBe(false);
    expect(all.some((s) => s.title === 'Manali')).toBe(false);
  });

  it('never suggests something already in the plan', () => {
    const titles = new Set(trip.days.flatMap((d) => d.stops.map((s) => s.title)));
    all.forEach((s) => expect(titles.has(s.title), s.title).toBe(false));
  });

  it('only offers unscheduled places that are must-sees', () => {
    const places = new Map(trip.input.destinations.flatMap((d) => d.places.map((p) => [p.id, p])));
    all
      .filter((s) => s.kind === 'unscheduled-place')
      .forEach((s) => {
        const a = s.action as { place: { id: string } };
        expect(places.get(a.place.id)!.priority).toBeGreaterThanOrEqual(4);
      });
  });

  it('ranks interest matches and filters by kind', () => {
    const days = nearbySuggestions(trip, { kinds: ['day-trip'] });
    expect(days.every((s) => s.kind === 'day-trip')).toBe(true);
    expect(nearbySuggestions(trip, { limit: 3 })).toHaveLength(3);
    for (let i = 1; i < all.length; i++) expect(all[i - 1].score).toBeGreaterThanOrEqual(all[i].score);
  });

  it('marks out-of-season items and budget fit', () => {
    const jog = all.find((s) => s.title === 'Jog Falls');
    expect(jog?.inSeason).toBe(true); // November is in its season
    const tight = generateTrip(input(['gokarna'], { budgetPerPerson: 1000 }));
    expect(nearbySuggestions(tight).filter((s) => s.extraCostPP > 0).every((s) => !s.fitsBudget)).toBe(true);
  });

  it('points add-stop actions at a day spent at that destination', () => {
    const s = all.find((x) => x.action.type === 'add-stop' && x.nearDestinationId === 'gokarna')!;
    const day = (s.action as { suggestedDay?: number }).suggestedDay!;
    const d = trip.days[day];
    expect(d.baseId === 'gokarna' || (d.night.type === 'stay' && d.night.destinationId === 'gokarna')).toBe(true);
    expect(bestDayFor(trip, 'manali')).toBeUndefined();
  });

  it('works on wizard input before a plan exists', () => {
    const list = nearbyForInput(input(['hampi']));
    expect(list.some((s) => s.title === 'Badami Cave Temples')).toBe(true);
    expect(list.every((s) => s.fitsBudget)).toBe(true);
  });
});
