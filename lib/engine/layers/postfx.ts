// Post effects: global flash, vignette, glitch slices, fog veil.
// Kept cheap — no per-pixel work. We stamp a few wide rectangles & gradients.

import type { World } from "../types";
import { WEATHER } from "../weather";
import { BIOMES } from "../biomes";
import { TIME_MODS } from "../timeOfDay";

export function drawFog(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World
) {
  const a = BIOMES[world.biomeA];
  const b = BIOMES[world.biomeB];
  const baseFog = a.fogDensity + (b.fogDensity - a.fogDensity) * world.biomeBlend;
  const wA = WEATHER[world.weatherA];
  const wB = WEATHER[world.weatherB];
  const weatherFog =
    wA.fogBoost + (wB.fogBoost - wA.fogBoost) * world.weatherBlend;
  const total = Math.min(0.85, baseFog + weatherFog);
  if (total <= 0.02) return;

  const tA = TIME_MODS[world.timeA];
  const tB = TIME_MODS[world.timeB];
  const ambient =
    tA.ambientLight + (tB.ambientLight - tA.ambientLight) * world.timeBlend;
  const tone = 200 + ambient * 30;
  const grad = ctx.createLinearGradient(0, height * 0.4, 0, height);
  grad.addColorStop(0, `rgba(${tone},${tone},${tone + 10},${total * 0.05})`);
  grad.addColorStop(0.5, `rgba(${tone},${tone},${tone + 10},${total * 0.55})`);
  grad.addColorStop(1, `rgba(${tone},${tone},${tone + 10},${total * 0.15})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, height * 0.4, width, height * 0.6);
}

export function drawGlitch(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World,
  rand: () => number
) {
  const apoc = world.settings.reality / 100;
  if (apoc < 0.1) return;

  // chromatic-aberration band (cheap version: horizontal pink/cyan stripes)
  if (rand() < apoc * 0.6) {
    const y = (rand() * height) | 0;
    const h = 1 + Math.floor(rand() * 4);
    ctx.save();
    ctx.globalAlpha = 0.18 + apoc * 0.3;
    ctx.fillStyle = "rgba(255,0,170,0.6)";
    ctx.fillRect(-4, y, width + 8, h);
    ctx.fillStyle = "rgba(0,255,213,0.55)";
    ctx.fillRect(2, y + 1, width + 8, h);
    ctx.restore();
  }

  // black slice
  if (rand() < apoc * 0.3) {
    const y = (rand() * height) | 0;
    const h = 1 + Math.floor(rand() * 6);
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(0, y, width, h);
  }

  // Drift bands: every few seconds, push a strip horizontally.
  if (apoc > 0.4 && rand() < apoc * 0.4) {
    const y = (rand() * height * 0.85) | 0;
    const h = 6 + Math.floor(rand() * 18);
    const dx = (rand() - 0.5) * apoc * 60;
    try {
      const img = ctx.getImageData(0, y, width, h);
      ctx.putImageData(img, dx | 0, y);
    } catch {
      // canvas may be tainted; ignore
    }
  }
}

export function drawFlash(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World
) {
  if (world.flash <= 0.005) return;
  ctx.save();
  ctx.fillStyle = `rgba(255,255,255,${world.flash})`;
  ctx.fillRect(0, 0, width, height);
  ctx.restore();
  world.flash *= 0.85;
  if (world.flash < 0.005) world.flash = 0;
}

export function drawVignette(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World
) {
  const apoc = world.settings.reality / 100;
  const grad = ctx.createRadialGradient(
    width / 2,
    height / 2,
    Math.min(width, height) * 0.3,
    width / 2,
    height / 2,
    Math.max(width, height) * 0.7
  );
  grad.addColorStop(0, "rgba(0,0,0,0)");
  grad.addColorStop(1, `rgba(0,0,0,${0.55 + apoc * 0.2})`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}
