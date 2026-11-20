import { useMemo, type ReactNode } from 'react';
import {
  AlertTriangle, ArrowRight, BedDouble, BusFront, CalendarClock, Car, Clock, Flag, MapPin, Plane, Plus, TrainFront, Wallet,
} from 'lucide-react';
import clsx from 'clsx';
import type { Destination, Leg, Stop, Trip } from '../../types';
import type { WorkspaceActions, WorkspaceTab } from './TripWorkspace';
import { summarize, tripPhase, CATEGORY } from '../../engine/expenses';
import { computeBudget } from '../../engine/budget';
import { modeLabel } from '../../engine/transport';
import { fmtDate, fmtDay, fmtDuration, fmtTime } from '../../lib/time';
import { inr, plural } from '../../lib/format';
import { Avatar, AvatarStack, Card, EmptyState, Progress, Stat, StatGrid } from '../ui/Kit';
import { Button } from '../ui/Button';
import { Donut } from '../charts/Charts';
import { WeatherCard, type DestinationDates } from '../overview/WeatherCard';
import { bookingSuggestions } from '../bookings/suggest';
import { dayColor } from '../map/colors';

export function OverviewPanel({
  trip, readOnly, onNavigate,
}: {
  trip: Trip;
  readOnly?: boolean;
  actions?: WorkspaceActions;
  onNavigate: (tab: WorkspaceTab, extra?: Record<string, string>) => void;
}) {
  const phase = tripPhase(trip);
  const s = useMemo(() => summarize(trip), [trip]);
  const budget = useMemo(() => computeBudget(trip), [trip]);
  const suggestions = useMemo(() => bookingSuggestions(trip), [trip]);
  const D = trip.days.length;
  const n = trip.input.travelers;

  const checkDone = trip.checklist.filter((c) => c.done).length;
  const activeBookings = trip.bookings.filter((b) => b.status !== 'cancelled');
  const confirmed = activeBookings.filter((b) => b.status === 'confirmed').length;

  const focusIndex = phase.kind === 'live' ? phase.dayIndex : 0;
  const focusDay = trip.days[focusIndex];
  const focusLabel = phase.kind === 'live' ? 'Today' : phase.kind === 'upcoming' ? 'Day 1' : 'Day 1 recap';

  const destDates = useMemo<DestinationDates[]>(() => {
    const map = new Map<string, Set<string>>();
    trip.days.forEach((d) => {
      const ids = new Set<string>();
      if (d.baseId) ids.add(d.baseId);
      if (d.night.type === 'stay') ids.add(d.night.destinationId);
      ids.forEach((id) => map.set(id, (map.get(id) ?? new Set()).add(d.date)));
    });
    return trip.input.destinations
      .filter((d) => map.has(d.id))
      .map((dest) => ({ dest, dates: [...map.get(dest.id)!].sort() }));
  }, [trip.days, trip.input.destinations]);

  const recent = useMemo(
    () =>
      [...trip.expenses]
        .sort((a, b) => (b.date + (b.time ?? '') + b.createdAt).localeCompare(a.date + (a.time ?? '') + a.createdAt))
        .slice(0, 5),
    [trip.expenses],
  );
  const person = (id: string) => trip.travelers.find((t) => t.id === id);
  const over = s.spent > s.cap;

  return (
    <div className="space-y-6">
      {/* Status hero */}
      <section className="card overflow-hidden">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0 flex-1">
            <div
              className={clsx(
                'mb-2 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[12px] font-semibold',
                phase.kind === 'live' && 'bg-ok-soft text-ok',
                phase.kind === 'upcoming' && 'bg-brand-soft text-brand',
                phase.kind === 'completed' && 'bg-sunken text-muted',
              )}
            >
              {phase.kind === 'live' ? (
                <>
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-ok" /> Live now
                </>
              ) : phase.kind === 'upcoming' ? (
                <>
                  <CalendarClock className="h-3.5 w-3.5" /> Upcoming
                </>
              ) : (
                <>
                  <Flag className="h-3.5 w-3.5" /> Completed
                </>
              )}
            </div>
            <h2 className="text-[22px] font-semibold leading-tight">
              {phase.kind === 'upcoming' &&
                (phase.daysToGo === 1 ? 'Starts tomorrow' : `Starts in ${phase.daysToGo} days`)}
              {phase.kind === 'live' && `Day ${phase.dayIndex + 1} of ${D}`}
              {phase.kind === 'completed' &&
                (phase.daysAgo === 0 ? 'Finished today' : `Completed ${plural(phase.daysAgo, 'day')} ago`)}
            </h2>
            <p className="mt-0.5 text-[13.5px] text-muted">
              {fmtDate(trip.input.startDate)} – {fmtDate(trip.days[D - 1]?.date ?? trip.input.startDate)} · {plural(D, 'day')} ·{' '}
              {plural(n, 'traveller')}
            </p>
            {phase.kind === 'live' && (
              <div className="mt-3 max-w-md">
                <Progress value={phase.dayIndex + 1} max={D} tone="brand" height={6} label="Trip progress" />
              </div>
            )}
            <RouteChips trip={trip} />
          </div>
          <div className="flex shrink-0 items-center gap-3 lg:flex-col lg:items-end">
            <AvatarStack people={trip.travelers} max={6} size={30} />
            {!readOnly && (
              <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={() => onNavigate('expenses', { add: '1' })}>
                Add expense
              </Button>
            )}
          </div>
        </div>
      </section>

      {trip.warnings.length > 0 && (
        <ul className="space-y-1.5">
          {trip.warnings.map((w) => (
            <li key={w} className="flex items-start gap-2 rounded-lg border border-warn/25 bg-warn-soft px-3 py-2 text-[13px] text-warn">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> {w}
            </li>
          ))}
        </ul>
      )}

      <StatGrid cols={5}>
        <Stat
          label="Planned per person"
          value={inr(budget.perPerson)}
          sub={budget.overBy ? `${inr(budget.overBy)} over the ${inr(budget.cap)} cap` : `${inr(budget.cap - budget.perPerson)} under the cap`}
          tone={budget.overBy ? 'bad' : 'ok'}
        />
        <Stat label="Spent so far" value={inr(s.spent)} sub={`${Math.round(s.pctOfCap * 100)}% of ${inr(s.cap)} group cap`} tone={over ? 'bad' : s.pctOfCap > 0.85 ? 'warn' : undefined} />
        <Stat label="Remaining" value={inr(Math.max(0, s.remaining))} sub={over ? `${inr(-s.remaining)} over budget` : s.daysLeft ? `${inr(s.dailyAllowance)} a day for ${plural(s.daysLeft, 'day')}` : 'Trip finished'} tone={over ? 'bad' : 'ok'} />
        <Stat label="Checklist" value={`${checkDone}/${trip.checklist.length}`} sub={trip.checklist.length ? `${Math.round((checkDone / trip.checklist.length) * 100)}% ready` : 'No items'} />
        <Stat
          label="Bookings"
          value={activeBookings.length ? `${confirmed}/${activeBookings.length}` : '0'}
          sub={activeBookings.length ? `${confirmed} confirmed` : suggestions.length ? `${plural(suggestions.length, 'item')} to book` : 'Nothing to book'}
          tone={activeBookings.length && confirmed === activeBookings.length ? 'ok' : undefined}
        />
      </StatGrid>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-6">
          <Card
            title={`${focusLabel} · ${focusDay ? fmtDay(focusDay.date) : ''}`}
            subtitle={focusDay?.title}
            actions={
              <Button size="xs" variant="ghost" onClick={() => onNavigate('plan')}>
                Open itinerary <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            }
            bodyClass="p-0"
          >
            {focusDay && focusDay.stops.length ? <DayAgenda stops={focusDay.stops} color={dayColor(focusIndex)} /> : <p className="px-5 py-6 text-[13.5px] text-muted">Nothing planned for this day.</p>}
          </Card>

          <Card title="Route" subtitle={`${trip.legs.reduce((a, l) => a + l.distanceKm, 0).toLocaleString('en-IN')} km in ${plural(trip.legs.length, 'journey')}`} bodyClass="p-5">
            <RouteTimeline trip={trip} />
          </Card>
        </div>

        <div className="min-w-0 space-y-6">
          <Card
            title="Budget health"
            subtitle={`Group cap ${inr(s.cap)}`}
            actions={
              <Button size="xs" variant="ghost" onClick={() => onNavigate('expenses')}>
                Details <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            }
          >
            <div className="flex flex-col items-center gap-5 sm:flex-row">
              <Donut
                size={148}
                thickness={18}
                slices={[
                  { key: 'spent', label: 'Spent', value: Math.min(s.spent, s.cap || s.spent), color: over ? 'rgb(var(--bad))' : 'rgb(var(--brand))' },
                  { key: 'left', label: 'Remaining', value: Math.max(0, s.remaining), color: 'rgb(var(--line-strong))' },
                ]}
                center={
                  <div>
                    <div className={clsx('text-[20px] font-semibold tabular', over && 'text-bad')}>{Math.round(s.pctOfCap * 100)}%</div>
                    <div className="text-[11.5px] text-muted">of cap used</div>
                  </div>
                }
              />
              <dl className="grid w-full flex-1 grid-cols-2 gap-x-4 gap-y-3 text-[13px] sm:grid-cols-1">
                <Row k="Spent" v={inr(s.spent)} />
                <Row k={over ? 'Over by' : 'Remaining'} v={inr(Math.abs(s.remaining))} tone={over ? 'bad' : 'ok'} />
                <Row k="Per person" v={inr(s.perPersonSpent)} />
                <Row k={phase.kind === 'live' ? 'Forecast at this pace' : 'Planned total'} v={inr(phase.kind === 'live' ? s.forecast : s.planned)} tone={phase.kind === 'live' && s.forecast > s.cap ? 'bad' : undefined} />
              </dl>
            </div>
            {s.overCategories.length > 0 && (
              <p className="mt-4 rounded-lg bg-bad-soft px-3 py-2 text-[12.5px] font-medium text-bad">
                Over plan on {s.overCategories.map((c) => CATEGORY[c].label.toLowerCase()).join(', ')}.
              </p>
            )}
            {!readOnly && (
              <Button className="mt-4 w-full" variant="secondary" icon={<Plus className="h-4 w-4" />} onClick={() => onNavigate('expenses', { add: '1' })}>
                Add expense
              </Button>
            )}
          </Card>

          <WeatherCard items={destDates} />

          <Card
            title="Recent expenses"
            actions={
              trip.expenses.length > 0 && (
                <Button size="xs" variant="ghost" onClick={() => onNavigate('expenses')}>
                  View all <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )
            }
            bodyClass="p-0"
          >
            {recent.length === 0 ? (
              <EmptyState icon={<Wallet className="h-5 w-5" />} title="No expenses yet">
                Log what you spend during the trip to track it against the budget.
              </EmptyState>
            ) : (
              <ul className="divide-y divide-line">
                {recent.map((e) => {
                  const p = person(e.paidBy);
                  return (
                    <li key={e.id} className="flex items-center gap-3 px-5 py-2.5">
                      <span className="h-8 w-1 shrink-0 rounded-full" style={{ background: CATEGORY[e.category].color }} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-medium">{e.title}</div>
                        <div className="truncate text-[12px] text-muted">
                          {fmtDay(e.date)} · {CATEGORY[e.category].label}
                          {p ? ` · paid by ${p.name}` : ''}
                        </div>
                      </div>
                      <span className="shrink-0 text-[13.5px] font-semibold tabular">{inr(e.amount)}</span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card title="Travellers" subtitle={plural(trip.travelers.length, 'person', 'people')} bodyClass="p-0">
            <ul className="divide-y divide-line">
              {trip.travelers.map((t) => {
                const b = s.balances.find((x) => x.travelerId === t.id);
                return (
                  <li key={t.id} className="flex items-center gap-3 px-5 py-2.5">
                    <Avatar person={t} size={30} />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{t.name}</span>
                    {b && (b.paid > 0 || b.share > 0) && (
                      <span className="text-right text-[12px] text-muted">
                        <span className="block tabular text-ink-2">Paid {inr(b.paid)}</span>
                        <span className={clsx('tabular', b.net > 0 ? 'text-ok' : b.net < 0 ? 'text-bad' : '')}>
                          {b.net > 0 ? `Gets back ${inr(b.net)}` : b.net < 0 ? `Owes ${inr(-b.net)}` : 'Settled'}
                        </span>
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ k, v, tone }: { k: string; v: string; tone?: 'ok' | 'bad' }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted">{k}</dt>
      <dd className={clsx('font-semibold tabular', tone === 'ok' && 'text-ok', tone === 'bad' && 'text-bad')}>{v}</dd>
    </div>
  );
}

function RouteChips({ trip }: { trip: Trip }) {
  const names = [trip.input.origin.name, ...trip.input.destinations.map((d) => d.name), trip.input.origin.name];
  return (
    <div className="mt-4 flex flex-wrap items-center gap-1.5">
      {names.map((nm, i) => (
        <span key={i} className="inline-flex items-center gap-1.5">
          {i > 0 && <ArrowRight className="h-3.5 w-3.5 text-muted" />}
          <span
            className={clsx(
              'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[12.5px] font-medium',
              i === 0 || i === names.length - 1 ? 'border-line bg-sunken text-muted' : 'border-line-strong bg-surface text-ink-2',
            )}
          >
            {(i === 0 || i === names.length - 1) && <MapPin className="h-3 w-3" />}
            {nm}
          </span>
        </span>
      ))}
    </div>
  );
}

function DayAgenda({ stops, color }: { stops: Stop[]; color: string }) {
  return (
    <ol className="divide-y divide-line">
      {stops.map((s) => (
        <li key={s.id} className="grid grid-cols-[76px_minmax(0,1fr)_auto] items-start gap-3 px-5 py-2.5">
          <span className="pt-0.5 text-[12.5px] font-medium text-muted tabular">{fmtTime(s.start)}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: s.kind === 'visit' || s.kind === 'custom' ? color : 'rgb(var(--line-strong))' }}
              />
              <span className={clsx('truncate text-[13.5px]', s.kind === 'visit' || s.kind === 'custom' || s.kind === 'travel' ? 'font-medium' : 'text-ink-2')}>{s.title}</span>
            </div>
            {s.kind === 'travel' && <div className="pl-4 text-[12px] text-muted">{fmtDuration(s.end - s.start)}</div>}
          </div>
          {s.cost > 0 ? <span className="text-[12.5px] text-muted tabular">{inr(s.cost)}</span> : <span />}
        </li>
      ))}
    </ol>
  );
}

function legIcon(l: Leg) {
  const m = l.mode;
  if (m === 'flight') return Plane;
  if (m.startsWith('train')) return TrainFront;
  if (m.startsWith('bus') || m === 'public') return BusFront;
  return Car;
}

function RouteTimeline({ trip }: { trip: Trip }) {
  const nights = new Map<string, string[]>();
  trip.days.forEach((d) => {
    if (d.night.type === 'stay') nights.set(d.night.destinationId, [...(nights.get(d.night.destinationId) ?? []), d.date]);
  });
  const n = trip.input.travelers;
  const stopRow = (key: string, label: string, sub: string, kind: 'home' | 'dest', dest?: Destination) => (
    <li key={key} className="relative flex gap-3 pb-5 last:pb-0">
      <span
        className={clsx(
          'relative z-[1] mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full',
          kind === 'home' ? 'bg-sunken text-muted ring-1 ring-line-strong' : 'bg-brand text-brand-ink',
        )}
      >
        {kind === 'home' ? <MapPin className="h-3.5 w-3.5" /> : <BedDouble className="h-3.5 w-3.5" />}
      </span>
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold">{label}</div>
        <div className="text-[12.5px] text-muted">{sub}</div>
        {dest && dest.places.length > 0 && <div className="text-[12px] text-muted">{plural(dest.places.length, 'place')} to see</div>}
      </div>
    </li>
  );
  const legRow = (l: Leg) => {
    const Icon = legIcon(l);
    const dayIdx = Math.min(trip.days.length - 1, Math.floor(l.departAbs / 1440));
    return (
      <li key={l.id} className="relative flex gap-3 pb-5">
        <span className="relative z-[1] mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-surface text-muted ring-1 ring-line">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="flex min-w-0 flex-1 flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5 rounded-lg bg-sunken/60 px-3 py-2">
          <div className="min-w-0">
            <div className="truncate text-[13px] font-medium">{modeLabel(l.mode)}</div>
            <div className="text-[12px] text-muted">
              {fmtDay(trip.days[dayIdx]?.date ?? trip.input.startDate)} · <Clock className="inline h-3 w-3" /> {fmtDuration(l.durationMin)} · {l.distanceKm} km
              {l.overnight ? ' · overnight' : ''}
            </div>
          </div>
          <span className="text-[12.5px] font-semibold tabular">
            {inr(l.cost * n)}
            <span className="font-normal text-muted"> group</span>
          </span>
        </div>
      </li>
    );
  };

  const items: ReactNode[] = [stopRow('origin', trip.input.origin.name, `Start · ${fmtDay(trip.input.startDate)}`, 'home')];
  trip.input.destinations.forEach((d, i) => {
    if (trip.legs[i]) items.push(legRow(trip.legs[i]));
    const ds = nights.get(d.id) ?? [];
    const sub = ds.length ? `${fmtDay(ds[0])} – ${fmtDay(ds[ds.length - 1])} · ${plural(ds.length, 'night')}` : 'Day visit, no overnight stay';
    items.push(stopRow(d.id, d.name, sub, 'dest', d));
  });
  const ret = trip.legs[trip.legs.length - 1];
  if (ret && trip.legs.length > trip.input.destinations.length) items.push(legRow(ret));
  items.push(stopRow('home', trip.input.origin.name, `Home · ${fmtDay(trip.days[trip.days.length - 1]?.date ?? trip.input.startDate)}`, 'home'));

  return <ol className="relative before:absolute before:bottom-3 before:left-3 before:top-3 before:w-px before:bg-line-strong">{items}</ol>;
}
