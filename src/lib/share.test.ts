import { describe, expect, it } from 'vitest';
import type { Destination, Trip, TripInput } from '../types';
import { ORIGIN_CITIES, findDestination } from '../data/destinations';
import { generateTrip } from '../engine/planner';
import { assertTripShape, shareableTrip } from './share';

const input: TripInput = {
  name: 'Goa',
  origin: ORIGIN_CITIES[0],
  destinations: ['north-goa'].map((id) => findDestination(id)!) as Destination[],
  startDate: '2026-11-21',
  days: 3,
  travelers: 2,
  budgetPerPerson: 10000,
  transport: 'bus_ac',
  returnTransport: 'bus_ac',
  localTransport: 'scooter',
  stay: 'budget',
  food: 'mixed',
  pace: 'balanced',
  interests: ['beaches'],
  overnightTravel: true,
};

function tripWithMoney(): Trip {
  const t = generateTrip(input);
  return {
    ...t,
    expenses: [{ id: 'x1', title: 'Dinner', amount: 900, category: 'food', date: '2026-11-21', method: 'upi', paidBy: t.travelers[0].id, splitWith: t.travelers.map((p) => p.id), createdAt: '' }],
    bookings: [{ id: 'b1', type: 'transport', title: 'Bus to Goa', status: 'confirmed', reference: 'PNR1234567', date: '2026-11-21', amount: 1200 } as unknown as Trip['bookings'][number]],
  };
}

describe('shareableTrip', () => {
  it('leaves expenses and bookings out by default', () => {
    const shared = shareableTrip(tripWithMoney());
    expect(shared.expenses).toEqual([]);
    expect(shared.bookings).toEqual([]);
    expect(JSON.stringify(shared)).not.toContain('PNR1234567');
  });

  it('keeps the plan itself', () => {
    const t = tripWithMoney();
    const shared = shareableTrip(t);
    expect(shared.days).toEqual(t.days);
    expect(shared.input).toEqual(t.input);
  });

  it('includes money when the sharer opts in', () => {
    const t = tripWithMoney();
    expect(shareableTrip(t, { includeMoney: true })).toBe(t);
  });
});

describe('assertTripShape', () => {
  it('accepts a generated trip', () => {
    expect(() => assertTripShape(generateTrip(input))).not.toThrow();
  });

  it.each([
    ['null', null],
    ['a string', 'trip'],
    ['wrong version', { version: 9, days: [] }],
    ['no input', { version: 2, days: [] }],
    ['input without destinations', { version: 2, days: [], input: { name: 'x', startDate: '2026-01-01', travelers: 2, origin: {} } }],
    ['expenses not a list', { ...generateTrip(input), expenses: 'oops' }],
  ])('rejects %s', (_label, value) => {
    expect(() => assertTripShape(value)).toThrow();
  });
});
