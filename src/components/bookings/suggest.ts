import type { Booking, BookingType, ExpenseCategory, Trip } from '../../types';
import { computeBudget } from '../../engine/budget';
import { MODES } from '../../engine/rates';
import { modeLabel } from '../../engine/transport';
import { fmtTime } from '../../lib/time';

export interface BookingSuggestion {
  key: string;
  type: BookingType;
  title: string;
  detail: string;
  estimate: number;
  draft: Omit<Booking, 'id'>;
}

export const BOOKING_CATEGORY: Record<BookingType, ExpenseCategory> = {
  transport: 'transport',
  stay: 'stay',
  activity: 'activities',
  other: 'other',
};

/** Things in the plan that usually need booking and don't have a booking linked yet. */
export function bookingSuggestions(trip: Trip): BookingSuggestion[] {
  const out: BookingSuggestion[] = [];
  const n = trip.input.travelers;
  const D = trip.days.length;
  const booked = trip.bookings.filter((b) => b.status !== 'cancelled');

  trip.legs.forEach((l) => {
    if (booked.some((b) => b.legId === l.id)) return;
    if (l.mode === 'car_self' || l.mode === 'bike') return;
    const dayIdx = Math.min(D - 1, Math.max(0, Math.floor(l.departAbs / 1440)));
    const date = trip.days[dayIdx]?.date ?? trip.input.startDate;
    const time = fmtTo24(l.departAbs - dayIdx * 1440);
    const label = modeLabel(l.mode);
    const estimate = Math.round(l.cost * n);
    const title = `${label}: ${l.from.name} to ${l.to.name}`;
    out.push({
      key: 'leg_' + l.id,
      type: 'transport',
      title,
      detail: `${date} · around ${fmtTime(l.departAbs - dayIdx * 1440, false)}${l.mode in MODES ? ` · ${MODES[l.mode as keyof typeof MODES].bookingHint}` : ''}`,
      estimate,
      draft: { type: 'transport', title, date, time, amount: estimate, status: 'pending', legId: l.id, provider: l.mode in MODES ? MODES[l.mode as keyof typeof MODES].bookingHint.split(',')[0] : undefined },
    });
  });

  const budget = computeBudget(trip);
  const stays = new Map<string, string[]>();
  trip.days.forEach((d) => {
    if (d.night.type === 'stay') stays.set(d.night.destinationId, [...(stays.get(d.night.destinationId) ?? []), d.date]);
  });
  stays.forEach((dates, destId) => {
    if (booked.some((b) => b.type === 'stay' && b.destinationId === destId)) return;
    const dest = trip.input.destinations.find((d) => d.id === destId);
    if (!dest) return;
    const line = budget.lines.find((l) => l.key === `stay_${destId}`);
    const estimate = Math.round((line?.perPerson ?? 0) * n);
    const checkIn = dates[0];
    const checkOut = nextDate(dates[dates.length - 1]);
    const title = `Stay in ${dest.name}`;
    out.push({
      key: 'stay_' + destId,
      type: 'stay',
      title,
      detail: `${dates.length} night${dates.length > 1 ? 's' : ''} · ${checkIn} to ${checkOut}`,
      estimate,
      draft: { type: 'stay', title, date: checkIn, endDate: checkOut, amount: estimate, status: 'pending', destinationId: destId },
    });
  });
  return out;
}

function fmtTo24(min: number): string {
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

function nextDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
