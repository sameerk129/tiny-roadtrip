"use client";

// CanvasStage owns the canvas + the requestAnimationFrame loop.
// It receives a `settingsRef` that's continuously synced from React state.
// The component itself never re-renders during animation.

import { useEffect, useRef } from "react";
import type { Settings, World } from "@/lib/engine/types";
import { createWorld } from "@/lib/engine/world";
import { mulberry32 } from "@/lib/engine/rng";
import { step } from "@/lib/engine/render";
import {
  ensureAudio,
  syncAudioFromWorld,
  thunderBoom,
} from "@/lib/audio/engine";
import { nextTrackFor } from "@/lib/procedural/radio";

interface Props {
  settingsRef: React.RefObject<Settings>;
  // Optional callback so the UI can read the latest world snapshot for HUD
  // displays (resolved biome label, radio track, etc.) without subscribing
  // to the render loop.
  onWorldTick?: (world: World) => void;
}

export default function CanvasStage({ settingsRef, onWorldTick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      width = Math.floor(rect.width);
      height = Math.floor(rect.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const initial: Settings = settingsRef.current
      ? { ...settingsRef.current, car: { ...settingsRef.current.car } }
      : ({} as Settings);
    const world = createWorld(initial);

    // Per-frame PRNG for cheap randomness. Independent from the seeded
    // procedural RNG so user actions never desync world generation.
    const frameRand = mulberry32(world.settings.seed ^ 0xa5a5a5a5);

    let last = performance.now();
    let rafId = 0;
    let trackTimer = 0;
    let weatherAudioTimer = 0;
    let thunderTimer = 6 + Math.random() * 8;

    // Initialize first radio track so HUD has something to display.
    {
      const t = nextTrackFor(world.settings.station, world.settings.seed);
      world.radio.station = world.settings.station;
      world.radio.trackTitle = t.title;
      world.radio.djLine = t.djLine;
      world.radio.trackElapsed = 0;
      world.radio.trackDuration = t.duration;
    }

    // Visibility pause — saves battery if user tabs away.
    let visible = true;
    const onVis = () => {
      visible = !document.hidden;
      if (visible) last = performance.now();
    };
    document.addEventListener("visibilitychange", onVis);

    const loop = (now: number) => {
      rafId = requestAnimationFrame(loop);
      if (!visible) return;
      let dt = (now - last) / 1000;
      last = now;
      if (dt > 0.066) dt = 0.066; // clamp huge gaps
      world.dt = dt;
      world.t += dt;

      // Mirror settings into world. Cheap shallow copy of primitives + car.
      const s = settingsRef.current;
      if (s) {
        world.settings.biome = s.biome;
        world.settings.weather = s.weather;
        world.settings.time = s.time;
        world.settings.reality = s.reality;
        world.settings.speed = s.speed;
        world.settings.station = s.station;
        world.settings.muted = s.muted;
        world.settings.cinematic = s.cinematic;
        world.settings.seed = s.seed;
        world.settings.car.headlights = s.car.headlights;
        world.settings.car.rooftopCargo = s.car.rooftopCargo;
        world.settings.car.camper = s.car.camper;
        world.settings.car.neon = s.car.neon;
        world.settings.car.antenna = s.car.antenna;
        world.settings.car.solar = s.car.solar;
        world.settings.car.armor = s.car.armor;
      }

      step({ ctx, width, height, world, rand: frameRand });

      // Radio cycling: independent from the canvas; advances track timer
      // and queues the next title when the current "track" expires.
      trackTimer += dt;
      world.radio.trackElapsed += dt;
      if (world.radio.station !== world.settings.station) {
        world.radio.station = world.settings.station;
        const t = nextTrackFor(world.radio.station, world.settings.seed + (Math.random() * 1e6) | 0);
        world.radio.trackTitle = t.title;
        world.radio.djLine = t.djLine;
        world.radio.trackElapsed = 0;
        world.radio.trackDuration = t.duration;
      }
      if (world.radio.trackElapsed >= world.radio.trackDuration) {
        const t = nextTrackFor(world.radio.station, (world.settings.seed + (now | 0)) >>> 0);
        world.radio.trackTitle = t.title;
        world.radio.djLine = t.djLine;
        world.radio.trackElapsed = 0;
        world.radio.trackDuration = t.duration;
      }
      world.radio.vu = 0.4 + Math.abs(Math.sin(world.t * 6 + Math.sin(world.t))) * 0.6;

      // Audio sync (~4 Hz to keep cost low)
      weatherAudioTimer += dt;
      if (weatherAudioTimer > 0.25) {
        weatherAudioTimer = 0;
        syncAudioFromWorld(world);
      }
      // Thunder: only during thunder weather
      thunderTimer -= dt;
      if (
        thunderTimer <= 0 &&
        (world.resolvedWeather === "thunder")
      ) {
        thunderBoom(0.6 + Math.random() * 0.4);
        world.flash = Math.max(world.flash, 0.4);
        thunderTimer = 4 + Math.random() * 8;
      } else if (world.resolvedWeather !== "thunder" && thunderTimer < 0) {
        thunderTimer = 8 + Math.random() * 10;
      }

      // Surface world snapshot for HUD subscribers (cheap; throttled below).
      if (onWorldTick) onWorldTick(world);
    };

    rafId = requestAnimationFrame(loop);

    // Lazy-init audio after first user gesture. Browsers require it.
    const tryInitAudio = () => {
      const s = settingsRef.current;
      if (s) ensureAudio(s);
    };
    window.addEventListener("pointerdown", tryInitAudio, { once: true });
    window.addEventListener("keydown", tryInitAudio, { once: true });

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pointerdown", tryInitAudio);
      window.removeEventListener("keydown", tryInitAudio);
    };
    // We intentionally do not depend on onWorldTick / settingsRef.current —
    // the loop reads them via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 h-full w-full"
      style={{ imageRendering: "auto" }}
    />
  );
}
