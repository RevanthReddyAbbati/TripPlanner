import { describe, expect, it } from 'vitest';
import type { Destination, Expense, Trip, TripInput } from '../types';
import { ORIGIN_CITIES, findDestination } from '../data/destinations';
import { generateTrip } from './planner';
import { computeBalances, settle, summarize, tripPhase, expensesToCSV } from './expenses';
import { normalizeTrip, syncTravelers } from './people';

const input: TripInput = {
  name: 'Goa',
  origin: ORIGIN_CITIES[0],
  destinations: ['north-goa', 'gokarna'].map((id) => findDestination(id)!) as Destination[],
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
  interests: ['beaches'],
  overnightTravel: true,
};

type TestExpense = Omit<Partial<Expense>, 'paidBy' | 'splitWith'> & { amount: number; paidBy: number; splitWith?: number[] };

function withExpenses(t: Trip, list: TestExpense[]): Trip {
  const ids = t.travelers.map((p) => p.id);
  return {
    ...t,
    expenses: list.map((e, i) => ({
      id: 'x' + i,
      title: 'E' + i,
      category: 'food',
      date: '2026-11-22',
      method: 'upi',
      createdAt: '',
      ...e,
      paidBy: ids[e.paidBy],
      splitWith: (e.splitWith ?? [0, 1, 2, 3]).map((k) => ids[k]),
    })) as Expense[],
  };
}

describe('travellers', () => {
  it('creates one traveller per person, first named after the user', () => {
    const t = generateTrip(input, undefined, 'Revanth');
    expect(t.travelers).toHaveLength(4);
    expect(t.travelers[0].name).toBe('Revanth');
  });

  it('never drops someone who has expenses when the group shrinks', () => {
    const list = syncTravelers(undefined, 4);
    const kept = syncTravelers(list, 2, undefined, new Set([list[3].id]));
    expect(kept.map((p) => p.id)).toContain(list[3].id);
  });

  it('upgrades version 1 trips', () => {
    const t = generateTrip(input);
    const old = { ...t, version: 1, travelers: undefined, expenses: undefined, bookings: undefined } as unknown as Trip;
    const n = normalizeTrip(old);
    expect(n.version).toBe(2);
    expect(n.travelers).toHaveLength(4);
    expect(n.expenses).toEqual([]);
  });
});

describe('balances and settle-up', () => {
  const base = generateTrip(input);

  it('splits equally and nets to zero', () => {
    const t = withExpenses(base, [{ amount: 4000, paidBy: 0 }, { amount: 2000, paidBy: 1 }]);
    const b = computeBalances(t);
    expect(b[0].net).toBe(2500);
    expect(b[1].net).toBe(500);
    expect(b[2].net).toBe(-1500);
    expect(b.reduce((a, x) => a + x.net, 0)).toBe(0);
  });

  it('settles with transfers that clear every balance', () => {
    const t = withExpenses(base, [{ amount: 4000, paidBy: 0 }, { amount: 2000, paidBy: 1 }, { amount: 900, paidBy: 2, splitWith: [2, 3] }]);
    const balances = computeBalances(t);
    const transfers = settle(balances);
    const after = new Map(balances.map((b) => [b.travelerId, b.net]));
    transfers.forEach((s) => {
      after.set(s.from, after.get(s.from)! + s.amount);
      after.set(s.to, after.get(s.to)! - s.amount);
    });
    [...after.values()].forEach((v) => expect(Math.abs(v)).toBeLessThanOrEqual(1));
    expect(transfers.length).toBeLessThanOrEqual(3);
  });
});

describe('summary', () => {
  const base = generateTrip(input);

  it('tracks spent, remaining and categories against the cap', () => {
    const t = withExpenses(base, [
      { amount: 6000, paidBy: 0, category: 'transport' },
      { amount: 2000, paidBy: 1, category: 'food' },
    ]);
    const s = summarize(t, '2026-11-23');
    expect(s.spent).toBe(8000);
    expect(s.cap).toBe(40000);
    expect(s.remaining).toBe(32000);
    expect(s.perPersonSpent).toBe(2000);
    expect(s.byCategory.find((c) => c.key === 'transport')!.spent).toBe(6000);
    expect(s.byDay.reduce((a, d) => a + d.spent, 0)).toBe(8000);
  });

  it('gives a daily allowance and forecast while live', () => {
    const t = withExpenses(base, [{ amount: 9000, paidBy: 0 }]);
    const s = summarize(t, '2026-11-23'); // day 3 of 6
    expect(s.phase).toEqual({ kind: 'live', dayIndex: 2 });
    expect(s.daysLeft).toBe(4);
    expect(s.dailyAllowance).toBe(Math.round((40000 - 9000) / 4));
    expect(s.forecast).toBe(18000);
  });

  it('knows upcoming and completed trips', () => {
    expect(tripPhase(base, '2026-11-20')).toEqual({ kind: 'upcoming', daysToGo: 1 });
    expect(tripPhase(base, '2026-11-30')).toEqual({ kind: 'completed', daysAgo: 4 });
  });

  it('exports CSV with escaped fields', () => {
    const t = withExpenses(base, [{ amount: 500, paidBy: 0, title: 'Lunch, "thali"' }]);
    const csv = expensesToCSV(t);
    expect(csv.split('\n')).toHaveLength(2);
    expect(csv).toContain('"Lunch, ""thali"""');
  });
});
