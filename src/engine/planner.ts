// Rule-based trip planner (phase 1). Deterministic: the same input always yields the same plan.
// Gemini (services/ai) can propose places and edits; this engine still does all timing and costing.
import type { DayPlan, Destination, GeoPoint, Leg, Place, Stop, Trip, TripInput } from '../types';
import { centroid, haversineKm, roadKm, transferMinutes } from '../lib/geo';
import { addDays, fmtDuration, monthOf, toMin } from '../lib/time';
import { uid } from '../lib/format';
import {
  DAY_END, DAY_START, MODES, OVERNIGHT_DEPART, OVERNIGHT_MIN_HOURS, OVERNIGHT_RETURN_DEPART, PACE,
} from './rates';
import { estimateHop, estimateLeg, HOP_THRESHOLD_KM, modeLabel } from './transport';
import { buildChecklist } from './checklist';
import { syncTravelers, travelersInUse } from './people';

interface Window {
  dest: Destination;
  start: number;
  end: number;
}

const BUCKET: Record<Place['bestTime'], number> = { morning: 0, any: 1, afternoon: 2, sunset: 3, evening: 4 };

export function generateTrip(
  input: TripInput,
  existing?: Partial<Pick<Trip, 'id' | 'createdAt' | 'status' | 'notes' | 'checklist' | 'travelers' | 'expenses' | 'bookings'>>,
  firstName?: string,
): Trip {
  const warnings: string[] = [];
  const D = Math.max(1, Math.min(30, Math.round(input.days)));
  const n = Math.max(1, input.travelers);
  const dests = input.destinations.filter((d) => d.places.length || d.source === 'custom');
  const now = new Date().toISOString();

  const base: Trip = {
    id: existing?.id ?? uid('trip_'),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    status: existing?.status ?? 'planned',
    input: { ...input, days: D, travelers: n },
    legs: [],
    days: [],
    checklist: [],
    notes: existing?.notes ?? '',
    warnings,
    unscheduled: {},
    expenses: existing?.expenses ?? [],
    bookings: existing?.bookings ?? [],
    travelers: syncTravelers(existing?.travelers, n, firstName, travelersInUse({ expenses: existing?.expenses ?? [] })),
    version: 2,
  };

  if (!dests.length) {
    warnings.push('Add at least one destination to build a plan.');
    base.days = emptyDays(input.startDate, D);
    return base;
  }

  // ---- 1. Outbound and return legs -------------------------------------------------------
  const first = dests[0];
  const last = dests[dests.length - 1];
  const out = estimateLeg(input.origin, first, input.transport, n);
  const outInfo = MODES[input.transport];
  const outOvernight =
    input.overnightTravel && outInfo.overnightCapable && D >= 2 && out.durationMin >= OVERNIGHT_MIN_HOURS * 60;
  let outDepart: number;
  if (outOvernight) outDepart = out.durationMin > 16 * 60 ? 12 * 60 : OVERNIGHT_DEPART;
  else outDepart = input.transport === 'flight' ? 6 * 60 + 30 : 6 * 60;
  const outArrive = outDepart + out.durationMin;

  const ret = estimateLeg(last, input.origin, input.returnTransport, n);
  const retInfo = MODES[input.returnTransport];
  const retOvernight =
    input.overnightTravel && retInfo.overnightCapable && D >= 2 && ret.durationMin >= OVERNIGHT_MIN_HOURS * 60;
  let retDepart: number;
  if (retOvernight) {
    retDepart = (D - 2) * 1440 + OVERNIGHT_RETURN_DEPART;
    const latestArrival = (D - 1) * 1440 + 23 * 60;
    if (retDepart + ret.durationMin > latestArrival) retDepart = latestArrival - ret.durationMin;
  } else {
    retDepart = (D - 1) * 1440 + 21 * 60 + 30 - ret.durationMin;
  }

  // ---- 2. Hops between destinations ------------------------------------------------------
  const hops = dests.slice(0, -1).map((d, i) => {
    const next = dests[i + 1];
    const km = roadKm(d, next);
    const useLocal = km < HOP_THRESHOLD_KM;
    const est = useLocal ? estimateHop(d, next, input.localTransport, n) : estimateLeg(d, next, input.transport, n);
    return { from: d, to: next, est, mode: useLocal ? input.localTransport : input.transport };
  });
  const hopTotal = hops.reduce((s, h) => s + h.est.durationMin, 0);

  const minNeeded = outArrive + hopTotal + dests.length * 180;
  if (retDepart < minNeeded) {
    warnings.push(
      `${D} days is tight for this route. Travel alone takes about ${fmtDuration(out.durationMin + ret.durationMin + hopTotal)}. Add a day or drop a destination.`,
    );
    retDepart = Math.max(retDepart, minNeeded);
  }
  if (out.durationMin > 14 * 60 || ret.durationMin > 14 * 60) {
    warnings.push('One of the long journeys is over 14 hours. A flight or a 3-tier AC train would be more comfortable.');
  }
  if (outInfo.maxDayKm && out.distanceKm > outInfo.maxDayKm) {
    warnings.push(`Driving ${out.distanceKm} km in one go is a lot. Plan a halt on the way.`);
  }

  // ---- 3. Split the time on the ground between destinations ------------------------------
  const weights = dests.map((d) => destWeight(d, input));
  let remainingWeight = weights.reduce((a, b) => a + b, 0);
  let cursor = outArrive;
  const windows: Window[] = [];
  const legs: Leg[] = [];

  legs.push(makeLeg(input.origin.name, input.origin, first.name, first, input.transport, out, outOvernight, outDepart));

  dests.forEach((dest, i) => {
    const isLast = i === dests.length - 1;
    let end: number;
    if (isLast) {
      end = retDepart;
    } else {
      const remainingHops = hops.slice(i).reduce((s, h) => s + h.est.durationMin, 0);
      const available = retDepart - cursor - remainingHops;
      const share = (available * weights[i]) / Math.max(1, remainingWeight);
      end = snapDeparture(cursor + share, hops[i].est.durationMin);
      const latest = retDepart - remainingHops - (dests.length - i - 1) * 180;
      end = Math.max(cursor + 180, Math.min(end, latest));
    }
    windows.push({ dest, start: cursor, end });
    remainingWeight -= weights[i];
    if (!isLast) {
      const h = hops[i];
      legs.push(makeLeg(h.from.name, h.from, h.to.name, h.to, h.mode, h.est, false, end));
      cursor = end + h.est.durationMin;
    }
  });

  legs.push(makeLeg(last.name, last, input.origin.name, input.origin, input.returnTransport, ret, retOvernight, retDepart));
  const retArrive = retDepart + ret.durationMin;

  // ---- 4. Lay out stops day by day -------------------------------------------------------
  const dayStops: Stop[][] = Array.from({ length: D }, () => []);
  const push = (abs: number, durationMin: number, s: Omit<Stop, 'id' | 'start' | 'end'>) => {
    const day = clampDay(Math.floor(abs / 1440), D);
    const start = abs - day * 1440;
    dayStops[day].push({ id: uid('s_'), start, end: start + durationMin, ...s });
  };

  // Outbound travel
  if (outDepart % 1440 >= 10 * 60) {
    push(outDepart - 60, 60, { kind: 'rest', title: 'Pack up and reach the boarding point', cost: 0, fixed: true });
  }
  push(outDepart, out.durationMin, {
    kind: 'travel',
    title: `${modeLabel(input.transport)} to ${first.name}`,
    note: `${out.distanceKm} km, about ${fmtDuration(out.durationMin)}. Book via ${outInfo.bookingHint}.`,
    cost: legs[0].cost,
    fixed: true,
    mode: input.transport,
    lat: input.origin.lat,
    lon: input.origin.lon,
  });

  const used = new Set<string>();
  windows.forEach((w, i) => {
    const staysNight = spansNight(w.start, w.end);
    const arriveLabel = (w.start % 1440) < 7 * 60 ? 'freshen up and drop bags' : 'check in';
    push(w.start, 45, {
      kind: 'checkin',
      title: `Arrive in ${w.dest.name}, ${staysNight ? arriveLabel : 'get your bearings'}`,
      cost: 0,
      fixed: true,
      lat: w.dest.lat,
      lon: w.dest.lon,
      destinationId: w.dest.id,
    });

    const leaveBuffer = staysNight ? 45 : 15;
    const sightStart = w.start + 45;
    const sightEnd = w.end - leaveBuffer;
    const firstDay = Math.floor(sightStart / 1440);
    const lastDay = Math.floor(sightEnd / 1440);
    let lastPoint: GeoPoint = w.dest;

    for (let d = firstDay; d <= lastDay && d < D; d++) {
      const dayBase = d * 1440;
      const startOfDay = dayBase + (input.pace === 'relaxed' ? DAY_START + 60 : DAY_START);
      const segStart = Math.max(sightStart, startOfDay);
      const segEnd = Math.min(sightEnd, dayBase + DAY_END);
      if (segEnd - segStart < 60) continue;
      const nightHere = d < lastDay || (w.end % 1440) > 22 * 60 || w.end - dayBase > 1440;
      const res = fillSegment(w.dest, segStart, segEnd, dayBase, input, used, lastPoint, nightHere);
      res.stops.forEach((s) => push(s.abs, s.dur, s.stop));
      if (res.last) lastPoint = res.last;
    }

    if (staysNight) {
      push(w.end - 45, 45, {
        kind: 'checkout',
        title: `Check out and head to the ${i === windows.length - 1 ? 'boarding point' : 'next stop'}`,
        cost: 0,
        fixed: true,
        destinationId: w.dest.id,
        lat: w.dest.lat,
        lon: w.dest.lon,
      });
    }

    const leg = legs[i + 1];
    push(leg.departAbs, leg.durationMin, {
      kind: 'travel',
      title: `${modeLabel(leg.mode)} to ${leg.to.name}`,
      note:
        `${leg.distanceKm} km, about ${fmtDuration(leg.durationMin)}.` +
        (leg.mode in MODES ? ` Book via ${MODES[leg.mode as keyof typeof MODES].bookingHint}.` : ''),
      cost: leg.cost,
      fixed: true,
      mode: leg.mode,
      lat: leg.from.lat,
      lon: leg.from.lon,
    });
  });

  push(retArrive, 30, {
    kind: 'checkin',
    title: `Arrive home in ${input.origin.name}`,
    cost: 0,
    fixed: true,
    lat: input.origin.lat,
    lon: input.origin.lon,
  });

  // ---- 5. Assemble days ------------------------------------------------------------------
  const days: DayPlan[] = dayStops.map((stops, d) => {
    stops.sort((a, b) => a.start - b.start || rankKind(a) - rankKind(b));
    const probe = (d + 1) * 1440 + 120;
    let night: DayPlan['night'] = { type: 'home' };
    if (d < D - 1) {
      const inLeg = legs.find((l) => probe >= l.departAbs && probe <= l.departAbs + l.durationMin);
      const inWin = windows.find((w) => probe >= w.start && probe <= w.end);
      if (inLeg) night = { type: 'transit' };
      else if (inWin) night = { type: 'stay', destinationId: inWin.dest.id };
    }
    const baseId = dominantDest(stops);
    return {
      index: d,
      date: addDays(input.startDate, d),
      title: dayTitle(stops, d, D, input, dests),
      baseId,
      stops,
      night,
    };
  });

  // Empty-day warning (e.g. destination with no places)
  windows.forEach((w) => {
    const visits = days.flatMap((d) => d.stops).filter((s) => s.kind === 'visit' && s.destinationId === w.dest.id);
    if (!visits.length && w.end - w.start > 300) {
      warnings.push(`No places are scheduled in ${w.dest.name}. Add places to it from the itinerary or the map.`);
    }
  });

  dests.forEach((d) => {
    if (d.bestMonths.length && !d.bestMonths.includes(monthOf(input.startDate))) {
      warnings.push(`${d.name} is outside its best season in this month. Check weather before booking.`);
    }
  });

  const unscheduled: Record<string, string[]> = {};
  dests.forEach((d) => {
    unscheduled[d.id] = d.places.filter((p) => !used.has(p.id)).map((p) => p.id);
  });

  const trip: Trip = { ...base, legs, days, unscheduled, input: { ...input, days: D, travelers: n, destinations: dests } };
  trip.checklist = mergeChecklist(existing?.checklist, buildChecklist(trip));
  return trip;
}

// ---------------------------------------------------------------------------------------------

function destWeight(d: Destination, input: TripInput): number {
  if (!d.places.length) return 3;
  const scores = d.places.map((p) => scorePlace(p, input)).sort((a, b) => b - a).slice(0, 10);
  return scores.reduce((a, b) => a + b, 0);
}

export function scorePlace(p: Place, input: TripInput): number {
  const interest = input.interests.includes(p.category) ? 3 : 0;
  return p.priority * 2 + interest;
}

function makeLeg(
  fromName: string, from: GeoPoint, toName: string, to: GeoPoint,
  mode: Leg['mode'], est: { distanceKm: number; durationMin: number; cost: number }, overnight: boolean, departAbs: number,
): Leg {
  return {
    id: uid('leg_'),
    from: { name: fromName, lat: from.lat, lon: from.lon },
    to: { name: toName, lat: to.lat, lon: to.lon },
    mode,
    distanceKm: est.distanceKm,
    durationMin: est.durationMin,
    cost: est.cost,
    overnight,
    departAbs,
  };
}

/** Move a departure to a sensible hour: not before 7 AM, and arriving by 10 PM. */
function snapDeparture(t: number, dur: number): number {
  const day = Math.floor(t / 1440);
  const tod = t - day * 1440;
  const sameDayLatest = day * 1440 + Math.max(8 * 60, 22 * 60 - dur);
  const nextMorning = (day + 1) * 1440 + 8 * 60;
  if (tod < 7 * 60) return day * 1440 + 8 * 60;
  if (tod + dur <= 22 * 60) return t;
  return Math.abs(sameDayLatest - t) <= Math.abs(nextMorning - t) && sameDayLatest >= day * 1440 + 8 * 60 ? sameDayLatest : nextMorning;
}

function spansNight(start: number, end: number): boolean {
  for (let k = Math.floor(start / 1440); k <= Math.floor(end / 1440); k++) {
    const probe = (k + 1) * 1440 + 120;
    if (probe > start && probe < end) return true;
  }
  return false;
}

interface Planned {
  abs: number;
  dur: number;
  stop: Omit<Stop, 'id' | 'start' | 'end'>;
}

function fillSegment(
  dest: Destination, segStart: number, segEnd: number, dayBase: number, input: TripInput,
  used: Set<string>, from: GeoPoint, nightHere: boolean,
): { stops: Planned[]; last?: GeoPoint } {
  const pace = PACE[input.pace];
  const budget = Math.min(segEnd - segStart, pace.visitMinutes);
  const startTod = segStart - dayBase;
  const endTod = segEnd - dayBase;

  // Pick places: best score first, penalising distance from what's already chosen so each day stays in one area.
  const pool = dest.places.filter((p) => !used.has(p.id) && fitsHours(p, startTod, endTod));
  const chosen: Place[] = [];
  let total = 0;
  while (chosen.length < pace.maxStops && pool.length) {
    const anchor = chosen.length ? centroid(chosen) : from;
    let bestIdx = -1;
    let best = -Infinity;
    pool.forEach((p, idx) => {
      const km = haversineKm(anchor, p);
      const s = scorePlace(p, input) - km / 6;
      if (total + p.durationMin + 25 <= budget && s > best) {
        best = s;
        bestIdx = idx;
      }
    });
    if (bestIdx < 0) break;
    const [p] = pool.splice(bestIdx, 1);
    chosen.push(p);
    total += p.durationMin + 25;
  }

  // Only one place per day can own the sunset slot and one the evening slot; any other
  // sunset-friendly place (most beaches) is simply visited in the afternoon.
  const slot = new Map<string, Place['bestTime']>();
  let sunsetTaken = false;
  let eveningTaken = false;
  [...chosen]
    .sort((a, b) => scorePlace(b, input) - scorePlace(a, input))
    .forEach((p) => {
      let bt = p.bestTime;
      if (bt === 'sunset') {
        if (sunsetTaken) bt = 'afternoon';
        sunsetTaken = true;
      } else if (bt === 'evening') {
        if (eveningTaken) bt = 'afternoon';
        eveningTaken = true;
      }
      slot.set(p.id, bt);
    });
  const bucketOf = (p: Place) => BUCKET[slot.get(p.id) ?? p.bestTime];

  // Order: morning spots first, sunset and evening last; nearest-neighbour inside each bucket.
  const ordered: Place[] = [];
  let cur: GeoPoint = from;
  const remaining = [...chosen];
  while (remaining.length) {
    const minBucket = Math.min(...remaining.map(bucketOf));
    const bucket = remaining.filter((p) => bucketOf(p) === minBucket);
    bucket.sort((a, b) => haversineKm(cur, a) - haversineKm(cur, b));
    const next = bucket[0];
    ordered.push(next);
    remaining.splice(remaining.indexOf(next), 1);
    cur = next;
  }

  const out: Planned[] = [];
  let t = segStart;
  let prev: GeoPoint = from;
  let lunchDone = startTod >= 14 * 60 || endTod <= 13 * 60;
  let last: GeoPoint | undefined;

  for (const p of ordered) {
    t += out.length ? transferMinutes(prev, p) : Math.min(45, transferMinutes(prev, p));
    if (!lunchDone && t - dayBase >= 12 * 60 + 45 && t + 60 <= segEnd) {
      out.push(meal(t, 'Lunch', dest));
      t += 60;
      lunchDone = true;
    }
    if (p.open && t - dayBase < toMin(p.open)) t = dayBase + toMin(p.open);
    const s = slot.get(p.id);
    if (s === 'sunset' || s === 'evening') {
      // Sunset in India is roughly 6:00–6:45 PM; arrive so the visit ends around then.
      const ideal = s === 'sunset' ? dayBase + 18 * 60 + 15 - p.durationMin : dayBase + 18 * 60 + 30;
      if (ideal > t && ideal + p.durationMin <= segEnd) {
        if (!lunchDone && ideal > dayBase + 13 * 60) {
          const at = Math.max(t, dayBase + 13 * 60);
          out.push(meal(at, 'Lunch', dest));
          t = at + 60;
          lunchDone = true;
        }
        if (ideal - t >= 90) out.push(rest(t, ideal - t, dest));
        t = Math.max(t, ideal);
      }
    }
    if (p.close && t - dayBase + p.durationMin > toMin(p.close)) continue;
    if (t + p.durationMin > segEnd) continue;
    out.push({
      abs: t,
      dur: p.durationMin,
      stop: {
        kind: 'visit',
        title: p.name,
        note: p.note,
        cost: p.cost,
        placeId: p.id,
        destinationId: dest.id,
        lat: p.lat,
        lon: p.lon,
        optional: p.priority <= 2,
      },
    });
    used.add(p.id);
    t += p.durationMin;
    prev = p;
    last = p;
  }

  if (!lunchDone && out.length && segEnd - dayBase >= 14 * 60) {
    const at = Math.max(t, dayBase + 13 * 60);
    if (at + 60 <= segEnd) {
      out.push(meal(at, 'Lunch', dest));
      t = at + 60;
    }
  }
  if (nightHere && endTod >= 20 * 60) {
    const dinnerAt = Math.max(t + 15, dayBase + 19 * 60 + 45);
    if (dinnerAt <= dayBase + 22 * 60) out.push(meal(dinnerAt, 'Dinner', dest, 75));
  }
  return { stops: out, last };
}

function fitsHours(p: Place, startTod: number, endTod: number): boolean {
  if (p.close && toMin(p.close) - p.durationMin < startTod) return false;
  if (p.open && toMin(p.open) + p.durationMin > endTod) return false;
  return p.durationMin <= endTod - startTod;
}

function meal(abs: number, title: string, dest: Destination, dur = 60): Planned {
  return {
    abs,
    dur,
    stop: { kind: 'meal', title: `${title} in ${dest.name}`, cost: 0, destinationId: dest.id, note: 'Food costs are counted in the daily food budget.' },
  };
}

function rest(abs: number, dur: number, dest: Destination): Planned {
  return { abs, dur, stop: { kind: 'rest', title: 'Free time: rest or explore nearby', cost: 0, destinationId: dest.id } };
}

function rankKind(s: Stop): number {
  return ({ checkout: 0, travel: 1, checkin: 2, rest: 3, visit: 4, meal: 5, custom: 6 } as Record<string, number>)[s.kind] ?? 9;
}

function clampDay(d: number, D: number): number {
  return Math.max(0, Math.min(D - 1, d));
}

function dominantDest(stops: Stop[]): string | undefined {
  const count: Record<string, number> = {};
  stops.forEach((s) => {
    if (s.destinationId && (s.kind === 'visit' || s.kind === 'checkin')) count[s.destinationId] = (count[s.destinationId] || 0) + (s.end - s.start);
  });
  return Object.entries(count).sort((a, b) => b[1] - a[1])[0]?.[0];
}

function dayTitle(stops: Stop[], d: number, D: number, input: TripInput, dests: Destination[]): string {
  const visits = stops.filter((s) => s.kind === 'visit');
  if (visits.length) {
    const destIds = [...new Set(visits.map((v) => v.destinationId))];
    if (destIds.length > 1) {
      const names = destIds.map((id) => dests.find((x) => x.id === id)?.name).filter(Boolean);
      return `${names.join(' to ')}`;
    }
    const dest = dests.find((x) => x.id === destIds[0]);
    const names = [...visits]
      .sort((a, b) => (a.optional ? 1 : 0) - (b.optional ? 1 : 0))
      .slice(0, 2)
      .map((v) => v.title.replace(/\s*\(.*\)$/, ''));
    return `${dest ? dest.name + ': ' : ''}${names.join(' and ')}`;
  }
  const travel = stops.find((s) => s.kind === 'travel');
  if (d === 0 && travel) return `Leave ${input.origin.name}`;
  if (d === D - 1) return `Back in ${input.origin.name}`;
  if (travel) return travel.title;
  return 'Free day';
}

function emptyDays(start: string, D: number): DayPlan[] {
  return Array.from({ length: D }, (_, i) => ({ index: i, date: addDays(start, i), title: 'Free day', stops: [], night: { type: 'home' } }));
}

function mergeChecklist(prev: Trip['checklist'] | undefined, next: Trip['checklist']): Trip['checklist'] {
  if (!prev?.length) return next;
  const done = new Map(prev.map((c) => [c.label, c.done]));
  const custom = prev.filter((c) => c.category === 'custom');
  return [...next.map((c) => ({ ...c, done: done.get(c.label) ?? false })), ...custom];
}
