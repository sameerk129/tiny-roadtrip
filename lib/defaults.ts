import type { Settings } from "./engine/types";

export const DEFAULT_SETTINGS: Settings = {
  biome: "auto",
  weather: "auto",
  time: "auto",
  reality: 5,
  speed: 0.45,
  station: "synthwave",
  muted: false,
  cinematic: false,
  car: {
    headlights: true,
    rooftopCargo: false,
    camper: true,
    neon: false,
    antenna: true,
    solar: false,
    armor: false,
  },
  seed: 1337,
};
