import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import type { Place, Trip } from '../../types';
import { Modal } from '../ui/Modal';
import { Segmented } from '../ui/Fields';
import { Button } from '../ui/Button';
import { PlaceSearch } from '../PlaceSearch';
import { INTEREST_LABEL } from '../options';
import { inr, slug } from '../../lib/format';
import { fmtDuration } from '../../lib/time';
import { scorePlace } from '../../engine/planner';

export interface AddPlaceResult {
  destinationId: string;
  place: Place;
  /** True when the place is new to the destination and should be saved to it. */
  isNew: boolean;
}

type Tab = 'suggested' | 'search' | 'custom';

export function AddPlaceModal({ trip, dayIndex, onClose, onAdd }: { trip: Trip; dayIndex: number | null; onClose: () => void; onAdd: (r: AddPlaceResult) => void }) {
  const [tab, setTab] = useState<Tab>('suggested');
  const [filter, setFilter] = useState('');
  const [custom, setCustom] = useState({ name: '', duration: 60, cost: 0, note: '' });
  const day = dayIndex != null ? trip.days[dayIndex] : undefined;
  const destId = day?.baseId ?? trip.input.destinations[0]?.id;
  const dest = trip.input.destinations.find((d) => d.id === destId) ?? trip.input.destinations[0];

  const suggestions = useMemo(() => {
    const scheduled = new Set(trip.days.flatMap((d) => d.stops.map((s) => s.placeId)).filter(Boolean) as string[]);
    return trip.input.destinations
      .flatMap((d) => d.places.map((p) => ({ p, d })))
      .filter(({ p }) => !scheduled.has(p.id))
      .filter(({ p }) => !filter || p.name.toLowerCase().includes(filter.toLowerCase()))
      .sort((a, b) => Number(b.d.id === destId) - Number(a.d.id === destId) || scorePlace(b.p, trip.input) - scorePlace(a.p, trip.input));
  }, [trip, destId, filter]);

  if (dayIndex == null || !dest) return null;

  return (
    <Modal open onClose={onClose} title={`Add a place to day ${dayIndex + 1}`}>
      <div className="mb-4">
        <Segmented
          label="How to add"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'suggested', label: 'Suggestions' },
            { value: 'search', label: 'Search' },
            { value: 'custom', label: 'Custom stop' },
          ]}
        />
      </div>

      {tab === 'suggested' && (
        <div className="space-y-3">
          <input className="input" placeholder="Filter places" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter places" />
          {suggestions.length === 0 ? (
            <p className="py-6 text-center text-[14px] text-muted">Every known place is already in the plan. Try Search to find more.</p>
          ) : (
            <ul className="divide-y divide-line rounded-lg border border-line">
              {suggestions.slice(0, 40).map(({ p, d }) => (
                <li key={p.id} className="flex items-start gap-3 px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <div className="font-medium">{p.name}</div>
                    <div className="text-[12.5px] text-muted">
                      {d.name} · {INTEREST_LABEL[p.category]} · {fmtDuration(p.durationMin)}
                      {p.cost > 0 ? ` · ${inr(p.cost)}` : ' · Free'}
                    </div>
                  </div>
                  <Button size="sm" variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => onAdd({ destinationId: d.id, place: p, isNew: false })}>
                    Add
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {tab === 'search' && (
        <div className="space-y-2">
          <PlaceSearch
            autoFocus
            near={dest}
            placeholder={`Search near ${dest.name}`}
            onSelect={(r) =>
              onAdd({
                destinationId: dest.id,
                isNew: true,
                place: {
                  id: `custom-${slug(r.name)}-${r.id.slice(-5)}`,
                  name: r.name,
                  lat: r.lat,
                  lon: r.lon,
                  category: 'culture',
                  durationMin: 60,
                  cost: 0,
                  bestTime: 'any',
                  priority: 3,
                  note: 'Added from search.',
                  source: 'custom',
                },
              })
            }
          />
          <p className="hint">Results near {dest.name} come first. The place is added to the end of the day and the times shift to fit.</p>
        </div>
      )}

      {tab === 'custom' && (
        <form
          className="grid gap-4 sm:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!custom.name.trim()) return;
            onAdd({
              destinationId: dest.id,
              isNew: false,
              place: {
                id: `note-${Date.now().toString(36)}`,
                name: custom.name.trim(),
                lat: NaN,
                lon: NaN,
                category: 'culture',
                durationMin: custom.duration,
                cost: custom.cost,
                bestTime: 'any',
                priority: 3,
                note: custom.note || undefined,
                source: 'custom',
              },
            });
          }}
        >
          <div className="sm:col-span-2">
            <label className="label" htmlFor="c-name">
              What
            </label>
            <input id="c-name" className="input" placeholder="e.g. Shopping at Mapusa market" value={custom.name} onChange={(e) => setCustom({ ...custom, name: e.target.value })} />
          </div>
          <div>
            <label className="label" htmlFor="c-dur">
              Duration (minutes)
            </label>
            <input id="c-dur" type="number" min={15} step={15} className="input tabular" value={custom.duration} onChange={(e) => setCustom({ ...custom, duration: Math.max(15, Number(e.target.value) || 60) })} />
          </div>
          <div>
            <label className="label" htmlFor="c-cost">
              Cost per person (₹)
            </label>
            <input id="c-cost" type="number" min={0} step={50} className="input tabular" value={custom.cost} onChange={(e) => setCustom({ ...custom, cost: Math.max(0, Number(e.target.value) || 0) })} />
          </div>
          <div className="sm:col-span-2">
            <label className="label" htmlFor="c-note">
              Note
            </label>
            <input id="c-note" className="input" value={custom.note} onChange={(e) => setCustom({ ...custom, note: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Button type="submit" disabled={!custom.name.trim()} icon={<Plus className="h-4 w-4" />}>
              Add stop
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
}
