// One color per day, mid-saturation so they read on both the light map and the dark-filtered map.
export const DAY_COLORS = ['#0f766e', '#2563eb', '#c2410c', '#be123c', '#7c3aed', '#0e7490', '#a16207', '#15803d', '#9333ea', '#b45309'];

export const dayColor = (i: number) => DAY_COLORS[i % DAY_COLORS.length];
