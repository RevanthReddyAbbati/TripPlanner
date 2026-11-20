import { useMemo, useRef, useState, type CSSProperties } from 'react';
import { DestinationPhoto } from '../components/ui/Photo';
import { Link, useNavigate } from 'react-router-dom';
import { LayoutGrid, List, Map as MapIcon, Plus, Search, Upload } from 'lucide-react';
import clsx from 'clsx';
import type { Trip } from '../types';
import { assertTripShape } from '../lib/share';
import { useAllTrips, useTrips } from '../store/trips';
import { computeBudget } from '../engine/budget';
import { summarize, tripEndDate, tripPhase, type TripPhase } from '../engine/expenses';
import { Page } from '../components/layout/AppShell';
import { Button, ButtonLink } from '../components/ui/Button';
import { Badge, Segmented } from '../components/ui/Fields';
import { AvatarStack, EmptyState, PageHeader, Progress } from '../components/ui/Kit';
import { useToast } from '../components/ui/Toast';
import { STATUS_OPTIONS } from '../components/trip/status';
import { dayColor } from '../components/map/colors';
import { inr, plural } from '../lib/format';
import { fmtDate, toISODate } from '../lib/time';

type Filter = 'all' | 'upcoming' | 'live' | 'past';
type View = 'table' | 'cards';
const VIEW_KEY = 'itinera-trips-view';

function readView(): View {
  try {
    return localStorage.getItem(VIEW_KEY) === 'cards' ? 'cards' : 'table';
  } catch {
    return 'table';
  }
}

export default function Trips() {
  const trips = useAllTrips();
  const importTrip = useTrips((s) => s.importTrip);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [view, setViewState] = useState<View>(readView);
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const today = toISODate(new Date());

  const setView = (v: View) => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* per-viewer preference only */
    }
  };

  const rows = useMemo(
    () =>
      trips.map((t, i) => ({
        t,
        i,
        phase: tripPhase(t, today),
        budget: computeBudget(t),
        sum: summarize(t, today),
        end: tripEndDate(t),
      })),
    [trips, today],
  );

  const counts = {
    all: rows.length,
    upcoming: rows.filter((r) => r.phase.kind === 'upcoming').length,
    live: rows.filter((r) => r.phase.kind === 'live').length,
    past: rows.filter((r) => r.phase.kind === 'completed').length,
  };

  const shown = rows.filter(({ t, phase }) => {
    const text = `${t.input.name} ${t.input.origin.name} ${t.input.destinations.map((d) => d.name).join(' ')}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (filter === 'upcoming') return phase.kind === 'upcoming';
    if (filter === 'live') return phase.kind === 'live';
    if (filter === 'past') return phase.kind === 'completed';
    return true;
  });

  const onImport = async (f: File) => {
    try {
      const trip: unknown = JSON.parse(await f.text());
      assertTripShape(trip);
      const id = importTrip(trip);
      toast(`Imported ${trip.input.name}.`);
      navigate(`/app/trips/${id}`);
    } catch {
      toast('That file is not an Itinera trip export.', 'error');
    }
    if (fileRef.current) fileRef.current.value = '';
  };

  return (
    <Page wide>
      <PageHeader
        title="Trips"
        crumbs={[{ label: 'Workspace', to: '/app/home' }, { label: 'Trips' }]}
        actions={
          <>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
            <Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
              Import
            </Button>
            <ButtonLink to="/app/new" icon={<Plus className="h-4 w-4" />}>
              New trip
            </ButtonLink>
          </>
        }
      >
        Every trip in your workspace, with plan, spend and readiness at a glance.
      </PageHeader>

      {trips.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<MapIcon className="h-5 w-5" />}
            title="No trips yet"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <ButtonLink to="/app/new" icon={<Plus className="h-4 w-4" />}>
                  Plan a trip
                </ButtonLink>
                <ButtonLink to="/app/new?sample=goa" variant="secondary">
                  Try the Goa sample
                </ButtonLink>
              </div>
            }
          >
            Plan a trip to get a timed itinerary, a live route map and a budget for your group. You can also import a trip exported from Itinera.
          </EmptyState>
        </div>
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <Segmented
              label="Filter trips"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: `All ${counts.all}` },
                { value: 'upcoming', label: `Upcoming ${counts.upcoming}` },
                { value: 'live', label: `Live ${counts.live}` },
                { value: 'past', label: `Past ${counts.past}` },
              ]}
            />
            <div className="relative min-w-[200px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input className="input pl-9" placeholder="Search by name or place" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search trips" />
            </div>
            <div className="inline-flex rounded-lg border border-line-strong bg-sunken p-0.5" role="radiogroup" aria-label="View">
              {(
                [
                  ['table', List, 'Table view'],
                  ['cards', LayoutGrid, 'Card view'],
                ] as const
              ).map(([v, Icon, label]) => (
                <button
                  key={v}
                  role="radio"
                  aria-checked={view === v}
                  aria-label={label}
                  title={label}
                  onClick={() => setView(v)}
                  className={clsx('grid h-8 w-8 place-items-center rounded-md', view === v ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink')}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          {shown.length === 0 ? (
            <div className="card">
              <EmptyState icon={<Search className="h-5 w-5" />} title="No trips match">
                Clear the search or pick another filter.
              </EmptyState>
            </div>
          ) : view === 'table' ? (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="table-base min-w-[860px]">
                  <thead>
                    <tr>
                      <th>Trip</th>
                      <th>Dates</th>
                      <th>Status</th>
                      <th>Travellers</th>
                      <th className="text-right">Planned / person</th>
                      <th className="w-[180px]">Spent vs cap</th>
                      <th className="text-right">Checklist</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map(({ t, i, phase, budget, sum, end }) => {
                      const done = t.checklist.filter((c) => c.done).length;
                      return (
                        <tr key={t.id} className="cursor-pointer hover:bg-sunken/50" onClick={() => navigate(`/app/trips/${t.id}`)}>
                          <td className="max-w-[300px]">
                            <div className="flex items-center gap-3">
                              <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: dayColor(i) }} />
                              <div className="min-w-0">
                                <Link to={`/app/trips/${t.id}`} className="block truncate font-medium hover:text-brand" onClick={(e) => e.stopPropagation()}>
                                  {t.input.name}
                                </Link>
                                <div className="truncate text-[12px] text-muted">{[t.input.origin.name, ...t.input.destinations.map((d) => d.name)].join(' → ')}</div>
                              </div>
                            </div>
                          </td>
                          <td className="whitespace-nowrap">
                            <div>{fmtDate(t.input.startDate)}</div>
                            <div className="text-[12px] text-muted">
                              {plural(t.days.length, 'day')} · to {fmtDate(end)}
                            </div>
                          </td>
                          <td>
                            <StatusCell phase={phase} trip={t} />
                          </td>
                          <td>
                            <AvatarStack people={t.travelers} max={4} size={24} />
                          </td>
                          <td className="text-right tabular">
                            <div className="font-medium">{inr(budget.perPerson)}</div>
                            <div className={clsx('text-[12px]', budget.overBy ? 'text-bad' : 'text-muted')}>cap {inr(budget.cap)}</div>
                          </td>
                          <td>
                            <div className="flex items-baseline justify-between text-[12px] tabular">
                              <span className="font-medium text-ink">{inr(sum.spent)}</span>
                              <span className="text-muted">{Math.round(sum.pctOfCap * 100)}%</span>
                            </div>
                            <div className="mt-1">
                              <Progress value={sum.spent} max={sum.cap} tone="auto" height={6} label="Spent vs cap" />
                            </div>
                          </td>
                          <td className="text-right tabular">
                            <span className="font-medium">{t.checklist.length ? Math.round((done / t.checklist.length) * 100) : 0}%</span>
                            <div className="text-[12px] text-muted">
                              {done}/{t.checklist.length}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <ul className="stagger grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map(({ t, i, phase, budget, sum, end }, idx) => {
                const done = t.checklist.filter((c) => c.done).length;
                return (
                  <li key={t.id} className="min-w-0" style={{ '--i': idx } as CSSProperties}>
                    <Link to={`/app/trips/${t.id}`} className="lift group card flex h-full flex-col overflow-hidden hover:border-line-strong">
                      <DestinationPhoto dest={t.input.destinations[0]} color={dayColor(i)} zoomOnHover credit={false} sizes="(min-width: 1280px) 400px, (min-width: 640px) 50vw, 100vw" className="h-32">
                        <span className="absolute left-3 top-3 h-2.5 w-2.5 rounded-full ring-2 ring-white" style={{ background: dayColor(i) }} />
                      </DestinationPhoto>
                      <div className="flex flex-1 flex-col p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h2 className="truncate text-[15px] font-semibold">{t.input.name}</h2>
                            <p className="truncate text-[12.5px] text-muted">{t.input.destinations.map((d) => d.name).join(' · ')}</p>
                          </div>
                          <StatusCell phase={phase} trip={t} />
                        </div>
                        <div className="mt-3 flex items-center justify-between text-[12.5px] text-muted">
                          <span>
                            {fmtDate(t.input.startDate)} – {fmtDate(end)}
                          </span>
                          <AvatarStack people={t.travelers} max={4} size={22} />
                        </div>
                        <div className="mt-4 grid grid-cols-2 gap-3 border-t border-line pt-4">
                          <div>
                            <div className="text-[12px] text-muted">Planned / person</div>
                            <div className={clsx('text-[15px] font-semibold tabular', budget.overBy && 'text-bad')}>{inr(budget.perPerson)}</div>
                          </div>
                          <div>
                            <div className="text-[12px] text-muted">Spent of cap</div>
                            <div className="text-[15px] font-semibold tabular">{Math.round(sum.pctOfCap * 100)}%</div>
                          </div>
                        </div>
                        <div className="mt-3">
                          <Progress value={sum.spent} max={sum.cap} tone="auto" height={6} label="Spent vs cap" />
                        </div>
                        <div className="mt-auto flex items-center justify-between pt-4 text-[12px] text-muted">
                          <span>
                            Checklist {done}/{t.checklist.length}
                          </span>
                          <span>{plural(t.expenses.length, 'expense')}</span>
                        </div>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}
    </Page>
  );
}

function StatusCell({ phase, trip }: { phase: TripPhase; trip: Trip }) {
  if (phase.kind === 'live') return <Badge tone="ok">Live · day {phase.dayIndex + 1}</Badge>;
  const status = STATUS_OPTIONS.find((s) => s.value === trip.status) ?? STATUS_OPTIONS[1];
  if (phase.kind === 'completed') return <Badge tone="neutral">Completed</Badge>;
  return <Badge tone={status.tone}>{status.label}</Badge>;
}
