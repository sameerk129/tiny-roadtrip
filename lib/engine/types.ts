// Core types shared between the React UI and the canvas rendering engine.
// Settings are mirrored from React state into the World once per frame so the
// canvas loop never causes React rerenders.

export type BiomeId =
  | "desert"
  | "snowy"
  | "cyberpunk"
  | "rain_highway"
  | "forest"
  | "wasteland"
  | "retro80s"
  | "alien"
  | "underwater"
  | "volcanic"
  | "floating_islands"
  | "ruins"
  | "night_highway"
  | "vaporwave"
  | "japan_country"
  | "moon"
  | "megacity"
  | "glitch";

export type WeatherId =
  | "clear"
  | "rain"
  | "thunder"
  | "snow"
  | "fog"
  | "ash"
  | "meteors"
  | "neon_rain"
  | "sandstorm";

export type TimeOfDayId =
  | "sunrise"
  | "noon"
  | "sunset"
  | "night"
  | "midnight"
  | "eclipse";

export type EventId =
  | "ufo"
  | "creature"
  | "gas_station"
  | "convoy"
  | "lightning"
  | "static_burst"
  | "meteor"
  | "ghost"
  | "portal"
  | "train"
  | "giant_moon"
  | "split_road"
  | "sky_whale"
  | "city_explosion"
  | "robot";

export type RadioStationId =
  | "synthwave"
  | "lofi"
  | "survival"
  | "static"
  | "emergency"
  | "off";

export interface CarOptions {
  headlights: boolean;
  rooftopCargo: boolean;
  camper: boolean;
  neon: boolean;
  antenna: boolean;
  solar: boolean;
  armor: boolean;
}

export interface Settings {
  biome: BiomeId | "auto";
  weather: WeatherId | "auto";
  time: TimeOfDayId | "auto";
  reality: number; // 0..100  apocalypse / reality stability inverted
  speed: number; // 0..1
  station: RadioStationId;
  muted: boolean;
  cinematic: boolean;
  car: CarOptions;
  seed: number;
}

export interface Vec2 {
  x: number;
  y: number;
}

// The mutable world that the render loop reads & writes every frame.
// Lives outside React state to avoid triggering rerenders.
export interface World {
  // Time
  t: number; // seconds since start
  dt: number; // last frame delta seconds
  distance: number; // virtual meters traveled

  // Settings (mirrored from React)
  settings: Settings;

  // Biome blending
  biomeA: BiomeId;
  biomeB: BiomeId;
  biomeBlend: number; // 0..1
  biomeNextChange: number; // seconds until next forced shift

  // Weather blending
  weatherA: WeatherId;
  weatherB: WeatherId;
  weatherBlend: number;
  weatherNextChange: number;

  // Time of day
  timeA: TimeOfDayId;
  timeB: TimeOfDayId;
  timeBlend: number;
  timeNextChange: number;

  // Events
  events: ActiveEvent[];
  eventCooldown: number;

  // Radio
  radio: RadioState;

  // Pools
  particles: Particle[];
  stars: Star[];
  shootingStars: ShootingStar[];

  // Camera shake
  shake: number;

  // Lightning flash 0..1
  flash: number;

  // Last UI-visible weather/time/biome labels (cached so UI can read them
  // without recomputing).
  resolvedBiome: BiomeId;
  resolvedWeather: WeatherId;
  resolvedTime: TimeOfDayId;
}

export interface Particle {
  alive: boolean;
  kind: "rain" | "snow" | "ash" | "sand" | "neon" | "meteor" | "spark" | "fog";
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface Star {
  x: number; // 0..1 across screen
  y: number; // 0..1 in upper portion
  brightness: number;
  twinkle: number;
}

export interface ShootingStar {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
}

export interface ActiveEvent {
  id: EventId;
  t: number; // age seconds
  duration: number;
  // Per-event payload
  data: Record<string, number>;
}

export interface RadioState {
  station: RadioStationId;
  trackTitle: string;
  djLine: string;
  trackElapsed: number;
  trackDuration: number;
  // visual VU meter
  vu: number;
}
