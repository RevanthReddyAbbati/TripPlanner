// Shared building blocks: cards, stats, avatars, progress, empty states, tabs.
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import clsx from 'clsx';
import type { Traveler } from '../../types';
import { initials } from '../../engine/people';

export function Card({ title, actions, children, className, bodyClass, subtitle }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClass?: string }) {
  return (
    <section className={clsx('card min-w-0', className)}>
      {(title || actions) && (
        <header className="card-header">
          <div className="min-w-0">
            {title && <h2 className="card-title truncate">{title}</h2>}
            {subtitle && <p className="truncate text-[12.5px] text-muted">{subtitle}</p>}
          </div>
          {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
        </header>
      )}
      <div className={clsx(bodyClass ?? 'p-5')}>{children}</div>
    </section>
  );
}

export function Stat({
  label, value, sub, tone, icon, trend,
}: {
  label: string; value: ReactNode; sub?: ReactNode; tone?: 'ok' | 'warn' | 'bad' | 'brand'; icon?: ReactNode; trend?: ReactNode;
}) {
  return (
    <div className="min-w-0 bg-surface px-5 py-4">
      <div className="flex items-center justify-between gap-2">
        <span className="truncate text-[12.5px] font-medium text-muted">{label}</span>
        {icon && <span className="text-muted">{icon}</span>}
      </div>
      <div className="mt-1.5 flex items-baseline gap-2">
        <span className="truncate text-[22px] font-semibold tracking-tight tabular">{value}</span>
        {trend}
      </div>
      {sub && (
        <div
          className={clsx(
            'mt-0.5 text-[12.5px] leading-snug',
            tone === 'ok' && 'text-ok',
            tone === 'warn' && 'text-warn',
            tone === 'bad' && 'text-bad',
            tone === 'brand' && 'text-brand',
            !tone && 'text-muted',
          )}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/** A row of stats separated by hairlines, stacking to 2 columns on small screens. */
export function StatGrid({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 | 5 }) {
  return (
    <div
      className={clsx(
        'grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-line bg-line shadow-card',
        cols === 3 && 'lg:grid-cols-3',
        cols === 4 && 'lg:grid-cols-4',
        cols === 5 && 'md:grid-cols-3 xl:grid-cols-5',
      )}
    >
      {children}
    </div>
  );
}

export function Avatar({ person, size = 28, ring }: { person: Pick<Traveler, 'name' | 'color'>; size?: number; ring?: boolean }) {
  return (
    <span
      title={person.name}
      className={clsx('inline-grid shrink-0 place-items-center rounded-full font-semibold text-white', ring && 'ring-2 ring-surface')}
      style={{ width: size, height: size, background: person.color, fontSize: Math.max(10, size * 0.38) }}
    >
      {initials(person.name)}
    </span>
  );
}

export function AvatarStack({ people, max = 4, size = 26 }: { people: Traveler[]; max?: number; size?: number }) {
  const shown = people.slice(0, max);
  return (
    <span className="inline-flex items-center">
      {shown.map((p, i) => (
        <span key={p.id} style={{ marginLeft: i ? -size / 4 : 0 }}>
          <Avatar person={p} size={size} ring />
        </span>
      ))}
      {people.length > max && (
        <span className="ml-1 text-[12px] font-medium text-muted">+{people.length - max}</span>
      )}
    </span>
  );
}

export function Progress({ value, max, tone, height = 8, label }: { value: number; max: number; tone?: 'auto' | 'brand' | 'ok' | 'warn' | 'bad'; height?: number; label?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const ratio = max > 0 ? value / max : 0;
  const t = tone === 'auto' || !tone ? (ratio > 1 ? 'bad' : ratio > 0.85 ? 'warn' : 'ok') : tone;
  return (
    <div className="overflow-hidden rounded-full bg-sunken" style={{ height }} role="progressbar" aria-valuenow={Math.round(value)} aria-valuemin={0} aria-valuemax={Math.round(max)} aria-label={label}>
      <div
        className={clsx('h-full rounded-full transition-[width] duration-500', t === 'ok' && 'bg-ok', t === 'warn' && 'bg-warn', t === 'bad' && 'bg-bad', t === 'brand' && 'bg-brand')}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function EmptyState({ icon, title, children, action }: { icon?: ReactNode; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      {icon && <div className="mb-3 grid h-11 w-11 place-items-center rounded-xl border border-line bg-sunken text-muted">{icon}</div>}
      <h3 className="text-[15px] font-semibold">{title}</h3>
      {children && <p className="mt-1 max-w-[46ch] text-[13.5px] text-muted">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export interface Crumb {
  label: string;
  to?: string;
}

export function PageHeader({
  title, crumbs, actions, children, meta,
}: {
  title: ReactNode; crumbs?: Crumb[]; actions?: ReactNode; children?: ReactNode; meta?: ReactNode;
}) {
  return (
    <div className="mb-6">
      {crumbs && crumbs.length > 0 && (
        <nav aria-label="Breadcrumb" className="mb-2 flex flex-wrap items-center gap-1 text-[12.5px] text-muted">
          {crumbs.map((c, i) => (
            <span key={i} className="inline-flex items-center gap-1">
              {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
              {c.to ? (
                <Link to={c.to} className="hover:text-ink">
                  {c.label}
                </Link>
              ) : (
                <span className="text-ink-2">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-[24px] font-semibold leading-tight sm:text-[26px]">{title}</h1>
          {children && <div className="mt-1 max-w-[70ch] text-[14px] text-muted">{children}</div>}
          {meta && <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-muted">{meta}</div>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, items, className }: { value: T; onChange: (v: T) => void; items: { value: T; label: string; icon?: ReactNode; count?: number; className?: string }[]; className?: string }) {
  return (
    <div role="tablist" className={clsx('no-print flex gap-1 overflow-x-auto overflow-y-hidden border-b border-line', className)}>
      {items.map((t) => (
        <button
          key={t.value}
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={clsx(
            '-mb-px flex shrink-0 items-center gap-2 border-b-2 px-3 py-2.5 text-[13.5px] font-medium transition-colors',
            value === t.value ? 'border-brand text-ink' : 'border-transparent text-muted hover:text-ink',
            t.className,
          )}
        >
          {t.icon}
          {t.label}
          {t.count != null && t.count > 0 && <span className="rounded-full bg-sunken px-1.5 text-[11.5px] tabular text-muted">{t.count}</span>}
        </button>
      ))}
    </div>
  );
}

export function Dot({ color, size = 8 }: { color: string; size?: number }) {
  return <span className="inline-block shrink-0 rounded-full" style={{ width: size, height: size, background: color }} />;
}
