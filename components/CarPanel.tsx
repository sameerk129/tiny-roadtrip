"use client";

// Left-side car customization panel. All toggles flip a single car-shaped
// patch back to the parent settings.

import Panel from "./ui/Panel";
import Toggle from "./ui/Toggle";
import type { CarOptions, Settings } from "@/lib/engine/types";

interface Props {
  settings: Settings;
  set: (patch: Partial<Settings>) => void;
}

export default function CarPanel({ settings, set }: Props) {
  const toggle = (key: keyof CarOptions) =>
    set({ car: { ...settings.car, [key]: !settings.car[key] } });

  return (
    <div className="pointer-events-auto absolute left-3 top-3 w-56 z-20">
      <Panel delay={0.15} className="space-y-2">
        <div className="text-[10px] uppercase tracking-[0.22em] text-white/55">
          vehicle
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          <Toggle
            label="lights"
            active={settings.car.headlights}
            onClick={() => toggle("headlights")}
          />
          <Toggle
            label="camper"
            active={settings.car.camper}
            onClick={() => toggle("camper")}
          />
          <Toggle
            label="cargo"
            active={settings.car.rooftopCargo}
            onClick={() => toggle("rooftopCargo")}
          />
          <Toggle
            label="solar"
            active={settings.car.solar}
            onClick={() => toggle("solar")}
          />
          <Toggle
            label="antenna"
            active={settings.car.antenna}
            onClick={() => toggle("antenna")}
          />
          <Toggle
            label="armor"
            active={settings.car.armor}
            onClick={() => toggle("armor")}
          />
          <Toggle
            label="neon"
            active={settings.car.neon}
            onClick={() => toggle("neon")}
          />
          <Toggle
            label="mute"
            active={settings.muted}
            onClick={() => set({ muted: !settings.muted })}
          />
        </div>
      </Panel>
    </div>
  );
}
