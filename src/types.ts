// Core domain model for Itinera. Everything the planner, store and UI share lives here.

export interface GeoPoint {
  lat: number;
  lon: number;
}

export type Interest =
  | 'beaches'
  | 'history'
  | 'nature'
  | 'nightlife'
  | 'spiritual'
  | 'adventure'
  | 'food'
  | 'shopping'
  | 'culture';

export type BestTime = 'morning' | 'afternoon' | 'sunset' | 'evening' | 'any';

/** A thing to see or do at a destination. Costs are per person in INR. */
export interface Place extends GeoPoint {
  id: string;
  name: string;
  area?: string;
  category: Interest;
  /** Typical time spent, in minutes. */
  durationMin: number;
  /** Opening time "HH:MM" (24h). Omit for always open. */
  open?: string;
  /** Closing time "HH:MM" (24h). */
  close?: string;
  /** Entry or activity cost per person, INR. 0 = free. */
  cost: number;
  bestTime: BestTime;
  /** 1 (minor) – 5 (must see). */
  priority: number;
  note?: string;
  source: 'catalog' | 'osm' | 'custom';
}

export interface Destination extends GeoPoint {
  id: string;
  name: string;
  state: string;
  summary: string;
  tags: Interest[];
  /** Price multiplier for stays and food relative to the national baseline (1 = average). */
  costIndex: number;
  /** Best months, 1–12. */
  bestMonths: number[];
  /** Nearest railway station / airport names, used in travel notes. */
  station?: string;
  airport?: string;
  places: Place[];
  source: 'catalog' | 'custom';
}

export interface City extends GeoPoint {
  name: string;
  state: string;
}

export type TransportMode =
  | 'bus_nonac'
  | 'bus_ac'
  | 'train_sl'
  | 'train_3a'
  | 'flight'
  | 'car_self'
  | 'bike';

export type LocalTransport = 'scooter' | 'taxi' | 'public' | 'car_rental';
export type StayTier = 'hostel' | 'budget' | 'comfort' | 'luxury';
export type FoodTier = 'street' | 'mixed' | 'premium';
export type Pace = 'relaxed' | 'balanced' | 'packed';

export interface TripInput {
  name: string;
  origin: City;
  /** Ordered list of destinations to visit. */
  destinations: Destination[];
  /** ISO date "YYYY-MM-DD" of day 1. */
  startDate: string;
  days: number;
  travelers: number;
  /** Budget cap per person in INR. */
  budgetPerPerson: number;
  transport: TransportMode;
  returnTransport: TransportMode;
  localTransport: LocalTransport;
  stay: StayTier;
  food: FoodTier;
  pace: Pace;
  interests: Interest[];
  /** Prefer overnight journeys for long legs, saving hotel nights and daylight. */
  overnightTravel: boolean;
}

export type StopKind = 'visit' | 'meal' | 'travel' | 'checkin' | 'checkout' | 'rest' | 'custom';

export interface Stop extends Partial<GeoPoint> {
  id: string;
  kind: StopKind;
  title: string;
  note?: string;
  /** Minutes from midnight of this day. May exceed 1440 for travel that runs past midnight. */
  start: number;
  end: number;
  /** Per person INR. */
  cost: number;
  placeId?: string;
  destinationId?: string;
  optional?: boolean;
  /** Fixed stops (travel, check-in) keep their times when the day is re-timed. */
  fixed?: boolean;
  mode?: TransportMode | LocalTransport;
}

export interface DayPlan {
  index: number;
  /** ISO date. */
  date: string;
  title: string;
  /** Destination id where the day is mostly spent; undefined for pure travel days. */
  baseId?: string;
  stops: Stop[];
  /** Where the group sleeps at the end of this day. */
  night: { type: 'stay'; destinationId: string } | { type: 'transit' } | { type: 'home' };
}

export interface Leg {
  id: string;
  from: { name: string } & GeoPoint;
  to: { name: string } & GeoPoint;
  mode: TransportMode | LocalTransport;
  distanceKm: number;
  durationMin: number;
  /** Per person INR. */
  cost: number;
  overnight: boolean;
  /** Absolute minutes from 00:00 of day 1. */
  departAbs: number;
}

export interface BudgetLine {
  key: string;
  label: string;
  detail: string;
  perPerson: number;
  group: 'transport' | 'stay' | 'food' | 'local' | 'activities' | 'buffer';
}

export interface Budget {
  lines: BudgetLine[];
  perPerson: number;
  total: number;
  cap: number;
  overBy: number;
}

export interface ChecklistItem {
  id: string;
  label: string;
  detail?: string;
  done: boolean;
  category: 'booking' | 'documents' | 'packing' | 'money' | 'custom';
}

export type TripStatus = 'draft' | 'planned' | 'booked' | 'completed';

export interface Trip {
  id: string;
  createdAt: string;
  updatedAt: string;
  status: TripStatus;
  input: TripInput;
  legs: Leg[];
  days: DayPlan[];
  checklist: ChecklistItem[];
  notes: string;
  warnings: string[];
  /** Places available at each destination that were not scheduled. */
  unscheduled: Record<string, string[]>;
  /** Schema version for migrations. */
  version: 1;
}
