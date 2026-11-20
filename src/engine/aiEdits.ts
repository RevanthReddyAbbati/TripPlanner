// Applies validated AI edit operations through the same engine functions the UI uses,
// so timings are recalculated by the planner, not invented by the model.
import type { DayPlan, Place, Trip } from '../types';
import { insertStop, removeStop } from './edit';

export type EditOp =
  | { op: 'add'; dayIndex: number; destinationId: string; place: Place; reason: string }
  | { op: 'remove'; dayIndex: number; stopId: string; title: string; reason: string }
  | { op: 'move'; dayIndex: number; toDayIndex: number; stopId: string; title: string; reason: string };

export interface AppliedEdits {
  days: DayPlan[];
  /** New places to save on their destinations. */
  newPlaces: { destinationId: string; place: Place }[];
}

export function applyEdits(trip: Trip, ops: EditOp[]): AppliedEdits {
  const days = trip.days.map((d) => ({ ...d, stops: [...d.stops] }));
  const newPlaces: AppliedEdits['newPlaces'] = [];
  // Removals first so "swap X for Y" frees the slot before Y is inserted.
  const order = [...ops].sort((a, b) => rank(a) - rank(b));
  for (const op of order) {
    if (op.op === 'remove') {
      const d = days[op.dayIndex];
      if (d && d.stops.some((s) => s.id === op.stopId)) days[op.dayIndex] = removeStop(d, op.stopId);
    } else if (op.op === 'move') {
      const from = days[op.dayIndex];
      const to = days[op.toDayIndex];
      const stop = from?.stops.find((s) => s.id === op.stopId);
      if (!from || !to || !stop || stop.fixed) continue;
      days[op.dayIndex] = removeStop(from, op.stopId);
      const { id: _id, start, end, ...rest } = stop;
      days[op.toDayIndex] = insertStop(days[op.toDayIndex], { ...rest, durationMin: end - start });
    } else if (op.op === 'add') {
      const d = days[op.dayIndex];
      if (!d) continue;
      const p = op.place;
      days[op.dayIndex] = insertStop(d, {
        kind: 'visit',
        title: p.name,
        note: p.note,
        cost: p.cost,
        placeId: p.id,
        destinationId: op.destinationId,
        lat: p.lat,
        lon: p.lon,
        durationMin: p.durationMin,
        optional: p.priority <= 2,
      });
      newPlaces.push({ destinationId: op.destinationId, place: p });
    }
  }
  return { days, newPlaces };
}

function rank(op: EditOp): number {
  return op.op === 'remove' ? 0 : op.op === 'move' ? 1 : 2;
}
