// Weather presets. Drives particle pools, fog density, lightning, and
// road reflections.

import type { WeatherId } from "./types";

export interface WeatherDef {
  id: WeatherId;
  label: string;
  particleKind:
    | "rain"
    | "snow"
    | "ash"
    | "sand"
    | "neon"
    | "meteor"
    | "fog"
    | "none";
  rate: number; // particles/sec
  fogBoost: number; // additive fog density 0..1
  thunder: boolean;
  reflectionStrength: number; // 0..1 wet-road reflections
  windX: number; // baseline horizontal wind
  visibility: number; // 0..1 (1 = full visibility)
}

export const WEATHER: Record<WeatherId, WeatherDef> = {
  clear: {
    id: "clear",
    label: "Clear",
    particleKind: "none",
    rate: 0,
    fogBoost: 0,
    thunder: false,
    reflectionStrength: 0,
    windX: 0,
    visibility: 1,
  },
  rain: {
    id: "rain",
    label: "Rain",
    particleKind: "rain",
    rate: 320,
    fogBoost: 0.1,
    thunder: false,
    reflectionStrength: 0.55,
    windX: -120,
    visibility: 0.8,
  },
  thunder: {
    id: "thunder",
    label: "Thunderstorm",
    particleKind: "rain",
    rate: 420,
    fogBoost: 0.2,
    thunder: true,
    reflectionStrength: 0.7,
    windX: -160,
    visibility: 0.7,
  },
  snow: {
    id: "snow",
    label: "Snow",
    particleKind: "snow",
    rate: 140,
    fogBoost: 0.18,
    thunder: false,
    reflectionStrength: 0.1,
    windX: -40,
    visibility: 0.75,
  },
  fog: {
    id: "fog",
    label: "Fog",
    particleKind: "fog",
    rate: 12,
    fogBoost: 0.55,
    thunder: false,
    reflectionStrength: 0.05,
    windX: -20,
    visibility: 0.5,
  },
  ash: {
    id: "ash",
    label: "Ashfall",
    particleKind: "ash",
    rate: 110,
    fogBoost: 0.4,
    thunder: false,
    reflectionStrength: 0.05,
    windX: -50,
    visibility: 0.6,
  },
  meteors: {
    id: "meteors",
    label: "Meteor Shower",
    particleKind: "meteor",
    rate: 6,
    fogBoost: 0,
    thunder: false,
    reflectionStrength: 0.1,
    windX: 0,
    visibility: 0.95,
  },
  neon_rain: {
    id: "neon_rain",
    label: "Neon Rain",
    particleKind: "neon",
    rate: 280,
    fogBoost: 0.18,
    thunder: false,
    reflectionStrength: 0.7,
    windX: -100,
    visibility: 0.85,
  },
  sandstorm: {
    id: "sandstorm",
    label: "Sandstorm",
    particleKind: "sand",
    rate: 400,
    fogBoost: 0.45,
    thunder: false,
    reflectionStrength: 0.05,
    windX: -260,
    visibility: 0.55,
  },
};
