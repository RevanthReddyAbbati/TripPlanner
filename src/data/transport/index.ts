// Aggregates the regional transport datasets and offers lookups used by the journey engine.
import type { CityHubs, Corridor, DestinationAccess, TransportDataset } from './types';
import { DATA as hubs } from './hubs';
import { DATA as westCoast } from './westCoast';
import { DATA as south } from './south';
import { DATA as north } from './north';

const ALL: TransportDataset[] = [hubs, westCoast, south, north];

export const HUBS: CityHubs[] = ALL.flatMap((d) => d.hubs);
export const ACCESS: DestinationAccess[] = ALL.flatMap((d) => d.access);
export const CORRIDORS: Corridor[] = ALL.flatMap((d) => d.corridors);

const norm = (s: string) => s.trim().toLowerCase();

export function hubsFor(city: string): CityHubs | undefined {
  return HUBS.find((h) => norm(h.city) === norm(city));
}

export function accessFor(destinationId: string): DestinationAccess | undefined {
  return ACCESS.find((a) => a.destinationId === destinationId);
}

/** Services from A to B (one direction). Keys are City.name for origin cities, Destination.id otherwise. */
export function corridor(from: string, to: string): Corridor | undefined {
  return CORRIDORS.find((c) => norm(c.from) === norm(from) && norm(c.to) === norm(to));
}

export type { CityHubs, Corridor, DestinationAccess } from './types';
