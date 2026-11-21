import { lazy, Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  AlertTriangle, CalendarDays, CheckSquare, LayoutDashboard, Map as MapIcon, NotebookPen, ReceiptIndianRupee, Settings2, Sparkles, Ticket, TrainFront, Wallet,
} from 'lucide-react';
import clsx from 'clsx';
import type { Booking, DayPlan, Expense, Place, Traveler, Trip, TripInput } from '../../types';
import type { Saving } from '../../engine/budget';
import { insertStop } from '../../engine/edit';
import { slug } from '../../lib/format';
import { DayTabs, Itinerary } from './Itinerary';
import { BudgetPanel } from './BudgetPanel';
import { ChecklistPanel } from './ChecklistPanel';
import { TripSettingsPanel } from './TripSettingsPanel';
import { AddPlaceModal, type AddPlaceResult } from './AddPlaceModal';
import { OverviewPanel } from './OverviewPanel';
import { ExpensesPanel } from './ExpensesPanel';
import { BookingsPanel } from './BookingsPanel';
import { AssistantPanel } from './AssistantPanel';
import { TravelGuidePanel } from '../journey/TravelGuidePanel';
import { Spinner } from '../ui/Spinner';
import { Tabs } from '../ui/Kit';
import type { MapAddRequest } from '../map/TripMap';
import { useToast } from '../ui/Toast';
import { ExpenseModal, type ExpenseDraft } from '../expenses/ExpenseModal';

const TripMap = lazy(() => import('../map/TripMap'));

export interface WorkspaceActions {
  setDay: (day: DayPlan) => void;
  /** Replace all days at once (used by AI plan edits, which may touch several days). */
  setDays: (days: DayPlan[]) => void;
  addPlace: (destinationId: string, place: Place) => void;
  toggleCheck: (id: string) => void;
  addCheck: (label: string) => void;
  removeCheck: (id: string) => void;
  resetChecklist: () => void;
  regenerate: (patch?: Partial<TripInput>) => void;
  /** Change inputs that only affect costs (stay, food, budget cap) without touching the itinerary. */
  updateInput: (patch: Partial<TripInput>) => void;
  setNotes: (notes: string) => void;
  updateTraveler: (travelerId: string, patch: Partial<Traveler>) => void;
  addExpense: (e: Omit<Expense, 'id' | 'createdAt'>) => string;
  updateExpense: (expenseId: string, patch: Partial<Expense>) => void;
  removeExpense: (expenseId: string) => void;
  addBooking: (b: Omit<Booking, 'id'>) => string;
  updateBooking: (bookingId: string, patch: Partial<Booking>) => void;
  removeBooking: (bookingId: string) => void;
}

export type WorkspaceTab = 'overview' | 'assistant' | 'plan' | 'travel' | 'map' | 'budget' | 'expenses' | 'bookings' | 'checklist' | 'notes' | 'settings';
const TABS: WorkspaceTab[] = ['overview', 'assistant', 'plan', 'travel', 'map', 'budget', 'expenses', 'bookings', 'checklist', 'notes', 'settings'];

export function TripWorkspace({ trip, readOnly, actions }: { trip: Trip; readOnly?: boolean; actions?: WorkspaceActions }) {
  const [params, setParams] = useSearchParams();
  const raw = params.get('tab') as WorkspaceTab | null;
  const tab: WorkspaceTab = raw && TABS.includes(raw) ? raw : 'overview';
  const [day, setDay] = useState<number | 'all'>(0);
  const [active, setActive] = useState<string | undefined>();
  const [addingTo, setAddingTo] = useState<number | null>(null);
  const [stopExpense, setStopExpense] = useState<Partial<ExpenseDraft> | null>(null);
  const toast = useToast();
  const editable = !readOnly && !!actions;

  const setTab = (t: WorkspaceTab, extra?: Record<string, string>) => {
    const next = new URLSearchParams(params);
    if (t === 'overview') next.delete('tab');
    else next.set('tab', t);
    next.delete('add');
    Object.entries(extra ?? {}).forEach(([k, v]) => next.set(k, v));
    setParams(next, { replace: true });
  };

  // ?add=1 opens the expense form (from the command palette or the overview).
  const autoAdd = params.get('add') === '1' && tab === 'expenses';
  const clearAutoAdd = () => {
    const next = new URLSearchParams(params);
    next.delete('add');
    setParams(next, { replace: true });
  };

  useEffect(() => {
    if ((tab === 'settings' || tab === 'assistant') && !editable) setTab('overview');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, editable]);

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
      <Tabs<WorkspaceTab>
        className="mb-6"
        value={tab}
        onChange={(t) => setTab(t)}
        items={[
          { value: 'overview', label: 'Overview', icon: <LayoutDashboard className="h-4 w-4" /> },
          ...(editable ? [{ value: 'assistant' as const, label: 'Assistant', icon: <Sparkles className="h-4 w-4 text-accent" /> }] : []),
          { value: 'plan', label: 'Itinerary', icon: <CalendarDays className="h-4 w-4" /> },
          { value: 'travel', label: 'Travel guide', icon: <TrainFront className="h-4 w-4" /> },
          { value: 'map', label: 'Map', icon: <MapIcon className="h-4 w-4" />, className: 'xl:hidden' },
          { value: 'budget', label: 'Budget', icon: <Wallet className="h-4 w-4" /> },
          { value: 'expenses', label: 'Expenses', icon: <ReceiptIndianRupee className="h-4 w-4" />, count: trip.expenses.length },
          { value: 'bookings', label: 'Bookings', icon: <Ticket className="h-4 w-4" />, count: trip.bookings.length },
          { value: 'checklist', label: 'Checklist', icon: <CheckSquare className="h-4 w-4" /> },
          { value: 'notes', label: 'Notes', icon: <NotebookPen className="h-4 w-4" /> },
          ...(editable ? [{ value: 'settings' as const, label: 'Settings', icon: <Settings2 className="h-4 w-4" /> }] : []),
        ]}
      />

      {tab === 'overview' && <OverviewPanel trip={trip} readOnly={!editable} actions={actions} onNavigate={(t, extra) => setTab(t, extra)} />}

      {tab === 'assistant' && editable && <AssistantPanel trip={trip} actions={actions!} onNavigate={(t, extra) => setTab(t, extra)} />}

      {(tab === 'plan' || tab === 'map') && (
        <>
          {trip.warnings.length > 0 && tab === 'plan' && (
            <div className="mb-5 space-y-2">
              {trip.warnings.map((w) => (
                <div key={w} className="flex items-start gap-2 rounded-lg border border-warn/25 bg-warn-soft px-3 py-2 text-[13px] text-warn">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w}
                </div>
              ))}
            </div>
          )}
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
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
                  onOpenTravelGuide={() => setTab('travel')}
                  onLogExpense={
                    editable
                      ? (dayIndex, stop) =>
                          setStopExpense({
                            title: stop.title,
                            amount: stop.cost * trip.input.travelers,
                            category: stop.kind === 'meal' ? 'food' : stop.kind === 'travel' ? 'transport' : 'activities',
                            date: trip.days[dayIndex].date,
                            stopId: stop.id,
                          })
                      : undefined
                  }
                />
              </div>
            </div>
            <div className={clsx('min-w-0 xl:sticky xl:top-[4.5rem] xl:self-start', tab === 'plan' && 'hidden xl:block')}>
              {tab === 'map' && (
                <div className="mb-3 xl:hidden">
                  <DayTabs trip={trip} day={day} onDay={(d) => { setDay(d); setActive(undefined); }} />
                </div>
              )}
              <div className="h-[70vh] min-h-[420px] xl:h-[calc(100vh-8rem)] xl:max-h-[820px]">{map}</div>
              <p className="mt-2 text-[12px] text-muted">
                {day === 'all' ? 'Showing every day. Pick a day to see its road route.' : 'Road route by OSRM. Dashed lines are intercity journeys.'}
              </p>
            </div>
          </div>
        </>
      )}

      {tab === 'travel' && <TravelGuidePanel trip={trip} />}

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

      {tab === 'expenses' && <ExpensesPanel trip={trip} readOnly={!editable} actions={actions} autoAdd={autoAdd} onAutoAddHandled={clearAutoAdd} />}

      {tab === 'bookings' && <BookingsPanel trip={trip} readOnly={!editable} actions={actions} />}

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
            className="input min-h-[320px] font-sans leading-relaxed"
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
          trip={trip}
          onRenameTraveler={(id, name) => actions!.updateTraveler(id, { name })}
          onRebuild={(patch) => {
            actions!.regenerate(patch);
            setDay(0);
            setTab('plan');
            toast('Plan rebuilt with the new settings.');
          }}
        />
      )}

      <AddPlaceModal trip={trip} dayIndex={addingTo} onClose={() => setAddingTo(null)} onAdd={(r) => addingTo != null && addToDay(addingTo, r)} />
      {editable && (
        <ExpenseModal
          trip={trip}
          open={!!stopExpense}
          initial={stopExpense ?? undefined}
          onClose={() => setStopExpense(null)}
          onSave={(e) => {
            actions!.addExpense(e);
            toast(`Logged ${e.title}.`);
          }}
        />
      )}
    </div>
  );
}
