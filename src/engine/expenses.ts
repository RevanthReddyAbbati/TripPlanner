// Spending analytics: actual vs plan, balances between travellers and who should pay whom.
import type { BudgetLine, Expense, ExpenseCategory, Trip } from '../types';
import { computeBudget } from './budget';
import { addDays, toISODate } from '../lib/time';

export const CATEGORIES: { key: ExpenseCategory; label: string; color: string }[] = [
  { key: 'transport', label: 'Travel', color: '#2557d6' },
  { key: 'stay', label: 'Stay', color: '#0f9488' },
  { key: 'food', label: 'Food', color: '#e8590c' },
  { key: 'local', label: 'Getting around', color: '#7048e8' },
  { key: 'activities', label: 'Entries & activities', color: '#c2255c' },
  { key: 'shopping', label: 'Shopping', color: '#b08800' },
  { key: 'other', label: 'Other', color: '#64748b' },
];
export const CATEGORY = Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<ExpenseCategory, (typeof CATEGORIES)[number]>;

const GROUP_TO_CATEGORY: Record<BudgetLine['group'], ExpenseCategory> = {
  transport: 'transport',
  stay: 'stay',
  food: 'food',
  local: 'local',
  activities: 'activities',
  buffer: 'other',
};

export type TripPhase =
  | { kind: 'upcoming'; daysToGo: number }
  | { kind: 'live'; dayIndex: number }
  | { kind: 'completed'; daysAgo: number };

export function tripPhase(trip: Trip, today = toISODate(new Date())): TripPhase {
  const start = trip.input.startDate;
  const end = addDays(start, trip.days.length - 1);
  const diff = (a: string, b: string) => Math.round((new Date(a + 'T00:00:00').getTime() - new Date(b + 'T00:00:00').getTime()) / 86400000);
  if (today < start) return { kind: 'upcoming', daysToGo: diff(start, today) };
  if (today > end) return { kind: 'completed', daysAgo: diff(today, end) };
  return { kind: 'live', dayIndex: diff(today, start) };
}

export function tripEndDate(trip: Trip): string {
  return addDays(trip.input.startDate, trip.days.length - 1);
}

export interface Balance {
  travelerId: string;
  paid: number;
  share: number;
  /** Positive: others owe them. Negative: they owe. */
  net: number;
}

export interface Settlement {
  from: string;
  to: string;
  amount: number;
}

export interface SpendSummary {
  spent: number;
  /** Group budget cap: cap per person × travellers. */
  cap: number;
  /** Planned group cost from the itinerary. */
  planned: number;
  remaining: number;
  pctOfCap: number;
  perPersonSpent: number;
  byCategory: { key: ExpenseCategory; label: string; color: string; planned: number; spent: number }[];
  /** Spend per trip day (by date). */
  byDay: { date: string; index: number; spent: number; planned: number }[];
  balances: Balance[];
  settlements: Settlement[];
  /** Projected total at the current daily rate (only meaningful once the trip has started). */
  forecast: number;
  /** What the group can spend per remaining day and stay within the cap. */
  dailyAllowance: number;
  daysLeft: number;
  phase: TripPhase;
  overCategories: ExpenseCategory[];
}

export function summarize(trip: Trip, today = toISODate(new Date())): SpendSummary {
  const n = trip.input.travelers;
  const budget = computeBudget(trip);
  const cap = trip.input.budgetPerPerson * n;
  const planned = budget.total;
  const expenses = trip.expenses ?? [];
  const spent = round(expenses.reduce((a, e) => a + e.amount, 0));

  const plannedByCat: Record<ExpenseCategory, number> = { transport: 0, stay: 0, food: 0, local: 0, activities: 0, shopping: 0, other: 0 };
  budget.lines.forEach((l) => (plannedByCat[GROUP_TO_CATEGORY[l.group]] += l.perPerson * n));
  const spentByCat: Record<ExpenseCategory, number> = { transport: 0, stay: 0, food: 0, local: 0, activities: 0, shopping: 0, other: 0 };
  expenses.forEach((e) => (spentByCat[e.category] += e.amount));
  const byCategory = CATEGORIES.map((c) => ({ ...c, planned: round(plannedByCat[c.key]), spent: round(spentByCat[c.key]) }));
  const overCategories = byCategory.filter((c) => c.planned > 0 && c.spent > c.planned).map((c) => c.key);

  // Planned spend per day: transport on the day it departs, everything else spread evenly.
  const D = trip.days.length;
  const transportPerDay = new Array(D).fill(0);
  trip.legs.forEach((l) => {
    const d = Math.min(D - 1, Math.max(0, Math.floor(l.departAbs / 1440)));
    transportPerDay[d] += l.cost * n;
  });
  const rest = Math.max(0, planned - transportPerDay.reduce((a, b) => a + b, 0));
  const byDay = trip.days.map((d, i) => ({
    date: d.date,
    index: i,
    planned: round(transportPerDay[i] + rest / D),
    spent: round(expenses.filter((e) => e.date === d.date).reduce((a, e) => a + e.amount, 0)),
  }));
  // Expenses logged before or after the trip dates count toward the first / last day.
  const start = trip.input.startDate;
  const end = tripEndDate(trip);
  expenses.forEach((e) => {
    if (e.date < start) byDay[0].spent += e.amount;
    else if (e.date > end) byDay[D - 1].spent += e.amount;
  });

  const balances = computeBalances(trip);
  const phase = tripPhase(trip, today);
  const daysLeft = phase.kind === 'upcoming' ? D : phase.kind === 'live' ? D - phase.dayIndex : 0;
  const elapsed = phase.kind === 'live' ? phase.dayIndex + 1 : phase.kind === 'completed' ? D : 0;
  const forecast = elapsed > 0 && phase.kind === 'live' ? round((spent / elapsed) * D) : Math.max(spent, phase.kind === 'completed' ? spent : planned);
  const remaining = cap - spent;

  return {
    spent,
    cap,
    planned,
    remaining,
    pctOfCap: cap ? spent / cap : 0,
    perPersonSpent: round(spent / n),
    byCategory,
    byDay,
    balances,
    settlements: settle(balances),
    forecast,
    dailyAllowance: daysLeft > 0 ? round(Math.max(0, remaining) / daysLeft) : 0,
    daysLeft,
    phase,
    overCategories,
  };
}

export function computeBalances(trip: Trip): Balance[] {
  const map = new Map<string, Balance>(trip.travelers.map((t) => [t.id, { travelerId: t.id, paid: 0, share: 0, net: 0 }]));
  (trip.expenses ?? []).forEach((e) => {
    const payer = map.get(e.paidBy);
    if (payer) payer.paid += e.amount;
    const sharers = e.splitWith.filter((id) => map.has(id));
    const each = sharers.length ? e.amount / sharers.length : 0;
    sharers.forEach((id) => (map.get(id)!.share += each));
  });
  return [...map.values()].map((b) => ({ ...b, paid: round(b.paid), share: round(b.share), net: round(b.paid - b.share) }));
}

/** Fewest transfers that settle all balances (greedy largest-first; optimal for typical group sizes). */
export function settle(balances: Balance[]): Settlement[] {
  const creditors = balances.filter((b) => b.net > 0.5).map((b) => ({ id: b.travelerId, amt: b.net })).sort((a, b) => b.amt - a.amt);
  const debtors = balances.filter((b) => b.net < -0.5).map((b) => ({ id: b.travelerId, amt: -b.net })).sort((a, b) => b.amt - a.amt);
  const out: Settlement[] = [];
  let i = 0;
  let j = 0;
  while (i < debtors.length && j < creditors.length) {
    const amt = Math.min(debtors[i].amt, creditors[j].amt);
    if (amt >= 1) out.push({ from: debtors[i].id, to: creditors[j].id, amount: Math.round(amt) });
    debtors[i].amt -= amt;
    creditors[j].amt -= amt;
    if (debtors[i].amt < 0.5) i++;
    if (creditors[j].amt < 0.5) j++;
  }
  return out;
}

export function expensesToCSV(trip: Trip, expenses: Expense[] = trip.expenses): string {
  const name = (id: string) => trip.travelers.find((t) => t.id === id)?.name ?? '';
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const rows = [['Date', 'Time', 'Title', 'Category', 'Amount (INR)', 'Paid by', 'Split with', 'Method', 'Note']];
  [...expenses]
    .sort((a, b) => (a.date + (a.time ?? '')).localeCompare(b.date + (b.time ?? '')))
    .forEach((e) =>
      rows.push([e.date, e.time ?? '', e.title, CATEGORY[e.category].label, String(e.amount), name(e.paidBy), e.splitWith.map(name).join('; '), e.method, e.note ?? '']),
    );
  return rows.map((r) => r.map(esc).join(',')).join('\n');
}

function round(n: number): number {
  return Math.round(n);
}
