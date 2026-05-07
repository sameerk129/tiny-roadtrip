"use client";

// Top-level component. Owns the React-side Settings state and a settingsRef
// that the canvas reads each frame. Settings updates DO trigger a small
// re-render of the UI, but never re-mount the canvas — so the world's
// continuous state is preserved across every interaction.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import CanvasStage from "./CanvasStage";
import Dashboard from "./Dashboard";
import CarPanel from "./CarPanel";
import Radio from "./Radio";
import Hud from "./Hud";
import type { Settings, World } from "@/lib/engine/types";
import { DEFAULT_SETTINGS } from "@/lib/defaults";

export default function Roadtrip() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  // Mirror current settings to a ref. The canvas reads from this ref each
  // frame to avoid re-creating its loop on every state change.
  const settingsRef = useRef<Settings>(settings);
  settingsRef.current = settings;

  // World snapshot ref written by the canvas loop. Read by Hud / Radio for
  // their cheap interval-based UI.
  const worldRef = useRef<World | null>(null);
  const onWorldTick = useCallback((w: World) => {
    worldRef.current = w;
  }, []);

  const set = useCallback(
    (patch: Partial<Settings>) =>
      setSettings((prev) => ({
        ...prev,
        ...patch,
        car: patch.car ? { ...prev.car, ...patch.car } : prev.car,
      })),
    []
  );

  const overlay = useMemo(() => !settings.cinematic, [settings.cinematic]);

  // Keyboard shortcuts: 'c' toggles cinematic, 'p' takes a screenshot.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "c" || e.key === "C") {
        set({ cinematic: !settingsRef.current.cinematic });
      } else if (e.key === "p" || e.key === "P") {
        screenshot();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [set]);

  return (
    <div className="relative h-full w-full">
      <CanvasStage settingsRef={settingsRef} onWorldTick={onWorldTick} />
      <div className="absolute inset-0 grain pointer-events-none" />

      <AnimatePresence>
        {overlay && (
          <motion.div
            key="ui"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="absolute inset-0 pointer-events-none"
          >
            <Hud worldRef={worldRef} />
            <Dashboard settings={settings} set={set} />
            <CarPanel settings={settings} set={set} />
            <Radio settings={settings} set={set} worldRef={worldRef} />
            <Title />
            <CinematicHint
              onClick={() => set({ cinematic: !settings.cinematic })}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {settings.cinematic && (
        <button
          onClick={() => set({ cinematic: false })}
          className="absolute bottom-4 right-4 z-30 pointer-events-auto text-[10px] uppercase tracking-[0.24em] px-3 py-1.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white"
        >
          show ui
        </button>
      )}
    </div>
  );
}

function Title() {
  return (
    <div className="pointer-events-none absolute bottom-3 left-3 z-10">
      <div className="text-[10px] uppercase tracking-[0.32em] text-white/45">
        tiny procedural roadtrip
      </div>
      <div className="text-[9px] tracking-[0.18em] text-white/30 mt-0.5">
        a small journey through infinite realities
      </div>
    </div>
  );
}

function CinematicHint({ onClick }: { onClick: () => void }) {
  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1">
      <button
        onClick={onClick}
        className="pointer-events-auto text-[9px] tracking-[0.22em] uppercase text-white/30 hover:text-white/70 transition"
      >
        [c] cinematic
      </button>
      <button
        onClick={screenshot}
        className="pointer-events-auto text-[9px] tracking-[0.22em] uppercase text-white/30 hover:text-white/70 transition"
      >
        [p] screenshot
      </button>
    </div>
  );
}

function screenshot() {
  const c = document.querySelector("canvas");
  if (!(c instanceof HTMLCanvasElement)) return;
  try {
    const url = c.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `roadtrip-${Date.now()}.png`;
    a.click();
  } catch {
    /* tainted canvas — ignore */
  }
}
