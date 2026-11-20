// Trip expense tracker: actual spend against plan and cap, daily pace, the expense log, and settle-up.
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { AlertTriangle, ArrowRight, Download, Plus, ReceiptIndianRupee, Search } from 'lucide-react';
import clsx from 'clsx';
import type { Expense, ExpenseCategory, Traveler, Trip } from '../../types';
import { CATEGORIES, CATEGORY, expensesToCSV, summarize } from '../../engine/expenses';
import { inr, slug } from '../../lib/format';
import { fmtDay } from '../../lib/time';
import { downloadFile } from '../../lib/share';
import { Button } from '../ui/Button';
import { Avatar, Card, Dot, EmptyState, Progress, Stat, StatGrid } from '../ui/Kit';
import { BarChart, CumulativeChart, Donut, Legend } from '../charts/Charts';
import { ExpenseModal, type ExpenseDraft } from '../expenses/ExpenseModal';
import { CategoryIcon, METHOD_LABEL } from '../expenses/CategoryIcon';
import { useToast } from '../ui/Toast';
import type { WorkspaceActions } from './TripWorkspace';

const UNKNOWN: Traveler = { id: '?', name: 'Unknown', color: '#64748b' };

export function ExpensesPanel({
  trip, readOnly, actions, autoAdd, onAutoAddHandled,
}: {
  trip: Trip; readOnly?: boolean; actions?: WorkspaceActions; autoAdd?: boolean; onAutoAddHandled?: () => void;
}) {
  const editable = !readOnly && !!actions;
  const s = useMemo(() => summarize(trip), [trip]);
  const toast = useToast();
  const [modal, setModal] = useState<{ open: boolean; editing?: Expense }>({ open: false });
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<'all' | ExpenseCategory>('all');
  const [person, setPerson] = useState<string>('all');

  useEffect(() => {
    if (autoAdd && editable) {
      setModal({ open: true });
      onAutoAddHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoAdd]);

  const people = useMemo(() => new Map(trip.travelers.map((t) => [t.id, t])), [trip.travelers]);
  const who = (id: string) => people.get(id) ?? UNKNOWN;
  const n = trip.input.travelers;
  const capPP = trip.input.budgetPerPerson;
  const pct = Math.round(s.pctOfCap * 100);
  const tone = (ratio: number) => (ratio > 1 ? 'bad' : ratio > 0.85 ? 'warn' : 'ok') as 'ok' | 'warn' | 'bad';

  const filtered = useMemo(() => {
    const text = q.trim().toLowerCase();
    return trip.expenses.filter(
      (e) =>
        (cat === 'all' || e.category === cat) &&
        (person === 'all' || e.paidBy === person) &&
        (!text || `${e.title} ${e.note ?? ''}`.toLowerCase().includes(text)),
    );
  }, [trip.expenses, q, cat, person]);

  const groups = useMemo(() => {
    const m = new Map<string, Expense[]>();
    [...filtered]
      .sort((a, b) => (b.date + (b.time ?? '')).localeCompare(a.date + (a.time ?? '')))
      .forEach((e) => m.set(e.date, [...(m.get(e.date) ?? []), e]));
    return [...m.entries()];
  }, [filtered]);
  const filteredTotal = filtered.reduce((a, e) => a + e.amount, 0);

  const dayOf = (date: string) => trip.days.find((d) => d.date === date)?.index;
  const phase = s.phase;
  const liveIdx = phase.kind === 'live' ? phase.dayIndex : -1;

  const bars = s.byDay.map((d) => ({
    label: `Day ${d.index + 1}`,
    sub: new Date(d.date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    value: d.spent,
    target: d.planned,
    highlight: phase.kind === 'live' ? (d.index === liveIdx ? true : d.index > liveIdx ? false : undefined) : undefined,
  }));
  const actual = s.byDay.map((d, i) => {
    if (phase.kind === 'completed') return d.spent;
    if (phase.kind === 'live') return i <= liveIdx ? d.spent : null;
    return i === 0 && s.spent > 0 ? d.spent : null;
  });

  const cats = s.byCategory.filter((c) => c.planned > 0 || c.spent > 0);

  const exportCsv = () => downloadFile(`${slug(trip.input.name) || 'trip'}-expenses.csv`, expensesToCSV(trip, filtered), 'text/csv');

  const save = (e: ExpenseDraft) => {
    if (!actions) return;
    if (modal.editing) {
      actions.updateExpense(modal.editing.id, e);
      toast('Expense updated.');
    } else {
      actions.addExpense(e);
      toast(`Added ${e.title}, ${inr(e.amount)}.`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-[18px] font-semibold">Spending</h2>
          <p className="text-[13.5px] text-muted">
            What the group has actually spent, against the plan and your {inr(capPP)} per person cap.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" icon={<Download className="h-4 w-4" />} onClick={exportCsv} disabled={!trip.expenses.length}>
            Export CSV
          </Button>
          {editable && (
            <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal({ open: true })}>
              Add expense
            </Button>
          )}
        </div>
      </div>

      <StatGrid cols={5}>
        <Stat label="Spent so far" value={inr(s.spent)} sub={`${pct}% of the ${inr(s.cap)} group cap`} tone={tone(s.pctOfCap)} />
        <Stat
          label={s.remaining >= 0 ? 'Remaining' : 'Over the cap'}
          value={inr(Math.abs(s.remaining))}
          sub={s.remaining >= 0 ? `Left for ${n} ${n === 1 ? 'person' : 'people'}` : 'Spending is above the cap'}
          tone={tone(s.pctOfCap)}
        />
        <Stat label="Per person" value={inr(s.perPersonSpent)} sub={`of ${inr(capPP)} each`} tone={tone(capPP ? s.perPersonSpent / capPP : 0)} />
        {s.daysLeft > 0 ? (
          <Stat
            label="Daily allowance"
            value={inr(s.dailyAllowance)}
            sub={`per day for the group, ${s.daysLeft} day${s.daysLeft === 1 ? '' : 's'} left`}
            tone={s.remaining < 0 ? 'bad' : undefined}
          />
        ) : (
          <Stat label="Planned cost" value={inr(s.planned)} sub={s.spent > s.planned ? `${inr(s.spent - s.planned)} above plan` : `${inr(s.planned - s.spent)} below plan`} tone={s.spent > s.planned ? 'warn' : 'ok'} />
        )}
        {phase.kind === 'live' ? (
          <Stat label="Forecast at this pace" value={inr(s.forecast)} sub={s.forecast > s.cap ? `${inr(s.forecast - s.cap)} over the cap` : `${inr(s.cap - s.forecast)} under the cap`} tone={tone(s.cap ? s.forecast / s.cap : 0)} />
        ) : (
          <Stat label="Planned cost" value={inr(s.planned)} sub={`${inr(Math.round(s.planned / n))} per person`} tone={s.planned > s.cap ? 'warn' : undefined} />
        )}
      </StatGrid>

      {(s.spent > s.cap || s.overCategories.length > 0) && (
        <div className="space-y-2">
          {s.spent > s.cap && (
            <Alert tone="bad">
              The group has spent {inr(s.spent - s.cap)} more than the {inr(s.cap)} cap.
            </Alert>
          )}
          {s.overCategories.length > 0 && (
            <Alert tone="warn">
              Over plan in {s.overCategories.map((k) => CATEGORY[k].label.toLowerCase()).join(', ')}.{' '}
              {s.byCategory
                .filter((c) => s.overCategories.includes(c.key))
                .map((c) => `${c.label}: ${inr(c.spent - c.planned)} over`)
                .join(' · ')}
            </Alert>
          )}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <Card title="By category" subtitle="Spent against the plan">
          <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start xl:flex-col xl:items-center 2xl:flex-row 2xl:items-start">
            <Donut
              slices={cats.map((c) => ({ key: c.key, label: c.label, value: c.spent, color: c.color }))}
              center={
                <div>
                  <div className="text-[11.5px] text-muted">Spent</div>
                  <div className="text-[18px] font-semibold tabular">{inr(s.spent)}</div>
                </div>
              }
            />
            <ul className="w-full min-w-0 flex-1 space-y-3">
              {cats.map((c) => (
                <li key={c.key}>
                  <div className="mb-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
                    <Dot color={c.color} />
                    <span className="min-w-[8rem] flex-1 font-medium">{c.label}</span>
                    <span className="whitespace-nowrap">
                      <span className={clsx('tabular', c.planned > 0 && c.spent > c.planned ? 'font-semibold text-bad' : 'text-ink-2')}>{inr(c.spent)}</span>
                      <span className="tabular text-[12px] text-muted"> / {c.planned > 0 ? inr(c.planned) : 'not planned'}</span>
                    </span>
                  </div>
                  <Progress value={c.spent} max={c.planned || Math.max(c.spent, 1)} tone={c.planned ? 'auto' : 'brand'} height={6} label={`${c.label} spent`} />
                </li>
              ))}
            </ul>
          </div>
        </Card>

        <Card title="Daily spend" subtitle="Bars are actual spend; the dark tick is the plan for that day" actions={<Legend items={[{ label: 'Spent', color: 'rgb(var(--brand))' }, { label: 'Plan', color: 'rgb(var(--ink))' }]} />}>
          <BarChart data={bars} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card
          title="Running total"
          subtitle="Cumulative spend compared with the plan and the cap"
          actions={
            <Legend
              items={[
                { label: 'Actual', color: 'rgb(var(--brand))' },
                { label: 'Plan', color: 'rgb(var(--muted))', dashed: true },
                { label: 'Cap', color: 'rgb(var(--bad))', dashed: true },
              ]}
            />
          }
        >
          <CumulativeChart
            planned={s.byDay.map((d) => d.planned)}
            actual={actual}
            cap={s.cap}
            labels={s.byDay.map((d) => `D${d.index + 1}`)}
            todayIndex={phase.kind === 'live' ? liveIdx : undefined}
          />
        </Card>

        <Card title="Balances" subtitle="Who paid, each person's share, and how to settle up" bodyClass="p-0">
          {trip.expenses.length === 0 ? (
            <p className="px-5 py-8 text-center text-[13.5px] text-muted">Balances appear once expenses are logged.</p>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table-base">
                  <thead>
                    <tr>
                      <th>Traveller</th>
                      <th className="text-right">Paid</th>
                      <th className="text-right">Share</th>
                      <th className="text-right">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.balances.map((b) => {
                      const p = who(b.travelerId);
                      return (
                        <tr key={b.travelerId}>
                          <td>
                            <span className="flex items-center gap-2">
                              <Avatar person={p} size={24} />
                              <span className="truncate font-medium">{p.name}</span>
                            </span>
                          </td>
                          <td className="text-right tabular">{inr(b.paid)}</td>
                          <td className="text-right tabular text-muted">{inr(b.share)}</td>
                          <td className={clsx('text-right font-semibold tabular', b.net > 0 ? 'text-ok' : b.net < 0 ? 'text-bad' : 'text-muted')}>
                            {b.net > 0 ? '+' : b.net < 0 ? '−' : ''}
                            {inr(Math.abs(b.net))}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="border-t border-line px-5 py-4">
                <div className="eyebrow mb-2.5">Settle up</div>
                {s.settlements.length === 0 ? (
                  <p className="text-[13.5px] text-ok">Everyone is settled up.</p>
                ) : (
                  <ul className="space-y-2">
                    {s.settlements.map((st, i) => {
                      const from = who(st.from);
                      const to = who(st.to);
                      return (
                        <li key={i} className="flex items-center gap-2 text-[13.5px]">
                          <Avatar person={from} size={22} />
                          <span className="min-w-0 truncate font-medium">{from.name}</span>
                          <ArrowRight className="h-3.5 w-3.5 shrink-0 text-muted" />
                          <Avatar person={to} size={22} />
                          <span className="min-w-0 flex-1 truncate font-medium">{to.name}</span>
                          <span className="font-semibold tabular">{inr(st.amount)}</span>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card
        title="Expense log"
        subtitle={trip.expenses.length ? `${filtered.length} of ${trip.expenses.length} expenses · ${inr(filteredTotal)}` : undefined}
        bodyClass="p-0"
      >
        {trip.expenses.length === 0 ? (
          <EmptyState
            icon={<ReceiptIndianRupee className="h-5 w-5" />}
            title="No expenses yet"
            action={
              editable && (
                <Button icon={<Plus className="h-4 w-4" />} onClick={() => setModal({ open: true })}>
                  Add the first expense
                </Button>
              )
            }
          >
            Log what you spend as you go: tickets, rooms, meals, fuel. Totals, the daily allowance and who owes whom update instantly.
          </EmptyState>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3">
              <div className="relative min-w-[180px] flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
                <input className="input pl-9" placeholder="Search expenses" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search expenses" />
              </div>
              <select className="input w-auto" value={cat} onChange={(e) => setCat(e.target.value as 'all' | ExpenseCategory)} aria-label="Filter by category">
                <option value="all">All categories</option>
                {CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
              <select className="input w-auto" value={person} onChange={(e) => setPerson(e.target.value)} aria-label="Filter by who paid">
                <option value="all">Anyone paid</option>
                {trip.travelers.map((t) => (
                  <option key={t.id} value={t.id}>
                    Paid by {t.name}
                  </option>
                ))}
              </select>
            </div>
            {groups.length === 0 ? (
              <p className="px-5 py-8 text-center text-[13.5px] text-muted">No expenses match these filters.</p>
            ) : (
              groups.map(([date, list]) => {
                const di = dayOf(date);
                const total = list.reduce((a, e) => a + e.amount, 0);
                return (
                  <section key={date}>
                    <div className="flex items-center justify-between gap-3 border-b border-line bg-sunken/60 px-5 py-2 text-[12.5px]">
                      <span className="font-semibold text-ink-2">
                        {di != null ? `Day ${di + 1} · ` : ''}
                        {fmtDay(date)}
                      </span>
                      <span className="tabular text-muted">{inr(total)}</span>
                    </div>
                    <ul>
                      {list.map((e) => (
                        <ExpenseRow key={e.id} e={e} payer={who(e.paidBy)} editable={editable} onOpen={() => setModal({ open: true, editing: e })} />
                      ))}
                    </ul>
                  </section>
                );
              })
            )}
          </>
        )}
      </Card>

      {editable && (
        <ExpenseModal
          trip={trip}
          open={modal.open}
          editingId={modal.editing?.id}
          initial={modal.editing ? stripMeta(modal.editing) : undefined}
          onClose={() => setModal({ open: false })}
          onSave={save}
          onDelete={
            modal.editing
              ? () => {
                  actions!.removeExpense(modal.editing!.id);
                  toast('Expense deleted.');
                }
              : undefined
          }
        />
      )}
    </div>
  );
}

function ExpenseRow({ e, payer, editable, onOpen }: { e: Expense; payer: Traveler; editable: boolean; onOpen: () => void }) {
  const body = (
    <>
      <CategoryIcon category={e.category} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-medium">{e.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12px] text-muted">
          {e.time && <span className="tabular">{e.time}</span>}
          <span>{METHOD_LABEL[e.method]}</span>
          <span className="inline-flex items-center gap-1">
            Paid by <Avatar person={payer} size={16} /> <span className="text-ink-2">{payer.name}</span>
          </span>
          <span>split {e.splitWith.length} way{e.splitWith.length === 1 ? '' : 's'}</span>
          {e.note && <span className="truncate italic">{e.note}</span>}
        </div>
      </div>
      <div className="shrink-0 text-right">
        <div className="font-semibold tabular">{inr(e.amount)}</div>
        <div className="text-[11.5px] text-muted">{CATEGORY[e.category].label}</div>
      </div>
    </>
  );
  return (
    <li className="border-b border-line last:border-b-0">
      {editable ? (
        <button type="button" onClick={onOpen} className="flex w-full items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-sunken/60">
          {body}
        </button>
      ) : (
        <div className="flex items-center gap-3 px-5 py-3">{body}</div>
      )}
    </li>
  );
}

function Alert({ tone, children }: { tone: 'warn' | 'bad'; children: ReactNode }) {
  return (
    <div
      className={clsx(
        'flex items-start gap-2 rounded-lg border px-3.5 py-2.5 text-[13px] font-medium',
        tone === 'bad' ? 'border-bad/25 bg-bad-soft text-bad' : 'border-warn/25 bg-warn-soft text-warn',
      )}
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
      <span>{children}</span>
    </div>
  );
}

function stripMeta(e: Expense): Partial<ExpenseDraft> {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id, createdAt, ...rest } = e;
  return rest;
}
