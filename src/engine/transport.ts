import type { GeoPoint, LocalTransport, TransportMode } from '../types';
import { haversineKm, roadKm } from '../lib/geo';
import { LOCAL, MODES } from './rates';

export interface LegEstimate {
  distanceKm: number;
  durationMin: number;
  /** Per person INR. */
  cost: number;
}

/** Estimate a long-distance leg for a main transport mode. */
export function estimateLeg(a: GeoPoint, b: GeoPoint, mode: TransportMode, travelers: number): LegEstimate {
  const info = MODES[mode];
  const air = !!info.air;
  const km = air ? Math.round(haversineKm(a, b)) : roadKm(a, b);
  const moving = (km / info.speed) * 60;
  const durationMin = Math.round(moving + info.overheadMin);
  let cost: number;
  if (info.perVehicle) {
    const vehicles = Math.ceil(travelers / info.perVehicle);
    cost = (vehicles * (info.base + info.perKm * km)) / travelers;
  } else {
    cost = info.base + info.perKm * km;
  }
  return { distanceKm: km, durationMin, cost: roundTo(cost, 10) };
}

/** Estimate a short hop between two nearby destinations using local transport. */
export function estimateHop(a: GeoPoint, b: GeoPoint, mode: LocalTransport, travelers: number): LegEstimate {
  const info = LOCAL[mode];
  const km = roadKm(a, b);
  const speed = mode === 'public' ? 35 : 42;
  const durationMin = Math.round((km / speed) * 60 + 20);
  // Scooters can't do a one-way intercity drop, so the hop is a taxi for scooter groups.
  const effective = mode === 'scooter' ? LOCAL.taxi : info;
  const vehicles = Math.ceil(travelers / effective.seats);
  const fare = Math.max(effective.minFare, effective.perKm * km);
  const cost = (vehicles * fare) / travelers;
  return { distanceKm: km, durationMin, cost: roundTo(cost, 10) };
}

/** Destinations closer than this (road km) are connected by local transport instead of the main mode. */
export const HOP_THRESHOLD_KM = 220;

export function roundTo(n: number, step: number): number {
  return Math.round(n / step) * step;
}

export function modeLabel(mode: TransportMode | LocalTransport): string {
  if (mode in MODES) return MODES[mode as TransportMode].label;
  if (mode === 'scooter') return 'Taxi (one-way)';
  return LOCAL[mode as LocalTransport].label;
}
