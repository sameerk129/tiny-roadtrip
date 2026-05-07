"use client";

// Bottom retro dashboard radio. Procedurally cycles tracks. Visuals only —
// no copyrighted audio. The actual sound is a subtle pad synthesized in
// lib/audio/engine.ts.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Panel from "./ui/Panel";
import { STATIONS } from "@/lib/procedural/radio";
import type { RadioStationId, Settings, World } from "@/lib/engine/types";

interface Props {
  settings: Settings;
  set: (patch: Partial<Settings>) => void;
  worldRef: React.RefObject<World | null>;
}

export default function Radio({ settings, set, worldRef }: Props) {
  // Snapshot just the user-visible bits of the radio at ~5Hz.
  const [snap, setSnap] = useState({ title: "—", dj: "—", vu: 0, elapsed: 0 });
  useEffect(() => {
    const id = window.setInterval(() => {
      const w = worldRef.current;
      if (!w) return;
      setSnap({
        title: w.radio.trackTitle,
        dj: w.radio.djLine,
        vu: w.radio.vu,
        elapsed: w.radio.trackElapsed,
      });
    }, 200);
    return () => window.clearInterval(id);
  }, [worldRef]);

  const cur = STATIONS.find((s) => s.id === settings.station)!;

  return (
    <div className="pointer-events-auto absolute bottom-3 left-1/2 -translate-x-1/2 w-[min(560px,92vw)] z-20">
      <Panel className="!px-4 !py-3" delay={0.4}>
        <div className="flex items-center gap-3">
          <Dial settings={settings} set={set} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] uppercase tracking-[0.24em] text-white/55 truncate">
                {cur.call} · {cur.name}
              </div>
              <div className="text-[10px] uppercase tracking-[0.18em] text-white/40 truncate">
                {cur.dj}
              </div>
            </div>
            <div className="mt-0.5 relative h-5 overflow-hidden rounded scanline">
              <Marquee text={`▶ ${snap.title}    —    ${snap.dj}`} />
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <VU vu={snap.vu} />
              <button
                onClick={() => set({ muted: !settings.muted })}
                className={
                  "text-[10px] uppercase tracking-[0.2em] px-2 py-0.5 rounded border " +
                  (settings.muted
                    ? "border-white/40 text-white"
                    : "border-white/10 text-white/55 hover:text-white/85")
                }
              >
                {settings.muted ? "muted" : "audio on"}
              </button>
            </div>
          </div>
        </div>
      </Panel>
    </div>
  );
}

function Dial({
  settings,
  set,
}: {
  settings: Settings;
  set: (patch: Partial<Settings>) => void;
}) {
  const ids = STATIONS.map((s) => s.id);
  const idx = Math.max(0, ids.indexOf(settings.station));
  const cycle = (delta: number) => {
    const next = ids[(idx + delta + ids.length) % ids.length];
    set({ station: next as RadioStationId });
  };
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => cycle(-1)}
        className="h-9 w-7 rounded-md border border-white/10 bg-white/5 text-white/70 hover:text-white text-xs"
        aria-label="previous station"
      >
        ◀
      </button>
      <div className="h-9 w-12 grid place-items-center rounded-md border border-white/10 bg-black/40 relative overflow-hidden">
        <motion.div
          key={settings.station}
          initial={{ rotate: -10, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="text-[10px] uppercase tracking-[0.18em] text-white/85"
        >
          {STATIONS.find((s) => s.id === settings.station)?.id ?? "—"}
        </motion.div>
        <div className="absolute inset-0 pointer-events-none scanline opacity-80" />
      </div>
      <button
        onClick={() => cycle(1)}
        className="h-9 w-7 rounded-md border border-white/10 bg-white/5 text-white/70 hover:text-white text-xs"
        aria-label="next station"
      >
        ▶
      </button>
    </div>
  );
}

function VU({ vu }: { vu: number }) {
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: 16 }).map((_, i) => {
        const lit = i / 16 < vu;
        return (
          <span
            key={i}
            className={
              "h-3 w-1 rounded-sm " +
              (lit
                ? i > 12
                  ? "bg-orange-300/90"
                  : i > 9
                  ? "bg-yellow-200/90"
                  : "bg-emerald-300/90"
                : "bg-white/10")
            }
          />
        );
      })}
    </div>
  );
}

function Marquee({ text }: { text: string }) {
  return (
    <div className="absolute inset-0 flex items-center">
      <div
        className="whitespace-nowrap text-xs text-white/85"
        style={{
          animation: "tr-marquee 24s linear infinite",
          paddingLeft: "100%",
        }}
      >
        {text} &nbsp;·&nbsp; {text}
      </div>
      <style jsx>{`
        @keyframes tr-marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }
      `}</style>
    </div>
  );
}
