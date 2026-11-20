/** "HH:MM" → minutes from midnight. */
export function toMin(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + (m || 0);
}

/** Minutes from midnight → "7:30 AM". Values past 24h wrap and get a "+1" marker. */
export function fmtTime(min: number, withDayMarker = true): string {
  const dayOffset = Math.floor(min / 1440);
  const m = ((Math.round(min) % 1440) + 1440) % 1440;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const ap = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  const base = `${h12}:${String(mm).padStart(2, '0')} ${ap}`;
  return withDayMarker && dayOffset > 0 ? `${base} (+${dayOffset})` : base;
}

/** Minutes → "13h 20m". */
export function fmtDuration(min: number): string {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return toISODate(d);
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** "Sat 21 Nov" */
export function fmtDay(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' });
}

/** "21 Nov 2026" */
export function fmtDate(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** The next Saturday on or after today, a sensible default start date. */
export function nextSaturday(from = new Date()): string {
  const d = new Date(from);
  const diff = (6 - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return toISODate(d);
}

export function monthOf(iso: string): number {
  return Number(iso.slice(5, 7));
}
