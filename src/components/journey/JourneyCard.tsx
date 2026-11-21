import { useState, type ReactNode } from 'react';
import {
  AlertTriangle, ArrowRight, BedDouble, BusFront, CalendarDays, Car, ChevronDown, Clock, ExternalLink, Footprints, Home, Info, MapPin,
  Moon, Plane, Ticket, TrainFront, type LucideIcon,
} from 'lucide-react';
import clsx from 'clsx';
import type { JourneyPlan, ServiceOption, StepIcon } from '../../engine/journey';
import { classLabel } from '../../engine/journey';
import { fmtDay, fmtDuration, fmtTime } from '../../lib/time';
import { Badge } from '../ui/Fields';
import type { Trip } from '../../types';
import { RunCalendar, nearestRunDate } from './RunCalendar';
import { LiveCheckPanel } from './LiveCheckPanel';

const STEP_ICON: Record<StepIcon, LucideIcon> = {
  book: Ticket,
  go: Footprints,
  board: TrainFront,
  ride: Car,
  night: Moon,
  arrive: MapPin,
  lastmile: Car,
  home: Home,
  car: Car,
  info: Info,
};

const KIND_ICON: Record<JourneyPlan['kind'], LucideIcon> = { train: TrainFront, bus: BusFront, flight: Plane, drive: Car, local: Car };

export function KindIcon({ kind, className }: { kind: JourneyPlan['kind'] | ServiceOption['kind']; className?: string }) {
  const Icon = KIND_ICON[kind as JourneyPlan['kind']] ?? TrainFront;
  return <Icon className={className} />;
}

/** One leg of the trip, explained step by step. `compact` is used inline in the itinerary. */
export function JourneyCard({ plan, compact, index, trip, autoRun }: { plan: JourneyPlan; compact?: boolean; index?: number; trip?: Trip; autoRun?: number }) {
  const [showAlt, setShowAlt] = useState(false);
  const [showTips, setShowTips] = useState(false);
  const best = plan.options[0];
  const others = plan.options.slice(1);

  return (
    <section className={clsx('min-w-0', !compact && 'card overflow-hidden')} aria-label={`Journey ${plan.title}`}>
      {!compact && (
        <header className="flex flex-wrap items-start gap-3 border-b border-line px-5 py-4">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
            <KindIcon kind={plan.kind} className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="text-[12px] font-medium text-muted">
              {index != null ? `Journey ${index + 1} · ` : ''}Day {plan.dayIndex + 1} · {fmtDay(plan.date)}
            </div>
            <h3 className="flex flex-wrap items-center gap-x-2 text-[16px] font-semibold">
              {plan.fromName} <ArrowRight className="h-4 w-4 text-muted" /> {plan.toName}
            </h3>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-muted">
              <span>{plan.modeLabel}</span>
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3.5 w-3.5" /> about {fmtDuration(plan.durationMin)}
              </span>
              <span>{plan.distanceKm} km</span>
              {plan.overnight && (
                <span className="inline-flex items-center gap-1">
                  <BedDouble className="h-3.5 w-3.5" /> Overnight
                </span>
              )}
            </div>
          </div>
        </header>
      )}

      <div className={clsx('space-y-5', compact ? 'pt-1' : 'p-5')}>
        {plan.advice && (
          <p className="flex items-start gap-2 rounded-lg bg-brand-soft/60 px-3 py-2 text-[13px] text-ink-2">
            <Info className="mt-0.5 h-4 w-4 shrink-0 text-brand" /> {plan.advice}
          </p>
        )}

        {best ? (
          <div>
            <div className="mb-2 text-[12px] font-semibold uppercase tracking-wide text-muted">Recommended</div>
            <ServiceRow option={best} highlight date={plan.date} />
            {others.length > 0 && (
              <div className="mt-2 space-y-2">
                {others.map((o, i) => (
                  <ServiceRow key={i} option={o} date={plan.date} />
                ))}
              </div>
            )}
          </div>
        ) : (
          plan.kind !== 'drive' &&
          plan.kind !== 'local' && (
            <p className="flex items-start gap-2 rounded-lg border border-dashed border-line-strong px-3 py-2.5 text-[13px] text-muted">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              We don't have checked service details for this route yet. Use the live search below to see today's {plan.kind === 'train' ? 'trains' : plan.kind === 'bus' ? 'buses' : 'flights'}, then follow the steps.
            </p>
          )
        )}

        {trip && <LiveCheckPanel trip={trip} plan={plan} autoRun={autoRun} />}

        {plan.alternatives.length > 0 && (
          <div>
            <button type="button" onClick={() => setShowAlt((v) => !v)} aria-expanded={showAlt} className="inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
              <ChevronDown className={clsx('h-4 w-4 transition-transform', showAlt && 'rotate-180')} />
              Other ways to travel on this route
            </button>
            {showAlt && (
              <div className="mt-2 space-y-2">
                {plan.alternatives.map((o, i) => (
                  <ServiceRow key={i} option={o} />
                ))}
              </div>
            )}
          </div>
        )}

        <div>
          <div className="mb-3 text-[12px] font-semibold uppercase tracking-wide text-muted">Step by step</div>
          <ol className="relative space-y-4">
            {plan.steps.map((s, i) => {
              const Icon = STEP_ICON[s.icon] ?? Info;
              return (
                <li key={i} className="relative flex gap-3">
                  {i < plan.steps.length - 1 && <span className="absolute left-[15px] top-8 h-[calc(100%-0.5rem)] w-px bg-line-strong" aria-hidden="true" />}
                  <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong bg-surface text-ink-2">
                    <Icon className="h-4 w-4" />
                    <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-brand px-1 text-[10px] font-semibold text-brand-ink">{i + 1}</span>
                  </span>
                  <div className="min-w-0 flex-1 pb-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <span className="text-[14px] font-semibold">{s.title}</span>
                      {s.time != null && (
                        <span className="text-[12px] font-medium text-muted tabular">
                          {fmtTime(s.time, false)}
                          {s.time >= 1440 ? ' (next day)' : ''}
                        </span>
                      )}
                    </div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-ink-2">{s.detail}</p>
                    {s.links && s.links.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {s.links.map((l) => (
                          <ExtLink key={l.url} href={l.url}>
                            {l.label}
                          </ExtLink>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ol>
        </div>

        <div className="flex flex-wrap items-start gap-2 rounded-lg bg-warn-soft px-3 py-2.5 text-[12.5px] text-warn">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="min-w-0 flex-1">
            <span className="font-medium">Times and fares change.</span> Check today's timetable before you book:{' '}
            <span className="inline-flex flex-wrap gap-x-3 gap-y-1">
              {plan.liveLinks.map((l) => (
                <a key={l.url} href={l.url} target="_blank" rel="noopener noreferrer" className="font-medium underline underline-offset-2">
                  {l.label}
                </a>
              ))}
            </span>
          </div>
        </div>

        {!compact && plan.tips.length > 0 && (
          <div className="rounded-lg border border-line">
            <button
              type="button"
              onClick={() => setShowTips((v) => !v)}
              aria-expanded={showTips}
              className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left text-[13.5px] font-semibold"
            >
              <span className="inline-flex items-center gap-2">
                <Info className="h-4 w-4 text-brand" /> Good to know for this journey
              </span>
              <ChevronDown className={clsx('h-4 w-4 text-muted transition-transform', showTips && 'rotate-180')} />
            </button>
            {showTips && (
              <ul className="space-y-2 border-t border-line px-4 py-3 text-[13px] text-ink-2">
                {plan.tips.map((t) => (
                  <li key={t} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted" /> {t}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {!compact && plan.sources.length > 0 && (
          <p className="text-[11.5px] text-muted">
            Service details checked against:{' '}
            {plan.sources.slice(0, 4).map((s, i) => (
              <span key={s}>
                {i > 0 && ', '}
                <a href={s} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-ink">
                  {hostOf(s)}
                </a>
              </span>
            ))}
          </p>
        )}
      </div>
    </section>
  );
}

function ServiceRow({ option: o, highlight, date }: { option: ServiceOption; highlight?: boolean; date?: string }) {
  const next = date && o.runsOnTravelDay === false ? nearestRunDate(o, date) : null;
  return (
    <div className={clsx('rounded-lg border px-3.5 py-3', highlight ? 'border-brand bg-brand-soft/40 shadow-[0_0_0_1px_rgb(var(--brand))]' : 'border-line bg-surface')}>
      <div className="flex flex-wrap items-center gap-2">
        <KindIcon kind={o.kind} className="h-4 w-4 text-muted" />
        {o.number && <span className="rounded-md bg-ink px-1.5 py-0.5 font-mono text-[12px] font-semibold text-bg">{o.number}</span>}
        <span className="min-w-0 text-[14px] font-semibold">{o.name}</span>
        {highlight && <Badge tone="brand">Best fit</Badge>}
        {o.runsOnTravelDay === false && (
          <Badge tone="warn">
            <CalendarDays className="h-3 w-3" /> Not on your travel day
          </Badge>
        )}
      </div>
      <div className="mt-2 grid gap-x-4 gap-y-1 text-[12.5px] text-ink-2 sm:grid-cols-[minmax(0,1fr)_auto]">
        <div className="min-w-0">
          <span className="font-medium tabular">{o.departs ?? ''}</span> {o.fromLabel}
          <ArrowRight className="mx-1 inline h-3.5 w-3.5 text-muted" />
          <span className="font-medium tabular">
            {o.arrives ?? ''}
            {o.arrivalDayOffset ? ` (+${o.arrivalDayOffset})` : ''}
          </span>{' '}
          {o.toLabel}
        </div>
        <div className="text-muted sm:text-right">{fmtDuration(o.durationMin)}</div>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[12px]">
        {o.runsOnText && <span className="rounded bg-sunken px-1.5 py-0.5 text-muted">Runs: {o.runsOnText}</span>}
        {o.classes?.map((c) => (
          <span key={c} className="rounded bg-sunken px-1.5 py-0.5 text-muted">
            {o.kind === 'train' ? classLabel(c) : c}
          </span>
        ))}
        {o.fareText && <span className="rounded bg-sunken px-1.5 py-0.5 font-medium text-ink-2">{o.fareText}</span>}
      </div>
      {date && o.kind === 'train' && <RunCalendar option={o} date={date} />}
      {next && (
        <p className="mt-1.5 text-[12px] font-medium text-warn">
          Next runs {next.offset < 0 ? `${-next.offset} day${next.offset === -1 ? '' : 's'} earlier` : `${next.offset} day${next.offset === 1 ? '' : 's'} later`}, on{' '}
          {new Date(next.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}.
        </p>
      )}
    </div>
  );
}

function ExtLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex h-7 items-center gap-1 rounded-md border border-line-strong bg-surface px-2.5 text-[12.5px] font-medium text-ink-2 shadow-card hover:bg-sunken"
    >
      {children} <ExternalLink className="h-3 w-3" />
    </a>
  );
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}
