import { useMemo, useState } from 'react';
import {
  AlertTriangle, ArrowDown, ArrowUp, ArrowRight, BedDouble, ChevronDown, BusFront, Car, Coffee, Home, LogOut, MapPin, Moon, Plane, Plus, ReceiptIndianRupee, Star,
  TrainFront, Trash2, UtensilsCrossed, Bike,
} from 'lucide-react';
import clsx from 'clsx';
import type { DayPlan, Place, Stop, Trip } from '../../types';
import { fmtDay, fmtDuration, fmtTime } from '../../lib/time';
import { inr } from '../../lib/format';
import { mapsLink } from '../../lib/share';
import { conflicts, moveStop, removeStop } from '../../engine/edit';
import { dayColor } from '../map/colors';
import { Badge } from '../ui/Fields';
import { IconButton } from '../ui/Button';
import { buildJourney, legForStop } from '../../engine/journey';
import { JourneyCard } from '../journey/JourneyCard';

interface Props {
  trip: Trip;
  day: number | 'all';
  onDay: (d: number | 'all') => void;
  activeStopId?: string;
  onActivate: (dayIndex: number, stopId: string) => void;
  readOnly?: boolean;
  onChangeDay?: (day: DayPlan) => void;
  onAddPlace?: (dayIndex: number) => void;
  /** Log an expense against a stop (prefilled from its cost). */
  onLogExpense?: (dayIndex: number, stop: Stop) => void;
  /** Open the trip's full travel guide tab. */
  onOpenTravelGuide?: () => void;
}

export function DayTabs({ trip, day, onDay }: Pick<Props, 'trip' | 'day' | 'onDay'>) {
  return (
    <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2" role="tablist" aria-label="Days">
      <TabBtn on={day === 'all'} onClick={() => onDay('all')} color="rgb(var(--ink))" title="All days" sub={`${trip.days.length} days`} />
      {trip.days.map((d) => (
        <TabBtn key={d.index} on={day === d.index} onClick={() => onDay(d.index)} color={dayColor(d.index)} title={`Day ${d.index + 1}`} sub={fmtDay(d.date)} />
      ))}
    </div>
  );
}

function TabBtn({ on, onClick, color, title, sub }: { on: boolean; onClick: () => void; color: string; title: string; sub: string }) {
  return (
    <button
      role="tab"
      aria-selected={on}
      onClick={onClick}
      className={clsx(
        'flex shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] transition-colors',
        on ? 'border-brand bg-brand-soft text-ink shadow-[0_0_0_1px_rgb(var(--brand))]' : 'border-line-strong bg-surface hover:bg-sunken',
      )}
    >
      <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
      <span className="font-medium">{title}</span>
      <span className={on ? 'opacity-75' : 'text-muted'}>{sub}</span>
    </button>
  );
}

export function Itinerary({ trip, day, activeStopId, onActivate, readOnly, onChangeDay, onAddPlace, onLogExpense, onOpenTravelGuide }: Props) {
  const places = useMemo(() => {
    const m = new Map<string, Place>();
    trip.input.destinations.forEach((d) => d.places.forEach((p) => m.set(p.id, p)));
    return m;
  }, [trip.input.destinations]);
  const list = day === 'all' ? trip.days : trip.days.filter((d) => d.index === day);
  return (
    <div className="space-y-4">
      {list.map((d) => (
        <DayCard
          key={d.index}
          trip={trip}
          day={d}
          places={places}
          activeStopId={activeStopId}
          onActivate={onActivate}
          readOnly={readOnly}
          onChange={onChangeDay}
          onAddPlace={onAddPlace}
          onLogExpense={onLogExpense}
          onOpenTravelGuide={onOpenTravelGuide}
        />
      ))}
    </div>
  );
}

function DayCard({
  trip, day, places, activeStopId, onActivate, readOnly, onChange, onAddPlace, onLogExpense, onOpenTravelGuide,
}: {
  trip: Trip; day: DayPlan; places: Map<string, Place>; activeStopId?: string; onActivate: Props['onActivate'];
  readOnly?: boolean; onChange?: (d: DayPlan) => void; onAddPlace?: (i: number) => void; onLogExpense?: Props['onLogExpense'];
  onOpenTravelGuide?: () => void;
}) {
  const bad = conflicts(day, places);
  const [openTravel, setOpenTravel] = useState<string | null>(null);
  // Journeys for this day's travel stops (cheap to build; data lookups only).
  const journeys = useMemo(() => {
    const m = new Map<string, ReturnType<typeof buildJourney>>();
    day.stops.forEach((s) => {
      if (s.kind !== 'travel') return;
      const leg = legForStop(trip, day.index, s.start);
      if (leg) m.set(s.id, buildJourney(trip, leg));
    });
    return m;
  }, [trip, day]);
  const logged = new Map<string, number>();
  (trip.expenses ?? []).forEach((e) => e.stopId && logged.set(e.stopId, (logged.get(e.stopId) ?? 0) + e.amount));
  const daySpent = (trip.expenses ?? []).filter((e) => e.date === day.date).reduce((a, e) => a + e.amount, 0);
  const color = dayColor(day.index);
  const spend = day.stops.filter((s) => s.kind === 'visit' || s.kind === 'custom').reduce((a, s) => a + (s.optional ? 0 : s.cost), 0);
  const night = day.night;
  const nightText =
    night.type === 'stay'
      ? `Night in ${trip.input.destinations.find((d) => d.id === night.destinationId)?.name ?? 'your stay'}`
      : night.type === 'transit'
        ? 'Night on the move'
        : day.index === trip.days.length - 1
          ? 'Home'
          : 'Night at home';
  let n = 0;
  return (
    <section className="card overflow-hidden" aria-labelledby={`day-${day.index}`}>
      <header className="flex items-start gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-[14px] font-semibold text-white" style={{ background: color }}>
          {day.index + 1}
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[12px] font-medium text-muted">
            Day {day.index + 1} · {fmtDay(day.date)}
          </div>
          <h3 id={`day-${day.index}`} className="truncate text-[15.5px] font-semibold">
            {day.title}
          </h3>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[12.5px] text-muted">
            <span className="inline-flex items-center gap-1">
              <Moon className="h-3.5 w-3.5" /> {nightText}
            </span>
            {spend > 0 && <span>Entries {inr(spend)} per person</span>}
            {daySpent > 0 && (
              <span className="inline-flex items-center gap-1 text-ink-2">
                <ReceiptIndianRupee className="h-3.5 w-3.5" /> {inr(daySpent)} spent
              </span>
            )}
          </div>
        </div>
        {!readOnly && onAddPlace && (
          <button onClick={() => onAddPlace(day.index)} className="inline-flex h-8 shrink-0 items-center gap-1 rounded-lg border border-line-strong px-2.5 text-[13px] font-medium shadow-card hover:bg-sunken">
            <Plus className="h-4 w-4" /> Add place
          </button>
        )}
      </header>
      {day.stops.length === 0 ? (
        <p className="px-5 py-6 text-[14px] text-muted">Nothing planned. Add a place, or keep it as a free day.</p>
      ) : (
        <ol className="divide-y divide-line">
          {day.stops.map((s, i) => {
            const mappable = s.lat != null && (s.kind === 'visit' || s.kind === 'custom' || s.kind === 'checkin') && !/home/i.test(s.title);
            const num = mappable && s.kind !== 'checkin' ? ++n : undefined;
            const active = s.id === activeStopId;
            const conflict = bad.has(s.id);
            return (
              <li
                key={s.id}
                className={clsx('group grid grid-cols-[72px_minmax(0,1fr)] gap-3 px-4 py-3 transition-colors sm:grid-cols-[92px_minmax(0,1fr)] sm:px-5', active && 'bg-brand-soft')}
              >
                <div className="pt-0.5 text-[12.5px] font-medium leading-tight text-ink-2 tabular">
                  {fmtTime(s.start)}
                  <div className="mt-0.5 text-[11px] opacity-80">{fmtDuration(s.end - s.start)}</div>
                </div>
                <div className="min-w-0">
                  <div className="flex items-start gap-2">
                    <KindIcon stop={s} color={color} num={num} />
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        disabled={!mappable}
                        onClick={() => onActivate(day.index, s.id)}
                        className={clsx('text-left font-medium', mappable && 'hover:text-brand hover:underline')}
                      >
                        {s.title}
                      </button>
                      {s.note && <p className="text-[13px] text-muted">{s.note}</p>}
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-[12px]">
                        {s.cost > 0 && <span className="rounded-md bg-sunken px-1.5 py-0.5 font-medium text-ink-2 tabular">{inr(s.cost)} pp</span>}
                        {s.optional && <Badge tone="warn">Optional</Badge>}
                        {conflict && (
                          <Badge tone="bad">
                            <AlertTriangle className="h-3 w-3" /> Timing clash
                          </Badge>
                        )}
                        {mappable && (
                          <a className="text-brand hover:underline" href={mapsLink(s.lat!, s.lon!, s.title)} target="_blank" rel="noopener noreferrer">
                            Google Maps ↗
                          </a>
                        )}
                        {logged.has(s.id) ? (
                          <Badge tone="ok">
                            <ReceiptIndianRupee className="h-3 w-3" /> {inr(logged.get(s.id)!)} logged
                          </Badge>
                        ) : (
                          !readOnly &&
                          onLogExpense &&
                          (s.kind === 'visit' || s.kind === 'custom' || s.kind === 'meal' || s.kind === 'travel') && (
                            <button type="button" onClick={() => onLogExpense(day.index, s)} className="inline-flex items-center gap-1 font-medium text-muted hover:text-brand">
                              <ReceiptIndianRupee className="h-3.5 w-3.5" /> Log expense
                            </button>
                          )
                        )}
                        {journeys.has(s.id) && (
                          <button
                            type="button"
                            aria-expanded={openTravel === s.id}
                            onClick={() => setOpenTravel((v) => (v === s.id ? null : s.id))}
                            className="inline-flex items-center gap-1 font-medium text-brand hover:underline"
                          >
                            <ChevronDown className={clsx('h-3.5 w-3.5 transition-transform', openTravel === s.id && 'rotate-180')} />
                            How to get there
                            {journeys.get(s.id)!.options[0]?.number && (
                              <span className="ml-1 rounded bg-ink px-1 font-mono text-[11px] font-semibold text-bg">{journeys.get(s.id)!.options[0].number}</span>
                            )}
                          </button>
                        )}
                      </div>
                      {openTravel === s.id && journeys.has(s.id) && (
                        <div className="mt-3 rounded-lg border border-line bg-sunken/30 p-3 sm:p-4">
                          <JourneyCard plan={journeys.get(s.id)!} compact />
                          {onOpenTravelGuide && (
                            <button type="button" onClick={onOpenTravelGuide} className="mt-4 inline-flex items-center gap-1 text-[13px] font-medium text-brand hover:underline">
                              Full travel guide with tips <ArrowRight className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                    {!readOnly && onChange && !s.fixed && (
                      <div className="flex shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100">
                        <IconButton label="Move earlier" disabled={i === 0 || day.stops[i - 1].fixed} onClick={() => onChange(moveStop(day, s.id, -1))}>
                          <ArrowUp className="h-4 w-4" />
                        </IconButton>
                        <IconButton label="Move later" disabled={i === day.stops.length - 1 || day.stops[i + 1].fixed} onClick={() => onChange(moveStop(day, s.id, 1))}>
                          <ArrowDown className="h-4 w-4" />
                        </IconButton>
                        <IconButton label={`Remove ${s.title}`} onClick={() => onChange(removeStop(day, s.id))}>
                          <Trash2 className="h-4 w-4" />
                        </IconButton>
                      </div>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}

function KindIcon({ stop, color, num }: { stop: Stop; color: string; num?: number }) {
  if (num && (stop.kind === 'visit' || stop.kind === 'custom')) {
    return (
      <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full text-[10.5px] font-semibold text-white" style={{ background: color }}>
        {num}
      </span>
    );
  }
  const cls = 'mt-0.5 h-[18px] w-[18px] shrink-0 text-muted';
  switch (stop.kind) {
    case 'meal':
      return <UtensilsCrossed className={cls} />;
    case 'rest':
      return <Coffee className={cls} />;
    case 'checkin':
      return /home/i.test(stop.title) ? <Home className={cls} /> : <BedDouble className={cls} />;
    case 'checkout':
      return <LogOut className={cls} />;
    case 'custom':
      return <Star className={cls} />;
    case 'travel': {
      const m = stop.mode ?? '';
      if (m === 'flight') return <Plane className={cls} />;
      if (m.startsWith('train')) return <TrainFront className={cls} />;
      if (m === 'car_self' || m === 'car_rental' || m === 'taxi' || m === 'scooter') return <Car className={cls} />;
      if (m === 'bike') return <Bike className={cls} />;
      return <BusFront className={cls} />;
    }
    default:
      return <MapPin className={cls} />;
  }
}
