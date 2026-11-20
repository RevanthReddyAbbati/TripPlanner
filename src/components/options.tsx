import { Bike, BusFront, Car, CarTaxiFront, Plane, TrainFront, Bed, BedDouble, Building2, Hotel } from 'lucide-react';
import type { FoodTier, Interest, LocalTransport, Pace, StayTier, TransportMode } from '../types';
import type { Option } from './ui/Fields';
import { FOOD, LOCAL, MODES, PACE, STAYS } from '../engine/rates';
import { inr } from '../lib/format';

const ic = 'h-[18px] w-[18px]';

export const TRANSPORT_OPTIONS: Option<TransportMode>[] = [
  { value: 'bus_nonac', label: MODES.bus_nonac.label, detail: 'Cheapest overnight option', icon: <BusFront className={ic} /> },
  { value: 'bus_ac', label: MODES.bus_ac.label, detail: 'Comfortable and easy to book', icon: <BusFront className={ic} /> },
  { value: 'train_sl', label: MODES.train_sl.label, detail: 'Very cheap, book weeks ahead', icon: <TrainFront className={ic} /> },
  { value: 'train_3a', label: MODES.train_3a.label, detail: 'Comfortable berths with AC', icon: <TrainFront className={ic} /> },
  { value: 'flight', label: MODES.flight.label, detail: 'Fastest, costs more', icon: <Plane className={ic} /> },
  { value: 'car_self', label: MODES.car_self.label, detail: 'Fuel and tolls split per car', icon: <Car className={ic} /> },
  { value: 'bike', label: MODES.bike.label, detail: 'Two riders per bike', icon: <Bike className={ic} /> },
];

export const LOCAL_OPTIONS: Option<LocalTransport>[] = (Object.keys(LOCAL) as LocalTransport[]).map((k) => ({
  value: k,
  label: LOCAL[k].label,
  detail: k === 'public' ? `About ${inr(LOCAL[k].perDay)} per person a day` : `About ${inr(LOCAL[k].perDay)} per vehicle a day, ${LOCAL[k].seats} seats`,
  icon: k === 'scooter' ? <Bike className={ic} /> : k === 'taxi' ? <CarTaxiFront className={ic} /> : k === 'public' ? <BusFront className={ic} /> : <Car className={ic} />,
}));

export const STAY_OPTIONS: Option<StayTier>[] = (Object.keys(STAYS) as StayTier[]).map((k) => ({
  value: k,
  label: STAYS[k].label,
  detail: STAYS[k].capacity === 1 ? `About ${inr(STAYS[k].rate)} a bed` : `About ${inr(STAYS[k].rate)} a room, ${STAYS[k].capacity} per room`,
  icon: k === 'hostel' ? <Bed className={ic} /> : k === 'budget' ? <BedDouble className={ic} /> : k === 'comfort' ? <Building2 className={ic} /> : <Hotel className={ic} />,
}));

export const FOOD_OPTIONS: Option<FoodTier>[] = (Object.keys(FOOD) as FoodTier[]).map((k) => ({
  value: k,
  label: FOOD[k].label,
  detail: `About ${inr(FOOD[k].perDay)} per person a day`,
}));

export const PACE_OPTIONS: Option<Pace>[] = (Object.keys(PACE) as Pace[]).map((k) => ({
  value: k,
  label: PACE[k].label,
  detail: PACE[k].description,
}));

export const INTERESTS: { value: Interest; label: string }[] = [
  { value: 'beaches', label: 'Beaches' },
  { value: 'history', label: 'Forts and history' },
  { value: 'nature', label: 'Nature and views' },
  { value: 'adventure', label: 'Adventure and treks' },
  { value: 'nightlife', label: 'Nightlife' },
  { value: 'spiritual', label: 'Temples and churches' },
  { value: 'culture', label: 'Culture and museums' },
  { value: 'food', label: 'Food' },
  { value: 'shopping', label: 'Markets and shopping' },
];

export const INTEREST_LABEL = Object.fromEntries(INTERESTS.map((i) => [i.value, i.label])) as Record<Interest, string>;
