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
              'flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 transition-colors',
              on ? 'border-brand bg-brand-soft' : 'border-line bg-surface hover:bg-sunken',
            )}
          >
            <input
              type="radio"
              name={name}
              id={`${name}-${o.value}`}
              className="sr-only"
              checked={on}
              onChange={() => onChange(o.value)}
            />
            {o.icon && <span className={clsx('mt-0.5', on ? 'text-brand' : 'text-muted')}>{o.icon}</span>}
            <span className="min-w-0">
              <span className="block text-[14px] font-medium">{o.label}</span>
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
    <div role="radiogroup" aria-label={label} className="inline-flex flex-wrap rounded-lg border border-line bg-sunken p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          onClick={() => onChange(o.value)}
          className={clsx(
            'rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors',
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
        'rounded-full border px-3 py-1.5 text-[13px] font-medium transition-colors',
        on ? 'border-brand bg-brand text-brand-ink' : 'border-line bg-surface text-ink hover:bg-sunken',
      )}
    >
      {children}
    </button>
  );
}

export function Stepper({ value, min, max, onChange, id, suffix }: { value: number; min: number; max: number; onChange: (n: number) => void; id: string; suffix?: string }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" aria-label="Decrease" className="h-10 w-10 rounded-lg border border-line bg-surface text-lg hover:bg-sunken disabled:opacity-40" disabled={value <= min} onClick={() => onChange(value - 1)}>
        −
      </button>
      <input
        id={id}
        type="number"
        inputMode="numeric"
        className="input w-20 text-center tabular"
        value={value}
        min={min}
        max={max}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
        }}
      />
      <button type="button" aria-label="Increase" className="h-10 w-10 rounded-lg border border-line bg-surface text-lg hover:bg-sunken disabled:opacity-40" disabled={value >= max} onClick={() => onChange(value + 1)}>
        +
      </button>
      {suffix && <span className="text-[13px] text-muted">{suffix}</span>}
    </div>
  );
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'brand' | 'ok' | 'warn' | 'bad'; children: ReactNode }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11.5px] font-semibold',
        tone === 'neutral' && 'bg-sunken text-muted',
        tone === 'brand' && 'bg-brand-soft text-brand',
        tone === 'ok' && 'bg-ok/15 text-ok',
        tone === 'warn' && 'bg-warn/15 text-warn',
        tone === 'bad' && 'bg-bad/15 text-bad',
      )}
    >
      {children}
    </span>
  );
}
