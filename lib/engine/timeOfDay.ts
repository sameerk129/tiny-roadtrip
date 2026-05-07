// Time-of-day modifiers. Each adjusts the biome palette by tinting and
// darkening the sky, mountains, and road. The renderer applies these
// modifiers AFTER biome blending so day/night looks consistent across
// every biome.

import type { TimeOfDayId } from "./types";
import type { RGB } from "./colors";

export interface TimeMod {
  id: TimeOfDayId;
  label: string;
  // 0..1 — how dark to make ground/road
  darkness: number;
  // 0..1 — how strongly to tint colors
  tintAmount: number;
  // RGB tint applied across palette
  tint: RGB;
  // 0..1 — chance per second of a shooting star (night-only effect)
  starsAlpha: number;
  shootingChance: number;
  // glow used by headlights, neon, etc.
  ambientLight: number; // 0..1, lower = darker → headlights matter more
}

export const TIME_MODS: Record<TimeOfDayId, TimeMod> = {
  sunrise: {
    id: "sunrise",
    label: "Sunrise",
    darkness: 0.25,
    tintAmount: 0.35,
    tint: [255, 165, 110],
    starsAlpha: 0.05,
    shootingChance: 0,
    ambientLight: 0.7,
  },
  noon: {
    id: "noon",
    label: "Noon",
    darkness: 0,
    tintAmount: 0.05,
    tint: [255, 250, 230],
    starsAlpha: 0,
    shootingChance: 0,
    ambientLight: 1,
  },
  sunset: {
    id: "sunset",
    label: "Sunset",
    darkness: 0.3,
    tintAmount: 0.45,
    tint: [255, 100, 80],
    starsAlpha: 0.1,
    shootingChance: 0,
    ambientLight: 0.55,
  },
  night: {
    id: "night",
    label: "Night",
    darkness: 0.65,
    tintAmount: 0.45,
    tint: [40, 60, 120],
    starsAlpha: 0.85,
    shootingChance: 0.04,
    ambientLight: 0.18,
  },
  midnight: {
    id: "midnight",
    label: "Midnight",
    darkness: 0.85,
    tintAmount: 0.55,
    tint: [20, 30, 80],
    starsAlpha: 1,
    shootingChance: 0.06,
    ambientLight: 0.08,
  },
  eclipse: {
    id: "eclipse",
    label: "Eclipse",
    darkness: 0.7,
    tintAmount: 0.6,
    tint: [60, 30, 90],
    starsAlpha: 0.6,
    shootingChance: 0.02,
    ambientLight: 0.15,
  },
};
