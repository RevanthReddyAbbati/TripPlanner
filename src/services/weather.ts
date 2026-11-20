// Daily forecasts from Open-Meteo (free, no key, CORS enabled).
// Forecasts only exist up to 16 days ahead; later dates come back as `unavailable`.
import type { GeoPoint } from '../types';
import { addDays, toISODate } from '../lib/time';

export type WeatherIcon = 'Sun' | 'CloudSun' | 'Cloud' | 'CloudFog' | 'CloudDrizzle' | 'CloudRain' | 'CloudLightning' | 'Snowflake';

export interface DayWeather {
  date: string;
  code: number;
  label: string;
  icon: WeatherIcon;
  max: number;
  min: number;
  /** Max chance of precipitation, %. */
  rain: number | null;
}

export type DayForecast = { date: string; status: 'ok'; weather: DayWeather } | { date: string; status: 'unavailable' | 'past' };

export const FORECAST_DAYS = 16;

const cache = new Map<string, Promise<Map<string, DayWeather>>>();

export function describeCode(code: number): { label: string; icon: WeatherIcon } {
  if (code === 0) return { label: 'Clear', icon: 'Sun' };
  if (code <= 2) return { label: 'Partly cloudy', icon: 'CloudSun' };
  if (code === 3) return { label: 'Overcast', icon: 'Cloud' };
  if (code === 45 || code === 48) return { label: 'Fog', icon: 'CloudFog' };
  if (code >= 51 && code <= 57) return { label: 'Drizzle', icon: 'CloudDrizzle' };
  if ((code >= 61 && code <= 67) || (code >= 80 && code <= 82)) return { label: code >= 80 ? 'Showers' : 'Rain', icon: 'CloudRain' };
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return { label: 'Snow', icon: 'Snowflake' };
  if (code >= 95) return { label: 'Thunderstorm', icon: 'CloudLightning' };
  return { label: 'Cloudy', icon: 'Cloud' };
}

/**
 * Forecast for each requested date at a location; network failures reject the promise.
 * Requests are cached and shared between callers, so they are never aborted: a caller that
 * unmounts should simply ignore the result (aborting would also cancel it for everyone else).
 */
export async function getForecast(p: GeoPoint, dates: string[]): Promise<DayForecast[]> {
  const today = toISODate(new Date());
  const last = addDays(today, FORECAST_DAYS - 1);
  const inRange = dates.filter((d) => d >= today && d <= last).sort();
  let byDate = new Map<string, DayWeather>();
  if (inRange.length) {
    const start = inRange[0];
    const end = inRange[inRange.length - 1];
    const key = `${p.lat.toFixed(3)},${p.lon.toFixed(3)},${start},${end}`;
    let req = cache.get(key);
    if (!req) {
      req = fetchRange(p, start, end);
      cache.set(key, req);
      req.catch(() => cache.delete(key));
    }
    byDate = await req;
  }
  return dates.map((date) => {
    if (date < today) return { date, status: 'past' as const };
    const w = byDate.get(date);
    return w ? { date, status: 'ok' as const, weather: w } : { date, status: 'unavailable' as const };
  });
}

async function fetchRange(p: GeoPoint, start: string, end: string): Promise<Map<string, DayWeather>> {
  const params = new URLSearchParams({
    latitude: String(p.lat),
    longitude: String(p.lon),
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    start_date: start,
    end_date: end,
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
  if (!res.ok) throw new Error(`Weather unavailable (${res.status})`);
  const data = (await res.json()) as {
    daily?: { time: string[]; weather_code: number[]; temperature_2m_max: number[]; temperature_2m_min: number[]; precipitation_probability_max?: (number | null)[] };
  };
  const out = new Map<string, DayWeather>();
  const d = data.daily;
  if (!d) return out;
  d.time.forEach((date, i) => {
    const code = d.weather_code[i];
    const { label, icon } = describeCode(code);
    out.set(date, {
      date,
      code,
      label,
      icon,
      max: Math.round(d.temperature_2m_max[i]),
      min: Math.round(d.temperature_2m_min[i]),
      rain: d.precipitation_probability_max?.[i] ?? null,
    });
  });
  return out;
}
