"use client";

// Minimal HUD: tiny labels at top-center for current biome / weather / time.
// Reads world state via worldRef without subscribing to the render loop.

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BIOMES } from "@/lib/engine/biomes";
import { WEATHER } from "@/lib/engine/weather";
import { TIME_MODS } from "@/lib/engine/timeOfDay";
import type { World } from "@/lib/engine/types";

export default function Hud({
  worldRef,
}: {
  worldRef: React.RefObject<World | null>;
}) {
  const [s, setS] = useState({
    biome: "—",
    weather: "—",
    time: "—",
    distance: 0,
  });
  useEffect(() => {
    const id = window.setInterval(() => {
      const w = worldRef.current;
      if (!w) return;
      setS({
        biome: BIOMES[w.resolvedBiome].label,
        weather: WEATHER[w.resolvedWeather].label,
        time: TIME_MODS[w.resolvedTime].label,
        distance: w.distance,
      });
    }, 500);
    return () => window.clearInterval(id);
  }, [worldRef]);

  const distanceKm = (s.distance / 1000).toFixed(1);

  return (
    <div className="pointer-events-none absolute top-3 left-1/2 -translate-x-1/2 z-10">
      <div className="flex items-center gap-3 text-[10px] uppercase tracking-[0.32em] text-white/60">
        <Tag label={s.biome} k="b" />
        <span className="text-white/20">·</span>
        <Tag label={s.weather} k="w" />
        <span className="text-white/20">·</span>
        <Tag label={s.time} k="t" />
        <span className="text-white/20">·</span>
        <span className="tabular-nums text-white/40">{distanceKm} km</span>
      </div>
    </div>
  );
}

function Tag({ label, k }: { label: string; k: string }) {
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={k + ":" + label}
        initial={{ opacity: 0, y: -4 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 4 }}
        transition={{ duration: 0.6 }}
        className="text-white/80"
      >
        {label}
      </motion.span>
    </AnimatePresence>
  );
}
