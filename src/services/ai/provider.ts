// Phase 2: Gemini-powered features. Every feature returns structured data that the deterministic
// engine validates, times and costs, so the model never invents schedules or prices on its own.
import type { City, Destination, ExpenseCategory, Interest, PaymentMethod, Place, Trip, TripInput } from '../../types';
import { generateJSON, stream, fileToInlineData, type Grounding, type Message } from './gemini';
import { haversineKm } from '../../lib/geo';
import { slug } from '../../lib/format';
import { fmtDay, fmtTime, toISODate } from '../../lib/time';
import { summarize, CATEGORY } from '../../engine/expenses';
import { computeBudget } from '../../engine/budget';
import { modeLabel } from '../../engine/transport';
import type { EditOp } from '../../engine/aiEdits';
import { buildAllJourneys } from '../../engine/journey';

const INTERESTS: Interest[] = ['beaches', 'history', 'nature', 'nightlife', 'spiritual', 'adventure', 'food', 'shopping', 'culture'];
const CATEGORIES: ExpenseCategory[] = ['transport', 'stay', 'food', 'local', 'activities', 'shopping', 'other'];

// ------------------------------------------------------------------------------------------
// Context

/** Compact, factual description of a trip for the model. Kept under a few thousand tokens. */
export function tripContext(trip: Trip): string {
  const i = trip.input;
  const b = computeBudget(trip);
  const s = summarize(trip);
  const lines: string[] = [];
  lines.push(`Trip: ${i.name}`);
  lines.push(`Dates: ${trip.days[0]?.date} to ${trip.days.at(-1)?.date} (${trip.days.length} days). Today is ${toISODate(new Date())}.`);
  lines.push(`Route: ${[i.origin.name, ...i.destinations.map((d) => d.name), i.origin.name].join(' -> ')}`);
  lines.push(`Travellers (${trip.travelers.length}): ${trip.travelers.map((t) => t.name).join(', ')}`);
  lines.push(`Travel: ${modeLabel(i.transport)} there, ${modeLabel(i.returnTransport)} back; local: ${i.localTransport}; stay: ${i.stay}; food: ${i.food}; pace: ${i.pace}.`);
  lines.push(`Interests: ${i.interests.join(', ') || 'none given'}.`);
  lines.push(`Budget cap: INR ${i.budgetPerPerson} per person (INR ${s.cap} group). Planned cost: INR ${b.perPerson} per person.`);
  lines.push(`Spent so far: INR ${s.spent} (${Math.round(s.pctOfCap * 100)}% of cap), remaining INR ${s.remaining}.`);
  lines.push(
    'Spend by category (spent / planned, group INR): ' +
      s.byCategory.filter((c) => c.spent || c.planned).map((c) => `${c.label} ${c.spent}/${c.planned}`).join('; '),
  );
  if (s.settlements.length) {
    const name = (id: string) => trip.travelers.find((t) => t.id === id)?.name ?? '?';
    lines.push('Settle up: ' + s.settlements.map((x) => `${name(x.from)} pays ${name(x.to)} INR ${x.amount}`).join('; '));
  }
  lines.push('');
  lines.push('Itinerary (day index is 0-based in the "dayIndex" field, shown to people as Day N):');
  trip.days.forEach((d) => {
    lines.push(`Day ${d.index + 1} (dayIndex ${d.index}, ${fmtDay(d.date)}): ${d.title}`);
    d.stops.forEach((st) => {
      const cost = st.cost ? `, INR ${st.cost}/person` : '';
      lines.push(`  - ${fmtTime(st.start)} ${st.kind}: ${st.title}${cost}`);
    });
  });
  // Verified transport options per journey, so the assistant names real trains and buses.
  const journeys = buildAllJourneys(trip);
  if (journeys.length) {
    lines.push('');
    lines.push('Journeys (verified services from the transport database; say timetables should be confirmed on IRCTC/redBus):');
    journeys.forEach((j) => {
      const top = j.options.slice(0, 3).map((o) => {
        const id = o.number ? `${o.number} ${o.name}` : o.name;
        const when = o.departs ? ` dep ${o.departs} ${o.fromLabel}, arr ${o.arrives}${o.arrivalDayOffset ? ` (+${o.arrivalDayOffset})` : ''} ${o.toLabel}` : '';
        const days = o.runsOnText ? `, runs ${o.runsOnText}` : '';
        const warn = o.runsOnTravelDay === false ? ' [does NOT run on the travel day]' : '';
        return `${o.kind}: ${id}${when}${days}${warn}`;
      });
      lines.push(`- ${j.title} on ${j.date} by ${j.modeLabel}: ${top.length ? top.join('; ') : 'no verified services on file'}${j.advice ? `. Advice: ${j.advice}` : ''}`);
    });
  }
  const unscheduled = i.destinations.flatMap((d) => (trip.unscheduled[d.id] ?? []).map((pid) => d.places.find((p) => p.id === pid)?.name).filter(Boolean));
  if (unscheduled.length) lines.push(`Known places not in the plan: ${unscheduled.slice(0, 30).join(', ')}`);
  if (trip.bookings.length) {
    lines.push('Bookings: ' + trip.bookings.map((bk) => `${bk.title} (${bk.status}${bk.reference ? `, ref ${bk.reference}` : ''}, INR ${bk.amount})`).join('; '));
  }
  if (trip.expenses.length) {
    lines.push(
      'Recent expenses: ' +
        [...trip.expenses].slice(-15).map((e) => `${e.date} ${e.title} INR ${e.amount} (${CATEGORY[e.category].label})`).join('; '),
    );
  }
  return lines.join('\n');
}

const ASSISTANT_SYSTEM = `You are Itinera's trip assistant for travellers in India. You help a group plan and run a trip.
Answer using the trip context provided. Be concise and practical: short paragraphs or bullet lists, amounts in INR with the ₹ sign.
If you suggest places, give real places near the destination with typical hours and prices, and say when something should be checked locally.
When asked about trains, buses or flights, use only the services listed under "Journeys" in the context (with their numbers and timings). If none are listed, say so and point to IRCTC, erail.in or redBus; never invent a train number.
Many users have never travelled before: explain steps simply (where to board, what to carry, how long it takes, how to reach the hotel) when it helps.
Never claim you changed the itinerary; changes happen only when the user uses "Change the plan".
Do not invent bookings, expenses or facts about the group that are not in the context.`;

// ------------------------------------------------------------------------------------------
// Chat

export async function chat(
  trip: Trip,
  history: Message[],
  onText: (t: string) => void,
  signal?: AbortSignal,
  opts?: { search?: boolean; onGrounding?: (g: Grounding) => void },
): Promise<string> {
  return stream(
    {
      system: `${ASSISTANT_SYSTEM}\n\n--- TRIP CONTEXT ---\n${tripContext(trip)}`,
      messages: history,
      signal,
      search: opts?.search,
      onGrounding: opts?.onGrounding,
    },
    onText,
  );
}

// ------------------------------------------------------------------------------------------
// Place suggestions

const PLACE_SCHEMA = {
  type: 'object',
  properties: {
    places: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          lat: { type: 'number' },
          lon: { type: 'number' },
          category: { type: 'string', enum: INTERESTS },
          durationMin: { type: 'integer' },
          cost: { type: 'integer', description: 'Entry or activity cost per person in INR, 0 if free' },
          bestTime: { type: 'string', enum: ['morning', 'afternoon', 'sunset', 'evening', 'any'] },
          open: { type: 'string', description: 'Opening time HH:MM 24h, empty if always open' },
          close: { type: 'string', description: 'Closing time HH:MM 24h, empty if always open' },
          priority: { type: 'integer', description: '1 minor to 5 must-see' },
          note: { type: 'string', description: 'One practical sentence' },
        },
        required: ['name', 'lat', 'lon', 'category', 'durationMin', 'cost', 'bestTime', 'priority', 'note'],
      },
    },
  },
  required: ['places'],
};

interface RawPlace {
  name: string;
  lat: number;
  lon: number;
  category: string;
  durationMin: number;
  cost: number;
  bestTime: string;
  open?: string;
  close?: string;
  priority: number;
  note: string;
}

/** Real places near a destination that suit the group, excluding ones already known. Coordinates are sanity-checked. */
export async function suggestPlaces(dest: Destination, input: TripInput, opts: { request?: string; count?: number; signal?: AbortSignal } = {}): Promise<Place[]> {
  const known = dest.places.map((p) => p.name);
  const prompt = `Suggest ${opts.count ?? 8} real places to visit in or near ${dest.name}, ${dest.state}, India (centre ${dest.lat.toFixed(4)}, ${dest.lon.toFixed(4)}), within 50 km.
Group: ${input.travelers} people, interests: ${input.interests.join(', ') || 'general sightseeing'}, pace: ${input.pace}, budget about INR ${input.budgetPerPerson} per person for the whole trip.
${opts.request ? `They specifically asked for: ${opts.request}\n` : ''}Do not repeat these places they already have: ${known.join(', ') || 'none'}.
Give accurate coordinates (4 decimals). Use typical Indian adult prices. Leave open/close empty for beaches and viewpoints.`;
  const res = await generateJSON<{ places: RawPlace[] }>({ messages: [{ role: 'user', parts: [{ text: prompt }] }], schema: PLACE_SCHEMA, signal: opts.signal });
  // The prompt asks for new places only; enforce it in case the model repeats known ones.
  const knownSet = new Set(known.map(normalizeName));
  return toPlaces(res.places ?? [], dest, 'ai').filter((p) => !knownSet.has(normalizeName(p.name)));
}

export function toPlaces(raw: RawPlace[], near: { lat: number; lon: number; id?: string }, source: Place['source']): Place[] {
  const seen = new Set<string>();
  return raw
    .filter((r) => r && typeof r.name === 'string' && Number.isFinite(r.lat) && Number.isFinite(r.lon))
    .filter((r) => haversineKm(near, r) <= 80)
    .filter((r) => {
      const k = r.name.trim().toLowerCase();
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    })
    .map((r) => ({
      id: `ai-${slug(r.name)}-${Math.round(r.lat * 1000)}`,
      name: r.name.trim(),
      lat: r.lat,
      lon: r.lon,
      category: (INTERESTS.includes(r.category as Interest) ? r.category : 'culture') as Interest,
      durationMin: clamp(Math.round(r.durationMin || 60), 20, 480),
      cost: Math.max(0, Math.round(r.cost || 0)),
      bestTime: (['morning', 'afternoon', 'sunset', 'evening', 'any'].includes(r.bestTime) ? r.bestTime : 'any') as Place['bestTime'],
      open: /^\d{1,2}:\d{2}$/.test(r.open ?? '') ? pad(r.open!) : undefined,
      close: /^\d{1,2}:\d{2}$/.test(r.close ?? '') ? pad(r.close!) : undefined,
      priority: clamp(Math.round(r.priority || 3), 1, 5),
      note: r.note ? `${r.note.trim()} (AI suggestion: check hours and fees locally.)` : 'AI suggestion: check hours and fees locally.',
      source,
    }));
}

// ------------------------------------------------------------------------------------------
// Change the plan in plain words

const EDIT_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string', description: 'One or two sentences describing the changes for the user' },
    ops: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          op: { type: 'string', enum: ['add', 'remove', 'move'] },
          dayIndex: { type: 'integer', description: '0-based day index for add/remove, or the source day for move' },
          toDayIndex: { type: 'integer', description: 'Target day for move' },
          title: { type: 'string', description: 'Exact title of the existing stop for remove/move' },
          place: {
            type: 'object',
            description: 'Required for add',
            properties: {
              name: { type: 'string' },
              lat: { type: 'number' },
              lon: { type: 'number' },
              category: { type: 'string', enum: INTERESTS },
              durationMin: { type: 'integer' },
              cost: { type: 'integer' },
              bestTime: { type: 'string', enum: ['morning', 'afternoon', 'sunset', 'evening', 'any'] },
              priority: { type: 'integer' },
              note: { type: 'string' },
            },
          },
          reason: { type: 'string' },
        },
        required: ['op', 'dayIndex', 'reason'],
      },
    },
  },
  required: ['summary', 'ops'],
};

/** Turn a request like "swap the fort on day 3 for Dudhsagar Falls" into validated edit operations. */
export async function planEdits(trip: Trip, request: string, signal?: AbortSignal): Promise<{ summary: string; ops: EditOp[] }> {
  const prompt = `${tripContext(trip)}

The user wants to change the itinerary: "${request}"

Return the smallest set of operations that does this:
- "remove": take an existing visit, meal or custom stop off a day (use its exact title).
- "add": add a real place to a day (give accurate coordinates near that day's destination).
- "move": move an existing visit stop (exact title) from dayIndex to toDayIndex.
Do not touch travel, check-in or check-out stops. Times are recalculated automatically, so do not include times.
If the request cannot be done, return no ops and explain why in the summary.`;
  const res = await generateJSON<{ summary: string; ops: RawOp[] }>({ messages: [{ role: 'user', parts: [{ text: prompt }] }], schema: EDIT_SCHEMA, signal });
  return { summary: res.summary ?? '', ops: validateOps(trip, res.ops ?? []) };
}

interface RawOp {
  op: string;
  dayIndex: number;
  toDayIndex?: number;
  title?: string;
  place?: Partial<RawPlace>;
  reason?: string;
}

function validateOps(trip: Trip, raw: RawOp[]): EditOp[] {
  const out: EditOp[] = [];
  raw.forEach((r) => {
    const day = trip.days[r.dayIndex];
    if (!day) return;
    if (r.op === 'remove' || r.op === 'move') {
      const stop = day.stops.find((s) => s.title.toLowerCase() === (r.title ?? '').toLowerCase()) ?? day.stops.find((s) => r.title && s.title.toLowerCase().includes(r.title.toLowerCase()));
      if (!stop || stop.fixed) return;
      if (r.op === 'remove') out.push({ op: 'remove', dayIndex: r.dayIndex, stopId: stop.id, title: stop.title, reason: r.reason ?? '' });
      else if (trip.days[r.toDayIndex ?? -1]) out.push({ op: 'move', dayIndex: r.dayIndex, toDayIndex: r.toDayIndex!, stopId: stop.id, title: stop.title, reason: r.reason ?? '' });
    } else if (r.op === 'add' && r.place?.name) {
      const destId = day.baseId ?? trip.input.destinations[0]?.id;
      const dest = trip.input.destinations.find((d) => d.id === destId) ?? trip.input.destinations[0];
      const [place] = toPlaces([r.place as RawPlace], dest, 'ai');
      if (place) out.push({ op: 'add', dayIndex: r.dayIndex, destinationId: dest.id, place, reason: r.reason ?? '' });
    }
  });
  return out;
}

// ------------------------------------------------------------------------------------------
// Receipt scanning

export interface ReceiptResult {
  title: string;
  amount: number;
  category: ExpenseCategory;
  date?: string;
  method?: PaymentMethod;
  note?: string;
}

const RECEIPT_SCHEMA = {
  type: 'object',
  properties: {
    isReceipt: { type: 'boolean' },
    merchant: { type: 'string' },
    title: { type: 'string', description: 'Short description like "Dinner at Britto\'s"' },
    total: { type: 'number', description: 'Grand total actually paid, INR' },
    category: { type: 'string', enum: CATEGORIES },
    date: { type: 'string', description: 'YYYY-MM-DD if printed, else empty' },
    method: { type: 'string', enum: ['cash', 'upi', 'card', 'other'] },
  },
  required: ['isReceipt', 'title', 'total', 'category'],
};

/** Read a bill or payment screenshot into an expense draft. */
export async function readReceipt(file: File, signal?: AbortSignal): Promise<ReceiptResult> {
  if (file.size > 12 * 1024 * 1024) throw new Error('That image is over 12 MB. Use a smaller photo.');
  const image = await fileToInlineData(file);
  const res = await generateJSON<{ isReceipt: boolean; merchant?: string; title: string; total: number; category: string; date?: string; method?: string }>({
    messages: [
      {
        role: 'user',
        parts: [
          image,
          { text: 'This is a bill, receipt or UPI payment screenshot from a trip in India. Extract the grand total paid in INR, a short title, the category, the date if printed, and the payment method if visible.' },
        ],
      },
    ],
    schema: RECEIPT_SCHEMA,
    signal,
  });
  if (!res.isReceipt || !(res.total > 0)) throw new Error("That doesn't look like a bill or payment screenshot. Try a clearer photo.");
  return {
    title: (res.title || res.merchant || 'Receipt').slice(0, 80),
    amount: Math.round(res.total * 100) / 100,
    category: (CATEGORIES.includes(res.category as ExpenseCategory) ? res.category : 'other') as ExpenseCategory,
    date: /^\d{4}-\d{2}-\d{2}$/.test(res.date ?? '') ? res.date : undefined,
    method: (['cash', 'upi', 'card', 'other'].includes(res.method ?? '') ? res.method : undefined) as PaymentMethod | undefined,
    note: res.merchant ? `Scanned from receipt: ${res.merchant}` : 'Scanned from receipt',
  };
}

// ------------------------------------------------------------------------------------------
// Describe a trip in plain words

export interface TripRequest {
  name?: string;
  origin?: City;
  destinationIds: string[];
  otherPlaces: string[];
  startDate?: string;
  days?: number;
  travelers?: number;
  budgetPerPerson?: number;
  transport?: TripInput['transport'];
  returnTransport?: TripInput['transport'];
  localTransport?: TripInput['localTransport'];
  stay?: TripInput['stay'];
  food?: TripInput['food'];
  pace?: TripInput['pace'];
  interests?: Interest[];
}

/** Parse "6 days in Goa and Gokarna for 4 friends from Hyderabad, ₹10k each, sleeper bus" into wizard fields. */
export async function parseTripRequest(text: string, catalog: Destination[], cities: City[], signal?: AbortSignal): Promise<TripRequest> {
  const schema = {
    type: 'object',
    properties: {
      name: { type: 'string' },
      originCity: { type: 'string', description: 'Starting city name' },
      destinationIds: { type: 'array', items: { type: 'string', enum: catalog.map((d) => d.id) }, description: 'Catalog destinations mentioned, in travel order' },
      otherPlaces: { type: 'array', items: { type: 'string' }, description: 'Destinations mentioned that are not in the catalog' },
      startDate: { type: 'string', description: 'YYYY-MM-DD, resolve relative dates like "this Saturday" from today' },
      days: { type: 'integer' },
      travelers: { type: 'integer' },
      budgetPerPerson: { type: 'integer', description: 'INR per person' },
      transport: { type: 'string', enum: ['bus_nonac', 'bus_ac', 'train_sl', 'train_3a', 'flight', 'car_self', 'bike'] },
      returnTransport: { type: 'string', enum: ['bus_nonac', 'bus_ac', 'train_sl', 'train_3a', 'flight', 'car_self', 'bike'] },
      localTransport: { type: 'string', enum: ['scooter', 'taxi', 'public', 'car_rental'] },
      stay: { type: 'string', enum: ['hostel', 'budget', 'comfort', 'luxury'] },
      food: { type: 'string', enum: ['street', 'mixed', 'premium'] },
      pace: { type: 'string', enum: ['relaxed', 'balanced', 'packed'] },
      interests: { type: 'array', items: { type: 'string', enum: INTERESTS } },
    },
    required: ['destinationIds', 'otherPlaces'],
  };
  const today = new Date();
  const prompt = `Today is ${toISODate(today)} (${today.toLocaleDateString('en-IN', { weekday: 'long' })}).
Extract trip details from this request. Only fill fields the request states or clearly implies; leave the rest out.
Catalog destinations: ${catalog.map((d) => `${d.id} = ${d.name} (${d.state})`).join('; ')}.
"Goa" alone means north-goa then south-goa.

Request: """${text.slice(0, 1500)}"""`;
  const r = await generateJSON<Record<string, unknown>>({ messages: [{ role: 'user', parts: [{ text: prompt }] }], schema, signal });
  const originName = typeof r.originCity === 'string' ? r.originCity.toLowerCase() : '';
  const origin = cities.find((c) => c.name.toLowerCase() === originName) ?? cities.find((c) => originName && originName.includes(c.name.toLowerCase()));
  const num = (v: unknown, min: number, max: number) => (typeof v === 'number' && v >= min && v <= max ? Math.round(v) : undefined);
  const date = typeof r.startDate === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(r.startDate) && r.startDate >= toISODate(today) ? r.startDate : undefined;
  return {
    name: typeof r.name === 'string' && r.name.trim() ? r.name.trim().slice(0, 80) : undefined,
    origin,
    destinationIds: (Array.isArray(r.destinationIds) ? r.destinationIds : []).filter((id): id is string => catalog.some((d) => d.id === id)),
    otherPlaces: (Array.isArray(r.otherPlaces) ? r.otherPlaces : []).filter((x): x is string => typeof x === 'string').slice(0, 5),
    startDate: date,
    days: num(r.days, 1, 30),
    travelers: num(r.travelers, 1, 20),
    budgetPerPerson: num(r.budgetPerPerson, 1000, 10_000_000),
    transport: r.transport as TripRequest['transport'],
    returnTransport: (r.returnTransport ?? r.transport) as TripRequest['returnTransport'],
    localTransport: r.localTransport as TripRequest['localTransport'],
    stay: r.stay as TripRequest['stay'],
    food: r.food as TripRequest['food'],
    pace: r.pace as TripRequest['pace'],
    interests: Array.isArray(r.interests) ? (r.interests as Interest[]).filter((x) => INTERESTS.includes(x)) : undefined,
  };
}

function normalizeName(s: string): string {
  return s.toLowerCase().replace(/\b(the|beach|fort|temple)\b/g, '').replace(/[^a-z0-9]/g, '');
}

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}
function pad(t: string) {
  const [h, m] = t.split(':');
  return `${h.padStart(2, '0')}:${m}`;
}
