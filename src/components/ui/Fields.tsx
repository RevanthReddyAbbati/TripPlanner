import type { ReactNode } from 'react';
import clsx from 'clsx';

export function Field({ label, hint, htmlFor, children, className }: { label: string; hint?: ReactNode; htmlFor?: string; children: ReactNode; className?: string }) {
  return (
    <div className={clsx('min-w-0', className)}>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

export interface Option<T extends string> {
  value: T;
  label: string;
  detail?: string;
  icon?: ReactNode;
}

/** Large selectable cards, used for transport and stay choices. */
export function OptionCards<T extends string>({
  name,
  value,
  options,
  onChange,
  columns = 3,
}: {
  name: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
  columns?: 2 | 3 | 4;
}) {
  return (
    <div
      role="radiogroup"
      className={clsx(
        'grid gap-2',
        columns === 2 && 'grid-cols-1 sm:grid-cols-2',
        columns === 3 && 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'grid-cols-2 lg:grid-cols-4',
      )}
    >
      {options.map((o) => {
        const on = o.value === value;
        return (
          <label
            key={o.value}
            className={clsx(
              'relative flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border px-3.5 py-3 transition-[border-color,background,box-shadow]',
              on ? 'border-brand bg-brand-soft/60 shadow-[0_0_0_1px_rgb(var(--brand))]' : 'border-line-strong bg-surface hover:border-muted/50',
            )}
          >
            <input type="radio" name={name} id={`${name}-${o.value}`} className="sr-only" checked={on} onChange={() => onChange(o.value)} />
            {o.icon && (
              <span className={clsx('mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-md', on ? 'bg-brand text-brand-ink' : 'bg-sunken text-muted')}>{o.icon}</span>
            )}
            <span className="min-w-0">
              <span className="block text-[13.5px] font-medium">{o.label}</span>
              {o.detail && <span className="block text-[12.5px] text-muted">{o.detail}</span>}
            </span>
          </label>
        );
      })}
    </div>
  );
}

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full flex-wrap rounded-lg border border-line-strong bg-sunken p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'rounded-md px-3 py-1 text-[13px] font-medium transition-colors',
            o.value === value ? 'bg-surface text-ink shadow-card' : 'text-muted hover:text-ink',
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={onClick}
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[13px] font-medium transition-colors',
        on ? 'border-brand bg-brand-soft text-brand' : 'border-line-strong bg-surface text-ink-2 hover:bg-sunken',
      )}
    >
      {children}
    </button>
  );
}

export function Stepper({ value, min, max, onChange, id, suffix }: { value: number; min: number; max: number; onChange: (n: number) => void; id: string; suffix?: string }) {
  const btn = 'grid h-9 w-9 place-items-center text-[16px] text-ink-2 hover:bg-sunken disabled:opacity-40';
  return (
    <div className="flex items-center gap-2">
      <div className="inline-flex overflow-hidden rounded-lg border border-line-strong bg-surface">
        <button type="button" aria-label="Decrease" className={btn} disabled={value <= min} onClick={() => onChange(value - 1)}>
          −
        </button>
        <input
          id={id}
          type="number"
          inputMode="numeric"
          className="h-9 w-14 border-x border-line bg-transparent text-center text-[14px] font-medium tabular outline-none"
          value={value}
          min={min}
          max={max}
          onChange={(e) => {
            const n = Number(e.target.value);
            if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
          }}
        />
        <button type="button" aria-label="Increase" className={btn} disabled={value >= max} onClick={() => onChange(value + 1)}>
          +
        </button>
      </div>
      {suffix && <span className="text-[13px] text-muted">{suffix}</span>}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'brand' | 'ok' | 'warn' | 'bad'; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-0.5 text-[11.5px] font-medium ring-1 ring-inset',
        tone === 'neutral' && 'bg-sunken text-ink-2 ring-line-strong',
        tone === 'brand' && 'bg-brand-soft text-brand ring-brand/20',
        tone === 'ok' && 'bg-ok-soft text-ok ring-ok/20',
        tone === 'warn' && 'bg-warn-soft text-warn ring-warn/25',
        tone === 'bad' && 'bg-bad-soft text-bad ring-bad/20',
      )}
    >
      {children}
    </span>
  );
}
