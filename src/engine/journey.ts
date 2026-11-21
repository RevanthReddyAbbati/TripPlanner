// Step-by-step travel guide for each leg of a trip, written for people who have never travelled.
// Real services (train numbers, bus operators, airlines) come from src/data/transport; when a
// route has no data the guide still explains every step and links to live search pages.
import type { Leg, LocalTransport, TransportMode, Trip } from '../types';
import type { CityHubs, Corridor, DestinationAccess, LastMile, TrainService, Weekday } from '../data/transport/types';
import { ACCESS, HUBS, accessFor, corridor, hubsFor } from '../data/transport';
import { roadKm } from '../lib/geo';
import { fmtDuration, fmtTime, toMin } from '../lib/time';
import { inr } from '../lib/format';
import { MODES } from './rates';
import { modeLabel } from './transport';
import {
  IRCTC_HOME, NTES_HOME, erailTrainsBetween, googleFlights, googleSearch, mapsDirections, redbusRoute, trainSchedule,
} from '../lib/links';

export interface JourneyLink {
  label: string;
  url: string;
}

export type StepIcon = 'book' | 'go' | 'board' | 'ride' | 'night' | 'arrive' | 'lastmile' | 'home' | 'car' | 'info';

export interface JourneyStep {
  icon: StepIcon;
  title: string;
  detail: string;
  /** Minutes from midnight of the departure day (may exceed 1440). */
  time?: number;
  links?: JourneyLink[];
}

export type ServiceKind = 'train' | 'bus' | 'flight';

export interface ServiceOption {
  kind: ServiceKind;
  /** e.g. "17603", empty for buses/flights. */
  number?: string;
  name: string;
  fromLabel: string;
  toLabel: string;
  departs?: string;
  arrives?: string;
  arrivalDayOffset?: number;
  durationMin: number;
  runsOnText?: string;
  /** Raw running days, for calendars. */
  runsOn?: Weekday[] | 'daily';
  /** False when the service does not run on the travel weekday. */
  runsOnTravelDay?: boolean;
  classes?: string[];
  fareText?: string;
  recommended?: boolean;
  source: string;
}

export interface JourneyPlan {
  legId: string;
  title: string;
  fromName: string;
  toName: string;
  mode: Leg['mode'];
  modeLabel: string;
  kind: 'train' | 'bus' | 'flight' | 'drive' | 'local';
  /** ISO date of departure. */
  date: string;
  dayIndex: number;
  /** Planned departure, minutes from midnight of `date`. */
  departMin: number;
  overnight: boolean;
  durationMin: number;
  distanceKm: number;
  /** Real services in the chosen mode, best first. */
  options: ServiceOption[];
  /** Other modes on the same route, briefly. */
  alternatives: ServiceOption[];
  steps: JourneyStep[];
  tips: string[];
  sources: string[];
  liveLinks: JourneyLink[];
  advice?: string;
  /** True when real service data exists for this route. */
  hasData: boolean;
}

export interface TransportLookups {
  hubsFor: (city: string) => CityHubs | undefined;
  accessFor: (destinationId: string) => DestinationAccess | undefined;
  corridor: (from: string, to: string) => Corridor | undefined;
}

const DEFAULT_LOOKUPS: TransportLookups = { hubsFor, accessFor, corridor };

const WEEKDAYS: Weekday[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function legKind(mode: Leg['mode']): JourneyPlan['kind'] {
  if (mode === 'train_sl' || mode === 'train_3a') return 'train';
  if (mode === 'bus_ac' || mode === 'bus_nonac') return 'bus';
  if (mode === 'flight') return 'flight';
  if (mode === 'car_self' || mode === 'bike') return 'drive';
  return 'local';
}

const refKey = (end: Leg['from']) => end.ref?.id ?? end.name;

function weekdayOf(iso: string): Weekday {
  return WEEKDAYS[new Date(iso + 'T00:00:00').getDay()];
}

function runsOnText(runsOn: TrainService['runsOn']): string {
  if (runsOn === 'daily' || runsOn.length === 7) return 'Daily';
  return runsOn.join(', ');
}

/** Circular distance between two times of day, in minutes. */
function timeGap(a: number, b: number): number {
  const d = Math.abs((((a - b) % 1440) + 1440) % 1440);
  return Math.min(d, 1440 - d);
}

function wantedClass(mode: Leg['mode']): string | undefined {
  if (mode === 'train_sl') return 'SL';
  if (mode === 'train_3a') return '3A';
  return undefined;
}

const CLASS_LABEL: Record<string, string> = {
  SL: 'Sleeper (SL)',
  '3A': 'AC 3-tier (3A)',
  '3E': 'AC 3-economy (3E)',
  '2A': 'AC 2-tier (2A)',
  '1A': 'AC First (1A)',
  CC: 'AC Chair Car (CC)',
  EC: 'Executive Chair (EC)',
  '2S': 'Second Sitting (2S)',
};

export function classLabel(c: string): string {
  return CLASS_LABEL[c] ?? c;
}

function rankTrains(trains: TrainService[], leg: Leg, weekday: Weekday, departTod: number): TrainService[] {
  const cls = wantedClass(leg.mode);
  const score = (t: TrainService) => {
    let s = timeGap(toMin(t.departs), departTod);
    const dep = toMin(t.departs);
    if (leg.overnight && (dep < 15 * 60 || dep > 23 * 60 + 30)) s += 240;
    if (t.runsOn !== 'daily' && !t.runsOn.includes(weekday)) s += 600;
    if (cls && !t.classes.includes(cls as TrainService['classes'][number])) s += 300;
    return s + t.durationMin / 10;
  };
  return [...trains].sort((a, b) => score(a) - score(b));
}

function trainOption(t: TrainService, weekday: Weekday, stationName: (code: string) => string, fareText?: string): ServiceOption {
  return {
    kind: 'train',
    number: t.number,
    name: t.name,
    fromLabel: `${stationName(t.fromCode)} (${t.fromCode})`,
    toLabel: `${stationName(t.toCode)} (${t.toCode})`,
    departs: t.departs,
    arrives: t.arrives,
    arrivalDayOffset: t.arrivalDayOffset,
    durationMin: t.durationMin,
    runsOnText: runsOnText(t.runsOn),
    runsOn: t.runsOn,
    runsOnTravelDay: t.runsOn === 'daily' || t.runsOn.includes(weekday),
    classes: t.classes,
    fareText,
    source: t.source,
  };
}

/** Station names known to the dataset (hubs and destination access points), by code. */
function stationNamer(look: TransportLookups, leg: Leg): (code: string) => string {
  const names = new Map<string, string>();
  const add = (code: string | undefined, name: string) => code && !names.has(code.toUpperCase()) && names.set(code.toUpperCase(), name);
  for (const end of [leg.from, leg.to]) {
    if (end.ref?.kind === 'city') look.hubsFor(end.ref.id)?.stations.forEach((s) => add(s.code, s.name));
    if (end.ref?.kind === 'destination') look.accessFor(end.ref.id)?.arrivals.forEach((a) => a.kind === 'rail' && add(a.code, a.hub));
  }
  // Fall back to every known station (a Goa train may stop at a station listed under another destination).
  const anywhere = (code: string) =>
    ACCESS.flatMap((x) => x.arrivals).find((a) => a.kind === 'rail' && a.code?.toUpperCase() === code.toUpperCase())?.hub ??
    HUBS.flatMap((h) => h.stations).find((s) => s.code.toUpperCase() === code.toUpperCase())?.name;
  return (code) => names.get(code.toUpperCase()) ?? anywhere(code) ?? code;
}

function fmtRange([a, b]: [number, number]): string {
  return a === b ? inr(a) : `${inr(a)}–${inr(b)}`;
}

function lastMileText(lm: LastMile): string {
  const best = lm.options[0];
  if (!best) return `${lm.hub} is about ${lm.distanceKm} km away.`;
  return `${best.how}: about ${fmtDuration(best.minutes)}, ${fmtRange(best.costINR)}${best.perVehicle ? ' per vehicle' : ' per person'}.`;
}

function pickArrival(access: DestinationAccess | undefined, kind: LastMile['kind'], code?: string, to?: { lat: number; lon: number }): LastMile | undefined {
  const list = (access?.arrivals ?? []).filter((a) => a.kind === kind);
  if (!code) return list[0];
  const exact = list.find((a) => a.code?.toUpperCase() === code.toUpperCase());
  if (exact) return exact;
  // The train stops at a station this destination doesn't list (e.g. Madgaon for North Goa):
  // describe the ride from THAT station, never from a different one.
  const other = ACCESS.flatMap((x) => x.arrivals).find((a) => a.code?.toUpperCase() === code.toUpperCase());
  if (other && to) {
    const km = roadKm(other, to);
    const perCar = Math.max(400, Math.round((km * 22) / 50) * 50);
    return {
      hub: other.hub,
      kind: other.kind,
      code: other.code,
      lat: other.lat,
      lon: other.lon,
      distanceKm: km,
      options: [{ how: 'Prepaid taxi or app cab from the station exit', minutes: Math.round((km / 32) * 60 + 10), costINR: [perCar, Math.round(perCar * 1.4)], perVehicle: true }],
    };
  }
  return list[0];
}

const TRAIN_TIPS = [
  'Classes: Sleeper (SL) is non-AC with open windows and the cheapest berths. AC 3-tier (3A) has 6 berths per bay with bedding provided. AC 2-tier (2A) has 4 berths per bay and curtains.',
  'PNR is the 10-digit booking number on your ticket. Use it to check status and your coach and berth.',
  'Status codes: CNF means confirmed. RAC means you share a side berth until one frees up, and you can travel. WL means waitlisted. A waitlisted e-ticket is cancelled automatically if it does not confirm, and you cannot board.',
  'Tatkal is a last-minute quota that opens one day before departure: 10:00 AM for AC classes and 11:00 AM for Sleeper. It costs more.',
  'Carry the original photo ID of the person named on the ticket. The SMS or e-ticket on your phone is enough; no printout is needed.',
  'Your coach and berth are on the SMS and on the chart near the platform. Coach position boards on the platform show where each coach stops.',
  'Keep valuables in a small bag on your berth, and lock big bags to the chain under the lower berth.',
  'Railway helpline: 139 (enquiries and security). Emergency: 112.',
];

const BUS_TIPS = [
  'You get an m-ticket by SMS or email. Show it on your phone; no printout is needed.',
  'The operator sends the boarding point, bus number and a staff phone number a few hours before departure. Call that number if you cannot find the bus.',
  'Reach the boarding point 15–20 minutes early. Buses do not wait.',
  'On sleeper buses, an upper berth is quieter and a lower one is easier to get in and out of. Women travelling alone can choose seats marked for women.',
  'Night buses stop for a short dinner break. Carry water and a light jacket, because the AC can be cold.',
  'Emergency: 112.',
];

const FLIGHT_TIPS = [
  'Reach the airport 2 hours before a domestic flight. Check-in and bag drop close 45–60 minutes before departure.',
  'Web check-in on the airline app opens 48 hours before departure and saves time at the airport.',
  'Cabin bag: usually 7 kg. Check-in bag: usually 15 kg on economy tickets. Power banks must go in the cabin bag.',
  'Use the prepaid taxi counter or app cabs at the arrival exit. Avoid touts.',
];

const DRIVE_TIPS = [
  'Start early to avoid driving at night on highways. Plan a break every 2–3 hours.',
  'Carry your driving licence, vehicle RC, insurance and pollution certificate. Keep FASTag topped up for tolls.',
  'Download offline maps for ghat sections with weak signal. Emergency: 112. Highway helpline: 1033.',
];

const LOCAL_TIPS = [
  'Agree on the fare or use a meter or app before you start. Ask your stay what a fair price is.',
  'Share your live location with the group when travelling separately. Emergency: 112.',
];

/** Build the full guide for one leg. */
/** "AC sleeper bus" keeps its capitals; "Non-AC sleeper bus" becomes "non-AC sleeper bus". */
function lowerFirst(s: string): string {
  return /^[A-Z]{2}/.test(s) ? s : s.charAt(0).toLowerCase() + s.slice(1);
}
/** "an" before vowel sounds, including initialisms like "AC". */
function article(s: string): string {
  return /^(AC|[aeiouAEIOU])/.test(s) ? 'an' : 'a';
}

/** Legs saved before refs existed: infer them from the trip's origin and destinations by name. */
function withRefs(trip: Trip, leg: Leg): Leg {
  if (leg.from.ref && leg.to.ref) return leg;
  const infer = (end: Leg['from']): Leg['from'] => {
    if (end.ref) return end;
    const dest = trip.input.destinations.find((d) => d.name === end.name);
    if (dest) return { ...end, ref: { kind: 'destination', id: dest.id } };
    if (trip.input.origin.name === end.name) return { ...end, ref: { kind: 'city', id: end.name } };
    return end;
  };
  return { ...leg, from: infer(leg.from), to: infer(leg.to) };
}

export function buildJourney(trip: Trip, rawLeg: Leg, look: TransportLookups = DEFAULT_LOOKUPS): JourneyPlan {
  const leg = withRefs(trip, rawLeg);
  const D = trip.days.length;
  const dayIndex = Math.max(0, Math.min(D - 1, Math.floor(leg.departAbs / 1440)));
  const date = trip.days[dayIndex]?.date ?? trip.input.startDate;
  const departMin = leg.departAbs - dayIndex * 1440;
  const weekday = weekdayOf(date);
  const kind = legKind(leg.mode);
  const fromKey = refKey(leg.from);
  const toKey = refKey(leg.to);
  const cor = look.corridor(fromKey, toKey);
  const fromCity = leg.from.ref?.kind === 'city' ? look.hubsFor(leg.from.ref.id) : undefined;
  const toCity = leg.to.ref?.kind === 'city' ? look.hubsFor(leg.to.ref.id) : undefined;
  const fromAccess = leg.from.ref?.kind === 'destination' ? look.accessFor(leg.from.ref.id) : undefined;
  const toAccess = leg.to.ref?.kind === 'destination' ? look.accessFor(leg.to.ref.id) : undefined;
  const stationName = stationNamer(look, leg);
  const n = trip.input.travelers;
  const fare = leg.cost > 0 ? `About ${inr(leg.cost)} per person (estimate)` : undefined;
  const sources = new Set<string>();

  // ---- Options in the chosen mode and alternatives -----------------------------------------
  let options: ServiceOption[] = [];
  const alternatives: ServiceOption[] = [];
  const trains = cor?.trains ?? [];
  const buses = cor?.buses ?? [];
  const flights = cor?.flights ?? [];

  const rankedTrains = rankTrains(trains, leg, weekday, departMin);
  const trainOpts = rankedTrains.map((t) => trainOption(t, weekday, stationName, kind === 'train' ? fare : undefined));
  const busOpts: ServiceOption[] = buses.map((b) => ({
    kind: 'bus',
    name: `${b.operator}`,
    fromLabel: b.boarding,
    toLabel: b.drop,
    departs: b.departs,
    durationMin: b.durationMin,
    classes: [b.type],
    fareText: `${fmtRange(b.fareINR)} per person`,
    source: b.source,
  }));
  const flightOpts: ServiceOption[] = flights.map((f) => ({
    kind: 'flight',
    name: f.airlines.join(', '),
    fromLabel: f.fromAirport,
    toLabel: f.toAirport,
    durationMin: f.durationMin,
    classes: [f.nonstop ? 'Non-stop' : 'With stops'],
    fareText: kind === 'flight' ? fare : undefined,
    source: f.source,
  }));
  // Prefer buses matching AC / non-AC choice.
  if (kind === 'bus') {
    const wantAC = leg.mode === 'bus_ac';
    busOpts.sort((a, b) => Number(isAC(b.classes?.[0]) === wantAC) - Number(isAC(a.classes?.[0]) === wantAC));
  }

  if (kind === 'train') options = trainOpts;
  else if (kind === 'bus') options = busOpts;
  else if (kind === 'flight') options = flightOpts;
  if (options[0]) options[0] = { ...options[0], recommended: true };
  options = options.slice(0, 4);
  if (kind !== 'train' && trainOpts[0]) alternatives.push(trainOpts[0]);
  if (kind !== 'bus' && busOpts[0]) alternatives.push(busOpts[0]);
  if (kind !== 'flight' && flightOpts[0]) alternatives.push(flightOpts[0]);
  [...options, ...alternatives].forEach((o) => o.source && sources.add(o.source));

  const best = kind === 'train' ? rankedTrains[0] : undefined;

  // ---- Live links ------------------------------------------------------------------------
  const liveLinks: JourneyLink[] = [];
  const depStation = best ? { code: best.fromCode, name: stationName(best.fromCode) } : firstStation(fromCity, fromAccess);
  const arrStation = best ? { code: best.toCode, name: stationName(best.toCode) } : firstStation(toCity, toAccess);
  if (kind === 'train' || trains.length) {
    if (depStation && arrStation) {
      const cls = leg.mode === 'train_sl' ? 'SL' : leg.mode === 'train_3a' ? '3A' : undefined;
      const dayLabel = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
      liveLinks.push({ label: `Trains and seats on ${dayLabel} (erail)`, url: erailTrainsBetween(depStation, arrStation, { date, cls }) });
    }
    liveLinks.push({ label: 'Book on IRCTC', url: IRCTC_HOME });
  }
  if (kind === 'bus' || buses.length) liveLinks.push({ label: 'Buses on redBus', url: redbusRoute(busCity(leg.from.name), busCity(leg.to.name)) });
  if (kind === 'flight' || flights.length) liveLinks.push({ label: 'Flights on Google Flights', url: googleFlights(leg.from.name, leg.to.name, date) });
  if (!liveLinks.length || (kind === 'train' && !depStation)) liveLinks.push({ label: `Search ${leg.from.name} to ${leg.to.name}`, url: googleSearch(`${modeWord(kind)} from ${leg.from.name} to ${leg.to.name}`) });

  // ---- Steps -------------------------------------------------------------------------------
  const steps: JourneyStep[] = [];
  const dateText = new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  if (kind === 'train') {
    const cls = wantedClass(leg.mode);
    const trainText = best ? `${best.number} ${best.name}` : `a train from ${leg.from.name} to ${leg.to.name}`;
    steps.push({
      icon: 'book',
      title: `Book ${best ? `train ${best.number}` : 'your train'} for ${n} ${n === 1 ? 'person' : 'people'}`,
      detail:
        `On IRCTC (or any train booking app), search ${depStation ? `${depStation.name} (${depStation.code})` : leg.from.name} to ${arrStation ? `${arrStation.name} (${arrStation.code})` : leg.to.name} for ${dateText}. ` +
        `Pick ${trainText}${cls ? ` in ${classLabel(cls)}` : ''}. Book together so you get berths near each other. ` +
        'Book 30–60 days ahead for confirmed berths. Booking opens 60 days before travel.' +
        (best && !(best.runsOn === 'daily' || best.runsOn.includes(weekday)) ? ` This train does not run on ${weekday}; pick another train from the list or change the date.` : ''),
      links: liveLinks.filter((l) => /erail|IRCTC/.test(l.label)),
    });
    const hub = fromCity?.stations.find((s) => best && s.code.toUpperCase() === best.fromCode.toUpperCase()) ?? fromCity?.stations[0];
    const fromLm = pickArrival(fromAccess, 'rail', best?.fromCode, leg.from);
    const reach = (best ? toMin(best.departs) : departMin) - 45;
    steps.push({
      icon: 'go',
      title: `Reach ${hub ? `${hub.name} (${hub.code})` : fromLm ? fromLm.hub : `the station in ${leg.from.name}`} by ${fmtTime(reach, false)}`,
      detail: hub
        ? `${hub.note ? hub.note + ' ' : ''}${fromCity?.localTip ?? 'Book an Uber, Ola or auto from where you are staying. Allow extra time for evening traffic.'}`
        : fromLm
          ? `From your stay: ${reverseLastMile(fromLm)}`
          : 'Leave plenty of time to reach the station. Check which station your train leaves from: big cities have several.',
      time: reach,
      links: hub ? [{ label: 'Directions', url: mapsDirections(hub.lat, hub.lon) }] : fromLm ? [{ label: 'Directions', url: mapsDirections(fromLm.lat, fromLm.lon) }] : undefined,
    });
    steps.push({
      icon: 'board',
      title: best ? `Board ${best.number} ${best.name} at ${best.departs}` : `Board your train around ${fmtTime(departMin, false)}`,
      detail:
        'Find the platform number on the station display boards or the NTES app. Check the coach position board, wait where your coach stops, and find your berth number on your ticket. A ticket checker (TTE) will check your ticket and ID on board.',
      time: best ? toMin(best.departs) : departMin,
      links: best ? [{ label: 'Live train status', url: trainSchedule(best.number) }, { label: 'NTES', url: NTES_HOME }] : [{ label: 'NTES', url: NTES_HOME }],
    });
    if (leg.overnight) {
      steps.push({
        icon: 'night',
        title: 'Overnight on the train',
        detail:
          'Lower berths fold down as seats until about 10 PM, after which everyone sleeps. Eat at the station before boarding, or order through IRCTC e-catering using your PNR. Set an alarm 30 minutes before your arrival time.',
      });
    }
    const arrivalMin = best ? toMin(best.arrives) + best.arrivalDayOffset * 1440 : departMin + leg.durationMin;
    steps.push({
      icon: 'arrive',
      title: `Get off at ${arrStation ? `${arrStation.name} (${arrStation.code})` : leg.to.name} around ${fmtTime(arrivalMin, false)}${arrivalMin >= 1440 ? ' next day' : ''}`,
      detail: 'Trains do not announce every stop. Watch the station boards and track the train on the NTES app. Most stops are only 2–5 minutes.',
      time: arrivalMin,
    });
    addLastMile(steps, leg, toAccess, toCity, 'rail', best?.toCode);
  } else if (kind === 'bus') {
    const b = buses[0] && options[0]?.kind === 'bus' ? buses.find((x) => x.operator === options[0].name) ?? buses[0] : undefined;
    steps.push({
      icon: 'book',
      title: `Book ${article(MODES[leg.mode as TransportMode].label)} ${lowerFirst(MODES[leg.mode as TransportMode].label)}`,
      detail:
        `On redBus or AbhiBus, search ${busCity(leg.from.name)} to ${busCity(leg.to.name)} for ${dateText}. ` +
        (b ? `Operators that run this route include ${buses.slice(0, 3).map((x) => x.operator).join(', ')}. ` : '') +
        `Filter by ${leg.mode === 'bus_ac' ? 'AC Sleeper' : 'Non-AC Sleeper'}, sort by rating, and pick a bus leaving around ${fmtTime(departMin, false)}. Choose a boarding point close to your stay.`,
      links: liveLinks.filter((l) => /redBus/.test(l.label)),
    });
    const point = fromCity?.busPoints[0];
    steps.push({
      icon: 'go',
      title: `Reach your boarding point by ${fmtTime(departMin - 20, false)}`,
      detail: `${b ? `Usual boarding area: ${b.boarding}. ` : point ? `Popular boarding area: ${point.name}${point.note ? ` (${point.note})` : ''}. ` : ''}The exact spot and the bus number come by SMS on the day. Call the staff number in the SMS if you cannot find the bus.`,
      time: departMin - 20,
      links: point ? [{ label: 'Directions', url: mapsDirections(point.lat, point.lon) }] : undefined,
    });
    steps.push({ icon: 'board', title: `Board around ${fmtTime(departMin, false)}`, detail: 'Show the m-ticket on your phone. Put big bags in the luggage hold under the bus and keep valuables with you.', time: departMin });
    if (leg.overnight) steps.push({ icon: 'night', title: 'Overnight on the bus', detail: 'Expect a dinner stop around 10–11 PM. Keep your phone charged; most sleeper buses have charging points.' });
    const arr = departMin + leg.durationMin;
    steps.push({ icon: 'arrive', title: `Arrive around ${fmtTime(arr, false)}${arr >= 1440 ? ' next day' : ''}`, detail: `${b ? `Usual drop point: ${b.drop}. ` : ''}Buses often run 30–60 minutes late. Tell the conductor where you want to get off.`, time: arr });
    addLastMile(steps, leg, toAccess, toCity, 'bus');
  } else if (kind === 'flight') {
    const air = fromCity?.airport;
    const f = flights[0];
    steps.push({
      icon: 'book',
      title: 'Book your flights',
      detail: `Search ${leg.from.name} to ${leg.to.name} for ${dateText}${f ? `. Airlines on this route: ${f.airlines.join(', ')}` : ''}. Compare fares on Google Flights, then book on the airline's own site.`,
      links: liveLinks.filter((l) => /Flights/.test(l.label)),
    });
    steps.push({
      icon: 'go',
      title: `Reach ${air ? `${air.name} (${air.code})` : 'the airport'} 2 hours before departure`,
      detail: 'Do web check-in on the airline app first. At the airport, show your ID and boarding pass at the entry gate, drop bags at the counter, then go through security.',
      links: air ? [{ label: 'Directions', url: mapsDirections(air.lat, air.lon) }] : undefined,
    });
    steps.push({ icon: 'board', title: 'Board the flight', detail: 'Boarding closes about 25 minutes before departure. Your gate number is on the airport screens.' });
    addLastMile(steps, leg, toAccess, toCity, 'air');
  } else if (kind === 'drive') {
    steps.push({
      icon: 'car',
      title: `Drive ${leg.distanceKm} km, about ${fmtDuration(leg.durationMin)}`,
      detail: `Leave around ${fmtTime(departMin, false)}. Plan fuel and food stops every 2–3 hours, and avoid ghat roads after dark.`,
      time: departMin,
      links: [{ label: 'Route in Google Maps', url: mapsRouteSafe(leg) }],
    });
    steps.push({ icon: 'arrive', title: `Reach ${leg.to.name}`, detail: 'Check parking at your stay before you arrive.', time: departMin + leg.durationMin });
  } else {
    // Local hop by taxi / public transport between nearby destinations.
    const local = leg.mode as LocalTransport;
    steps.push({
      icon: 'book',
      title: local === 'public' ? `Take a bus or train to ${leg.to.name}` : `Book a taxi to ${leg.to.name}`,
      detail:
        local === 'public'
          ? `Ask at your stay for the nearest bus stand with buses to ${leg.to.name}. State buses run often and are cheap. Pay the conductor on board.`
          : `Ask your stay to arrange a one-way taxi, or use an app if it works in the area. Agree on the fare before you start: about ${inr(leg.cost * n)} for the group (estimate).`,
      links: [{ label: 'Route in Google Maps', url: mapsRouteSafe(leg) }],
    });
    steps.push({ icon: 'ride', title: `Ride about ${fmtDuration(leg.durationMin)} (${leg.distanceKm} km)`, detail: `Leave around ${fmtTime(departMin, false)} so you arrive in daylight.`, time: departMin });
    addLastMile(steps, leg, toAccess, toCity, 'bus');
  }

  const tips = kind === 'train' ? TRAIN_TIPS : kind === 'bus' ? BUS_TIPS : kind === 'flight' ? FLIGHT_TIPS : kind === 'drive' ? DRIVE_TIPS : LOCAL_TIPS;
  const extraTips = [...(toAccess?.tips ?? [])];

  return {
    legId: leg.id,
    title: `${leg.from.name} → ${leg.to.name}`,
    fromName: leg.from.name,
    toName: leg.to.name,
    mode: leg.mode,
    modeLabel: modeLabel(leg.mode),
    kind,
    date,
    dayIndex,
    departMin,
    overnight: leg.overnight,
    durationMin: leg.durationMin,
    distanceKm: leg.distanceKm,
    options,
    alternatives: alternatives.slice(0, 3),
    steps,
    tips: [...extraTips, ...tips],
    sources: [...sources],
    liveLinks,
    advice: cor?.advice,
    hasData: options.length > 0,
  };
}

export function buildAllJourneys(trip: Trip, look: TransportLookups = DEFAULT_LOOKUPS): JourneyPlan[] {
  return trip.legs.map((l) => buildJourney(trip, l, look));
}

/** The leg a travel stop belongs to (same departure time), if any. */
export function legForStop(trip: Trip, dayIndex: number, stopStart: number): Leg | undefined {
  const abs = dayIndex * 1440 + stopStart;
  return trip.legs.find((l) => Math.abs(l.departAbs - abs) < 2);
}

// ---------------------------------------------------------------------------------------------

function addLastMile(steps: JourneyStep[], leg: Leg, access: DestinationAccess | undefined, city: CityHubs | undefined, kind: LastMile['kind'], code?: string) {
  if (city) {
    steps.push({ icon: 'home', title: `Head home in ${leg.to.name}`, detail: city.localTip ?? 'Take an Uber, Ola or auto from the station exit. Prepaid auto counters are often just outside.' });
    return;
  }
  // A taxi, rental car or scooter goes door to door, so there is no station-to-stay step.
  if (leg.mode === 'taxi' || leg.mode === 'scooter' || leg.mode === 'car_rental' || leg.mode === 'car_self' || leg.mode === 'bike') {
    steps.push({ icon: 'arrive', title: `Arrive at your stay in ${leg.to.name}`, detail: 'Share your stay location with the driver on Google Maps before you set off, and pay the agreed fare at the end.' });
    return;
  }
  const lm = pickArrival(access, kind, code, leg.to) ?? access?.arrivals[0];
  if (lm) {
    steps.push({
      icon: 'lastmile',
      title: `From ${lm.hub} to ${leg.to.name} (${lm.distanceKm} km)`,
      detail: `${lastMileText(lm)}${lm.options.length > 1 ? ` Other options: ${lm.options.slice(1).map((o) => `${o.how.toLowerCase()} (${fmtDuration(o.minutes)}, ${fmtRange(o.costINR)})`).join('; ')}.` : ''}`,
      links: [{ label: 'Route in Google Maps', url: `https://www.google.com/maps/dir/?api=1&origin=${lm.lat},${lm.lon}&destination=${leg.to.lat},${leg.to.lon}` }],
    });
  } else if (legKind(leg.mode) !== 'local') {
    steps.push({ icon: 'lastmile', title: `Get to your stay in ${leg.to.name}`, detail: 'Use a prepaid taxi or auto counter at the exit, or an app cab. Agree on the fare first. Share your stay address with the driver on Google Maps.' });
  }
}

function reverseLastMile(lm: LastMile): string {
  const best = lm.options[0];
  return best ? `${best.how} (about ${fmtDuration(best.minutes)}, ${fmtRange(best.costINR)}). Leave early.` : `Allow time to cover ${lm.distanceKm} km.`;
}

function firstStation(city?: CityHubs, access?: DestinationAccess): { code: string; name: string } | undefined {
  const s = city?.stations[0];
  if (s) return { code: s.code, name: s.name };
  const a = access?.arrivals.find((x) => x.kind === 'rail' && x.code);
  return a ? { code: a.code!, name: a.hub } : undefined;
}

function isAC(type?: string): boolean {
  return !!type && /\bAC\b|A\/C|Volvo|Airavat|Scania|Multi-?Axle/i.test(type) && !/non[- ]?AC/i.test(type);
}

/** redBus city names: destinations like "North Goa" are listed under "Goa". */
function busCity(name: string): string {
  return name.replace(/^(North|South)\s+/i, '');
}

function modeWord(kind: JourneyPlan['kind']): string {
  return kind === 'train' ? 'trains' : kind === 'bus' ? 'buses' : kind === 'flight' ? 'flights' : 'how to travel';
}

function mapsRouteSafe(leg: Leg): string {
  return `https://www.google.com/maps/dir/?api=1&origin=${leg.from.lat},${leg.from.lon}&destination=${leg.to.lat},${leg.to.lon}&travelmode=driving`;
}

