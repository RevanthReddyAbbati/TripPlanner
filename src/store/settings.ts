import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { City, FoodTier, LocalTransport, Pace, StayTier, TransportMode } from '../types';

export type Theme = 'system' | 'light' | 'dark';

export interface Defaults {
  origin?: City;
  travelers: number;
  budgetPerPerson: number;
  transport: TransportMode;
  localTransport: LocalTransport;
  stay: StayTier;
  food: FoodTier;
  pace: Pace;
  overnightTravel: boolean;
}

interface SettingsState {
  theme: Theme;
  displayName: string;
  workspaceName: string;
  defaults: Defaults;
  setTheme: (t: Theme) => void;
  setProfile: (p: { displayName?: string; workspaceName?: string }) => void;
  setDefaults: (d: Partial<Defaults>) => void;
}

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'system',
      displayName: '',
      workspaceName: 'My workspace',
      defaults: {
        travelers: 4,
        budgetPerPerson: 10000,
        transport: 'bus_ac',
        localTransport: 'scooter',
        stay: 'budget',
        food: 'mixed',
        pace: 'balanced',
        overnightTravel: true,
      },
      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },
      setProfile: (p) => set(p),
      setDefaults: (d) => set((s) => ({ defaults: { ...s.defaults, ...d } })),
    }),
    { name: 'itinera-settings', version: 1, storage: createJSONStorage(() => localStorage) },
  ),
);

export function applyTheme(theme: Theme) {
  const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
  document.documentElement.dataset.theme = dark ? 'dark' : 'light';
}
