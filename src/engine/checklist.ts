import type { ChecklistItem, Trip } from '../types';
import { fmtDay, fmtTime } from '../lib/time';
import { slug } from '../lib/format';
import { LOCAL, MODES } from './rates';
import { modeLabel } from './transport';

/** "AC sleeper bus" stays as is; "Train, sleeper class" becomes "train, sleeper class". */
function lowerFirst(s: string): string {
  return /^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);
}

/** Build a checklist from the plan: tickets per leg, stays per destination, documents, money and packing. */
export function buildChecklist(trip: Trip): ChecklistItem[] {
  const { input, legs, days } = trip;
  const items: ChecklistItem[] = [];
  const add = (label: string, category: ChecklistItem['category'], detail?: string) =>
    items.push({ id: 'ck_' + slug(label), label, detail, done: false, category });

  legs.forEach((l) => {
    if (!(l.mode in MODES)) {
      add(`Arrange ${lowerFirst(modeLabel(l.mode))} from ${l.from.name} to ${l.to.name}`, 'booking');
      return;
    }
    const dayIdx = Math.floor(l.departAbs / 1440);
    const date = days[Math.min(dayIdx, days.length - 1)]?.date;
    const info = MODES[l.mode as keyof typeof MODES];
    if (l.mode === 'car_self' || l.mode === 'bike') {
      add(`Service the ${l.mode === 'bike' ? 'bikes' : 'car'} before the drive to ${l.to.name}`, 'booking');
      return;
    }
    add(
      `Book ${lowerFirst(info.label)}: ${l.from.name} to ${l.to.name}`,
      'booking',
      `${date ? fmtDay(date) + ', ' : ''}leaving around ${fmtTime(l.departAbs - dayIdx * 1440, false)}. ${info.bookingHint}.`,
    );
  });

  const nights: Record<string, number> = {};
  days.forEach((d) => {
    if (d.night.type === 'stay') nights[d.night.destinationId] = (nights[d.night.destinationId] || 0) + 1;
  });
  Object.entries(nights).forEach(([destId, count]) => {
    const dest = input.destinations.find((x) => x.id === destId);
    if (dest) add(`Book stay in ${dest.name} for ${count} night${count > 1 ? 's' : ''}`, 'booking');
  });

  add('Photo ID for every traveller', 'documents', 'Hotels ask for it at check-in.');
  const needsLicence =
    LOCAL[input.localTransport].needsLicence || input.transport === 'car_self' || input.transport === 'bike';
  if (needsLicence) add('Original driving licences', 'documents', 'Needed for rented scooters and cars.');
  add('Share the itinerary with family', 'documents');

  add('Carry some cash', 'money', 'Smaller towns and beach shacks may not take UPI or cards.');
  add('Set up a shared expense group', 'money', 'Split rooms, transport and food fairly.');

  const tags = new Set(input.destinations.flatMap((d) => d.tags));
  if (tags.has('beaches')) add('Sunscreen, sunglasses and caps', 'packing');
  if (tags.has('adventure') || tags.has('nature')) add('Walking or trekking shoes', 'packing');
  if (tags.has('spiritual') || tags.has('history')) add('Modest clothes for temples and churches', 'packing');
  add('Power bank and charging cables', 'packing');
  add('Basic medicines and a first-aid kit', 'packing');
  return items;
}
