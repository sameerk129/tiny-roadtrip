// Sky gradient layer. Blends the current biome's three-stop sky and applies
// the time-of-day darkness/tint and weather visibility on top.

import { BIOMES } from "../biomes";
import { TIME_MODS } from "../timeOfDay";
import { mix, rgb, shade, tint, type RGB } from "../colors";
import type { World } from "../types";

export function getBlendedSky(world: World): {
  top: RGB;
  mid: RGB;
  bottom: RGB;
  ambient: number;
} {
  const a = BIOMES[world.biomeA];
  const b = BIOMES[world.biomeB];
  const tA = TIME_MODS[world.timeA];
  const tB = TIME_MODS[world.timeB];
  const bb = world.biomeBlend;
  const tb = world.timeBlend;

  let top = mix(a.skyTop, b.skyTop, bb);
  let mid = mix(a.skyMid, b.skyMid, bb);
  let bottom = mix(a.skyBottom, b.skyBottom, bb);

  // Apply time-of-day tint + darkness
  const darkness = tA.darkness + (tB.darkness - tA.darkness) * tb;
  const tintAmt = tA.tintAmount + (tB.tintAmount - tA.tintAmount) * tb;
  const tintCol = mix(tA.tint, tB.tint, tb);
  const ambient = tA.ambientLight + (tB.ambientLight - tA.ambientLight) * tb;

  top = shade(tint(top, tintCol, tintAmt), 1 - darkness * 0.95);
  mid = shade(tint(mid, tintCol, tintAmt), 1 - darkness * 0.85);
  bottom = shade(tint(bottom, tintCol, tintAmt), 1 - darkness * 0.7);

  return { top, mid, bottom, ambient };
}

export function drawSky(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World
) {
  const { top, mid, bottom } = getBlendedSky(world);
  const grad = ctx.createLinearGradient(0, 0, 0, height);
  grad.addColorStop(0, rgb(top));
  grad.addColorStop(0.55, rgb(mid));
  grad.addColorStop(1, rgb(bottom));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, width, height);
}
