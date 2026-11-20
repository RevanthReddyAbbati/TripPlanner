import { lazy, Suspense, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, CalendarDays, CheckSquare, Map as MapIcon, NotebookPen, Route, Settings2, Users, Wallet } from 'lucide-react';
import clsx from 'clsx';
import type { DayPlan, Place, Trip, TripInput } from '../../types';
import { computeBudget, type Saving } from '../../engine/budget';
import { insertStop } from '../../engine/edit';
import { fmtDate, fmtDuration } from '../../lib/time';
import { inr, plural, slug } from '../../lib/format';
import { DayTabs, Itinerary } from './Itinerary';
import { BudgetPanel } from './BudgetPanel';
import { ChecklistPanel } from './ChecklistPanel';
import { TripSettingsPanel } from './TripSettingsPanel';
import { AddPlaceModal, type AddPlaceResult } from './AddPlaceModal';
import { Spinner } from '../ui/Spinner';
import type { MapAddRequest } from '../map/TripMap';
import { useToast } from '../ui/Toast';

const TripMap = lazy(() => import('../map/TripMap'));

export interface WorkspaceActions {
  setDay: (day: DayPlan) => void;
  addPlace: (destinationId: string, place: Place) => void;
  toggleCheck: (id: string) => void;
  addCheck: (label: string) => void;
  removeCheck: (id: string) => void;
  resetChecklist: () => void;
  regenerate: (patch?: Partial<TripInput>) => void;
  /** Change inputs that only affect costs (stay, food, budget cap) without touching the itinerary. */
  updateInput: (patch: Partial<TripInput>) => void;
  setNotes: (notes: string) => void;
}

type Tab = 'plan' | 'map' | 'budget' | 'checklist' | 'notes' | 'settings';

export function TripWorkspace({ trip, readOnly, actions }: { trip: Trip; readOnly?: boolean; actions?: WorkspaceActions }) {
  const [tab, setTab] = useState<Tab>('plan');
  const [day, setDay] = useState<number | 'all'>(0);
  const [active, setActive] = useState<string | undefined>();
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const toast = useToast();
  const budget = useMemo(() => computeBudget(trip), [trip]);
  const totalKm = trip.legs.reduce((a, l) => a + l.distanceKm, 0);
  const travelMin = trip.legs.reduce((a, l) => a + l.durationMin, 0);
  const editable = !readOnly && !!actions;

  const addToDay = (dayIndex: number, r: AddPlaceResult) => {
    if (!actions) return;
    if (r.isNew) actions.addPlace(r.destinationId, r.place);
    const p = r.place;
    const hasGeo = Number.isFinite(p.lat) && Number.isFinite(p.lon);
    const next = insertStop(trip.days[dayIndex], {
      kind: hasGeo ? 'visit' : 'custom',
      title: p.name,
      note: p.note,
      cost: p.cost,
      placeId: hasGeo ? p.id : undefined,
      destinationId: r.destinationId,
      lat: hasGeo ? p.lat : undefined,
      lon: hasGeo ? p.lon : undefined,
      durationMin: p.durationMin,
    });
    actions.setDay(next);
    setAddingTo(null);
    toast(`Added ${p.name} to day ${dayIndex + 1}.`);
  };

  const fromMap = (req: MapAddRequest) => {
    if (day === 'all') return;
    const destId = trip.days[day].baseId ?? trip.input.destinations[0].id;
    addToDay(day, {
      destinationId: destId,
      isNew: true,
      place: {
        id: `pin-${slug(req.name)}-${Date.now().toString(36)}`,
        name: req.name,
        lat: req.lat,
        lon: req.lon,
        category: 'culture',
        durationMin: 60,
        cost: 0,
        bestTime: 'any',
        priority: 3,
        note: 'Added from the map.',
        source: 'custom',
      },
    });
  };

  const tabs: { key: Tab; label: string; icon: typeof MapIcon; hide?: boolean; mobileOnly?: boolean }[] = [
    { key: 'plan', label: 'Itinerary', icon: CalendarDays },
    { key: 'map', label: 'Map', icon: MapIcon, mobileOnly: true },
    { key: 'budget', label: 'Budget', icon: Wallet },
    { key: 'checklist', label: 'Checklist', icon: CheckSquare },
    { key: 'notes', label: 'Notes', icon: NotebookPen },
    { key: 'settings', label: 'Trip settings', icon: Settings2, hide: !editable },
  ];

  const map = (
    <Suspense fallback={<div className="grid h-full place-items-center rounded-xl border border-line"><Spinner /></div>}>
      <TripMap
        key={tab === 'map' ? 'map-tab' : 'plan-tab'}
        trip={trip}
        day={day}
        activeStopId={active}
        onSelectStop={(d, id) => {
          setDay((cur) => (cur === 'all' ? cur : d));
          setActive(id);
          document.getElementById(`day-${d}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }}
        onAddPlace={editable ? fromMap : undefined}
        className="h-full"
      />
    </Suspense>
  );

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">
        <Summary icon={<CalendarDays className="h-4 w-4" />} label="Dates" value={`${fmtDate(trip.input.startDate)}`} sub={plural(trip.days.length, 'day')} />
        <Summary icon={<Users className="h-4 w-4" />} label="Group" value={plural(trip.input.travelers, 'person', 'people')} sub={`${inr(budget.total)} in total`} />
        <Summary icon={<Route className="h-4 w-4" />} label="Travel" value={`${totalKm.toLocaleString('en-IN')} km`} sub={`${fmtDuration(travelMin)} on the road`} />
        <Summary
          icon={<Wallet className="h-4 w-4" />}
          label="Per person"
          value={inr(budget.perPerson)}
          sub={budget.overBy ? `${inr(budget.overBy)} over the cap` : `${inr(budget.cap - budget.perPerson)} under the cap`}
          tone={budget.overBy ? 'bad' : 'ok'}
        />
      </div>

      {trip.warnings.length > 0 && (
        <div className="mb-5 space-y-2">
          {trip.warnings.map((w) => (
            <div key={w} className="flex items-start gap-2 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-[13.5px] text-warn">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w}
            </div>
          ))}
        </div>
      )}

      <div className="no-print mb-5 flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line" role="tablist">
        {tabs
          .filter((t) => !t.hide)
          .map(({ key, label, icon: Icon, mobileOnly }) => (
            <button
              key={key}
              role="tab"
              aria-selected={tab === key}
              onClick={() => setTab(key)}
              className={clsx(
                '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[14px] font-medium transition-colors',
                tab === key ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-ink',
                mobileOnly && 'xl:hidden',
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </button>
          ))}
      </div>

      {(tab === 'plan' || tab === 'map') && (
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
          <div className={clsx('min-w-0', tab === 'map' && 'hidden xl:block')}>
            <DayTabs trip={trip} day={day} onDay={(d) => { setDay(d); setActive(undefined); }} />
            <div className="mt-3">
              <Itinerary
                trip={trip}
                day={day}
                onDay={setDay}
                activeStopId={active}
                onActivate={(_, id) => setActive(id)}
                readOnly={!editable}
                onChangeDay={actions?.setDay}
                onAddPlace={editable ? (i) => setAddingTo(i) : undefined}
              />
            </div>
          </div>
          <div className={clsx('min-w-0 xl:sticky xl:top-4 xl:self-start', tab === 'plan' && 'hidden xl:block')}>
            {tab === 'map' && (
              <div className="mb-3 xl:hidden">
                <DayTabs trip={trip} day={day} onDay={(d) => { setDay(d); setActive(undefined); }} />
              </div>
            )}
            <div className="h-[70vh] min-h-[420px] xl:h-[calc(100vh-4rem)] xl:max-h-[820px]">{map}</div>
            <p className="mt-2 text-[12px] text-muted">
              {day === 'all' ? 'Showing every day. Pick a day to see its road route.' : 'Road route by OSRM. Dashed lines are intercity journeys.'}
            </p>
          </div>
        </div>
      )}

      {tab === 'budget' && (
        <BudgetPanel
          trip={trip}
          readOnly={!editable}
          onCap={(cap) => actions?.updateInput({ budgetPerPerson: cap })}
          onApply={(s: Saving) => {
            if (s.rebuild) actions?.regenerate(s.patch);
            else actions?.updateInput(s.patch);
            toast(`Applied: ${s.label}.`);
          }}
        />
      )}

      {tab === 'checklist' && (
        <ChecklistPanel
          trip={trip}
          readOnly={!editable}
          onToggle={actions?.toggleCheck}
          onAdd={actions?.addCheck}
          onRemove={actions?.removeCheck}
          onReset={actions?.resetChecklist}
        />
      )}

      {tab === 'notes' && (
        <div className="card p-5">
          <label htmlFor="notes" className="label">
            Trip notes
          </label>
          <textarea
            id="notes"
            className="input min-h-[280px] font-sans leading-relaxed"
            placeholder="Booking references, contact numbers, who pays for what..."
            defaultValue={trip.notes}
            readOnly={!editable}
            onBlur={(e) => actions?.setNotes(e.target.value)}
          />
          {editable && <p className="hint">Saved when you click away.</p>}
        </div>
      )}

      {tab === 'settings' && editable && (
        <TripSettingsPanel
          input={trip.input}
          onRebuild={(patch) => {
            actions!.regenerate(patch);
            setDay(0);
            setTab('plan');
            toast('Plan rebuilt with the new settings.');
          }}
        />
      )}

      <AddPlaceModal trip={trip} dayIndex={addingTo} onClose={() => setAddingTo(null)} onAdd={(r) => addingTo != null && addToDay(addingTo, r)} />
    </div>
  );
}

function Summary({ icon, label, value, sub, tone }: { icon: ReactNode; label: string; value: string; sub: string; tone?: 'ok' | 'bad' }) {
  return (
    <div className="min-w-0 bg-surface px-4 py-3">
      <div className="flex items-center gap-1.5 text-[12px] text-muted">
        {icon} {label}
      </div>
      <div className="truncate font-display text-[19px] font-bold tabular">{value}</div>
      <div className={clsx('truncate text-[12.5px]', tone === 'bad' ? 'font-medium text-bad' : tone === 'ok' ? 'font-medium text-ok' : 'text-muted')}>{sub}</div>
    </div>
  );
}
