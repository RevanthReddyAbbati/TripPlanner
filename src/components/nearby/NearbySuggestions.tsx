import { useMemo, useState } from 'react';
import { CalendarPlus, Clock, Compass, MapPin, Plus, Route, Sparkles, Wallet } from 'lucide-react';
import clsx from 'clsx';
import type { Place, Trip } from '../../types';
import type { WorkspaceActions } from '../trip/TripWorkspace';
import { bestDayFor, kmBetween, nearbySuggestions, type NearbyKind, type NearbySuggestion } from '../../engine/nearby';
import { insertStop } from '../../engine/edit';
import { computeBudget } from '../../engine/budget';
import { findDestination } from '../../data/destinations';
import { suggestPlaces } from '../../services/ai/provider';
import { AIError } from '../../services/ai/gemini';
import { useAIReady } from '../../store/ai';
import { roadKm } from '../../lib/geo';
import { fmtDay, fmtDuration } from '../../lib/time';
import { inr } from '../../lib/format';
import { Card, EmptyState } from '../ui/Kit';
import { Badge, Chip } from '../ui/Fields';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Spinner } from '../ui/Spinner';
import { useToast } from '../ui/Toast';
import { INTEREST_LABEL } from '../options';

type Filter = 'all' | NearbyKind;

const FILTERS: { value: Filter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'day-trip', label: 'Day trips' },
  { value: 'add-destination', label: 'Add to route' },
  { value: 'unscheduled-place', label: 'Must-see in plan' },
];

const VISIT_LABEL: Record<NearbySuggestion['idealVisit'], string> = {
  'half-day': 'Half day',
  'day-trip': 'Full day',
  overnight: 'Needs a night',
  stop: 'Short stop',
};

/** Ranked "nearby you could explore" list with add actions. Without actions it is read-only. */
export function NearbySuggestions({
  trip, actions, limit, title = 'Nearby you could explore', subtitle, onShowAll,
}: {
  trip: Trip;
  actions?: WorkspaceActions;
  /** Show only the top N (no filters) with a "See all" button. */
  limit?: number;
  title?: string;
  subtitle?: string;
  onShowAll?: () => void;
}) {
  const [filter, setFilter] = useState<Filter>('all');
  const [picking, setPicking] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<NearbySuggestion | null>(null);
  const [ai, setAi] = useState<NearbySuggestion[]>([]);
  const toast = useToast();
  const all = useMemo(() => nearbySuggestions(trip), [trip]);
  const list = useMemo(() => {
    const merged = [...ai, ...all];
    const f = filter === 'all' ? merged : merged.filter((s) => s.kind === filter);
    return limit ? f.slice(0, limit) : f;
  }, [all, ai, filter, limit]);

  const addStop = (s: NearbySuggestion, dayIndex: number) => {
    if (!actions || s.action.type === 'add-destination') return;
    const { destinationId, place, durationMin } = s.action;
    const day = trip.days[dayIndex];
    if (!day) return;
    actions.addPlace(destinationId, place);
    actions.setDay(
      insertStop(day, {
        kind: 'visit',
        title: place.name,
        note: place.note,
        cost: place.cost,
        placeId: place.id,
        destinationId,
        lat: place.lat,
        lon: place.lon,
        durationMin,
      }),
    );
    setPicking(null);
    toast(`Added ${place.name} to day ${dayIndex + 1}.`);
  };

  const addDestination = (s: NearbySuggestion) => {
    if (!actions || s.action.type !== 'add-destination') return;
    const dest = findDestination(s.action.destinationId);
    if (!dest) return;
    const after = s.action.afterDestinationId;
    const list = [...trip.input.destinations];
    const at = list.findIndex((d) => d.id === after);
    list.splice(at < 0 ? list.length : at + 1, 0, dest);
    actions.regenerate({ destinations: list, days: Math.min(30, trip.input.days + s.action.extraDays) });
    setConfirm(null);
    toast(`Added ${dest.name} to the route and rebuilt the plan.`);
  };

  const empty = list.length === 0;

  return (
    <Card
      title={
        <span className="inline-flex items-center gap-2">
          <Compass className="h-4 w-4 text-brand" /> {title}
        </span>
      }
      subtitle={subtitle ?? 'Day trips, nearby destinations and must-sees that did not fit, ranked for your group'}
      actions={
        limit && onShowAll && all.length > limit ? (
          <Button size="xs" variant="ghost" onClick={onShowAll}>
            See all {all.length}
          </Button>
        ) : undefined
      }
      bodyClass="p-0"
    >
      {!limit && (
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
          {FILTERS.map((f) => {
            const count = f.value === 'all' ? all.length + ai.length : [...ai, ...all].filter((s) => s.kind === f.value).length;
            return (
              <Chip key={f.value} on={filter === f.value} onClick={() => setFilter(f.value)}>
                {f.label}
                <span className="tabular text-[11.5px] opacity-70">{count}</span>
              </Chip>
            );
          })}
          {actions && <AiIdeas trip={trip} onResults={setAi} />}
        </div>
      )}

      {empty ? (
        <EmptyState icon={<Compass className="h-5 w-5" />} title="Nothing more nearby">
          Everything worth seeing near these destinations is already in your plan.
        </EmptyState>
      ) : (
        <ul className="divide-y divide-line">
          {list.map((s) => (
            <li key={s.id} className="px-5 py-4">
              <div className="flex flex-wrap items-start gap-3">
                <KindIcon kind={s.kind} ai={s.id.startsWith('ai-')} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="font-medium">{s.title}</span>
                    {s.id.startsWith('ai-') && <Badge tone="warn">AI idea</Badge>}
                    {s.inSeason === true && <Badge tone="ok">In season</Badge>}
                    {s.inSeason === false && <Badge tone="warn">Off season</Badge>}
                    <Badge tone={s.fitsBudget ? 'ok' : 'bad'}>{s.fitsBudget ? 'Fits budget' : 'Over budget'}</Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-muted">
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {s.distanceKm} km from {s.near}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {fmtDuration(s.travelMin)} each way · {VISIT_LABEL[s.idealVisit]}
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <Wallet className="h-3.5 w-3.5" /> {s.extraCostPP > 0 ? `about ${inr(s.extraCostPP)} extra per person` : 'Free'}
                    </span>
                  </div>
                  <p className="mt-1.5 text-[13px] text-ink-2">{s.why}</p>
                  {s.howToGet && !limit && <p className="mt-1 text-[12.5px] text-muted">How to get there: {s.howToGet}</p>}
                  {s.bestFor.length > 0 && !limit && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {s.bestFor.slice(0, 3).map((b) => (
                        <Badge key={b}>{INTEREST_LABEL[b]}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                {actions && (
                  <div className="shrink-0">
                    {s.action.type === 'add-destination' ? (
                      <Button size="sm" variant="secondary" icon={<Route className="h-4 w-4" />} onClick={() => setConfirm(s)}>
                        Add to route
                      </Button>
                    ) : s.action.type === 'needs-night' ? (
                      <Button size="sm" variant="secondary" icon={<CalendarPlus className="h-4 w-4" />} onClick={() => setPicking(picking === s.id ? null : s.id)}>
                        Plan it
                      </Button>
                    ) : (
                      <Button size="sm" variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => setPicking(picking === s.id ? null : s.id)}>
                        Add to day
                      </Button>
                    )}
                  </div>
                )}
              </div>
              {picking === s.id && actions && <DayPicker trip={trip} s={s} onAdd={(d) => addStop(s, d)} onCancel={() => setPicking(null)} />}
            </li>
          ))}
        </ul>
      )}

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        size="sm"
        title={confirm ? `Add ${confirm.title} to your route?` : 'Add to route'}
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button onClick={() => confirm && addDestination(confirm)}>Add and rebuild plan</Button>
          </>
        }
      >
        {confirm && confirm.action.type === 'add-destination' && (
          <div className="space-y-3 text-[14px]">
            <p>
              {confirm.title} goes into the route right after {confirm.near}, and the trip gets {confirm.action.extraDays} more day
              {confirm.action.extraDays > 1 ? 's' : ''} ({trip.input.days} → {Math.min(30, trip.input.days + confirm.action.extraDays)}).
            </p>
            <p className="text-muted">
              The day-by-day plan is rebuilt, so manual itinerary edits are replaced. Your expenses, bookings, notes and checklist ticks are kept. Estimated extra cost: about {inr(confirm.extraCostPP)} per person.
            </p>
          </div>
        )}
      </Modal>
    </Card>
  );
}

function KindIcon({ kind, ai }: { kind: NearbyKind; ai?: boolean }) {
  const Icon = ai ? Sparkles : kind === 'add-destination' ? Route : kind === 'unscheduled-place' ? MapPin : Compass;
  return (
    <span
      className={clsx(
        'mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg',
        ai ? 'bg-warn-soft text-accent' : kind === 'add-destination' ? 'bg-brand-soft text-brand' : kind === 'unscheduled-place' ? 'bg-ok-soft text-ok' : 'bg-sunken text-ink-2',
      )}
    >
      <Icon className="h-4 w-4" />
    </span>
  );
}

function DayPicker({ trip, s, onAdd, onCancel }: { trip: Trip; s: NearbySuggestion; onAdd: (day: number) => void; onCancel: () => void }) {
  const suggested = s.action.type === 'add-stop' ? s.action.suggestedDay ?? bestDayFor(trip, s.nearDestinationId) : bestDayFor(trip, s.nearDestinationId);
  const [day, setDay] = useState<number>(suggested ?? 0);
  const overnight = s.action.type === 'needs-night';
  const hours = s.action.type !== 'add-destination' ? Math.round((s.action.durationMin / 60) * 2) / 2 : 0;
  return (
    <div className="animate-in mt-3 rounded-lg border border-line bg-sunken/50 p-3 sm:ml-11">
      {overnight ? (
        <p className="mb-3 text-[13px] text-ink-2">
          This works best with a night there. Add a day in <strong>Settings → Plan settings</strong> first, or squeeze it into a day as a long trip of about {hours} hours.
        </p>
      ) : (
        <p className="mb-3 text-[13px] text-ink-2">Takes about {hours} hours including travel. Later stops that day move to fit.</p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <label htmlFor={`pick-${s.id}`} className="sr-only">
          Day
        </label>
        <select id={`pick-${s.id}`} className="input w-auto min-w-[12rem] flex-1 sm:flex-none" value={day} onChange={(e) => setDay(Number(e.target.value))}>
          {trip.days.map((d) => (
            <option key={d.index} value={d.index}>
              Day {d.index + 1} · {fmtDay(d.date)}
              {d.index === suggested ? ' (most free time here)' : ''}
            </option>
          ))}
        </select>
        <Button size="sm" onClick={() => onAdd(day)}>
          Add to day {day + 1}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

/** "More ideas with AI": Gemini excursions within ~100 km of a chosen destination. */
function AiIdeas({ trip, onResults }: { trip: Trip; onResults: (s: NearbySuggestion[]) => void }) {
  const ready = useAIReady();
  const [destId, setDestId] = useState(trip.input.destinations[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  if (!ready || !trip.input.destinations.length) return null;

  const run = async () => {
    const dest = trip.input.destinations.find((d) => d.id === destId);
    if (!dest) return;
    setBusy(true);
    setError('');
    try {
      const places = await suggestPlaces(dest, trip.input, { request: 'day trips and excursions within 100 km', count: 6 });
      onResults(places.map((p) => toSuggestion(trip, dest.id, dest.name, dest, p)));
    } catch (e) {
      setError(e instanceof AIError ? e.message : 'Could not get ideas right now.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="ml-auto flex flex-wrap items-center gap-2">
      {trip.input.destinations.length > 1 && (
        <select aria-label="Destination for AI ideas" className="input h-8 w-auto text-[12.5px]" value={destId} onChange={(e) => setDestId(e.target.value)}>
          {trip.input.destinations.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
        </select>
      )}
      <Button size="sm" variant="subtle" icon={busy ? <Spinner className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />} onClick={run} disabled={busy}>
        More ideas with AI
      </Button>
      {error && <span className="w-full text-[12.5px] text-bad">{error}</span>}
    </div>
  );
}

function toSuggestion(trip: Trip, destinationId: string, near: string, center: { lat: number; lon: number }, p: Place): NearbySuggestion {
  const km = Math.round(roadKm(center, p)) || kmBetween(center, p);
  const travelMin = Math.max(15, Math.round((km / 40) * 60));
  const visit: NearbySuggestion['idealVisit'] = travelMin > 150 ? 'overnight' : travelMin > 60 ? 'day-trip' : 'half-day';
  const n = trip.input.travelers;
  const taxi = (Math.ceil(n / 4) * Math.max(1500, km * 2 * 14)) / n;
  const extra = Math.round(p.cost + taxi);
  const b = computeBudget(trip);
  return {
    id: `ai-${p.id}`,
    kind: 'day-trip',
    title: p.name,
    near,
    nearDestinationId: destinationId,
    distanceKm: km,
    travelMin,
    idealVisit: visit,
    extraCostPP: extra,
    fitsBudget: extra <= b.cap - b.perPerson,
    inSeason: null,
    bestFor: [p.category],
    why: p.note ?? 'Suggested by Gemini. Check hours and fees locally.',
    score: 0,
    action: { type: visit === 'overnight' ? 'needs-night' : 'add-stop', destinationId, place: p, durationMin: travelMin * 2 + p.durationMin },
  };
}
