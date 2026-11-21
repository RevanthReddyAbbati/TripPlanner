// "Nearby you could also explore": ranked extras near a trip's destinations.
// Three sources: curated excursions (data/nearby.ts), other catalog destinations within reach,
// and must-see catalog places of the trip's own destinations that did not fit the plan.
import type { DayPlan, Destination, Interest, Place, Trip, TripInput } from '../types';
import { DESTINATIONS } from '../data/destinations';
import { excursionsFor, type Excursion, type IdealVisit } from '../data/nearby';
import { haversineKm, roadKm } from '../lib/geo';
import { monthOf } from '../lib/time';
import { computeBudget } from './budget';
import { FOOD, LOCAL, STAYS } from './rates';

export type NearbyKind = 'day-trip' | 'add-destination' | 'unscheduled-place';

export type NearbyAction =
  /** Add a stop to a day. durationMin includes the round trip for excursions. */
  | { type: 'add-stop'; destinationId: string; place: Place; durationMin: number; suggestedDay?: number }
  /** Too far for a day: add a day in trip settings, then add it. */
  | { type: 'needs-night'; destinationId: string; place: Place; durationMin: number }
  /** Insert a catalog destination into the route and rebuild. */
  | { type: 'add-destination'; destinationId: string; afterDestinationId: string; extraDays: number };

export interface NearbySuggestion {
  id: string;
  kind: NearbyKind;
  title: string;
  /** Destination it is near (name). */
  near: string;
  nearDestinationId: string;
  distanceKm: number;
  /** One way, minutes. */
  travelMin: number;
  idealVisit: IdealVisit | 'stop';
  /** Estimated extra spend per person, INR. */
  extraCostPP: number;
  fitsBudget: boolean;
  /** true / false for the trip's month, null when there is no season data. */
  inSeason: boolean | null;
  bestFor: Interest[];
  why: string;
  howToGet?: string;
  score: number;
  action: NearbyAction;
}

export interface NearbyOptions {
  limit?: number;
  kinds?: NearbyKind[];
  /** Road km within which other catalog destinations are suggested. */
  maxDestinationKm?: number;
}

/** Visit time on top of travel, by excursion length. */
const VISIT_MIN: Record<IdealVisit, number> = { 'half-day': 150, 'day-trip': 240, overnight: 300 };

/** Suggestions for a planned trip, best first. */
export function nearbySuggestions(trip: Trip, opts: NearbyOptions = {}): NearbySuggestion[] {
  const budget = computeBudget(trip);
  const headroom = budget.cap - budget.perPerson;
  const planned = plannedNames(trip);
  const out = [
    ...excursionSuggestions(trip.input, planned, headroom),
    ...destinationSuggestions(trip.input, headroom, opts.maxDestinationKm),
    ...unscheduledSuggestions(trip, planned, headroom),
  ].map((s) => (s.action.type === 'add-stop' ? { ...s, action: { ...s.action, suggestedDay: bestDayFor(trip, s.nearDestinationId) } } : s));
  return finish(out, opts);
}

/** Lighter version for the new-trip wizard, where no plan exists yet. */
export function nearbyForInput(input: TripInput, opts: NearbyOptions = {}): NearbySuggestion[] {
  const headroom = Number.POSITIVE_INFINITY;
  const out = [...excursionSuggestions(input, new Set(), headroom), ...destinationSuggestions(input, headroom, opts.maxDestinationKm)];
  return finish(out, opts).map((s) => ({ ...s, fitsBudget: true }));
}

/**
 * The day spent at a destination with the most free time (fewest visit minutes), so an added
 * stop lands where there is room. Falls back to any day that sleeps there.
 */
export function bestDayFor(trip: Trip, destinationId: string): number | undefined {
  const candidates = trip.days.filter((d) => d.baseId === destinationId || (d.night.type === 'stay' && d.night.destinationId === destinationId));
  if (!candidates.length) return undefined;
  const busy = (d: DayPlan) => d.stops.filter((s) => s.kind === 'visit' || s.kind === 'custom').reduce((a, s) => a + (s.end - s.start), 0);
  return [...candidates].sort((a, b) => busy(a) - busy(b) || a.index - b.index)[0].index;
}

/** Turn an excursion into a Place the itinerary can hold. */
export function excursionPlace(e: Excursion): Place {
  return {
    id: `nearby-${e.id}`,
    name: e.name,
    lat: e.lat,
    lon: e.lon,
    category: e.bestFor[0] ?? 'nature',
    durationMin: VISIT_MIN[e.idealVisit],
    cost: e.entryCostINR,
    bestTime: e.idealVisit === 'half-day' ? 'any' : 'morning',
    priority: e.priority,
    note: `${e.howToGet} Allow about ${Math.round((e.travelMin * 2) / 60)} hours of travel there and back.`,
    source: 'catalog',
  };
}

// ---------------------------------------------------------------------------------------------

function excursionSuggestions(input: TripInput, planned: Set<string>, headroom: number): NearbySuggestion[] {
  const month = monthOf(input.startDate);
  const n = Math.max(1, input.travelers);
  return input.destinations.flatMap((dest) =>
    excursionsFor(dest.id)
      .filter((e) => !isPlanned(e.name, planned) && !dest.places.some((p) => sameName(p.name, e.name) || p.id === `nearby-${e.id}`))
      .map<NearbySuggestion>((e) => {
        const transport = groupAwareTransport(e, n, input.localTransport);
        const extra = Math.round(e.entryCostINR + transport);
        const place = excursionPlace(e);
        const durationMin = e.travelMin * 2 + VISIT_MIN[e.idealVisit];
        const inSeason = e.season ? e.season.includes(month) : null;
        return {
          id: `x-${e.id}`,
          kind: 'day-trip',
          title: e.name,
          near: dest.name,
          nearDestinationId: dest.id,
          distanceKm: e.distanceKm,
          travelMin: e.travelMin,
          idealVisit: e.idealVisit,
          extraCostPP: extra,
          fitsBudget: extra <= headroom,
          inSeason,
          bestFor: e.bestFor,
          why: e.why,
          howToGet: e.howToGet,
          score: score({ priority: e.priority, interests: input.interests, bestFor: e.bestFor, km: e.distanceKm, inSeason, fits: extra <= headroom, overnight: e.idealVisit === 'overnight' }),
          action: e.idealVisit === 'overnight'
            ? { type: 'needs-night', destinationId: dest.id, place, durationMin }
            : { type: 'add-stop', destinationId: dest.id, place, durationMin },
        };
      }),
  );
}

// ~340 road km keeps Hampi in reach of Goa and Gokarna (6–7 hours) without pulling in other states.
function destinationSuggestions(input: TripInput, headroom: number, maxKm = 340): NearbySuggestion[] {
  const inTrip = new Set(input.destinations.map((d) => d.id));
  const month = monthOf(input.startDate);
  const out: NearbySuggestion[] = [];
  DESTINATIONS.filter((c) => !inTrip.has(c.id)).forEach((cand) => {
    let best: { dest: Destination; km: number } | undefined;
    input.destinations.forEach((d) => {
      const km = roadKm(d, cand);
      if (km <= maxKm && (!best || km < best.km)) best = { dest: d, km };
    });
    if (!best) return;
    const extraDays = cand.places.length >= 10 ? 2 : 1;
    const travelMin = Math.round((best.km / 45) * 60);
    const extra = Math.round(extraDays * perDayCost(input, cand) + hopCost(best.km, input));
    const inSeason = cand.bestMonths.length ? cand.bestMonths.includes(month) : null;
    const top = [...cand.places].sort((a, b) => b.priority - a.priority).slice(0, 3).map((p) => p.name);
    out.push({
      id: `d-${cand.id}`,
      kind: 'add-destination',
      title: cand.name,
      near: best.dest.name,
      nearDestinationId: best.dest.id,
      distanceKm: best.km,
      travelMin,
      idealVisit: extraDays > 1 ? 'overnight' : 'day-trip',
      extraCostPP: extra,
      fitsBudget: extra <= headroom,
      inSeason,
      bestFor: cand.tags,
      why: `${cand.summary} Highlights: ${top.join(', ')}.`,
      score: score({ priority: 4, interests: input.interests, bestFor: cand.tags, km: best.km, inSeason, fits: extra <= headroom, overnight: true }) - 1,
      action: { type: 'add-destination', destinationId: cand.id, afterDestinationId: best.dest.id, extraDays },
    });
  });
  return out;
}

function unscheduledSuggestions(trip: Trip, planned: Set<string>, headroom: number): NearbySuggestion[] {
  const input = trip.input;
  return input.destinations.flatMap((dest) =>
    (trip.unscheduled[dest.id] ?? [])
      .map((pid) => dest.places.find((p) => p.id === pid))
      .filter((p): p is Place => !!p && p.priority >= 4 && !isPlanned(p.name, planned))
      .map<NearbySuggestion>((p) => {
        const km = Math.round(roadKm(dest, p));
        const travelMin = Math.max(10, Math.round((km / 28) * 60));
        return {
          id: `u-${p.id}`,
          kind: 'unscheduled-place',
          title: p.name,
          near: dest.name,
          nearDestinationId: dest.id,
          distanceKm: km,
          travelMin,
          idealVisit: 'stop',
          extraCostPP: p.cost,
          fitsBudget: p.cost <= headroom,
          inSeason: null,
          bestFor: [p.category],
          why: p.note ?? `A must-see in ${dest.name} that did not fit the plan.`,
          score: score({ priority: p.priority, interests: input.interests, bestFor: [p.category], km, inSeason: null, fits: p.cost <= headroom, overnight: false }) + 1,
          action: { type: 'add-stop', destinationId: dest.id, place: p, durationMin: p.durationMin },
        };
      }),
  );
}

function finish(list: NearbySuggestion[], opts: NearbyOptions): NearbySuggestion[] {
  const seen = new Set<string>();
  return list
    .filter((s) => !opts.kinds || opts.kinds.includes(s.kind))
    .sort((a, b) => b.score - a.score || a.distanceKm - b.distanceKm)
    .filter((s) => {
      const k = normalize(s.title);
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .slice(0, opts.limit ?? 50);
}

function score(p: { priority: number; interests: Interest[]; bestFor: Interest[]; km: number; inSeason: boolean | null; fits: boolean; overnight: boolean }): number {
  const match = p.bestFor.filter((b) => p.interests.includes(b)).length;
  return (
    p.priority * 2 +
    Math.min(2, match) * 2.5 -
    p.km / 40 +
    (p.inSeason === true ? 1.5 : p.inSeason === false ? -4 : 0) +
    (p.fits ? 1 : -3) -
    (p.overnight ? 1 : 0)
  );
}

/** Round-trip transport per person, using the group's chosen way of getting around. */
function groupAwareTransport(e: Excursion, travelers: number, mode: TripInput['localTransport']): number {
  const [bus, taxiForTwo] = e.transportCostINR;
  if (mode === 'public') return bus;
  // Taxi share scales with group size: one car seats four.
  const perVehicle = taxiForTwo * 2;
  const cars = Math.ceil(travelers / 4);
  return Math.round((perVehicle * cars) / travelers);
}

function perDayCost(input: TripInput, dest: Destination): number {
  const n = Math.max(1, input.travelers);
  const stay = STAYS[input.stay];
  const rooms = Math.ceil(n / stay.capacity);
  const local = LOCAL[input.localTransport];
  const localPP = input.localTransport === 'public' ? local.perDay : (Math.ceil(n / local.seats) * local.perDay) / n;
  return ((rooms * stay.rate) / n + FOOD[input.food].perDay + localPP) * dest.costIndex;
}

function hopCost(km: number, input: TripInput): number {
  // Bus-level fare for the extra hop, roughly ₹1.6/km per person.
  return input.localTransport === 'public' ? km * 1.2 : Math.max(150, km * 1.6);
}

function plannedNames(trip: Trip): Set<string> {
  const s = new Set<string>();
  trip.days.forEach((d) => d.stops.forEach((st) => s.add(normalize(st.title))));
  return s;
}

function isPlanned(name: string, planned: Set<string>): boolean {
  const n = normalize(name);
  for (const p of planned) if (p.length >= 5 && (p === n || p.includes(n) || n.includes(p))) return true;
  return false;
}

function sameName(a: string, b: string): boolean {
  const x = normalize(a);
  const y = normalize(b);
  return x === y || (x.length > 5 && y.includes(x)) || (y.length > 5 && x.includes(y));
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, '');
}

/** Straight-line km between two points (exported for UI distance labels of AI ideas). */
export function kmBetween(a: { lat: number; lon: number }, b: { lat: number; lon: number }): number {
  return Math.round(haversineKm(a, b));
}
