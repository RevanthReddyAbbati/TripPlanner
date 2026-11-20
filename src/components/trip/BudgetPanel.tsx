import { useMemo, useState } from 'react';
import { PiggyBank, TrendingDown } from 'lucide-react';
import clsx from 'clsx';
import type { BudgetLine, Trip } from '../../types';
import { computeBudget, suggestSavings, type Saving } from '../../engine/budget';
import { inr, plural } from '../../lib/format';
import { Button } from '../ui/Button';
import { Modal } from '../ui/Modal';
import { BudgetMeter } from '../ui/BudgetMeter';

const GROUPS: { key: BudgetLine['group']; label: string; color: string }[] = [
  { key: 'transport', label: 'Travel', color: '#2563eb' },
  { key: 'stay', label: 'Stay', color: '#0f766e' },
  { key: 'food', label: 'Food', color: '#c2410c' },
  { key: 'local', label: 'Getting around', color: '#7c3aed' },
  { key: 'activities', label: 'Entries', color: '#be123c' },
  { key: 'buffer', label: 'Contingency', color: '#64748b' },
];

export function BudgetPanel({ trip, readOnly, onApply, onCap }: { trip: Trip; readOnly?: boolean; onApply?: (s: Saving) => void; onCap?: (cap: number) => void }) {
  const budget = useMemo(() => computeBudget(trip), [trip]);
  const savings = useMemo(() => (readOnly ? [] : suggestSavings(trip)), [trip, readOnly]);
  const [confirm, setConfirm] = useState<Saving | null>(null);
  const n = trip.input.travelers;

  const byGroup = GROUPS.map((g) => ({ ...g, value: budget.lines.filter((l) => l.group === g.key).reduce((a, l) => a + l.perPerson, 0) })).filter((g) => g.value > 0);

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
      <div className="min-w-0 space-y-5">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line sm:grid-cols-4">
          <Stat label="Per person" value={inr(budget.perPerson)} strong />
          <Stat label={`Group of ${n}`} value={inr(budget.total)} />
          <Stat label="Budget cap" value={inr(budget.cap)} />
          <Stat label={budget.overBy ? 'Over by' : 'Left over'} value={inr(budget.overBy || budget.cap - budget.perPerson)} tone={budget.overBy ? 'bad' : 'ok'} />
        </div>

        <div className="card p-5">
          <h3 className="mb-3 text-[16px] font-semibold">Where the money goes</h3>
          <div className="flex h-4 overflow-hidden rounded-full" role="img" aria-label="Spending split by category">
            {byGroup.map((g) => (
              <div key={g.key} style={{ width: `${(g.value / budget.perPerson) * 100}%`, background: g.color }} title={`${g.label}: ${inr(g.value)}`} />
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-[13px] sm:grid-cols-3">
            {byGroup.map((g) => (
              <li key={g.key} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: g.color }} />
                <span className="flex-1 text-muted">{g.label}</span>
                <span className="font-mono text-[12px] tabular">{Math.round((g.value / budget.perPerson) * 100)}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="border-b border-line bg-sunken text-left text-[12px] uppercase tracking-wide text-muted">
                  <th className="px-4 py-2.5 font-medium">Item</th>
                  <th className="px-4 py-2.5 text-right font-medium">Per person</th>
                  <th className="px-4 py-2.5 text-right font-medium">Group</th>
                </tr>
              </thead>
              <tbody>
                {budget.lines.map((l) => (
                  <tr key={l.key} className="border-b border-line last:border-0">
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: GROUPS.find((g) => g.key === l.group)?.color }} />
                        <span className="font-medium">{l.label}</span>
                      </div>
                      <div className="pl-4 text-[12.5px] text-muted">{l.detail}</div>
                    </td>
                    <td className="px-4 py-2.5 text-right font-mono text-[13px] tabular">{inr(l.perPerson)}</td>
                    <td className="px-4 py-2.5 text-right font-mono text-[13px] text-muted tabular">{inr(l.perPerson * n)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-sunken font-semibold">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right font-mono tabular">{inr(budget.perPerson)}</td>
                  <td className="px-4 py-3 text-right font-mono tabular">{inr(budget.total)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
        <p className="text-[12.5px] text-muted">Costs are estimates from typical Indian prices and update as you edit the itinerary. Shared costs (rooms, taxis, fuel) are split across {plural(n, 'person', 'people')}.</p>
      </div>

      <aside className="space-y-4">
        <div className="card p-5">
          <div className="eyebrow mb-1">Against your cap</div>
          <div className="font-display text-[30px] font-bold tabular">{inr(budget.perPerson)}</div>
          <BudgetMeter value={budget.perPerson} cap={budget.cap} />
          {!readOnly && onCap && (
            <div className="mt-4">
              <label htmlFor="cap" className="label">
                Budget cap per person (₹)
              </label>
              <input id="cap" type="number" step={500} min={1000} className="input tabular" defaultValue={budget.cap} onBlur={(e) => onCap(Math.max(1000, Number(e.target.value) || budget.cap))} />
            </div>
          )}
        </div>
        {!readOnly && (
          <div className="card p-5">
            <h3 className="mb-1 flex items-center gap-2 text-[16px] font-semibold">
              <PiggyBank className="h-4 w-4 text-brand" /> Ways to save
            </h3>
            {savings.length === 0 ? (
              <p className="text-[13.5px] text-muted">You're already on the cheapest options for this route.</p>
            ) : (
              <ul className="mt-3 space-y-2.5">
                {savings.map((s) => (
                  <li key={s.id} className="flex items-start gap-3 rounded-lg border border-line p-3">
                    <TrendingDown className="mt-0.5 h-4 w-4 shrink-0 text-ok" />
                    <div className="min-w-0 flex-1">
                      <div className="text-[14px] font-medium">{s.label}</div>
                      <div className="text-[12.5px] text-muted">
                        Saves <span className="font-semibold text-ok">{inr(s.saving)}</span> per person · {s.detail}
                      </div>
                    </div>
                    <Button size="sm" variant="secondary" onClick={() => (s.rebuild ? setConfirm(s) : onApply?.(s))}>
                      Apply
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </aside>

      <Modal
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Rebuild the itinerary?"
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
        <p className="text-[14px]">Changing how you travel changes journey times, so the day-by-day plan is rebuilt. Manual changes to the itinerary will be replaced. Your checklist ticks and notes are kept.</p>
      </Modal>
    </div>
  );
}

function Stat({ label, value, strong, tone }: { label: string; value: string; strong?: boolean; tone?: 'ok' | 'bad' }) {
  return (
    <div className="bg-surface px-4 py-3">
      <div className="text-[12px] text-muted">{label}</div>
      <div className={clsx('font-display font-bold tabular', strong ? 'text-[24px]' : 'text-[20px]', tone === 'ok' && 'text-ok', tone === 'bad' && 'text-bad')}>{value}</div>
    </div>
  );
}
