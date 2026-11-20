import clsx from 'clsx';
import { inr } from '../../lib/format';

export function BudgetMeter({ value, cap }: { value: number; cap: number }) {
  const over = value > cap;
  const pct = cap ? Math.min(100, (value / cap) * 100) : 100;
  return (
    <div className="mt-3">
      <div className="h-2.5 overflow-hidden rounded-full bg-sunken" role="meter" aria-valuemin={0} aria-valuemax={cap} aria-valuenow={value} aria-label="Budget used">
        <div className={clsx('h-full rounded-full transition-all', over ? 'bg-bad' : 'bg-ok')} style={{ width: `${pct}%` }} />
      </div>
      <div className="mt-1.5 flex justify-between gap-2 text-[12.5px]">
        <span className={over ? 'font-semibold text-bad' : 'font-semibold text-ok'}>{over ? `${inr(value - cap)} over budget` : `${inr(cap - value)} under budget`}</span>
        <span className="text-muted">Cap {inr(cap)}</span>
      </div>
    </div>
  );
}
