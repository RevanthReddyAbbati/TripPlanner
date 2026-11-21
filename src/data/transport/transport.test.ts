// Integrity checks for the researched transport data. These guard against the most harmful
// mistakes for a first-time traveller: malformed train numbers, impossible timings, unknown
// destination ids, and advice that recommends a train the data doesn't list.
import { describe, expect, it } from 'vitest';
import { ACCESS, CORRIDORS, HUBS } from './index';
import { DESTINATIONS, ORIGIN_CITIES } from '../destinations';

const destIds = new Set(DESTINATIONS.map((d) => d.id));
const cityNames = new Set(ORIGIN_CITIES.map((c) => c.name.toLowerCase()));
const isPlace = (k: string) => destIds.has(k) || cityNames.has(k.toLowerCase());
const hhmm = /^([01]\d|2[0-3]):[0-5]\d$/;

describe('transport data', () => {
  it('has hubs for every origin city', () => {
    const covered = new Set(HUBS.map((h) => h.city));
    ORIGIN_CITIES.forEach((c) => expect(covered.has(c.name), c.name).toBe(true));
  });

  it('has arrival info for every catalog destination', () => {
    const covered = new Set(ACCESS.map((a) => a.destinationId));
    DESTINATIONS.forEach((d) => expect(covered.has(d.id), d.id).toBe(true));
  });

  it('only references known cities and destinations', () => {
    CORRIDORS.forEach((c) => {
      expect(isPlace(c.from), `from ${c.from}`).toBe(true);
      expect(isPlace(c.to), `to ${c.to}`).toBe(true);
    });
  });

  it('has well-formed trains with sources', () => {
    CORRIDORS.forEach((c) =>
      c.trains.forEach((t) => {
        const where = `${c.from}->${c.to} ${t.number}`;
        expect(t.number, where).toMatch(/^\d{5}$/);
        expect(t.departs, where).toMatch(hhmm);
        expect(t.arrives, where).toMatch(hhmm);
        expect(t.fromCode, where).toMatch(/^[A-Z]{2,5}$/);
        expect(t.toCode, where).toMatch(/^[A-Z]{2,5}$/);
        expect(t.source, where).toMatch(/^https:\/\//);
        expect(t.durationMin, where).toBeGreaterThan(0);
        // Duration must agree with the timetable within 20 minutes.
        const [dh, dm] = t.departs.split(':').map(Number);
        const [ah, am] = t.arrives.split(':').map(Number);
        const span = ah * 60 + am + t.arrivalDayOffset * 1440 - (dh * 60 + dm);
        expect(Math.abs(span - t.durationMin), `${where} duration ${t.durationMin} vs ${span}`).toBeLessThanOrEqual(20);
      }),
    );
  });

  it('has sourced buses and flights with sane numbers', () => {
    CORRIDORS.forEach((c) => {
      c.buses.forEach((b) => {
        expect(b.source, `${c.from}->${c.to} ${b.operator}`).toMatch(/^https:\/\//);
        expect(b.fareINR[0]).toBeLessThanOrEqual(b.fareINR[1]);
      });
      c.flights.forEach((f) => expect(f.source).toMatch(/^https:\/\//));
    });
  });

  it('only names trains in advice that the corridor actually lists', () => {
    const named = /\b(Konkan Kanya|Mandovi|Jan Shatabdi|Matsyagandha|Goa Express|Poorna|Panchaganga|Vasco Express|Mangaluru Express|Amaravati|Sampark Kranti|Rajdhani|Garib Rath|Duronto|Humsafar|Nilgiri Express|Island Express|Kerala Express|Mewar Express|Chetak|Yoga Express|Dehradun Express)\b/gi;
    // Advice may mention a connecting train from another corridor ("take the Goa Express to
    // Madgaon, then change"), so a name must appear in this corridor or in any verified corridor.
    const everywhere = CORRIDORS.flatMap((c) => c.trains.map((t) => t.name.toLowerCase())).join(' | ');
    const problems: string[] = [];
    CORRIDORS.forEach((c) => {
      for (const m of (c.advice ?? '').matchAll(named)) {
        const key = m[1].toLowerCase().replace(' express', '');
        if (!everywhere.includes(key)) problems.push(`${c.from}->${c.to}: advice names "${m[1]}" but no verified train has that name`);
      }
    });
    expect(problems).toEqual([]);
  });
});
