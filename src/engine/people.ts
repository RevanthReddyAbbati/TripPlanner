import type { Trip, Traveler } from '../types';
import { uid } from '../lib/format';

export const PEOPLE_COLORS = ['#2557d6', '#0f9488', '#d9480f', '#c2255c', '#7048e8', '#1098ad', '#b08800', '#2b8a3e', '#9c36b5', '#e8590c'];

/** Keep the traveller list in step with the group size, never dropping someone who has expenses. */
export function syncTravelers(current: Traveler[] | undefined, count: number, firstName?: string, inUse: Set<string> = new Set()): Traveler[] {
  const list = [...(current ?? [])];
  while (list.length < count) {
    const i = list.length;
    list.push({ id: uid('p_'), name: i === 0 ? firstName || 'You' : `Traveller ${i + 1}`, color: PEOPLE_COLORS[i % PEOPLE_COLORS.length] });
  }
  while (list.length > count && !inUse.has(list[list.length - 1].id)) list.pop();
  return list;
}

export function travelersInUse(trip: Pick<Trip, 'expenses'>): Set<string> {
  const s = new Set<string>();
  (trip.expenses ?? []).forEach((e) => {
    s.add(e.paidBy);
    e.splitWith.forEach((id) => s.add(id));
  });
  return s;
}

/** Fill fields added after version 1 so older saved trips and share links keep working. */
export function normalizeTrip(t: Trip, firstName?: string): Trip {
  const expenses = t.expenses ?? [];
  const bookings = t.bookings ?? [];
  const travelers = syncTravelers(t.travelers, t.input.travelers, firstName, travelersInUse({ expenses }));
  return { ...t, expenses, bookings, travelers, version: 2 };
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : '')).toUpperCase();
}
