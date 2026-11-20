import type { Budget, BudgetLine, FoodTier, LocalTransport, StayTier, TransportMode, Trip, TripInput } from '../types';
import { CONTINGENCY, FOOD, LOCAL, MODES, STAYS } from './rates';
import { estimateLeg, modeLabel, roundTo } from './transport';
import { inr } from '../lib/format';

/** Budget for a trip, computed from its current days and legs so manual edits are reflected. */
export function computeBudget(trip: Trip): Budget {
  const { input, legs, days } = trip;
  const n = input.travelers;
  const lines: BudgetLine[] = [];
  const dest = (id?: string) => input.destinations.find((d) => d.id === id);

  // Transport legs
  legs.forEach((l) => {
    lines.push({
      key: l.id,
      label: `${l.from.name} → ${l.to.name}`,
      detail: `${modeLabel(l.mode)}, ${l.distanceKm} km`,
      perPerson: l.cost,
      group: 'transport',
    });
  });

  // Stays
  const nights: Record<string, number> = {};
  days.forEach((d) => {
    if (d.night.type === 'stay') nights[d.night.destinationId] = (nights[d.night.destinationId] || 0) + 1;
  });
  const stay = STAYS[input.stay];
  Object.entries(nights).forEach(([id, count]) => {
    const d = dest(id);
    const idx = d?.costIndex ?? 1;
    const rooms = Math.ceil(n / stay.capacity);
    const perNight = (rooms * stay.rate * idx) / n;
    lines.push({
      key: 'stay_' + id,
      label: `Stay in ${d?.name ?? 'destination'}`,
      detail: `${count} night${count > 1 ? 's' : ''}, ${stay.label.toLowerCase()}${stay.capacity > 1 ? `, ${rooms} room${rooms > 1 ? 's' : ''}` : ''}`,
      perPerson: roundTo(perNight * count, 10),
      group: 'stay',
    });
  });

  // Food: full rate on days with time on the ground; travel-only days need about one meal.
  // Food prices vary less between places than rooms do, so the destination index counts half.
  const food = FOOD[input.food];
  let foodTotal = 0;
  days.forEach((d) => {
    const idx = dest(d.baseId)?.costIndex ?? 1;
    const hasGround = d.stops.some((s) => s.kind === 'visit' || s.kind === 'meal' || s.kind === 'custom');
    foodTotal += food.perDay * (1 + (idx - 1) * 0.5) * (hasGround ? 1 : 0.35);
  });
  lines.push({
    key: 'food',
    label: 'Food',
    detail: `${food.label}, about ${inr(food.perDay)} a day`,
    perPerson: roundTo(foodTotal, 10),
    group: 'food',
  });

  // Local transport on sightseeing days
  const local = LOCAL[input.localTransport];
  const groundDays = days.filter((d) => d.stops.some((s) => s.kind === 'visit' || s.kind === 'custom'));
  if (groundDays.length) {
    const vehicles = Math.ceil(n / local.seats);
    const perDay = input.localTransport === 'public' ? local.perDay : (vehicles * local.perDay) / n;
    lines.push({
      key: 'local',
      label: 'Getting around',
      detail: `${local.label}, ${groundDays.length} day${groundDays.length > 1 ? 's' : ''}`,
      perPerson: roundTo(perDay * groundDays.length, 10),
      group: 'local',
    });
  }

  // Entries and activities
  const visits = days.flatMap((d) => d.stops).filter((s) => (s.kind === 'visit' || s.kind === 'custom') && s.cost > 0);
  const required = visits.filter((s) => !s.optional).reduce((a, s) => a + s.cost, 0);
  const optional = visits.filter((s) => s.optional).reduce((a, s) => a + s.cost, 0);
  lines.push({
    key: 'activities',
    label: 'Entries and activities',
    detail: optional ? `Optional extras add ${inr(optional)} if you do them all` : `${visits.length} paid stops`,
    perPerson: required,
    group: 'activities',
  });

  const subtotal = lines.reduce((a, l) => a + l.perPerson, 0);
  lines.push({
    key: 'buffer',
    label: 'Contingency',
    detail: `${Math.round(CONTINGENCY * 100)}% for tips, water, small extras`,
    perPerson: roundTo(subtotal * CONTINGENCY, 10),
    group: 'buffer',
  });

  const perPerson = lines.reduce((a, l) => a + l.perPerson, 0);
  return {
    lines,
    perPerson,
    total: perPerson * n,
    cap: input.budgetPerPerson,
    overBy: Math.max(0, perPerson - input.budgetPerPerson),
  };
}

export interface Saving {
  id: string;
  label: string;
  detail: string;
  saving: number;
  patch: Partial<TripInput>;
  /** True when applying it needs the itinerary rebuilt (journey times change). */
  rebuild: boolean;
}

/** Cheaper alternatives, with how much each saves per person. Only returns options that actually save money. */
export function suggestSavings(trip: Trip): Saving[] {
  const { input } = trip;
  const now = computeBudget(trip).perPerson;
  const out: Saving[] = [];
  const tryPatch = (id: string, label: string, detail: string, patch: Partial<TripInput>, rebuild: boolean) => {
    const variant: Trip = { ...trip, input: { ...input, ...patch } };
    if (patch.transport || patch.returnTransport) {
      variant.legs = trip.legs.map((l, i) => {
        const isOut = i === 0;
        const isRet = i === trip.legs.length - 1;
        const mode = isOut ? patch.transport : isRet ? patch.returnTransport : undefined;
        if (!mode || !(l.mode in MODES)) return l;
        return { ...l, mode, cost: estimateLeg(l.from, l.to, mode, input.travelers).cost };
      });
    }
    const saving = now - computeBudget(variant).perPerson;
    if (saving >= 100) out.push({ id, label, detail, saving, patch, rebuild });
  };

  const cheaperModes: TransportMode[] = ['train_sl', 'bus_nonac', 'bus_ac', 'train_3a'];
  cheaperModes.forEach((m) => {
    if (m !== input.transport || m !== input.returnTransport) {
      tryPatch(`mode_${m}`, `Travel by ${MODES[m].label.toLowerCase()}`, 'Both the outbound and return journeys', { transport: m, returnTransport: m }, true);
    }
  });
  const stays: StayTier[] = ['hostel', 'budget', 'comfort'];
  stays.forEach((s) => {
    if (s !== input.stay) tryPatch(`stay_${s}`, `Stay in ${STAYS[s].label.toLowerCase()}`, 'Same nights, cheaper rooms', { stay: s }, false);
  });
  const foods: FoodTier[] = ['street', 'mixed'];
  foods.forEach((f) => {
    if (f !== input.food) tryPatch(`food_${f}`, `Eat at ${FOOD[f].label.toLowerCase()}`, 'Daily food budget', { food: f }, false);
  });
  const locals: LocalTransport[] = ['scooter', 'public'];
  locals.forEach((l) => {
    if (l !== input.localTransport) tryPatch(`local_${l}`, `Get around by ${LOCAL[l].label.toLowerCase()}`, 'Local transport', { localTransport: l }, false);
  });

  // Keep the best option per kind, sorted by saving.
  const best = new Map<string, Saving>();
  out.forEach((s) => {
    const kind = s.id.split('_')[0];
    if (!best.has(kind) || best.get(kind)!.saving < s.saving) best.set(kind, s);
  });
  return [...best.values()].sort((a, b) => b.saving - a.saving);
}
