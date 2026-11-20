import { useMemo, useState } from 'react';
import { PiggyBank, TrendingDown } from 'lucide-react';
import type { BudgetLine, Trip } from '../../types';
import { computeBudget, suggestSavings, type Saving } from '../../engine/budget';
import { summarize } from '../../engine/expenses';
import { inr, plural } from '../../lib/format';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { Card, Progress, Stat, StatGrid } from '../ui/Kit';
import { Donut } from '../charts/Charts';

const GROUPS: { key: BudgetLine['group']; label: string; color: string }[] = [
  { key: 'transport', label: 'Travel', color: '#2557d6' },
  { key: 'stay', label: 'Stay', color: '#0f9488' },
  { key: 'food', label: 'Food', color: '#e8590c' },
  { key: 'local', label: 'Getting around', color: '#7048e8' },
  { key: 'activities', label: 'Entries', color: '#c2255c' },
  { key: 'buffer', label: 'Contingency', color: '#64748b' },
];

/** The planned budget: what the trip should cost, split per person, with ways to bring it down. */
export function BudgetPanel({ trip, readOnly, onApply, onCap }: { trip: Trip; readOnly?: boolean; onApply?: (s: Saving) => void; onCap?: (cap: number) => void }) {
  const budget = useMemo(() => computeBudget(trip), [trip]);
  const spend = useMemo(() => summarize(trip), [trip]);
  const savings = useMemo(() => (readOnly ? [] : suggestSavings(trip)), [trip, readOnly]);
  const [confirm, setConfirm] = useState<Saving | null>(null);
  const n = trip.input.travelers;
  const over = budget.perPerson > budget.cap;

  const byGroup = GROUPS.map((g) => ({ ...g, value: budget.lines.filter((l) => l.group === g.key).reduce((a, l) => a + l.perPerson, 0) })).filter((g) => g.value > 0);

  return (
    <div className="space-y-6">
      <StatGrid cols={4}>
        <Stat label="Planned per person" value={inr(budget.perPerson)} sub={over ? `${inr(budget.perPerson - budget.cap)} over the cap` : `${inr(budget.cap - budget.perPerson)} under the cap`} tone={over ? 'bad' : 'ok'} />
        <Stat label={`Planned for ${n}`} value={inr(budget.total)} sub="Whole group, all costs" />
        <Stat label="Cap per person" value={inr(budget.cap)} sub={`${inr(budget.cap * n)} for the group`} />
        <Stat
          label="Actually spent"
          value={inr(spend.spent)}
          sub={budget.total ? `${Math.round((spend.spent / budget.total) * 100)}% of the plan` : undefined}
          tone={spend.spent > budget.total ? 'warn' : 'brand'}
        />
      </StatGrid>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="min-w-0 space-y-6">
          <Card title="Where the money goes" subtitle="Planned cost per person by category">
            <div className="flex flex-col items-center gap-6 sm:flex-row">
              <Donut
                slices={byGroup.map((g) => ({ key: g.key, label: g.label, value: g.value, color: g.color }))}
                center={
                  <div>
                    <div className="text-[18px] font-semibold tabular">{inr(budget.perPerson)}</div>
                    <div className="text-[11.5px] text-muted">per person</div>
                  </div>
                }
              />
              <ul className="w-full min-w-0 flex-1 space-y-2.5">
                {byGroup.map((g) => (
                  <li key={g.key} className="text-[13px]">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-sm" style={{ background: g.color }} />
                      <span className="flex-1 text-ink-2">{g.label}</span>
                      <span className="tabular font-medium">{inr(g.value)}</span>
                      <span className="w-10 text-right tabular text-muted">{Math.round((g.value / budget.perPerson) * 100)}%</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-sunken">
                      <div className="h-full rounded-full" style={{ width: `${(g.value / budget.perPerson) * 100}%`, background: g.color }} />
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </Card>

          <Card title="Line items" subtitle={`Shared costs (rooms, taxis, fuel) are split across ${plural(n, 'person', 'people')}.`} bodyClass="p-0">
            <div className="overflow-x-auto">
              <table className="table-base">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th className="!text-right">Per person</th>
                    <th className="!text-right">Group</th>
                  </tr>
                </thead>
                <tbody>
                  {budget.lines.map((l) => (
                    <tr key={l.key}>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: GROUPS.find((g) => g.key === l.group)?.color }} />
                          <span className="font-medium">{l.label}</span>
                        </div>
                        <div className="pl-4 text-[12.5px] text-muted">{l.detail}</div>
                      </td>
                      <td className="text-right tabular">{inr(l.perPerson)}</td>
                      <td className="text-right tabular text-muted">{inr(l.perPerson * n)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-sunken/60 font-semibold">
                    <td className="px-4 py-3">Total</td>
                    <td className="px-4 py-3 text-right tabular">{inr(budget.perPerson)}</td>
                    <td className="px-4 py-3 text-right tabular">{inr(budget.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </Card>
          <p className="text-[12.5px] text-muted">Estimates from typical Indian prices. They update as you edit the itinerary. Track what you really spend in the Expenses tab.</p>
        </div>

        <aside className="space-y-6">
          <Card title="Against your cap">
            <div className="flex items-baseline justify-between">
              <span className="text-[26px] font-semibold tracking-tight tabular">{inr(budget.perPerson)}</span>
              <span className="text-[12.5px] text-muted">cap {inr(budget.cap)}</span>
            </div>
            <div className="mt-3">
              <Progress value={budget.perPerson} max={budget.cap} tone="auto" label="Planned cost against cap" />
            </div>
            <p className={`mt-2 text-[12.5px] font-medium ${over ? 'text-bad' : 'text-ok'}`}>
              {over ? `${inr(budget.perPerson - budget.cap)} over budget` : `${inr(budget.cap - budget.perPerson)} under budget`}
            </p>
            {!readOnly && onCap && (
              <div className="mt-4 border-t border-line pt-4">
                <label htmlFor="cap" className="label">
                  Budget cap per person (₹)
                </label>
                <input id="cap" type="number" step={500} min={1000} className="input tabular" defaultValue={budget.cap} onBlur={(e) => onCap(Math.max(1000, Number(e.target.value) || budget.cap))} />
              </div>
            )}
          </Card>
          {!readOnly && (
            <Card
              title={
                <span className="inline-flex items-center gap-2">
                  <PiggyBank className="h-4 w-4 text-brand" /> Ways to save
                </span>
              }
              bodyClass="p-3"
            >
              {savings.length === 0 ? (
                <p className="px-2 py-2 text-[13px] text-muted">You're already on the cheapest options for this route.</p>
              ) : (
                <ul className="space-y-1">
                  {savings.map((s) => (
                    <li key={s.id} className="flex items-start gap-3 rounded-lg px-2 py-2.5 hover:bg-sunken/60">
                      <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                      <div className="min-w-0 flex-1">
                        <div className="text-[13.5px] font-medium">{s.label}</div>
                        <div className="text-[12.5px] text-muted">
                          Saves <span className="font-semibold text-ok">{inr(s.saving)}</span> per person · {s.detail}
                        </div>
                      </div>
                      <Button size="xs" variant="secondary" onClick={() => (s.rebuild ? setConfirm(s) : onApply?.(s))}>
                        Apply
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          )}
        </aside>
      </div>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Rebuild the itinerary?"
        size="sm"
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirm(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (confirm) onApply?.(confirm);
                setConfirm(null);
              }}
            >
              Rebuild with new transport
            </Button>
          </>
        }
      >
        <p className="text-[14px]">Changing how you travel changes journey times, so the day-by-day plan is rebuilt. Manual changes to the itinerary are replaced. Expenses, bookings, notes and checklist ticks are kept.</p>
      </Modal>
    </div>
  );
}
