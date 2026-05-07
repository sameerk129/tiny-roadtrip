"use client";

// Right-side dashboard: world settings (biome, weather, time, reality slider,
// speed). Translucent, tucked away, never blocks more than a thin column.

import Panel from "./ui/Panel";
import Slider from "./ui/Slider";
import Select from "./ui/Select";
import type {
  BiomeId,
  Settings,
  TimeOfDayId,
  WeatherId,
} from "@/lib/engine/types";
import { BIOMES, BIOME_LIST } from "@/lib/engine/biomes";
import { WEATHER } from "@/lib/engine/weather";
import { TIME_MODS } from "@/lib/engine/timeOfDay";

interface Props {
  settings: Settings;
  set: (patch: Partial<Settings>) => void;
}

export default function Dashboard({ settings, set }: Props) {
  return (
    <div className="pointer-events-auto absolute right-3 top-3 w-64 max-w-[80vw] flex flex-col gap-2 z-20">
      <Panel delay={0.1} className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">
            atmosphere
          </div>
          <button
            onClick={() => set({ cinematic: !settings.cinematic })}
            className={
              "text-[9px] uppercase tracking-[0.2em] px-1.5 py-0.5 rounded " +
              (settings.cinematic
                ? "text-white border border-white/30 bg-white/10"
                : "text-white/45 border border-white/10")
            }
            title="Hide UI for cinematic view"
          >
            {settings.cinematic ? "ui hidden" : "cinematic"}
          </button>
        </div>

        <Select<BiomeId | "auto">
          label="biome"
          value={settings.biome}
          onChange={(v) => set({ biome: v })}
          options={[
            { value: "auto", label: "auto · drift" },
            ...BIOME_LIST.map((id) => ({
              value: id,
              label: BIOMES[id].label.toLowerCase(),
            })),
          ]}
        />

        <Select<WeatherId | "auto">
          label="weather"
          value={settings.weather}
          onChange={(v) => set({ weather: v })}
          options={[
            { value: "auto", label: "auto · drift" },
            ...(Object.keys(WEATHER) as WeatherId[]).map((id) => ({
              value: id,
              label: WEATHER[id].label.toLowerCase(),
            })),
          ]}
        />

        <Select<TimeOfDayId | "auto">
          label="timeline"
          value={settings.time}
          onChange={(v) => set({ time: v })}
          options={[
            { value: "auto", label: "auto · drift" },
            ...(Object.keys(TIME_MODS) as TimeOfDayId[]).map((id) => ({
              value: id,
              label: TIME_MODS[id].label.toLowerCase(),
            })),
          ]}
        />
      </Panel>

      <Panel delay={0.2} className="space-y-3">
        <Slider
          label="reality stability"
          value={settings.reality}
          onChange={(v) => set({ reality: v })}
          hint={`${Math.round(settings.reality)}%`}
        />
        <p className="text-[9.5px] leading-snug text-white/40 -mt-1">
          0 = normal world · 100 = cosmic collapse. sky bends, geometry
          drifts, signals corrupt.
        </p>
        <Slider
          label="cruise"
          value={settings.speed * 100}
          onChange={(v) => set({ speed: v / 100 })}
          hint={`${Math.round(settings.speed * 100)}%`}
        />
      </Panel>

      <Panel delay={0.3} className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">
            seed
          </div>
          <button
            onClick={() =>
              set({ seed: ((Math.random() * 1e9) | 0) >>> 0 })
            }
            className="text-[10px] uppercase tracking-[0.18em] px-2 py-0.5 rounded border border-white/10 text-white/70 hover:text-white hover:border-white/30"
          >
            re-roll
          </button>
        </div>
        <div className="text-[11px] text-white/70 tabular-nums">
          #{settings.seed.toString(16).padStart(8, "0")}
        </div>
      </Panel>
    </div>
  );
}
