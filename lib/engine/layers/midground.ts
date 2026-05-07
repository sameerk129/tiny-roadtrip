// Midground scenery. Each biome has a "scenery" type drawn between the
// near mountains and the road. Items are sampled deterministically from
// the world's distance — no allocation, no per-item state.

import { BIOMES } from "../biomes";
import { TIME_MODS } from "../timeOfDay";
import { mix, rgb, shade, tint } from "../colors";
import type { BiomePalette } from "../biomes";
import type { World } from "../types";
import { hash32 } from "../rng";

// Hash a scenery slot index into 0..1
function rnd(slot: number, salt = 0) {
  return (hash32(`${slot}|${salt}`) % 100000) / 100000;
}

interface SceneryParams {
  parallax: number;
  spacing: number; // pixels
  baseYFrac: number; // y position fraction
  width: number;
  height: number;
  palette: BiomePalette;
  // tinting
  tintAmt: number;
  darkness: number;
  tintCol: [number, number, number];
  worldDistance: number;
  apocalypse: number; // 0..1
}

export function drawMidground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World
) {
  const a = BIOMES[world.biomeA];
  const b = BIOMES[world.biomeB];
  const tA = TIME_MODS[world.timeA];
  const tB = TIME_MODS[world.timeB];
  const tb = world.timeBlend;
  const darkness = tA.darkness + (tB.darkness - tA.darkness) * tb;
  const tintAmt = tA.tintAmount + (tB.tintAmount - tA.tintAmount) * tb;
  const tintCol = mix(tA.tint, tB.tint, tb);
  const apoc = world.settings.reality / 100;

  // Draw two passes: outgoing biome with (1 - blend) alpha, then incoming.
  drawForBiome(ctx, a, 1 - world.biomeBlend, {
    width,
    height,
    palette: a,
    tintAmt,
    darkness,
    tintCol: tintCol as [number, number, number],
    worldDistance: world.distance,
    parallax: 0.35,
    spacing: 220,
    baseYFrac: 0.74,
    apocalypse: apoc,
  });
  drawForBiome(ctx, b, world.biomeBlend, {
    width,
    height,
    palette: b,
    tintAmt,
    darkness,
    tintCol: tintCol as [number, number, number],
    worldDistance: world.distance,
    parallax: 0.35,
    spacing: 220,
    baseYFrac: 0.74,
    apocalypse: apoc,
  });
}

function drawForBiome(
  ctx: CanvasRenderingContext2D,
  pal: BiomePalette,
  alpha: number,
  P: SceneryParams
) {
  if (alpha <= 0.01) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  const offset = P.worldDistance * P.parallax;
  const slotW = P.spacing;
  const startSlot = Math.floor(offset / slotW) - 1;
  const endSlot = startSlot + Math.ceil(P.width / slotW) + 3;
  const baseY = P.height * P.baseYFrac;

  let silhouette = mix(pal.fgSilhouette, P.tintCol, P.tintAmt * 0.5);
  silhouette = shade(silhouette, 1 - P.darkness * 0.4);
  const accent = pal.accent;

  for (let slot = startSlot; slot <= endSlot; slot++) {
    const x = slot * slotW - offset;
    const r1 = rnd(slot, 1);
    const r2 = rnd(slot, 2);
    const r3 = rnd(slot, 3);
    drawScenery(
      ctx,
      pal.scenery,
      x + r1 * slotW * 0.6,
      baseY + r2 * 8,
      r3,
      silhouette,
      accent,
      P.darkness,
      P.apocalypse
    );
  }
  ctx.restore();
}

function drawScenery(
  ctx: CanvasRenderingContext2D,
  kind: BiomePalette["scenery"],
  x: number,
  y: number,
  r: number,
  silhouette: [number, number, number],
  accent: [number, number, number],
  darkness: number,
  apoc: number
) {
  ctx.fillStyle = rgb(silhouette);
  switch (kind) {
    case "cactus": {
      const h = 26 + r * 26;
      ctx.fillRect(x, y - h, 5, h);
      // arms
      if (r > 0.4) {
        ctx.fillRect(x - 7, y - h * 0.6, 7, 4);
        ctx.fillRect(x - 8, y - h * 0.85, 4, h * 0.25);
      }
      if (r > 0.6) {
        ctx.fillRect(x + 5, y - h * 0.7, 8, 4);
        ctx.fillRect(x + 11, y - h * 0.95, 4, h * 0.3);
      }
      break;
    }
    case "pine": {
      const h = 36 + r * 50;
      ctx.beginPath();
      ctx.moveTo(x, y - h);
      ctx.lineTo(x + 9, y);
      ctx.lineTo(x - 9, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillRect(x - 1, y, 3, 4);
      break;
    }
    case "city": {
      // building
      const h = 60 + r * 100;
      const w = 28 + (r * 23) | 0;
      ctx.fillRect(x, y - h, w, h);
      // window blinks
      ctx.fillStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${
        0.45 + Math.max(0, 0.55 - darkness) * 0.5
      })`;
      for (let i = 4; i < h - 4; i += 6) {
        for (let j = 3; j < w - 3; j += 6) {
          if (((i * 7 + j * 13) ^ ((x | 0) >> 1)) & 2) {
            ctx.fillRect(x + j, y - h + i, 2, 2);
          }
        }
      }
      ctx.fillStyle = rgb(silhouette);
      break;
    }
    case "neon_city": {
      const h = 80 + r * 120;
      const w = 24 + (r * 22) | 0;
      ctx.fillRect(x, y - h, w, h);
      // neon stripes
      ctx.fillStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},0.65)`;
      ctx.fillRect(x, y - h - 1, w, 1);
      ctx.fillRect(x + 2, y - h * 0.6, w - 4, 1);
      ctx.fillRect(x + 2, y - h * 0.3, w - 4, 1);
      ctx.fillStyle = rgb(silhouette);
      break;
    }
    case "ruins": {
      // jagged broken wall
      const h = 25 + r * 50;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x, y - h * 0.7);
      ctx.lineTo(x + 7, y - h);
      ctx.lineTo(x + 14, y - h * 0.55);
      ctx.lineTo(x + 22, y - h * 0.85);
      ctx.lineTo(x + 30, y - h * 0.5);
      ctx.lineTo(x + 30, y);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "rocks": {
      const w = 14 + r * 20;
      ctx.beginPath();
      ctx.ellipse(x, y - 4, w, 7, 0, 0, Math.PI * 2);
      ctx.fill();
      break;
    }
    case "japan": {
      // torii or simple house silhouette
      if (r > 0.7) {
        // torii
        const h = 36;
        ctx.fillRect(x, y - h, 3, h);
        ctx.fillRect(x + 22, y - h, 3, h);
        ctx.fillRect(x - 4, y - h - 4, 33, 4);
        ctx.fillRect(x - 2, y - h, 29, 3);
      } else {
        const w = 30;
        const h = 22;
        ctx.fillRect(x, y - h, w, h);
        // roof
        ctx.beginPath();
        ctx.moveTo(x - 4, y - h);
        ctx.lineTo(x + w / 2, y - h - 10);
        ctx.lineTo(x + w + 4, y - h);
        ctx.closePath();
        ctx.fill();
      }
      break;
    }
    case "alien": {
      // mushroom-like
      const h = 22 + r * 30;
      ctx.fillRect(x + 4, y - h * 0.5, 3, h * 0.5);
      ctx.beginPath();
      ctx.ellipse(x + 5.5, y - h * 0.5, 12, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},0.8)`;
      ctx.fillRect(x + 1, y - h * 0.5 - 2, 2, 1);
      ctx.fillRect(x + 8, y - h * 0.5 - 1, 2, 1);
      ctx.fillStyle = rgb(silhouette);
      break;
    }
    case "kelp": {
      const h = 30 + r * 70;
      const sway = Math.sin((x + Date.now() * 0.0006) * 0.04) * 4;
      ctx.beginPath();
      ctx.moveTo(x - 1, y);
      ctx.lineTo(x - 1 + sway, y - h);
      ctx.lineTo(x + 2 + sway, y - h);
      ctx.lineTo(x + 2, y);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "lava": {
      const w = 20 + r * 22;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + w * 0.3, y - 14);
      ctx.lineTo(x + w * 0.6, y - 6);
      ctx.lineTo(x + w, y);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},0.6)`;
      ctx.fillRect(x + w * 0.3, y - 1, w * 0.4, 1);
      ctx.fillStyle = rgb(silhouette);
      break;
    }
    case "floating": {
      // floating chunk
      const yy = y - 60 - r * 40;
      ctx.beginPath();
      ctx.moveTo(x, yy);
      ctx.lineTo(x + 26, yy);
      ctx.lineTo(x + 22, yy + 10);
      ctx.lineTo(x + 16, yy + 18);
      ctx.lineTo(x + 8, yy + 14);
      ctx.lineTo(x + 2, yy + 8);
      ctx.closePath();
      ctx.fill();
      break;
    }
    case "moon": {
      // crater rim
      const w = 16 + r * 18;
      ctx.beginPath();
      ctx.ellipse(x, y, w, 4, 0, 0, Math.PI);
      ctx.fill();
      break;
    }
    case "mega": {
      const h = 100 + r * 180;
      const w = 30 + (r * 30) | 0;
      ctx.fillRect(x, y - h, w, h);
      ctx.fillStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},0.7)`;
      ctx.fillRect(x, y - h, w, 1);
      ctx.fillRect(x + w * 0.3, y - h - 8, 2, 8);
      // antenna blink
      if ((Math.floor(Date.now() * 0.002) + (x | 0)) & 1) {
        ctx.fillRect(x + w * 0.3 - 1, y - h - 10, 4, 2);
      }
      ctx.fillStyle = rgb(silhouette);
      break;
    }
    case "glitch": {
      const h = 40 + r * 80;
      const w = 16 + (r * 32) | 0;
      // Glitched offsets
      const o = (Math.sin(Date.now() * 0.01 + x) * 4 * apoc) | 0;
      ctx.fillRect(x + o, y - h, w, h);
      ctx.fillStyle = `rgba(${accent[0]},${accent[1]},${accent[2]},${0.8})`;
      ctx.fillRect(x + o + 2, y - h * 0.7, w - 4, 1);
      ctx.fillStyle = "rgba(255,0,170,0.6)";
      ctx.fillRect(x - o, y - h * 0.4, w, 1);
      ctx.fillStyle = rgb(silhouette);
      break;
    }
  }
}
