// Procedural radio. We synthesize:
//   - station list with a fictional name & DJ
//   - a stream of fake track titles
//   - DJ banter / emergency broadcasts / static
// Nothing copyrighted. Pure word soup.

import { mulberry32 } from "../engine/rng";
import type { RadioStationId } from "../engine/types";

export interface StationDef {
  id: RadioStationId;
  name: string;
  call: string; // "FM 88.3" etc
  dj: string;
  genre: string;
  vibe: "calm" | "static" | "creepy" | "warm";
}

export const STATIONS: StationDef[] = [
  {
    id: "synthwave",
    name: "Neon Mirage",
    call: "88.3 FM",
    dj: "DJ Halcyon",
    genre: "synthwave",
    vibe: "warm",
  },
  {
    id: "lofi",
    name: "Drift FM",
    call: "92.7 FM",
    dj: "Kiyo",
    genre: "lo-fi",
    vibe: "calm",
  },
  {
    id: "survival",
    name: "Last Signal",
    call: "104.1 FM",
    dj: "Mara — automated",
    genre: "broadcast",
    vibe: "creepy",
  },
  {
    id: "static",
    name: "—",
    call: "0.00 FM",
    dj: "—",
    genre: "static",
    vibe: "static",
  },
  {
    id: "emergency",
    name: "EMG-7",
    call: "—— —",
    dj: "Civil Defense",
    genre: "emergency",
    vibe: "creepy",
  },
  {
    id: "off",
    name: "Off",
    call: "—",
    dj: "—",
    genre: "—",
    vibe: "calm",
  },
];

const SYNTH_WORDS_A = [
  "Neon", "Velvet", "Silent", "Chrome", "Pastel", "Hollow", "Plastic", "Phantom",
  "Twilight", "Lonely", "Soft", "Endless", "Ghost", "Liquid", "Distant", "Sapphire",
  "Forgotten", "Drifting", "Crystal", "Slow",
];
const SYNTH_WORDS_B = [
  "Highways", "Sunsets", "Memory", "Drive", "Static", "Mirror", "Engine", "Cassette",
  "Letters", "Coastline", "Postcard", "Heartbeat", "Skyline", "Theater", "Dream",
  "Polaroid", "Departure", "Reverie", "Hotel", "Window",
];
const LOFI_WORDS_A = [
  "rainy", "midnight", "autumn", "soft", "quiet", "indigo", "warm", "small",
  "tiny", "gentle", "lazy", "sleepy", "cherry", "linen", "amber", "honey",
];
const LOFI_WORDS_B = [
  "study", "thoughts", "afternoons", "letters", "kitchens", "windows", "trains",
  "porches", "balconies", "footsteps", "mornings", "tea", "drives", "pages",
];

const SURVIVAL_LINES = [
  "If you can hear this, stay off the southern road.",
  "Day 412. Something walked past the camp last night.",
  "We are not alone in this rain.",
  "If you have water, ration it. The next town is empty.",
  "Avoid lights between midnight and four.",
  "I'll keep transmitting until the antenna fails.",
  "If you still drive — drive slow, drive quiet.",
  "Anyone out there?",
];

const EMERGENCY_LINES = [
  "—— THIS IS A CIVIL ALERT ——",
  "Reality stability anomaly detected. Stand by.",
  "Sky fold reported in sectors 7 and 11.",
  "All citizens shelter in place. Do not look up.",
  "Temporal seam closing. Estimated end: unknown.",
  "If sky changes color, do not stop the car.",
];

const SYNTH_DJ = [
  "you're driving with me. it's still raining out there.",
  "this one's for everyone who's still on the road.",
  "wherever you are, take it slow tonight.",
  "the road keeps going. so do we.",
  "no traffic for hours. just us and the hum.",
];

const LOFI_DJ = [
  "stay warm out there.",
  "small drive, small thoughts.",
  "we'll keep this slow.",
  "no rush tonight.",
  "another quiet hour.",
];

export interface ProceduralTrack {
  title: string;
  djLine: string;
  duration: number;
}

export function nextTrackFor(
  station: RadioStationId,
  seed: number
): ProceduralTrack {
  const rand = mulberry32(seed >>> 0);
  switch (station) {
    case "synthwave": {
      const a = SYNTH_WORDS_A[(rand() * SYNTH_WORDS_A.length) | 0];
      const b = SYNTH_WORDS_B[(rand() * SYNTH_WORDS_B.length) | 0];
      const title = `${a} ${b}`;
      const dj = SYNTH_DJ[(rand() * SYNTH_DJ.length) | 0];
      return { title, djLine: dj, duration: 60 + rand() * 90 };
    }
    case "lofi": {
      const a = LOFI_WORDS_A[(rand() * LOFI_WORDS_A.length) | 0];
      const b = LOFI_WORDS_B[(rand() * LOFI_WORDS_B.length) | 0];
      const title = `${a} ${b}`;
      const dj = LOFI_DJ[(rand() * LOFI_DJ.length) | 0];
      return { title, djLine: dj, duration: 90 + rand() * 90 };
    }
    case "survival": {
      const title = `transmission #${(rand() * 999) | 0}`;
      const dj = SURVIVAL_LINES[(rand() * SURVIVAL_LINES.length) | 0];
      return { title, djLine: dj, duration: 30 + rand() * 60 };
    }
    case "emergency": {
      const title = `// ALERT ${((rand() * 9999) | 0)
        .toString(16)
        .toUpperCase()}`;
      const dj = EMERGENCY_LINES[(rand() * EMERGENCY_LINES.length) | 0];
      return { title, djLine: dj, duration: 25 + rand() * 30 };
    }
    case "static": {
      return { title: "···", djLine: "—", duration: 999 };
    }
    case "off":
    default:
      return { title: "—", djLine: "—", duration: 999 };
  }
}
