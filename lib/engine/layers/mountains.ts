// Layered procedural mountains. We compute a continuous noise silhouette
// that scrolls horizontally with the world. Three depth layers move at
// different parallax speeds. Each layer also blends colors between the
// outgoing biome A and incoming biome B.

import { fbm1D } from "../noise";
import { BIOMES } from "../biomes";
import { TIME_MODS } from "../timeOfDay";
import { mix, rgb, shade, tint } from "../colors";
import type { World } from "../types";

const LAYERS = [
  // depth (parallax factor), amplitude (frac of height), baseY (frac of height), freq, octaves
  { parallax: 0.04, amp: 0.18, base: 0.55, freq: 0.0018, oct: 3, key: "far" },
  { parallax: 0.1, amp: 0.22, base: 0.62, freq: 0.0035, oct: 3, key: "mid" },
  { parallax: 0.22, amp: 0.16, base: 0.7, freq: 0.0065, oct: 4, key: "near" },
] as const;

export function drawMountains(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World
) {
  const a = BIOMES[world.biomeA];
  const b = BIOMES[world.biomeB];
  const tA = TIME_MODS[world.timeA];
  const tB = TIME_MODS[world.timeB];
  const bb = world.biomeBlend;
  const tb = world.timeBlend;
  const darkness = tA.darkness + (tB.darkness - tA.darkness) * tb;
  const tintAmt = tA.tintAmount + (tB.tintAmount - tA.tintAmount) * tb;
  const tintCol = mix(tA.tint, tB.tint, tb);

  for (let i = 0; i < LAYERS.length; i++) {
    const L = LAYERS[i];
    const colA = i === 0 ? a.mountainsFar : i === 1 ? a.mountainsMid : a.mountainsNear;
    const colB = i === 0 ? b.mountainsFar : i === 1 ? b.mountainsMid : b.mountainsNear;
    let col = mix(colA, colB, bb);
    col = shade(tint(col, tintCol, tintAmt * 0.7), 1 - darkness * (0.5 + i * 0.15));

    ctx.fillStyle = rgb(col);
    ctx.beginPath();
    const offset = world.distance * L.parallax;
    const baseY = height * L.base;
    const amp = height * L.amp;
    const step = 8;
    ctx.moveTo(0, height);
    for (let x = 0; x <= width; x += step) {
      const n = fbm1D((x + offset) * L.freq + i * 17.3, L.oct);
      const y = baseY - amp * (n - 0.5) * 2;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(width, height);
    ctx.closePath();
    ctx.fill();
  }
}
