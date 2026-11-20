import { useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarDays, MapPinned, Plus, Search, Upload, Users } from 'lucide-react';
import type { Trip, TripStatus } from '../types';
import { useTrips } from '../store/trips';
import { useSettings } from '../store/settings';
import { computeBudget } from '../engine/budget';
import { Page, PageHeader } from '../components/layout/AppShell';
import { Button, ButtonLink } from '../components/ui/Button';
import { Badge, Segmented } from '../components/ui/Fields';
import { useToast } from '../components/ui/Toast';
import { inr, plural } from '../lib/format';
import { addDays, fmtDate, toISODate } from '../lib/time';

export const STATUS_OPTIONS: { value: TripStatus; label: string; tone: 'neutral' | 'brand' | 'ok' | 'warn' }[] = [
  { value: 'draft', label: 'Draft', tone: 'neutral' },
  { value: 'planned', label: 'Planned', tone: 'brand' },
  { value: 'booked', label: 'Booked', tone: 'ok' },
  { value: 'completed', label: 'Completed', tone: 'warn' },
];

type Filter = 'all' | 'upcoming' | 'past';

export default function Dashboard() {
  const trips = useTrips((s) => s.order.map((id) => s.trips[id]).filter(Boolean));
  const importTrip = useTrips((s) => s.importTrip);
  const name = useSettings((s) => s.displayName);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const fileRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const today = toISODate(new Date());

  const rows = useMemo(
    () =>
      trips.map((t) => {
        const b = computeBudget(t);
        const end = addDays(t.input.startDate, t.days.length - 1);
        return { t, b, end };
      }),
    [trips],
  );

  const shown = rows.filter(({ t, end }) => {
    const text = `${t.input.name} ${t.input.destinations.map((d) => d.name).join(' ')}`.toLowerCase();
    if (q && !text.includes(q.toLowerCase())) return false;
    if (filter === 'upcoming') return end >= today;
    if (filter === 'past') return end < today;
    return true;
  });

  const upcoming = rows.filter((r) => r.end >= today).length;
  const planned = rows.reduce((a, r) => a + r.b.total, 0);
  const days = rows.reduce((a, r) => a + r.t.days.length, 0);

  const onImport = async (f: File) => {
    try {
      const trip = JSON.parse(await f.text()) as Trip;
      if (trip.version !== 1 || !Array.isArray(trip.days)) throw new Error();
      const id = importTrip(trip);
      toast(`Imported ${trip.input.name}.`);
      navigate(`/app/trips/${id}`);
    } catch {
      toast('That file is not an Itinera trip export.', 'error');
    }
  };

  return (
    <Page>
      <PageHeader
        eyebrow={name ? `Welcome back, ${name}` : 'Your workspace'}
        title="Trips"
        actions={
          <>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])} />
            <Button variant="secondary" icon={<Upload className="h-4 w-4" />} onClick={() => fileRef.current?.click()}>
              Import
            </Button>
            <ButtonLink to="/app/new" icon={<Plus className="h-4 w-4" />}>
              Plan a trip
            </ButtonLink>
          </>
        }
      />

      {trips.length > 0 && (
        <div className="mb-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line md:grid-cols-4">
          <Kpi label="Trips" value={String(trips.length)} />
          <Kpi label="Upcoming" value={String(upcoming)} />
          <Kpi label="Days planned" value={String(days)} />
          <Kpi label="Planned spend, all groups" value={inr(planned)} />
        </div>
      )}

      {trips.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input className="input pl-9" placeholder="Search trips or places" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search trips" />
            </div>
            <Segmented
              label="Filter trips"
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'upcoming', label: 'Upcoming' },
                { value: 'past', label: 'Past' },
              ]}
            />
          </div>
          {shown.length === 0 ? (
            <p className="card p-8 text-center text-muted">No trips match. Clear the search or switch the filter.</p>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {shown.map(({ t, b, end }) => {
                const status = STATUS_OPTIONS.find((s) => s.value === t.status)!;
                const done = t.checklist.filter((c) => c.done).length;
                return (
                  <li key={t.id}>
                    <Link to={`/app/trips/${t.id}`} className="card flex h-full flex-col p-5 transition-shadow hover:shadow-pop">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h2 className="min-w-0 text-[17px] font-semibold leading-snug">{t.input.name}</h2>
                        <Badge tone={status.tone}>{status.label}</Badge>
                      </div>
                      <div className="space-y-1.5 text-[13.5px] text-muted">
                        <div className="flex items-center gap-2">
                          <MapPinned className="h-4 w-4 shrink-0" />
                          <span className="truncate">{t.input.destinations.map((d) => d.name).join(', ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CalendarDays className="h-4 w-4 shrink-0" />
                          {fmtDate(t.input.startDate)} – {fmtDate(end)}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 shrink-0" />
                          {plural(t.input.travelers, 'person', 'people')} from {t.input.origin.name}
                        </div>
                      </div>
                      <div className="mt-auto pt-4">
                        <div className="flex items-baseline justify-between">
                          <span className="font-display text-[20px] font-bold tabular">{inr(b.perPerson)}</span>
                          <span className={b.overBy ? 'text-[12.5px] font-medium text-bad' : 'text-[12.5px] font-medium text-ok'}>
                            {b.overBy ? `${inr(b.overBy)} over` : `${inr(b.cap - b.perPerson)} under`} cap
                          </span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-[12px] text-muted">
                          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-sunken">
                            <div className="h-full bg-ok" style={{ width: `${t.checklist.length ? (done / t.checklist.length) * 100 : 0}%` }} />
                          </div>
                          {done}/{t.checklist.length} ready
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

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="text-[12px] text-muted">{label}</div>
      <div className="font-display text-[22px] font-bold tabular">{value}</div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="card grid items-center gap-8 p-8 md:grid-cols-[1.2fr_1fr]">
      <div>
        <h2 className="text-[22px] font-bold">Plan your first trip</h2>
        <p className="mt-2 max-w-[52ch] text-muted">
          Pick where you're starting, where you want to go and how you'll travel. You get a day-by-day plan with timings, a live map with routes, and a budget split across your group.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <ButtonLink to="/app/new" icon={<Plus className="h-4 w-4" />}>
            Plan a trip
          </ButtonLink>
          <ButtonLink to="/app/explore" variant="secondary">
            Browse destinations
          </ButtonLink>
        </div>
      </div>
      <ol className="space-y-3 text-[14px]">
        {['Choose destinations and dates', 'Pick transport, stay and budget', 'Edit the plan on the map', 'Share it with your group'].map((s, i) => (
          <li key={s} className="flex items-center gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-brand-soft font-semibold text-brand">{i + 1}</span>
            {s}
          </li>
        ))}
      </ol>
    </div>
  );
}
