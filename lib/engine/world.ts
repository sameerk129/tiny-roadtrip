// World bootstrap + simulation step. The world struct holds all
// continuously-updated state for the canvas. UI settings are mirrored in
// once per frame from React, but the world itself is mutated outside React.

import type {
  ActiveEvent,
  BiomeId,
  ShootingStar,
  Settings,
  Star,
  Particle,
  TimeOfDayId,
  WeatherId,
  World,
} from "./types";
import { BIOME_LIST, BIOMES } from "./biomes";
import { WEATHER } from "./weather";
import { TIME_MODS } from "./timeOfDay";
import { mulberry32 } from "./rng";

const PARTICLE_POOL_SIZE = 600; // hard cap for performance
const STAR_COUNT = 120;
const SHOOTING_POOL = 12;

export function createWorld(settings: Settings): World {
  const rand = mulberry32(settings.seed);

  const stars: Star[] = new Array(STAR_COUNT);
  for (let i = 0; i < STAR_COUNT; i++) {
    stars[i] = {
      x: rand(),
      y: rand() * 0.55,
      brightness: 0.3 + rand() * 0.7,
      twinkle: rand() * Math.PI * 2,
    };
  }

  const particles: Particle[] = new Array(PARTICLE_POOL_SIZE);
  for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
    particles[i] = {
      alive: false,
      kind: "rain",
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
      size: 1,
      color: "#fff",
    };
  }

  const shootingStars: ShootingStar[] = new Array(SHOOTING_POOL);
  for (let i = 0; i < SHOOTING_POOL; i++) {
    shootingStars[i] = {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      life: 0,
      maxLife: 0,
    };
  }

  const initialBiome: BiomeId =
    settings.biome === "auto" ? "japan_country" : settings.biome;
  const nextBiome: BiomeId = pickNextBiome(initialBiome, rand);
  const initialWeather: WeatherId =
    settings.weather === "auto" ? "clear" : settings.weather;
  const initialTime: TimeOfDayId =
    settings.time === "auto" ? "sunset" : settings.time;

  return {
    t: 0,
    dt: 0,
    distance: 0,
    settings: { ...settings, car: { ...settings.car } },

    biomeA: initialBiome,
    biomeB: nextBiome,
    biomeBlend: 0,
    biomeNextChange: 28 + rand() * 16,

    weatherA: initialWeather,
    weatherB: initialWeather,
    weatherBlend: 1,
    weatherNextChange: 22 + rand() * 18,

    timeA: initialTime,
    timeB: initialTime,
    timeBlend: 1,
    timeNextChange: 60 + rand() * 30,

    events: [],
    eventCooldown: 8 + rand() * 6,

    radio: {
      station: settings.station,
      trackTitle: "—",
      djLine: "tuning…",
      trackElapsed: 0,
      trackDuration: 0,
      vu: 0,
    },

    particles,
    stars,
    shootingStars,

    shake: 0,
    flash: 0,

    resolvedBiome: initialBiome,
    resolvedWeather: initialWeather,
    resolvedTime: initialTime,
  };
}

function pickNextBiome(current: BiomeId, rand: () => number): BiomeId {
  // Pick something that isn't the same as the current.
  let next = BIOME_LIST[Math.floor(rand() * BIOME_LIST.length)];
  if (next === current) {
    next = BIOME_LIST[(BIOME_LIST.indexOf(current) + 1) % BIOME_LIST.length];
  }
  return next;
}

const WEATHER_LIST: WeatherId[] = Object.keys(WEATHER) as WeatherId[];
const TIME_LIST: TimeOfDayId[] = Object.keys(TIME_MODS) as TimeOfDayId[];

// Update biome/weather/time blending. Driven by procedural timers when
// the corresponding setting is "auto", otherwise pinned to the user's
// chosen preset (with smooth transition into it).
export function tickTransitions(world: World, rand: () => number) {
  const { settings } = world;
  const dt = world.dt;

  // BIOME ---------------------------------------------------------------
  if (settings.biome === "auto") {
    world.biomeNextChange -= dt;
    if (world.biomeNextChange <= 0 && world.biomeBlend >= 1) {
      world.biomeA = world.biomeB;
      world.biomeB = pickNextBiome(world.biomeA, rand);
      world.biomeBlend = 0;
      world.biomeNextChange = 30 + rand() * 25;
    }
    // Slowly blend toward B
    world.biomeBlend = Math.min(1, world.biomeBlend + dt * 0.05);
  } else if (settings.biome !== world.biomeB) {
    world.biomeA = lerpedBiome(world);
    world.biomeB = settings.biome;
    world.biomeBlend = 0;
  } else {
    world.biomeBlend = Math.min(1, world.biomeBlend + dt * 0.25);
  }
  world.resolvedBiome =
    world.biomeBlend > 0.5 ? world.biomeB : world.biomeA;

  // WEATHER -------------------------------------------------------------
  if (settings.weather === "auto") {
    world.weatherNextChange -= dt;
    if (world.weatherNextChange <= 0 && world.weatherBlend >= 1) {
      world.weatherA = world.weatherB;
      world.weatherB = WEATHER_LIST[Math.floor(rand() * WEATHER_LIST.length)];
      world.weatherBlend = 0;
      world.weatherNextChange = 25 + rand() * 25;
    }
    world.weatherBlend = Math.min(1, world.weatherBlend + dt * 0.18);
  } else if (settings.weather !== world.weatherB) {
    world.weatherA = world.weatherB;
    world.weatherB = settings.weather;
    world.weatherBlend = 0;
  } else {
    world.weatherBlend = Math.min(1, world.weatherBlend + dt * 0.6);
  }
  world.resolvedWeather =
    world.weatherBlend > 0.5 ? world.weatherB : world.weatherA;

  // TIME ----------------------------------------------------------------
  if (settings.time === "auto") {
    world.timeNextChange -= dt;
    if (world.timeNextChange <= 0 && world.timeBlend >= 1) {
      world.timeA = world.timeB;
      world.timeB = nextTimeStep(world.timeA);
      world.timeBlend = 0;
      world.timeNextChange = 60 + rand() * 60;
    }
    world.timeBlend = Math.min(1, world.timeBlend + dt * 0.04);
  } else if (settings.time !== world.timeB) {
    world.timeA = world.timeB;
    world.timeB = settings.time;
    world.timeBlend = 0;
  } else {
    world.timeBlend = Math.min(1, world.timeBlend + dt * 0.2);
  }
  world.resolvedTime = world.timeBlend > 0.5 ? world.timeB : world.timeA;
}

function lerpedBiome(world: World): BiomeId {
  return world.biomeBlend > 0.5 ? world.biomeB : world.biomeA;
}

function nextTimeStep(t: TimeOfDayId): TimeOfDayId {
  // Natural cycle. Eclipse occasionally injected via auto-biome events.
  const order: TimeOfDayId[] = [
    "sunrise",
    "noon",
    "sunset",
    "night",
    "midnight",
    "sunrise",
  ];
  const i = order.indexOf(t);
  return order[(i + 1) % order.length];
}

// Returns interpolated palette tuples for the current biome blend.
// Used by the renderer; we keep this in world.ts so it's near the
// transition logic.
export { BIOMES };
export { TIME_MODS };
export { WEATHER };
