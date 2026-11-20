import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Destination, TripInput } from '../../types';
import { ORIGIN_CITIES, findDestination } from '../../data/destinations';
import { generateTrip } from '../../engine/planner';
import { applyEdits } from '../../engine/aiEdits';
import { useAI } from '../../store/ai';
import { AIError, generate, parseJSON } from './gemini';
import { planEdits, suggestPlaces, toPlaces } from './provider';

// A tiny in-memory localStorage so the persisted zustand store works under Node.
const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => void mem.set(k, v),
  removeItem: (k) => void mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
};

const input: TripInput = {
  name: 'Goa',
  origin: ORIGIN_CITIES[0],
  destinations: ['north-goa', 'gokarna'].map((id) => findDestination(id)!) as Destination[],
  startDate: '2026-11-21',
  days: 6,
  travelers: 4,
  budgetPerPerson: 10000,
  transport: 'bus_ac',
  returnTransport: 'bus_nonac',
  localTransport: 'scooter',
  stay: 'budget',
  food: 'mixed',
  pace: 'balanced',
  interests: ['beaches'],
  overnightTravel: true,
};

const reply = (obj: unknown) => ({ candidates: [{ content: { parts: [{ text: typeof obj === 'string' ? obj : JSON.stringify(obj) }] }, finishReason: 'STOP' }] });
const ok = (body: unknown) => new Response(JSON.stringify(body), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('gemini client', () => {
  beforeEach(() => useAI.setState({ mode: 'key', apiKey: 'test-key-0123456789abcdefghij', model: 'gemini-3.6-flash' }));
  afterEach(() => vi.unstubAllGlobals());

  it('sends the key in a header, never the URL, and no sampling params', async () => {
    const f = vi.fn().mockResolvedValue(ok(reply('Hello')));
    vi.stubGlobal('fetch', f);
    const text = await generate({ messages: [{ role: 'user', parts: [{ text: 'Hi' }] }] });
    expect(text).toBe('Hello');
    const [url, init] = f.mock.calls[0];
    expect(url).toContain('/v1beta/models/gemini-3.6-flash:generateContent');
    expect(url).not.toContain('test-key');
    expect(init.headers['x-goog-api-key']).toBe('test-key-0123456789abcdefghij');
    expect(init.body).not.toContain('temperature');
  });

  it('falls back to the older schema field when the API rejects the new one', async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ error: { message: 'Invalid JSON payload received. Unknown name "responseJsonSchema"' } }), { status: 400 }))
      .mockResolvedValueOnce(ok(reply({ a: 1 })));
    vi.stubGlobal('fetch', f);
    const text = await generate({ messages: [{ role: 'user', parts: [{ text: 'x' }] }], schema: { type: 'object', properties: { a: { type: 'integer' } } } });
    expect(JSON.parse(text)).toEqual({ a: 1 });
    expect(f.mock.calls[1][1].body).toContain('"responseSchema"');
    expect(f.mock.calls[1][1].body).toContain('"INTEGER"');
  });

  it('maps HTTP errors to helpful messages', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('{}', { status: 429 })));
    await expect(generate({ messages: [{ role: 'user', parts: [{ text: 'x' }] }] })).rejects.toMatchObject({ kind: 'quota' });
  });

  it('refuses to run without a connection', async () => {
    useAI.setState({ mode: 'off' });
    await expect(generate({ messages: [] })).rejects.toBeInstanceOf(AIError);
  });

  it('parses JSON wrapped in code fences or prose', () => {
    expect(parseJSON('```json\n{"x":2}\n```')).toEqual({ x: 2 });
    expect(parseJSON('Here you go: {"x":3} hope it helps')).toEqual({ x: 3 });
  });
});

describe('AI place suggestions', () => {
  beforeEach(() => useAI.setState({ mode: 'key', apiKey: 'test-key-0123456789abcdefghij' }));
  afterEach(() => vi.unstubAllGlobals());

  it('drops places far from the destination and duplicates', async () => {
    const dest = findDestination('gokarna')!;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ok(
          reply({
            places: [
              { name: 'Yana Caves', lat: 14.59, lon: 74.56, category: 'nature', durationMin: 180, cost: 0, bestTime: 'morning', priority: 4, note: 'Trek.' },
              { name: 'Yana Caves', lat: 14.59, lon: 74.56, category: 'nature', durationMin: 180, cost: 0, bestTime: 'morning', priority: 4, note: 'Dup.' },
              { name: 'Charminar', lat: 17.36, lon: 78.47, category: 'history', durationMin: 60, cost: 25, bestTime: 'any', priority: 5, note: 'Far away.' },
            ],
          }),
        ),
      ),
    );
    const places = await suggestPlaces(dest, input);
    expect(places.map((p) => p.name)).toEqual(['Yana Caves']);
    expect(places[0].source).toBe('ai');
  });

  it('clamps bad numbers from the model', () => {
    const [p] = toPlaces([{ name: 'X', lat: 14.55, lon: 74.32, category: 'weird', durationMin: 5000, cost: -5, bestTime: 'noon', priority: 9, note: '' }], { lat: 14.55, lon: 74.32 }, 'ai');
    expect(p.durationMin).toBe(480);
    expect(p.cost).toBe(0);
    expect(p.priority).toBe(5);
    expect(p.category).toBe('culture');
    expect(p.bestTime).toBe('any');
  });
});

describe('AI plan edits', () => {
  beforeEach(() => useAI.setState({ mode: 'key', apiKey: 'test-key-0123456789abcdefghij' }));
  afterEach(() => vi.unstubAllGlobals());

  it('validates ops against the real itinerary and applies them through the engine', async () => {
    const trip = generateTrip(input);
    const day = trip.days.find((d) => d.stops.some((s) => s.kind === 'visit'))!;
    const visit = day.stops.find((s) => s.kind === 'visit')!;
    const travel = trip.days[0].stops.find((s) => s.kind === 'travel')!;
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        ok(
          reply({
            summary: 'Swapped one stop.',
            ops: [
              { op: 'remove', dayIndex: day.index, title: visit.title, reason: 'Asked to drop it' },
              { op: 'remove', dayIndex: 0, title: travel.title, reason: 'Should be ignored: fixed stop' },
              { op: 'remove', dayIndex: 99, title: 'Nope', reason: 'Bad day' },
              { op: 'add', dayIndex: day.index, place: { name: 'Mapusa Market', lat: 15.5937, lon: 73.8142, category: 'shopping', durationMin: 90, cost: 0, bestTime: 'morning', priority: 3, note: 'Friday market.' }, reason: 'Requested' },
            ],
          }),
        ),
      ),
    );
    const { summary, ops } = await planEdits(trip, 'swap a stop for the market');
    expect(summary).toBe('Swapped one stop.');
    expect(ops.map((o) => o.op)).toEqual(['remove', 'add']);
    const { days, newPlaces } = applyEdits(trip, ops);
    expect(days[day.index].stops.some((s) => s.id === visit.id)).toBe(false);
    expect(days[day.index].stops.some((s) => s.title === 'Mapusa Market')).toBe(true);
    expect(newPlaces).toHaveLength(1);
    // Fixed travel stop untouched.
    expect(days[0].stops.some((s) => s.id === travel.id)).toBe(true);
  });
});
