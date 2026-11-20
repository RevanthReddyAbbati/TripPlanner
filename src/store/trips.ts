// Trip workspace store. Phase 1 persists to localStorage; the actions here are the seam where
// a server-backed repository (Supabase, Firebase or a REST API) plugs in for multi-user sync.
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { ChecklistItem, DayPlan, Place, Trip, TripInput, TripStatus } from '../types';
import { generateTrip } from '../engine/planner';
import { buildChecklist } from '../engine/checklist';
import { uid } from '../lib/format';

interface TripState {
  trips: Record<string, Trip>;
  order: string[];
  create: (input: TripInput) => string;
  regenerate: (id: string, patch?: Partial<TripInput>) => void;
  remove: (id: string) => void;
  duplicate: (id: string) => string | undefined;
  importTrip: (trip: Trip) => string;
  setStatus: (id: string, status: TripStatus) => void;
  rename: (id: string, name: string) => void;
  updateInput: (id: string, patch: Partial<TripInput>) => void;
  setNotes: (id: string, notes: string) => void;
  setDay: (id: string, day: DayPlan) => void;
  addPlace: (id: string, destinationId: string, place: Place) => void;
  toggleCheck: (id: string, itemId: string) => void;
  addCheck: (id: string, label: string) => void;
  removeCheck: (id: string, itemId: string) => void;
  resetChecklist: (id: string) => void;
  clearAll: () => void;
}

const touch = (t: Trip): Trip => ({ ...t, updatedAt: new Date().toISOString() });

export const useTrips = create<TripState>()(
  persist(
    (set, get) => {
      const patchTrip = (id: string, fn: (t: Trip) => Trip) =>
        set((s) => (s.trips[id] ? { trips: { ...s.trips, [id]: touch(fn(s.trips[id])) } } : s));

      return {
        trips: {},
        order: [],
        create: (input) => {
          const trip = generateTrip(input);
          set((s) => ({ trips: { ...s.trips, [trip.id]: trip }, order: [trip.id, ...s.order] }));
          return trip.id;
        },
        regenerate: (id, patch) => {
          const t = get().trips[id];
          if (!t) return;
          const next = generateTrip({ ...t.input, ...patch }, t);
          set((s) => ({ trips: { ...s.trips, [id]: next } }));
        },
        remove: (id) =>
          set((s) => {
            const trips = { ...s.trips };
            delete trips[id];
            return { trips, order: s.order.filter((x) => x !== id) };
          }),
        duplicate: (id) => {
          const t = get().trips[id];
          if (!t) return;
          const now = new Date().toISOString();
          const copy: Trip = structuredClone({ ...t, id: uid('trip_'), createdAt: now, updatedAt: now, status: 'draft' as const });
          copy.input.name = `${t.input.name} (copy)`;
          set((s) => ({ trips: { ...s.trips, [copy.id]: copy }, order: [copy.id, ...s.order] }));
          return copy.id;
        },
        importTrip: (trip) => {
          const now = new Date().toISOString();
          const copy: Trip = { ...trip, id: uid('trip_'), createdAt: now, updatedAt: now };
          set((s) => ({ trips: { ...s.trips, [copy.id]: copy }, order: [copy.id, ...s.order] }));
          return copy.id;
        },
        setStatus: (id, status) => patchTrip(id, (t) => ({ ...t, status })),
        rename: (id, name) => patchTrip(id, (t) => ({ ...t, input: { ...t.input, name } })),
        updateInput: (id, patch) => patchTrip(id, (t) => ({ ...t, input: { ...t.input, ...patch } })),
        setNotes: (id, notes) => patchTrip(id, (t) => ({ ...t, notes })),
        setDay: (id, day) => patchTrip(id, (t) => ({ ...t, days: t.days.map((d) => (d.index === day.index ? day : d)) })),
        addPlace: (id, destinationId, place) =>
          patchTrip(id, (t) => ({
            ...t,
            input: {
              ...t.input,
              destinations: t.input.destinations.map((d) =>
                d.id === destinationId && !d.places.some((p) => p.id === place.id) ? { ...d, places: [...d.places, place] } : d,
              ),
            },
          })),
        toggleCheck: (id, itemId) =>
          patchTrip(id, (t) => ({ ...t, checklist: t.checklist.map((c) => (c.id === itemId ? { ...c, done: !c.done } : c)) })),
        addCheck: (id, label) =>
          patchTrip(id, (t) => ({
            ...t,
            checklist: [...t.checklist, { id: uid('ck_'), label, done: false, category: 'custom' } satisfies ChecklistItem],
          })),
        removeCheck: (id, itemId) => patchTrip(id, (t) => ({ ...t, checklist: t.checklist.filter((c) => c.id !== itemId) })),
        resetChecklist: (id) => patchTrip(id, (t) => ({ ...t, checklist: buildChecklist(t) })),
        clearAll: () => set({ trips: {}, order: [] }),
      };
    },
    {
      name: 'itinera-trips',
      version: 1,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);

export function useTrip(id: string | undefined): Trip | undefined {
  return useTrips((s) => (id ? s.trips[id] : undefined));
}
