import clsx from 'clsx';
import type { ServiceOption } from '../../engine/journey';
import { addDays, toISODate } from '../../lib/time';
import type { Weekday } from '../../data/transport/types';

const WD: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function runsOn(o: Pick<ServiceOption, 'runsOn'>, iso: string): boolean | undefined {
  if (!o.runsOn) return undefined;
  if (o.runsOn === 'daily') return true;
  return o.runsOn.includes(WD[new Date(iso + 'T00:00:00').getDay()]);
}

/** Nearest date (before or after, up to a week, never in the past) on which the service runs. */
export function nearestRunDate(o: Pick<ServiceOption, 'runsOn'>, iso: string, today = toISODate(new Date())): { date: string; offset: number } | null {
  const tomorrow = addDays(today, 1);
  for (let k = 1; k <= 7; k++) {
    for (const off of [-k, k]) {
      const d = addDays(iso, off);
      if (d >= tomorrow && runsOn(o, d)) return { date: d, offset: off };
    }
  }
  return null;
}

/** Seven days centred on the travel date, marking the days the train leaves. */
export function RunCalendar({ option, date }: { option: ServiceOption; date: string }) {
  if (!option.runsOn || option.runsOn === 'daily') return null;
  const days = Array.from({ length: 7 }, (_, i) => addDays(date, i - 3));
  return (
    <div className="mt-2 flex items-center gap-1" aria-label={`Days ${option.number ?? option.name} runs around your travel date`}>
      {days.map((d) => {
        const on = runsOn(option, d);
        const isTravel = d === date;
        const dt = new Date(d + 'T00:00:00');
        return (
          <span
            key={d}
            title={`${dt.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}: ${on ? 'runs' : 'does not run'}`}
            className={clsx(
              'flex w-9 flex-col items-center rounded-md border px-0.5 py-1 text-[10.5px] leading-tight',
              on ? 'border-ok/30 bg-ok-soft text-ok' : 'border-line bg-sunken text-muted line-through decoration-muted/50',
              isTravel && 'ring-2 ring-brand ring-offset-1 ring-offset-surface',
            )}
          >
            <span className="font-semibold no-underline">{WD[dt.getDay()].slice(0, 2)}</span>
            <span className="tabular">{dt.getDate()}</span>
          </span>
        );
      })}
    </div>
  );
}
