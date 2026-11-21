// Shared schema for real-world transport data: stations, bus stands, airports, trains, buses
// and flights. Every service record carries a source URL so it can be re-checked.
// Timings are typical and change with timetables; the app always links to a live source too.

export type Weekday = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';
export type TrainClass = '1A' | '2A' | '3A' | '3E' | 'SL' | 'CC' | 'EC' | '2S';

export interface RailStation {
  /** Indian Railways station code, e.g. "SC", "MAO". */
  code: string;
  name: string;
  lat: number;
  lon: number;
}

export interface BusPoint {
  name: string;
  lat: number;
  lon: number;
  note?: string;
}

export interface Airport {
  /** IATA code, e.g. "HYD". */
  code: string;
  name: string;
  lat: number;
  lon: number;
}

/** Major departure hubs of an origin city (keyed by City.name in data/destinations.ts). */
export interface CityHubs {
  city: string;
  stations: (RailStation & { note?: string })[];
  busPoints: BusPoint[];
  airport?: Airport;
  /** How to get to the hubs inside the city, plain words. */
  localTip?: string;
}

/** How you reach a destination (keyed by Destination.id) from a station / bus stand / airport. */
export interface LastMile {
  /** Where you arrive. */
  hub: string;
  kind: 'rail' | 'bus' | 'air';
  /** Station or airport code if relevant. */
  code?: string;
  lat: number;
  lon: number;
  /** Distance from the hub to the destination's main area. */
  distanceKm: number;
  /** Plain-words options, e.g. "Prepaid taxi from the station exit, about 45 min". */
  options: { how: string; minutes: number; costINR: [number, number]; perVehicle?: boolean }[];
}

export interface DestinationAccess {
  destinationId: string;
  /** Best stations, bus stand and airport, in order of usefulness. */
  arrivals: LastMile[];
  /** Short practical notes for first-timers. */
  tips?: string[];
}

export interface TrainService {
  /** Five-digit train number as a string, e.g. "17603". */
  number: string;
  name: string;
  fromCode: string;
  toCode: string;
  /** Typical departure / arrival, 24h "HH:MM", local time. */
  departs: string;
  arrives: string;
  /** Days after departure that it arrives (0 = same day). */
  arrivalDayOffset: number;
  durationMin: number;
  /** Days it leaves the departure station. */
  runsOn: Weekday[] | 'daily';
  classes: TrainClass[];
  /** Page where the details were checked (erail, indiarailinfo, IRCTC, etc.). */
  source: string;
}

export interface BusService {
  operator: string;
  /** e.g. "AC Sleeper", "Non-AC Sleeper", "Volvo Multi-Axle Semi-Sleeper", "KSRTC Airavat Club Class". */
  type: string;
  /** Usual boarding area in the origin city. */
  boarding: string;
  /** Usual drop point at the destination. */
  drop: string;
  /** Typical evening departure window, e.g. "18:00–21:00". */
  departs: string;
  durationMin: number;
  fareINR: [number, number];
  /** Whether it is a state transport corporation (KSRTC, TSRTC, MSRTC...) or private. */
  government: boolean;
  source: string;
}

export interface FlightOption {
  fromAirport: string;
  toAirport: string;
  airlines: string[];
  /** Typical non-stop block time. */
  durationMin: number;
  nonstop: boolean;
  source: string;
}

/** Services between two places, in ONE direction. Return trips have their own corridor. */
export interface Corridor {
  /** City.name of an origin city, or a Destination.id. */
  from: string;
  to: string;
  trains: TrainService[];
  buses: BusService[];
  flights: FlightOption[];
  /** Plain-words routing advice, e.g. "No direct train; take a train to Madgaon, then a taxi". */
  advice?: string;
}

export interface TransportDataset {
  hubs: CityHubs[];
  access: DestinationAccess[];
  corridors: Corridor[];
}
