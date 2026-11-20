// Itinerary editing helpers. Each returns a new DayPlan; the store saves it.
import type { DayPlan, GeoPoint, Place, Stop } from '../types';
import { transferMinutes } from '../lib/geo';
import { toMin } from '../lib/time';
import { uid } from '../lib/format';

/** Recompute start/end for movable stops, keeping fixed stops (travel, check-in) where they are. */
export function retime(day: DayPlan): DayPlan {
  const stops = day.stops.map((s) => ({ ...s }));
  let prevEnd: number | null = null;
  let prevPoint: Stop | undefined;
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    const dur = s.end - s.start;
    if (s.fixed) {
      prevEnd = s.end;
      if (s.lat != null) prevPoint = s;
      continue;
    }
    if (prevEnd != null) {
      const gap = s.kind === 'meal' || s.kind === 'rest' || !prevPoint || s.lat == null ? 10 : transferMinutes(prevPoint as GeoPoint, s as GeoPoint);
      // Keep the planned time when there is room; only push later to avoid an overlap.
      const start = Math.max(s.start, prevEnd + gap);
      s.start = start;
      s.end = start + dur;
    }
    prevEnd = s.end;
    if (s.lat != null) prevPoint = s;
  }
  return { ...day, stops };
}

/** Stops whose times overlap the next one, or that run past closing time. */
export function conflicts(day: DayPlan, places: Map<string, Place>): Set<string> {
  const bad = new Set<string>();
  const sorted = day.stops;
  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (a.kind === 'travel' && a.end > 1440) continue;
    if (a.end > b.start + 5) bad.add(b.id);
  }
  sorted.forEach((s) => {
    const p = s.placeId ? places.get(s.placeId) : undefined;
    if (p?.close && s.end > toMin(p.close)) bad.add(s.id);
    if (p?.open && s.start < toMin(p.open)) bad.add(s.id);
  });
  return bad;
}

export function moveStop(day: DayPlan, stopId: string, dir: -1 | 1): DayPlan {
  const i = day.stops.findIndex((s) => s.id === stopId);
  const j = i + dir;
  if (i < 0 || j < 0 || j >= day.stops.length) return day;
  if (day.stops[i].fixed || day.stops[j].fixed) return day;
  const stops = [...day.stops];
  [stops[i], stops[j]] = [stops[j], stops[i]];
  // swap times so the earlier slot stays earlier, then retime
  const a = stops[i];
  const b = stops[j];
  const aDur = a.end - a.start;
  const bDur = b.end - b.start;
  const first = Math.min(a.start, b.start);
  if (i < j) {
    a.start = first; a.end = first + aDur; b.start = a.end; b.end = b.start + bDur;
  } else {
    b.start = first; b.end = first + bDur; a.start = b.end; a.end = a.start + aDur;
  }
  return retime({ ...day, stops });
}

export function removeStop(day: DayPlan, stopId: string): DayPlan {
  return retime({ ...day, stops: day.stops.filter((s) => s.id !== stopId) });
}

/**
 * Insert a stop where it fits best:
 * 1. into a free-time block long enough to hold it (nothing else moves), otherwise
 * 2. at the position that adds the least travel, before dinner and any departure; later stops shift.
 */
export function insertStop(day: DayPlan, stop: Omit<Stop, 'id' | 'start' | 'end'> & { durationMin: number }): DayPlan {
  const { durationMin, ...rest } = stop;
  const stops = day.stops.map((s) => ({ ...s }));

  // 1. Free time
  const gapIdx = stops.findIndex((s) => s.kind === 'rest' && !s.fixed && s.end - s.start >= durationMin + 20);
  if (gapIdx >= 0) {
    const gap = stops[gapIdx];
    const start = gap.start + 10;
    const s: Stop = { id: uid('s_'), start, end: start + durationMin, ...rest };
    gap.start = s.end + 10;
    if (gap.end - gap.start < 30) stops.splice(gapIdx, 1, s);
    else stops.splice(gapIdx, 0, s);
    return { ...day, stops };
  }

  // 2. Cheapest position in the daytime part of the day
  let limit = stops.length;
  for (let i = 0; i < stops.length; i++) {
    const s = stops[i];
    const isDinner = s.kind === 'meal' && s.start >= 19 * 60;
    const isLateFixed = s.fixed && i > 0 && (s.kind === 'travel' || s.kind === 'checkout');
    if (isDinner || isLateFixed) {
      limit = i;
      break;
    }
  }
  let at = limit;
  if (rest.lat != null && rest.lon != null) {
    const pt = rest as GeoPoint;
    let best = Infinity;
    const firstMovable = Math.max(0, stops.findIndex((s) => !s.fixed));
    for (let i = firstMovable; i <= limit; i++) {
      const a = [...stops.slice(0, i)].reverse().find((s) => s.lat != null) as GeoPoint | undefined;
      const b = stops.slice(i, limit).find((s) => s.lat != null) as GeoPoint | undefined;
      const added = (a ? transferMinutes(a, pt) : 0) + (b ? transferMinutes(pt, b) : 0) - (a && b ? transferMinutes(a, b) : 0);
      if (added < best) {
        best = added;
        at = i;
      }
    }
  }
  const prev = stops[at - 1];
  const start = prev ? prev.end + 15 : 9 * 60;
  const s: Stop = { id: uid('s_'), start, end: start + durationMin, ...rest };
  stops.splice(at, 0, s);
  // Everything after the new stop moves later by its length so the order holds.
  for (let i = at + 1; i < stops.length; i++) {
    if (stops[i].fixed) break;
    const d = stops[i].end - stops[i].start;
    if (stops[i].start < stops[i - 1].end + 10) {
      stops[i].start = stops[i - 1].end + 10;
      stops[i].end = stops[i].start + d;
    }
  }
  return retime({ ...day, stops });
}

export function updateStop(day: DayPlan, stopId: string, patch: Partial<Stop>): DayPlan {
  return { ...day, stops: day.stops.map((s) => (s.id === stopId ? { ...s, ...patch } : s)).sort((a, b) => a.start - b.start) };
}
