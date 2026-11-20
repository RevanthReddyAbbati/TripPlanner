// Cost and speed model. Figures are typical Indian prices (INR, 2025–26) and are deliberately
// conservative. Every number the planner uses lives here so it can be tuned in one place.
import type { FoodTier, LocalTransport, Pace, StayTier, TransportMode } from '../types';

export interface ModeInfo {
  label: string;
  short: string;
  /** Fixed fare component per person. */
  base: number;
  /** Per km per person (for shared vehicles this is per vehicle, see `perVehicle`). */
  perKm: number;
  /** Average door-to-door speed in km/h on the moving part. */
  speed: number;
  /** Minutes added for boarding, stops, check-in, reaching the station. */
  overheadMin: number;
  /** If set, cost is per vehicle and split across this many seats. */
  perVehicle?: number;
  /** Can run overnight (sleeper). */
  overnightCapable: boolean;
  /** Uses straight-line distance (flights). */
  air?: boolean;
  /** Longest sensible single-day distance (km), for self-driven modes. */
  maxDayKm?: number;
  bookingHint: string;
}

export const MODES: Record<TransportMode, ModeInfo> = {
  bus_nonac: {
    label: 'Non-AC sleeper bus', short: 'Bus', base: 150, perKm: 1.6, speed: 50, overheadMin: 30,
    overnightCapable: true, bookingHint: 'redBus or AbhiBus',
  },
  bus_ac: {
    label: 'AC sleeper bus', short: 'AC bus', base: 200, perKm: 1.9, speed: 52, overheadMin: 30,
    overnightCapable: true, bookingHint: 'redBus or AbhiBus',
  },
  train_sl: {
    label: 'Train, sleeper class', short: 'Train SL', base: 60, perKm: 0.75, speed: 48, overheadMin: 45,
    overnightCapable: true, bookingHint: 'IRCTC, book early for confirmed berths',
  },
  train_3a: {
    label: 'Train, 3-tier AC', short: 'Train 3A', base: 150, perKm: 1.9, speed: 50, overheadMin: 45,
    overnightCapable: true, bookingHint: 'IRCTC, book early for confirmed berths',
  },
  flight: {
    label: 'Flight (economy)', short: 'Flight', base: 2200, perKm: 3.2, speed: 650, overheadMin: 210,
    overnightCapable: false, air: true, bookingHint: 'Airline site or an aggregator',
  },
  car_self: {
    label: 'Own car / self-drive', short: 'Car', base: 0, perKm: 8.2, speed: 55, overheadMin: 30,
    perVehicle: 5, overnightCapable: false, maxDayKm: 650, bookingHint: 'Fuel ~₹7/km plus tolls',
  },
  bike: {
    label: 'Motorbike road trip', short: 'Bike', base: 0, perKm: 2.6, speed: 45, overheadMin: 30,
    perVehicle: 2, overnightCapable: false, maxDayKm: 400, bookingHint: 'Riding gear and documents',
  },
};

export interface LocalInfo {
  label: string;
  /** Per vehicle per day, including fuel. */
  perDay: number;
  seats: number;
  /** For short hops between nearby destinations, cost per km per vehicle. */
  perKm: number;
  minFare: number;
  needsLicence: boolean;
}

export const LOCAL: Record<LocalTransport, LocalInfo> = {
  scooter: { label: 'Rented scooters', perDay: 550, seats: 2, perKm: 14, minFare: 1500, needsLicence: true },
  taxi: { label: 'Taxi with driver', perDay: 3000, seats: 4, perKm: 14, minFare: 1500, needsLicence: false },
  public: { label: 'Buses and autos', perDay: 250, seats: 1, perKm: 1.4, minFare: 80, needsLicence: false },
  car_rental: { label: 'Self-drive rental car', perDay: 2700, seats: 5, perKm: 9, minFare: 1200, needsLicence: true },
};

export interface StayInfo {
  label: string;
  /** Per room (or bed) per night at costIndex 1. */
  rate: number;
  /** People per room. */
  capacity: number;
}

export const STAYS: Record<StayTier, StayInfo> = {
  hostel: { label: 'Hostel dorm beds', rate: 600, capacity: 1 },
  budget: { label: 'Budget guesthouse', rate: 2000, capacity: 4 },
  comfort: { label: '3-star hotel', rate: 3400, capacity: 2 },
  luxury: { label: 'Premium resort', rate: 9500, capacity: 2 },
};

export const FOOD: Record<FoodTier, { label: string; perDay: number }> = {
  street: { label: 'Local thalis and street food', perDay: 450 },
  mixed: { label: 'Mix of local places and cafés', perDay: 600 },
  premium: { label: 'Restaurants and beach shacks', perDay: 1300 },
};

export const PACE: Record<Pace, { label: string; visitMinutes: number; maxStops: number; description: string }> = {
  relaxed: { label: 'Relaxed', visitMinutes: 300, maxStops: 4, description: 'Late starts, long lunches, 3–4 stops a day' },
  balanced: { label: 'Balanced', visitMinutes: 420, maxStops: 6, description: 'A full day with breaks, 4–6 stops' },
  packed: { label: 'Packed', visitMinutes: 540, maxStops: 8, description: 'Early starts, see as much as possible' },
};

export const CONTINGENCY = 0.05;

/** Day window for sightseeing, minutes from midnight. */
export const DAY_START = 8 * 60;
export const DAY_END = 21 * 60 + 30;
/** Overnight journeys depart around this time. */
export const OVERNIGHT_DEPART = 18 * 60 + 30;
export const OVERNIGHT_RETURN_DEPART = 20 * 60 + 30;
/** Legs at least this long use an overnight departure when the traveller prefers it. */
export const OVERNIGHT_MIN_HOURS = 6;
