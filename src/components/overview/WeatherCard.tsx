import { useEffect, useState } from 'react';
import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSun, Droplets, Snowflake, Sun } from 'lucide-react';
import type { Destination } from '../../types';
import { getForecast, type DayForecast, type WeatherIcon } from '../../services/weather';
import { Card } from '../ui/Kit';
import { Spinner } from '../ui/Spinner';

const ICONS: Record<WeatherIcon, typeof Sun> = { Sun, CloudSun, Cloud, CloudFog, CloudDrizzle, CloudRain, CloudLightning, Snowflake };

export interface DestinationDates {
  dest: Destination;
  dates: string[];
}

function shortDay(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' });
}

function DestinationWeather({ dest, dates }: DestinationDates) {
  const [rows, setRows] = useState<DayForecast[] | null>(null);
  const [error, setError] = useState(false);
  const key = dates.join(',');

  useEffect(() => {
    let live = true;
    setRows(null);
    setError(false);
    getForecast(dest, dates)
      .then((r) => live && setRows(r))
      .catch(() => live && setError(true));
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dest.lat, dest.lon, key]);

  return (
    <div className="px-5 py-3.5">
      <div className="mb-2 flex items-baseline justify-between gap-2">
        <span className="truncate text-[13.5px] font-semibold">{dest.name}</span>
        <span className="shrink-0 text-[12px] text-muted">{dates.length} day{dates.length > 1 ? 's' : ''}</span>
      </div>
      {error ? (
        <p className="text-[12.5px] text-muted">Weather is unavailable right now.</p>
      ) : !rows ? (
        <div className="py-2">
          <Spinner className="h-4 w-4" />
        </div>
      ) : rows.every((r) => r.status !== 'ok') ? (
        <p className="text-[12.5px] text-muted">
          {rows.every((r) => r.status === 'past') ? 'These dates have passed.' : 'Forecast appears 16 days before your dates.'}
        </p>
      ) : (
        <ul className="grid grid-cols-[repeat(auto-fill,minmax(64px,1fr))] gap-1.5">
          {rows.map((r) => {
            if (r.status !== 'ok')
              return (
                <li key={r.date} className="rounded-lg bg-sunken/70 px-2 py-2 text-center">
                  <div className="text-[11px] text-muted">{shortDay(r.date)}</div>
                  <div className="mt-1 text-[11px] text-muted">—</div>
                </li>
              );
            const w = r.weather;
            const Icon = ICONS[w.icon];
            return (
              <li key={r.date} className="rounded-lg bg-sunken/70 px-2 py-2 text-center" title={w.label}>
                <div className="text-[11px] text-muted">{shortDay(r.date)}</div>
                <Icon className="mx-auto my-1 h-5 w-5 text-ink-2" aria-label={w.label} />
                <div className="text-[12.5px] font-semibold tabular">
                  {w.max}°<span className="font-normal text-muted"> {w.min}°</span>
                </div>
                {w.rain != null && w.rain >= 20 && (
                  <div className="mt-0.5 inline-flex items-center gap-0.5 text-[10.5px] text-brand">
                    <Droplets className="h-3 w-3" />
                    {w.rain}%
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export function WeatherCard({ items }: { items: DestinationDates[] }) {
  return (
    <Card title="Weather" subtitle="Daily forecast by Open-Meteo" bodyClass="divide-y divide-line">
      {items.length === 0 ? <p className="px-5 py-4 text-[13px] text-muted">No destinations yet.</p> : items.map((i) => <DestinationWeather key={i.dest.id} {...i} />)}
    </Card>
  );
}
