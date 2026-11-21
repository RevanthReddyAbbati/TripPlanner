// "Better dates": when a train journey has no direct train on the planned day, find a nearby
// start date on which every train journey of the trip has a verified train running.
import type { JourneyPlan, ServiceOption } from './journey';
import type { Weekday } from '../data/transport/types';
import { addDays, toISODate } from '../lib/time';

const WD: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function runs(o: Pick<ServiceOption, 'runsOn'>, iso: string): boolean {
  if (!o.runsOn) return false;
  if (o.runsOn === 'daily') return true;
  return o.runsOn.includes(WD[new Date(iso + 'T00:00:00').getDay()]);
}

export interface DateSuggestion {
  /** New trip start date. */
  startDate: string;
  /** Days relative to the current start (negative = earlier). */
  offset: number;
  /** Train journeys with a direct train on their (shifted) day. */
  covered: number;
  total: number;
  /** Per journey: the train that runs, if any. */
  matches: { legId: string; title: string; train?: { number?: string; name: string } }[];
}

export interface DateAdvice {
  /** Train journeys that have verified trains on file. */
  total: number;
  /** How many of them have a train on the planned day. */
  coveredNow: number;
  best: DateSuggestion | null;
}

/**
 * Look up to `range` days either side (never before tomorrow) for the start date that gives
 * the most train journeys a running train, preferring the smallest shift.
 */
export function suggestBetterDates(startDate: string, journeys: JourneyPlan[], range = 4, today = toISODate(new Date())): DateAdvice {
  const trainJourneys = journeys.filter((j) => j.kind === 'train' && j.options.some((o) => o.kind === 'train' && o.runsOn));
  const total = trainJourneys.length;
  const evaluate = (offset: number): DateSuggestion => {
    const matches = trainJourneys.map((j) => {
      const day = addDays(j.date, offset);
      // Same rule as the planner: the train must run that day AND have the class the group chose.
      const cls = j.mode === 'train_sl' ? 'SL' : j.mode === 'train_3a' ? '3A' : undefined;
      const t = j.options.find((o) => o.kind === 'train' && runs(o, day) && (!cls || !o.classes || o.classes.includes(cls)));
      return { legId: j.legId, title: j.title, train: t ? { number: t.number, name: t.name } : undefined };
    });
    return { startDate: addDays(startDate, offset), offset, covered: matches.filter((m) => m.train).length, total, matches };
  };
  const now = evaluate(0);
  if (!total || now.covered === total) return { total, coveredNow: now.covered, best: null };
  const tomorrow = addDays(today, 1);
  let best: DateSuggestion | null = null;
  for (let k = 1; k <= range; k++) {
    for (const off of [-k, k]) {
      const s = evaluate(off);
      if (s.startDate < tomorrow) continue;
      if (s.covered > (best?.covered ?? now.covered)) best = s;
    }
  }
  return { total, coveredNow: now.covered, best };
}
