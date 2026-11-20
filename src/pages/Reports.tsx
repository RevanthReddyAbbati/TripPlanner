import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import clsx from 'clsx';
import type { ExpenseCategory, Trip } from '../types';
import { useAllTrips } from '../store/trips';
import { CATEGORIES, CATEGORY, computeBalances, summarize } from '../engine/expenses';
import { Page } from '../components/layout/AppShell';
import { ButtonLink } from '../components/ui/Button';
import { Avatar, Card, Dot, EmptyState, PageHeader, Stat, StatGrid } from '../components/ui/Kit';
import { BarChart, Donut, Legend } from '../components/charts/Charts';
import { inr } from '../lib/format';
import { fmtDay } from '../lib/time';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Reports() {
  const trips = useAllTrips();
  const [sel, setSel] = useState<string>('all');
  const scope: Trip[] = useMemo(() => (sel === 'all' ? trips : trips.filter((t) => t.id === sel)), [trips, sel]);
  const one = sel !== 'all' ? scope[0] : undefined;

  const sums = useMemo(() => scope.map((t) => ({ t, s: summarize(t) })), [scope]);
  const expenses = useMemo(() => scope.flatMap((t) => t.expenses.map((e) => ({ e, t }))), [scope]);

  const spent = sums.reduce((a, x) => a + x.s.spent, 0);
  // Planned only counts trips that have spending logged, so variance compares like with like.
  const tracked = sums.filter((x) => x.t.expenses.length > 0);
  const plannedTracked = tracked.reduce((a, x) => a + x.s.planned, 0);
  const plannedAll = sums.reduce((a, x) => a + x.s.planned, 0);
  const variance = spent - plannedTracked;

  const byCat = CATEGORIES.map((c) => ({
    ...c,
    spent: sums.reduce((a, x) => a + (x.s.byCategory.find((b) => b.key === c.key)?.spent ?? 0), 0),
    planned: tracked.reduce((a, x) => a + (x.s.byCategory.find((b) => b.key === c.key)?.planned ?? 0), 0),
  }));
  const biggest = [...byCat].sort((a, b) => b.spent - a.spent)[0];

  const monthly = useMemo(() => {
    const m = new Map<string, number>();
    expenses.forEach(({ e }) => m.set(e.date.slice(0, 7), (m.get(e.date.slice(0, 7)) ?? 0) + e.amount));
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([k, v]) => ({ label: MONTHS[Number(k.slice(5, 7)) - 1], sub: k.slice(0, 4), value: Math.round(v) }));
  }, [expenses]);

  const top = useMemo(() => [...expenses].sort((a, b) => b.e.amount - a.e.amount).slice(0, 10), [expenses]);

  const people = useMemo(() => {
    if (one) {
      const bal = computeBalances(one);
      return bal.map((b) => ({ key: b.travelerId, person: one.travelers.find((p) => p.id === b.travelerId)!, paid: b.paid, share: b.share, net: b.net })).filter((r) => r.person);
    }
    // Across trips, group by traveller name.
    const m = new Map<string, { key: string; person: { name: string; color: string }; paid: number; share: number; net: number }>();
    scope.forEach((t) =>
      computeBalances(t).forEach((b) => {
        const p = t.travelers.find((x) => x.id === b.travelerId);
        if (!p) return;
        const k = p.name.trim().toLowerCase();
        const cur = m.get(k) ?? { key: k, person: { name: p.name, color: p.color }, paid: 0, share: 0, net: 0 };
        cur.paid += b.paid;
        cur.share += b.share;
        cur.net += b.net;
        m.set(k, cur);
      }),
    );
    return [...m.values()].filter((r) => r.paid || r.share).sort((a, b) => b.paid - a.paid);
  }, [scope, one]);

  const tripBars = sums.map((x) => ({
    label: x.t.input.name.length > 12 ? x.t.input.name.slice(0, 11) + '…' : x.t.input.name,
    value: x.s.spent,
    target: x.s.planned,
  }));
  const dayBars = one
    ? sums[0].s.byDay.map((d) => ({ label: `Day ${d.index + 1}`, sub: fmtDay(d.date).split(' ').slice(1).join(' '), value: d.spent, target: d.planned }))
    : [];

  return (
    <Page wide>
      <PageHeader
        title="Reports"
        crumbs={[{ label: 'Workspace', to: '/app/home' }, { label: 'Reports' }]}
        actions={
          trips.length > 0 && (
            <select className="input w-auto min-w-[200px]" value={sel} onChange={(e) => setSel(e.target.value)} aria-label="Report scope">
              <option value="all">All trips</option>
              {trips.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.input.name}
                </option>
              ))}
            </select>
          )
        }
      >
        Where the money went, compared with what you planned.
      </PageHeader>

      {expenses.length === 0 ? (
        <div className="space-y-6">
          {trips.length > 0 && (
            <StatGrid>
              <Stat label="Trips" value={String(scope.length)} />
              <Stat label="Planned spend" value={inr(plannedAll)} sub="Across these trips" />
              <Stat label="Spent" value={inr(0)} sub="No expenses logged" />
              <Stat label="Travellers" value={String(scope.reduce((a, t) => a + t.input.travelers, 0))} />
            </StatGrid>
          )}
          <div className="card">
            <EmptyState
              icon={<BarChart3 className="h-5 w-5" />}
              title="No spending to report yet"
              action={
                trips.length ? (
                  <ButtonLink to={one ? `/app/trips/${one.id}?tab=expenses&add=1` : '/app/trips'} size="sm">
                    {one ? 'Add an expense' : 'Go to trips'}
                  </ButtonLink>
                ) : (
                  <ButtonLink to="/app/new" size="sm">
                    Plan a trip
                  </ButtonLink>
                )
              }
            >
              Log expenses on a trip's Expenses tab and this page fills with category splits, plan-versus-actual charts and who paid for what.
            </EmptyState>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <StatGrid>
            <Stat label="Total spent" value={inr(spent)} sub={`${expenses.length} expenses${one ? '' : ` · ${tracked.length} trip${tracked.length === 1 ? '' : 's'}`}`} />
            <Stat label="Planned" value={inr(plannedTracked)} sub="For trips with spending" />
            <Stat
              label="Variance"
              value={`${variance > 0 ? '+' : variance < 0 ? '−' : ''}${inr(Math.abs(variance))}`}
              sub={variance > 0 ? 'Over plan' : variance < 0 ? 'Under plan' : 'On plan'}
              tone={variance > 0 ? 'bad' : 'ok'}
            />
            <Stat label="Biggest category" value={biggest.spent ? biggest.label : '—'} sub={biggest.spent ? `${inr(biggest.spent)} · ${Math.round((biggest.spent / spent) * 100)}%` : undefined} />
          </StatGrid>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <Card title="Spending by category" subtitle="Share of everything spent">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start xl:flex-col xl:items-center 2xl:flex-row 2xl:items-start">
                <Donut
                  slices={byCat.map((c) => ({ key: c.key, label: c.label, value: c.spent, color: c.color }))}
                  center={
                    <div>
                      <div className="text-[11.5px] text-muted">Spent</div>
                      <div className="text-[17px] font-semibold tabular">{inr(spent)}</div>
                    </div>
                  }
                />
                <div className="w-full min-w-0 overflow-x-auto">
                  <table className="w-full text-[13px]">
                    <thead>
                      <tr className="text-left text-[11.5px] text-muted">
                        <th className="pb-2 font-medium">Category</th>
                        <th className="pb-2 text-right font-medium">Spent</th>
                        <th className="pb-2 text-right font-medium">Share</th>
                        <th className="pb-2 text-right font-medium">Planned</th>
                      </tr>
                    </thead>
                    <tbody>
                      {byCat
                        .filter((c) => c.spent || c.planned)
                        .map((c) => (
                          <tr key={c.key} className="border-t border-line">
                            <td className="py-2">
                              <span className="inline-flex items-center gap-2">
                                <Dot color={c.color} /> {c.label}
                              </span>
                            </td>
                            <td className={clsx('py-2 text-right font-medium tabular', c.planned > 0 && c.spent > c.planned && 'text-bad')}>{inr(c.spent)}</td>
                            <td className="py-2 text-right tabular text-muted">{spent ? Math.round((c.spent / spent) * 100) : 0}%</td>
                            <td className="py-2 text-right tabular text-muted">{c.planned ? inr(c.planned) : '—'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </Card>

            <Card
              title={one ? 'Daily spend against plan' : 'Spent vs planned by trip'}
              subtitle={one ? one.input.name : 'Bars are actual spend; ticks are the plan'}
              actions={<Legend items={[{ label: 'Spent', color: 'rgb(var(--brand))' }, { label: 'Planned', color: 'rgb(var(--ink))' }]} />}
            >
              <BarChart data={one ? dayBars : tripBars} targetLabel="Planned" valueLabel="Spent" />
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card title="Spend by traveller" subtitle={one ? 'Paid against fair share' : 'Matched by name across trips'} bodyClass="">
              <div className="overflow-x-auto">
                <table className="table-base min-w-[420px]">
                  <thead>
                    <tr>
                      <th>Traveller</th>
                      <th className="text-right">Paid</th>
                      <th className="text-right">Share</th>
                      <th className="text-right">Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {people.map((r) => (
                      <tr key={r.key}>
                        <td>
                          <span className="flex items-center gap-2">
                            <Avatar person={r.person} size={24} />
                            <span className="truncate font-medium">{r.person.name}</span>
                          </span>
                        </td>
                        <td className="text-right tabular">{inr(r.paid)}</td>
                        <td className="text-right tabular text-muted">{inr(r.share)}</td>
                        <td className={clsx('text-right font-medium tabular', r.net > 0.5 ? 'text-ok' : r.net < -0.5 ? 'text-bad' : 'text-muted')}>
                          {r.net > 0.5 ? `gets ${inr(r.net)}` : r.net < -0.5 ? `owes ${inr(-r.net)}` : 'settled'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card title="Monthly spend" subtitle="Last 12 months with spending">
              <BarChart data={monthly} valueLabel="Spent" height={220} />
            </Card>
          </div>

          <Card title="Top expenses" subtitle="The 10 largest single payments" bodyClass="">
            <div className="overflow-x-auto">
              <table className="table-base min-w-[640px]">
                <thead>
                  <tr>
                    <th>Expense</th>
                    <th>Category</th>
                    {!one && <th>Trip</th>}
                    <th>Date</th>
                    <th>Paid by</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {top.map(({ e, t }) => {
                    const c = CATEGORY[e.category as ExpenseCategory];
                    return (
                      <tr key={e.id} className="hover:bg-sunken/50">
                        <td className="max-w-[260px]">
                          <Link to={`/app/trips/${t.id}?tab=expenses`} className="block truncate font-medium hover:text-brand">
                            {e.title}
                          </Link>
                        </td>
                        <td>
                          <span className="inline-flex items-center gap-2 whitespace-nowrap">
                            <Dot color={c.color} /> {c.label}
                          </span>
                        </td>
                        {!one && <td className="max-w-[180px] truncate text-muted">{t.input.name}</td>}
                        <td className="whitespace-nowrap text-muted">{fmtDay(e.date)}</td>
                        <td className="whitespace-nowrap">{t.travelers.find((p) => p.id === e.paidBy)?.name ?? '—'}</td>
                        <td className="text-right font-medium tabular">{inr(e.amount)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </Page>
  );
}
