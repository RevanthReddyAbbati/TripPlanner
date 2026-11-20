import { useMemo, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle, ArrowRight, BarChart3, CalendarDays, CheckCircle2, Compass, MapPin, Plus, ReceiptIndianRupee, Ticket, Wallet, Wand2,
} from 'lucide-react';
import clsx from 'clsx';
import type { Trip } from '../types';
import { useAllTrips } from '../store/trips';
import { useSettings } from '../store/settings';
import { summarize, tripEndDate, tripPhase, CATEGORY } from '../engine/expenses';
import { computeBudget } from '../engine/budget';
import { Page } from '../components/layout/AppShell';
import { ButtonLink } from '../components/ui/Button';
import { Card, EmptyState, Progress, Stat, StatGrid, AvatarStack, Dot } from '../components/ui/Kit';
import { dayColor } from '../components/map/colors';
import { DestinationPhoto } from '../components/ui/Photo';
import { CountUp } from '../components/ui/CountUp';
import { inr, plural } from '../lib/format';
import { fmtDate, fmtDay, fmtTime, toISODate } from '../lib/time';

export default function Home() {
  const trips = useAllTrips();
  const name = useSettings((s) => s.displayName);
  const today = toISODate(new Date());
  const year = today.slice(0, 4);

  const rows = useMemo(
    () =>
      trips.map((t, i) => ({
        t,
        i,
        phase: tripPhase(t, today),
        sum: summarize(t, today),
        budget: computeBudget(t),
      })),
    [trips, today],
  );

  const live = rows.find((r) => r.phase.kind === 'live');
  const upcoming = rows
    .filter((r) => r.phase.kind === 'upcoming')
    .sort((a, b) => a.t.input.startDate.localeCompare(b.t.input.startDate));
  const hero = live ?? upcoming[0];

  const spentYear = rows.reduce((a, r) => a + r.t.expenses.filter((e) => e.date.startsWith(year)).reduce((s, e) => s + e.amount, 0), 0);
  const plannedUpcoming = upcoming.reduce((a, r) => a + r.budget.total, 0);
  const personDays = rows.reduce((a, r) => a + r.t.input.travelers * r.t.days.length, 0);
  const totalCost = rows.reduce((a, r) => a + (r.t.expenses.length ? r.sum.spent : r.budget.total), 0);
  const avgPPD = personDays ? totalCost / personDays : 0;

  const recent = rows
    .flatMap((r) => r.t.expenses.map((e) => ({ e, r })))
    .sort((a, b) => (b.e.date + (b.e.time ?? '') + b.e.createdAt).localeCompare(a.e.date + (a.e.time ?? '') + a.e.createdAt))
    .slice(0, 6);

  const attention = useMemo(() => {
    const out: { key: string; icon: 'warn' | 'bad' | 'info'; text: string; sub: string; to: string }[] = [];
    rows.forEach(({ t, phase, sum }) => {
      if (phase.kind === 'completed') return;
      if (sum.spent > sum.cap) out.push({ key: t.id + 'over', icon: 'bad', text: `${t.input.name} is over budget`, sub: `${inr(sum.spent - sum.cap)} above the group cap`, to: `/app/trips/${t.id}?tab=expenses` });
      else if (sum.overCategories.length)
        out.push({ key: t.id + 'cat', icon: 'warn', text: `${sum.overCategories.length} categor${sum.overCategories.length > 1 ? 'ies' : 'y'} over plan`, sub: t.input.name, to: `/app/trips/${t.id}?tab=budget` });
      const pending = t.bookings.filter((b) => b.status === 'pending').length;
      if (pending) out.push({ key: t.id + 'pend', icon: 'warn', text: `${plural(pending, 'booking')} pending`, sub: t.input.name, to: `/app/trips/${t.id}?tab=bookings` });
      const todo = t.checklist.filter((c) => c.category === 'booking' && !c.done);
      todo.slice(0, 2).forEach((c) => out.push({ key: c.id + t.id, icon: 'info', text: c.label, sub: t.input.name, to: `/app/trips/${t.id}?tab=checklist` }));
    });
    return out.slice(0, 7);
  }, [rows]);

  const greeting = (() => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  })();

  return (
    <Page wide>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="text-[13px] text-muted">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</div>
          <h1 className="mt-0.5 text-[24px] font-semibold sm:text-[26px]">
            {greeting}
            {name ? `, ${name}` : ''}
          </h1>
        </div>
        {trips.length > 0 && (
          <div className="flex gap-2">
            {hero && (
              <ButtonLink to={`/app/trips/${hero.t.id}?tab=expenses&add=1`} variant="secondary" icon={<ReceiptIndianRupee className="h-4 w-4" />}>
                Add expense
              </ButtonLink>
            )}
            <ButtonLink to="/app/new" icon={<Plus className="h-4 w-4" />}>
              New trip
            </ButtonLink>
          </div>
        )}
      </div>

      {trips.length === 0 ? (
        <Onboarding />
      ) : (
        <div className="space-y-6">
          {hero && <HeroCard row={hero} />}

          <StatGrid>
            <Stat label="Active and upcoming" value={String((live ? 1 : 0) + upcoming.length)} sub={live ? '1 trip in progress' : upcoming[0] ? `Next in ${plural((upcoming[0].phase as { daysToGo: number }).daysToGo, 'day')}` : 'Nothing scheduled'} tone={live ? 'ok' : undefined} />
            <Stat label={`Spent in ${year}`} value={<CountUp value={spentYear} format={inr} />} sub={`${rows.reduce((a, r) => a + r.t.expenses.length, 0)} expenses logged`} />
            <Stat label="Planned, upcoming trips" value={<CountUp value={plannedUpcoming} format={inr} />} sub={`${plural(upcoming.length, 'trip')} ahead`} />
            <Stat label="Avg per person per day" value={<CountUp value={avgPPD} format={inr} />} sub="Across all trips" />
          </StatGrid>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-6">
              <Card
                title="Upcoming trips"
                actions={
                  <Link to="/app/trips" className="text-[13px] font-medium text-brand hover:underline">
                    View all
                  </Link>
                }
                bodyClass=""
              >
                {upcoming.length === 0 && !live ? (
                  <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="No upcoming trips" action={<ButtonLink to="/app/new" size="sm">Plan a trip</ButtonLink>}>
                    Plan your next trip and it will show up here.
                  </EmptyState>
                ) : (
                  <ul className="divide-y divide-line">
                    {[...(live ? [live] : []), ...upcoming].slice(0, 5).map(({ t, i, phase, budget }) => (
                      <li key={t.id}>
                        <Link to={`/app/trips/${t.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-sunken/60">
                          <span className="h-9 w-1 shrink-0 rounded-full" style={{ background: dayColor(i) }} />
                          <div className="min-w-0 flex-1">
                            <div className="truncate text-[13.5px] font-medium">{t.input.name}</div>
                            <div className="truncate text-[12.5px] text-muted">
                              {fmtDate(t.input.startDate)} · {t.input.destinations.map((d) => d.name).join(', ')}
                            </div>
                          </div>
                          <AvatarStack people={t.travelers} max={3} size={22} />
                          <div className="hidden w-24 text-right sm:block">
                            <div className="text-[13px] font-medium tabular">{inr(budget.perPerson)}</div>
                            <div className="text-[11.5px] text-muted">per person</div>
                          </div>
                          <span
                            className={clsx(
                              'w-[76px] shrink-0 rounded-full px-2 py-0.5 text-center text-[11.5px] font-semibold',
                              phase.kind === 'live' ? 'bg-ok-soft text-ok' : 'bg-sunken text-ink-2',
                            )}
                          >
                            {phase.kind === 'live' ? 'Live' : phase.kind === 'upcoming' ? (phase.daysToGo === 1 ? 'Tomorrow' : `In ${phase.daysToGo}d`) : 'Done'}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <Card
                title="Recent expenses"
                actions={
                  <Link to="/app/expenses" className="text-[13px] font-medium text-brand hover:underline">
                    View all
                  </Link>
                }
                bodyClass=""
              >
                {recent.length === 0 ? (
                  <EmptyState icon={<Wallet className="h-5 w-5" />} title="No expenses yet">
                    Log what you spend during a trip to track it against your budget and settle up with your group.
                  </EmptyState>
                ) : (
                  <ul className="divide-y divide-line">
                    {recent.map(({ e, r }) => {
                      const cat = CATEGORY[e.category];
                      const payer = r.t.travelers.find((p) => p.id === e.paidBy);
                      return (
                        <li key={e.id}>
                          <Link to={`/app/trips/${r.t.id}?tab=expenses`} className="flex items-center gap-3 px-5 py-2.5 hover:bg-sunken/60">
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-white" style={{ background: cat.color }}>
                              <ReceiptIndianRupee className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="truncate text-[13.5px] font-medium">{e.title}</div>
                              <div className="truncate text-[12px] text-muted">
                                {r.t.input.name} · {fmtDay(e.date)}
                                {payer ? ` · ${payer.name} paid` : ''}
                              </div>
                            </div>
                            <span className="text-[13.5px] font-semibold tabular">{inr(e.amount)}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </div>

            <div className="min-w-0 space-y-6">
              <Card title="Needs attention" bodyClass="">
                {attention.length === 0 ? (
                  <div className="flex items-center gap-3 px-5 py-6 text-[13.5px] text-muted">
                    <CheckCircle2 className="h-5 w-5 text-ok" /> You're all caught up.
                  </div>
                ) : (
                  <ul className="divide-y divide-line">
                    {attention.map((a) => (
                      <li key={a.key}>
                        <Link to={a.to} className="flex items-start gap-3 px-5 py-3 hover:bg-sunken/60">
                          {a.icon === 'info' ? (
                            <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                          ) : (
                            <AlertTriangle className={clsx('mt-0.5 h-4 w-4 shrink-0', a.icon === 'bad' ? 'text-bad' : 'text-warn')} />
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="text-[13.5px] font-medium">{a.text}</div>
                            <div className="truncate text-[12px] text-muted">{a.sub}</div>
                          </div>
                          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </Card>

              <div className="grid grid-cols-2 gap-3">
                <QuickTile to="/app/new" icon={<Plus className="h-4 w-4" />} title="New trip" sub="Plan in minutes" />
                <QuickTile to={hero ? `/app/trips/${hero.t.id}?tab=expenses&add=1` : '/app/expenses'} icon={<ReceiptIndianRupee className="h-4 w-4" />} title="Add expense" sub={hero ? hero.t.input.name : 'Log spending'} />
                <QuickTile to="/app/explore" icon={<Compass className="h-4 w-4" />} title="Explore" sub="14 destinations" />
                <QuickTile to="/app/reports" icon={<BarChart3 className="h-4 w-4" />} title="Reports" sub="Where money went" />
              </div>
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

/** A short photo band across the top of the hero card, one photo per destination. */
function TripBand({ trip, color }: { trip: Trip; color: string }) {
  const dests = trip.input.destinations.slice(0, 3);
  return (
    <div className="group grid h-24 gap-px bg-line sm:h-28" style={{ gridTemplateColumns: `repeat(${Math.max(1, dests.length)}, minmax(0, 1fr))` }}>
      {dests.map((d) => (
        <DestinationPhoto key={d.id} dest={d} color={color} priority credit={false} sizes="(min-width: 1024px) 40vw, 100vw" className="h-full" />
      ))}
    </div>
  );
}

function HeroCard({ row }: { row: { t: Trip; i: number; phase: ReturnType<typeof tripPhase>; sum: ReturnType<typeof summarize>; budget: ReturnType<typeof computeBudget> } }) {
  const { t, i, phase, sum, budget } = row;
  const D = t.days.length;
  const route = [t.input.origin.name, ...t.input.destinations.map((d) => d.name)].join(' → ');
  const color = dayColor(i);

  if (phase.kind === 'live') {
    const day = t.days[phase.dayIndex];
    const todaySpent = sum.byDay[phase.dayIndex]?.spent ?? 0;
    const now = new Date().getHours() * 60 + new Date().getMinutes();
    const next = day.stops.filter((s) => s.end >= now && s.kind !== 'meal' && s.kind !== 'rest').slice(0, 3);
    return (
      <section className="card overflow-hidden">
        <TripBand trip={t} color={color} />
        <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-ok-soft px-2 py-0.5 text-[11.5px] font-semibold text-ok">
                <span className="live-dot" /> Live · Day {phase.dayIndex + 1} of {D}
              </span>
              <span className="truncate text-[12.5px] text-muted">{route}</span>
            </div>
            <h2 className="mt-2 text-[20px] font-semibold">{t.input.name}</h2>
            <p className="text-[13.5px] text-muted">{day.title}</p>
            <div className="mt-4">
              <div className="eyebrow mb-2">Up next today</div>
              {next.length === 0 ? (
                <p className="text-[13.5px] text-muted">Nothing else planned today.</p>
              ) : (
                <ul className="space-y-1.5">
                  {next.map((s) => (
                    <li key={s.id} className="flex items-center gap-3 text-[13.5px]">
                      <span className="w-20 shrink-0 text-[12.5px] tabular text-muted">{fmtTime(s.start)}</span>
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-muted" />
                      <span className="truncate">{s.title}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
          <div className="min-w-0 rounded-xl border border-line bg-sunken/50 p-4">
            <div className="flex items-baseline justify-between">
              <span className="text-[12.5px] font-medium text-muted">Spent today</span>
              <span className="text-[12.5px] text-muted">Allowance {inr(sum.dailyAllowance)}/day</span>
            </div>
            <div className="mt-1 text-[24px] font-semibold tabular"><CountUp value={todaySpent} format={inr} /></div>
            <div className="mt-2">
              <Progress value={todaySpent} max={sum.dailyAllowance || 1} tone="auto" label="Today's spend vs allowance" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3 text-[12.5px]">
              <div>
                <div className="text-muted">Trip total</div>
                <div className="text-[14px] font-semibold tabular">{inr(sum.spent)}</div>
              </div>
              <div>
                <div className="text-muted">Remaining</div>
                <div className={clsx('text-[14px] font-semibold tabular', sum.remaining < 0 ? 'text-bad' : 'text-ok')}>{inr(sum.remaining)}</div>
              </div>
            </div>
            <ButtonLink to={`/app/trips/${t.id}?tab=expenses&add=1`} size="sm" className="mt-4 w-full" icon={<Plus className="h-4 w-4" />}>
              Add expense
            </ButtonLink>
          </div>
        </div>
      </section>
    );
  }

  const daysToGo = phase.kind === 'upcoming' ? phase.daysToGo : 0;
  const done = t.checklist.filter((c) => c.done).length;
  const pending = t.bookings.filter((b) => b.status === 'pending').length;
  const confirmed = t.bookings.filter((b) => b.status === 'confirmed').length;
  return (
    <section className="card overflow-hidden">
      <TripBand trip={t} color={color} />
      <div className="grid gap-6 p-5 sm:p-6 lg:grid-cols-[auto_minmax(0,1fr)]">
        <div className="flex items-center gap-4 lg:border-r lg:border-line lg:pr-8">
          <div className="text-center">
            <div className="text-[40px] font-semibold leading-none tabular"><CountUp value={daysToGo} duration={700} /></div>
            <div className="mt-1 text-[12.5px] text-muted">{daysToGo === 1 ? 'day to go' : 'days to go'}</div>
          </div>
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11.5px] font-semibold text-brand">Next trip</span>
            <span className="truncate text-[12.5px] text-muted">{route}</span>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-[20px] font-semibold">{t.input.name}</h2>
            <ButtonLink to={`/app/trips/${t.id}`} size="sm" variant="secondary">
              Open trip <ArrowRight className="h-3.5 w-3.5" />
            </ButtonLink>
          </div>
          <p className="text-[13px] text-muted">
            {fmtDate(t.input.startDate)} – {fmtDate(tripEndDate(t))} · {plural(t.input.travelers, 'person', 'people')}
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <div className="flex justify-between text-[12.5px]">
                <span className="text-muted">Checklist</span>
                <span className="tabular">
                  {done}/{t.checklist.length}
                </span>
              </div>
              <div className="mt-1.5">
                <Progress value={done} max={t.checklist.length || 1} tone="brand" height={6} label="Checklist progress" />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[12.5px]">
                <span className="text-muted">Budget per person</span>
                <span className="tabular">
                  {inr(budget.perPerson)} / {inr(budget.cap)}
                </span>
              </div>
              <div className="mt-1.5">
                <Progress value={budget.perPerson} max={budget.cap} tone="auto" height={6} label="Planned cost vs cap" />
              </div>
            </div>
            <div className="text-[12.5px]">
              <div className="text-muted">Bookings</div>
              <div className="mt-1 flex items-center gap-3">
                <span className="inline-flex items-center gap-1.5">
                  <Dot color="rgb(var(--ok))" /> {confirmed} confirmed
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Dot color="rgb(var(--warn))" /> {pending} pending
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function QuickTile({ to, icon, title, sub }: { to: string; icon: ReactNode; title: string; sub: string }) {
  return (
    <Link to={to} className="card group flex items-start gap-3 p-4 transition-colors hover:border-line-strong hover:bg-sunken/40">
      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">{icon}</span>
      <span className="min-w-0">
        <span className="block text-[13.5px] font-semibold">{title}</span>
        <span className="block truncate text-[12px] text-muted">{sub}</span>
      </span>
    </Link>
  );
}

function Onboarding() {
  const steps = [
    { icon: <MapPin className="h-4 w-4" />, title: 'Pick your route', body: 'Starting city, destinations in order, dates and group size.' },
    { icon: <Wallet className="h-4 w-4" />, title: 'Set the budget', body: 'Transport, stays and food style, checked against a per-person cap.' },
    { icon: <CalendarDays className="h-4 w-4" />, title: 'Get a timed plan', body: 'Day-by-day itinerary with live maps and road routes.' },
    { icon: <ReceiptIndianRupee className="h-4 w-4" />, title: 'Track spending', body: 'Log expenses on the go, see what is left, settle up at the end.' },
  ];
  return (
    <section className="card overflow-hidden">
      <div className="grid lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <div className="p-6 sm:p-8">
          <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11.5px] font-semibold text-brand">Getting started</span>
          <h2 className="mt-3 text-[22px] font-semibold">Plan your first trip</h2>
          <p className="mt-1.5 max-w-[52ch] text-[14px] text-muted">
            Build a complete itinerary with timings, routes and a budget for your whole group, then track every rupee once you are on the road.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <ButtonLink to="/app/new" icon={<Plus className="h-4 w-4" />}>
              Plan a trip
            </ButtonLink>
            <ButtonLink to="/app/new?sample=goa" variant="secondary" icon={<Wand2 className="h-4 w-4" />}>
              Try the Goa sample
            </ButtonLink>
          </div>
        </div>
        <ol className="divide-y divide-line border-t border-line bg-sunken/40 lg:border-l lg:border-t-0">
          {steps.map((s, i) => (
            <li key={s.title} className="flex items-start gap-3 px-6 py-4">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line bg-surface text-brand">{s.icon}</span>
              <div>
                <div className="text-[13.5px] font-semibold">
                  <span className="mr-1.5 text-muted tabular">{i + 1}.</span>
                  {s.title}
                </div>
                <div className="text-[12.5px] text-muted">{s.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
