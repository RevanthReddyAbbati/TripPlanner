import type { TripStatus } from '../../types';

export const STATUS_OPTIONS: { value: TripStatus; label: string; tone: 'neutral' | 'brand' | 'ok' | 'warn' }[] = [
  { value: 'draft', label: 'Draft', tone: 'neutral' },
  { value: 'planned', label: 'Planned', tone: 'brand' },
  { value: 'booked', label: 'Booked', tone: 'ok' },
  { value: 'completed', label: 'Completed', tone: 'warn' },
];
