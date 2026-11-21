// Live, date-specific check of a journey using Gemini with Google Search grounding.
//
// What it can do: confirm which trains run on the exact date, find cancellations, diversions,
// rescheduling and new services announced online, and judge how busy the date is (festivals,
// long weekends). What it cannot do: read live seat counts; those come only from IRCTC and its
// licensed partners, so the result always points to the official booking page for that.
import type { Trip } from '../../types';
import type { JourneyPlan } from '../../engine/journey';
import { generateGrounded, parseJSON, type WebSource } from './gemini';

export type RunsOnDate = 'yes' | 'no' | 'unknown';
export type ServiceStatus = 'normal' | 'cancelled' | 'diverted' | 'rescheduled' | 'unknown';
export type Demand = 'low' | 'normal' | 'high' | 'very-high' | 'unknown';

export interface LiveService {
  /** Train number for trains; empty for buses/flights. */
  number: string;
  name: string;
  runsOnDate: RunsOnDate;
  status: ServiceStatus;
  departs?: string;
  arrives?: string;
  note?: string;
  /** True when the service is already in the app's verified data. */
  known: boolean;
}

export interface LiveCheck {
  legId: string;
  date: string;
  checkedAt: string;
  summary: string;
  services: LiveService[];
  alerts: string[];
  demand: Demand;
  demandNote: string;
  recommendation: string;
  sources: WebSource[];
  queries: string[];
}

const STATUSES: ServiceStatus[] = ['normal', 'cancelled', 'diverted', 'rescheduled', 'unknown'];
const DEMANDS: Demand[] = ['low', 'normal', 'high', 'very-high', 'unknown'];
const CACHE_MIN = 30;

function cacheKey(legId: string, date: string) {
  return `itinera-live-${legId}-${date}`;
}

export function cachedLiveCheck(legId: string, date: string): LiveCheck | null {
  try {
    const raw = sessionStorage.getItem(cacheKey(legId, date));
    if (!raw) return null;
    const v = JSON.parse(raw) as LiveCheck;
    if (Date.now() - new Date(v.checkedAt).getTime() > CACHE_MIN * 60_000) return null;
    return v;
  } catch {
    return null;
  }
}

function store(v: LiveCheck) {
  try {
    sessionStorage.setItem(cacheKey(v.legId, v.date), JSON.stringify(v));
  } catch {
    /* storage full or blocked: skip caching */
  }
}

export function buildLivePrompt(trip: Trip, j: JourneyPlan): string {
  const weekday = new Date(j.date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' });
  const known = [...j.options, ...j.alternatives]
    .map((o) => `- ${o.kind}${o.number ? ` ${o.number}` : ''} ${o.name}${o.departs ? `, dep ${o.departs} ${o.fromLabel}, arr ${o.arrives} ${o.toLabel}` : ''}${o.runsOnText ? `, runs ${o.runsOnText}` : ''}`)
    .join('\n');
  return `Today is ${new Date().toISOString().slice(0, 10)}. A group of ${trip.input.travelers} is travelling from ${j.fromName} to ${j.toName}, India, on ${weekday} ${j.date}, by ${j.modeLabel}${j.overnight ? ' (overnight)' : ''}, leaving around ${String(Math.floor(j.departMin / 60)).padStart(2, '0')}:${String(j.departMin % 60).padStart(2, '0')}.

Services already in our database (from timetables checked earlier):
${known || '- none on file'}

Search the web now and check, for that exact date:
1. Which of these services actually run on ${j.date}, and whether any are cancelled, diverted, rescheduled or short-terminated around that date (railway notices, news, operator announcements).
2. Any other direct train, bus or flight on this route that we are missing (only real ones you found).
3. Anything that affects travel that day: strikes, road or ghat closures, weather warnings, festivals, long weekends.
4. How busy that date is likely to be for tickets (low / normal / high / very-high), and why.
Do not guess seat availability numbers; say to check IRCTC (trains) or redBus (buses) for live seats.

Reply ONLY with JSON in a \`\`\`json block, no other text:
{
  "summary": "one or two plain sentences for a first-time traveller",
  "services": [{"number": "5-digit train number or empty", "name": "", "runsOnDate": "yes|no|unknown", "status": "normal|cancelled|diverted|rescheduled|unknown", "departs": "HH:MM or empty", "arrives": "HH:MM or empty", "note": "short, cite what you found"}],
  "alerts": ["short plain sentences, empty if none"],
  "demand": "low|normal|high|very-high|unknown",
  "demandNote": "why",
  "recommendation": "what to book, in one sentence"
}`;
}

interface Raw {
  summary?: string;
  services?: { number?: string; name?: string; runsOnDate?: string; status?: string; departs?: string; arrives?: string; note?: string }[];
  alerts?: string[];
  demand?: string;
  demandNote?: string;
  recommendation?: string;
}

const hhmm = (s?: string) => (s && /^([01]?\d|2[0-3]):[0-5]\d$/.test(s.trim()) ? s.trim().padStart(5, '0') : undefined);
const clip = (s: unknown, n: number) => (typeof s === 'string' ? s.trim().slice(0, n) : '');

/** Validate the model's JSON against what we know; unknown values become 'unknown', bad train numbers are dropped. */
export function normalizeLive(raw: Raw, j: JourneyPlan): Omit<LiveCheck, 'checkedAt' | 'sources' | 'queries'> {
  const knownNumbers = new Set([...j.options, ...j.alternatives].map((o) => o.number).filter(Boolean));
  const knownNames = new Set([...j.options, ...j.alternatives].map((o) => o.name.toLowerCase()));
  const services: LiveService[] = [];
  const seen = new Set<string>();
  (Array.isArray(raw.services) ? raw.services : []).forEach((s) => {
    const number = clip(s.number, 5);
    if (number && !/^\d{5}$/.test(number)) return; // never show a malformed train number
    const name = clip(s.name, 80);
    if (!name && !number) return;
    const key = number || name.toLowerCase();
    if (seen.has(key)) return;
    seen.add(key);
    services.push({
      number,
      name: name || `Train ${number}`,
      runsOnDate: s.runsOnDate === 'yes' || s.runsOnDate === 'no' ? s.runsOnDate : 'unknown',
      status: (STATUSES as string[]).includes(s.status ?? '') ? (s.status as ServiceStatus) : 'unknown',
      departs: hhmm(s.departs),
      arrives: hhmm(s.arrives),
      note: clip(s.note, 240) || undefined,
      known: number ? knownNumbers.has(number) : knownNames.has(name.toLowerCase()),
    });
  });
  return {
    legId: j.legId,
    date: j.date,
    summary: clip(raw.summary, 400) || 'No clear live information was found for this date.',
    services: services.slice(0, 12),
    alerts: (Array.isArray(raw.alerts) ? raw.alerts : []).map((a) => clip(a, 240)).filter(Boolean).slice(0, 6),
    demand: (DEMANDS as string[]).includes(raw.demand ?? '') ? (raw.demand as Demand) : 'unknown',
    demandNote: clip(raw.demandNote, 240),
    recommendation: clip(raw.recommendation, 300),
  };
}

/** Run a live check for one journey (cached for 30 minutes per journey and date). */
export async function liveCheckJourney(trip: Trip, j: JourneyPlan, opts: { force?: boolean; signal?: AbortSignal } = {}): Promise<LiveCheck> {
  if (!opts.force) {
    const hit = cachedLiveCheck(j.legId, j.date);
    if (hit) return hit;
  }
  const res = await generateGrounded({ messages: [{ role: 'user', parts: [{ text: buildLivePrompt(trip, j) }] }], signal: opts.signal });
  const out: LiveCheck = { ...normalizeLive(parseJSON<Raw>(res.text), j), checkedAt: new Date().toISOString(), sources: res.sources, queries: res.queries };
  store(out);
  return out;
}
