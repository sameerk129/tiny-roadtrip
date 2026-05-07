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
import MobileQuietGate from "./MobileQuietGate";
import type { Settings, World } from "@/lib/engine/types";
import { DEFAULT_SETTINGS } from "@/lib/defaults";

export default function Roadtrip() {
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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

  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => Promise<void>;
    };
    const active =
      document.fullscreenElement === el ||
      doc.webkitFullscreenElement === el;
    try {
      if (active) {
        if (document.exitFullscreen) await document.exitFullscreen();
        else await doc.webkitExitFullscreen?.();
      } else {
        if (el.requestFullscreen) await el.requestFullscreen();
        else
          await (
            el as HTMLDivElement & { webkitRequestFullscreen?: () => Promise<void> }
          ).webkitRequestFullscreen?.();
      }
    } catch {
      /* unsupported or blocked — ignore */
    }
  }, []);

  useEffect(() => {
    const sync = () => {
      const el = containerRef.current;
      if (!el) return;
      const doc = document as Document & {
        webkitFullscreenElement?: Element | null;
      };
      const active =
        document.fullscreenElement === el ||
        doc.webkitFullscreenElement === el;
      setIsFullscreen(!!active);
    };
    document.addEventListener("fullscreenchange", sync);
    document.addEventListener(
      "webkitfullscreenchange",
      sync as EventListener
    );
    sync();
    return () => {
      document.removeEventListener("fullscreenchange", sync);
      document.removeEventListener(
        "webkitfullscreenchange",
        sync as EventListener
      );
    };
  }, []);

  // Keyboard shortcuts: 'c' toggles cinematic, 'p' takes a screenshot, 'f' fullscreen.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;
      if (e.key === "c" || e.key === "C") {
        set({ cinematic: !settingsRef.current.cinematic });
      } else if (e.key === "p" || e.key === "P") {
        screenshot();
      } else if (e.key === "f" || e.key === "F") {
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [set, toggleFullscreen]);

  return (
    <div className="relative h-full w-full bg-ink">
      {/* Desktop: full experience from md breakpoint up */}
      <div
        ref={containerRef}
        className="relative hidden h-full w-full md:block"
      >
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
              <Dashboard
                settings={settings}
                set={set}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
              />
              <CarPanel settings={settings} set={set} />
              <Radio settings={settings} set={set} worldRef={worldRef} />
              <Title />
              <CinematicHint
                onCinematic={() => set({ cinematic: !settings.cinematic })}
                isFullscreen={isFullscreen}
                onToggleFullscreen={toggleFullscreen}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {settings.cinematic && (
          <div className="absolute bottom-4 right-4 z-30 flex flex-col items-end gap-1.5 pointer-events-auto">
            <button
              onClick={() => set({ cinematic: false })}
              className="text-[10px] uppercase tracking-[0.24em] px-3 py-1.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white"
            >
              show ui
            </button>
            {isFullscreen && (
              <button
                onClick={toggleFullscreen}
                className="text-[10px] uppercase tracking-[0.24em] px-3 py-1.5 rounded-md bg-black/40 backdrop-blur-md border border-white/10 text-white/70 hover:text-white"
              >
                exit fullscreen
              </button>
            )}
          </div>
        )}
      </div>

      {/* Mobile & narrow: quiet interlude only — no canvas */}
      <div className="md:hidden">
        <MobileQuietGate />
      </div>
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

function CinematicHint({
  onCinematic,
  isFullscreen,
  onToggleFullscreen,
}: {
  onCinematic: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}) {
  return (
    <div className="pointer-events-none absolute bottom-3 right-3 z-10 flex flex-col items-end gap-1">
      <button
        onClick={onCinematic}
        className="pointer-events-auto text-[9px] tracking-[0.22em] uppercase text-white/30 hover:text-white/70 transition"
      >
        [c] cinematic
      </button>
      <button
        onClick={onToggleFullscreen}
        className="pointer-events-auto text-[9px] tracking-[0.22em] uppercase text-white/30 hover:text-white/70 transition"
      >
        [f] {isFullscreen ? "exit fullscreen" : "fullscreen"}
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
