import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { JourneyPlan } from '../../engine/journey';
import { extractGrounding, generateGrounded } from './gemini';
import { normalizeLive } from './liveCheck';
import { useAI } from '../../store/ai';
import { suggestBetterDates } from '../../engine/dateSmart';

const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: Storage }).localStorage = {
  getItem: (k) => mem.get(k) ?? null,
  setItem: (k, v) => void mem.set(k, v),
  removeItem: (k) => void mem.delete(k),
  clear: () => mem.clear(),
  key: () => null,
  length: 0,
};

const plan = (over: Partial<JourneyPlan> = {}): JourneyPlan => ({
  legId: 'leg1',
  title: 'Bengaluru to Gokarna',
  fromName: 'Bengaluru',
  toName: 'Gokarna',
  mode: 'train_sl',
  modeLabel: 'Train, sleeper class',
  kind: 'train',
  date: '2026-11-28',
  dayIndex: 0,
  departMin: 1130,
  overnight: true,
  durationMin: 727,
  distanceKm: 505,
  options: [
    { kind: 'train', number: '16595', name: 'Panchaganga Express', fromLabel: 'SBC', toLabel: 'GOK', departs: '18:50', arrives: '06:57', durationMin: 727, runsOn: 'daily', source: 'https://x' },
  ],
  alternatives: [],
  steps: [],
  tips: [],
  sources: [],
  liveLinks: [],
  hasData: true,
  ...over,
});

describe('grounding', () => {
  it('extracts unique https sources and queries', () => {
    const g = extractGrounding({
      candidates: [
        {
          groundingMetadata: {
            groundingChunks: [
              { web: { uri: 'https://erail.in/a', title: 'erail' } },
              { web: { uri: 'https://erail.in/a', title: 'dup' } },
              { web: { uri: 'http://insecure.example', title: 'no' } },
              { web: { uri: 'https://news.example/x' } },
            ],
            webSearchQueries: ['trains SBC to GOK 28 Nov'],
          },
        },
      ],
    });
    expect(g.sources.map((s) => s.url)).toEqual(['https://erail.in/a', 'https://news.example/x']);
    expect(g.sources[1].title).toBe('news.example');
    expect(g.queries).toEqual(['trains SBC to GOK 28 Nov']);
  });

  describe('request', () => {
    beforeEach(() => useAI.setState({ mode: 'key', apiKey: 'test-key-0123456789abcdefghij', model: 'gemini-3.6-flash' }));
    afterEach(() => vi.unstubAllGlobals());

    it('sends the google_search tool and no JSON schema', async () => {
      const f = vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            candidates: [{ content: { parts: [{ text: 'ok' }] }, groundingMetadata: { groundingChunks: [{ web: { uri: 'https://a.example', title: 'A' } }] } }],
          }),
          { status: 200 },
        ),
      );
      vi.stubGlobal('fetch', f);
      const r = await generateGrounded({ messages: [{ role: 'user', parts: [{ text: 'q' }] }] });
      const body = JSON.parse(f.mock.calls[0][1].body);
      expect(body.tools).toEqual([{ google_search: {} }]);
      expect(body.generationConfig).toBeUndefined();
      expect(r.text).toBe('ok');
      expect(r.sources).toEqual([{ url: 'https://a.example', title: 'A' }]);
    });
  });
});

describe('live check validation', () => {
  it('drops malformed train numbers, coerces enums and marks known services', () => {
    const out = normalizeLive(
      {
        summary: 'Runs normally.',
        services: [
          { number: '16595', name: 'Panchaganga Express', runsOnDate: 'yes', status: 'normal', departs: '18:50' },
          { number: '1659X', name: 'Fake', runsOnDate: 'yes', status: 'normal' },
          { number: '26655', name: 'Vande Bharat', runsOnDate: 'maybe', status: 'weird', departs: '25:99' },
          { number: '16595', name: 'Duplicate', runsOnDate: 'no', status: 'cancelled' },
        ],
        demand: 'extreme',
        alerts: ['Ghat road work near Ankola', ''],
      },
      plan(),
    );
    expect(out.services.map((s) => s.number)).toEqual(['16595', '26655']);
    expect(out.services[0].known).toBe(true);
    expect(out.services[1]).toMatchObject({ known: false, runsOnDate: 'unknown', status: 'unknown', departs: undefined });
    expect(out.demand).toBe('unknown');
    expect(out.alerts).toEqual(['Ghat road work near Ankola']);
  });
});

describe('better dates', () => {
  const weekly = (days: ('Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun')[]) =>
    plan({ options: [{ kind: 'train', number: '17021', name: 'Weekly Express', fromLabel: 'SC', toLabel: 'MAO', durationMin: 1100, runsOn: days, source: 'https://x' }] });

  it('suggests the nearest start date with a running train', () => {
    // 2026-11-28 is a Saturday; the train only runs on Thursdays.
    const r = suggestBetterDates('2026-11-28', [weekly(['Thu'])], 4, '2026-11-21');
    expect(r.coveredNow).toBe(0);
    expect(r.best?.startDate).toBe('2026-11-26');
    expect(r.best?.offset).toBe(-2);
    expect(r.best?.matches[0].train?.number).toBe('17021');
  });

  it('never suggests a date before tomorrow', () => {
    // Trip starts Sun 22 Nov; the Thursday before (19 Nov) is in the past, so it must pick Thu 26 Nov.
    const j = { ...weekly(['Thu']), date: '2026-11-22' };
    const r = suggestBetterDates('2026-11-22', [j], 4, '2026-11-21');
    expect(r.best?.startDate).toBe('2026-11-26');
    expect(r.best?.offset).toBe(4);
  });

  it('stays quiet when every journey already has a train', () => {
    expect(suggestBetterDates('2026-11-28', [plan()], 4, '2026-11-21').best).toBeNull();
  });
});

describe('erail date links', () => {
  it('uses erail date and numeric class codes', async () => {
    const { erailTrainsBetween } = await import('../../lib/links');
    const url = erailTrainsBetween({ code: 'SC', name: 'Secunderabad Jn' }, { code: 'MAO', name: 'Madgaon (Margao) railway station' }, { date: '2026-11-26', cls: 'SL' });
    expect(url).toBe('https://erail.in/trains-between-stations/secunderabad-jn-SC/madgaon-margao-railway-station-MAO?date=26-Nov-2026&class=5&quota=GN');
    expect(erailTrainsBetween({ code: 'SC', name: 'a' }, { code: 'MAO', name: 'b' }, { date: '2026-11-26', cls: 'XX' })).toContain('class=-1');
  });
});
