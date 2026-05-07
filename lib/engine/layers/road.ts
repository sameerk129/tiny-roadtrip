// The road. A receding band that scrolls horizontally with the world.
// Dashed center lines move at the road's parallax. With apocalypse > 0 the
// road undulates / splits subtly.

import { BIOMES } from "../biomes";
import { TIME_MODS } from "../timeOfDay";
import { mix, rgb, shade, tint, type RGB } from "../colors";
import type { World } from "../types";
import { WEATHER } from "../weather";

export const ROAD_TOP_FRAC = 0.78;
export const ROAD_BOTTOM_FRAC = 1.0;

export function drawRoad(
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
  const bb = world.biomeBlend;
  const darkness = tA.darkness + (tB.darkness - tA.darkness) * tb;
  const tintAmt = tA.tintAmount + (tB.tintAmount - tA.tintAmount) * tb;
  const tintCol = mix(tA.tint, tB.tint, tb);

  let ground = mix(a.ground, b.ground, bb);
  ground = shade(tint(ground, tintCol, tintAmt * 0.8), 1 - darkness * 0.7);

  let road = mix(a.road, b.road, bb);
  road = shade(tint(road, tintCol, tintAmt * 0.5), 1 - darkness * 0.7);

  let line = mix(a.roadLine, b.roadLine, bb);
  line = shade(tint(line, tintCol, tintAmt * 0.3), 1 - darkness * 0.4);

  const apoc = world.settings.reality / 100;

  const roadTopBase = height * ROAD_TOP_FRAC;
  // Apocalypse causes the horizon to wobble.
  const wobble = Math.sin(world.t * 1.4) * 6 * apoc;
  const roadTop = roadTopBase + wobble;

  // Ground band above the road
  ctx.fillStyle = rgb(ground);
  ctx.fillRect(0, height * 0.7, width, height * 0.3);

  // Road body — slight perspective trapezoid
  ctx.fillStyle = rgb(road);
  ctx.beginPath();
  ctx.moveTo(0, roadTop);
  ctx.lineTo(width, roadTop);
  ctx.lineTo(width + 60, height);
  ctx.lineTo(-60, height);
  ctx.closePath();
  ctx.fill();

  // Road edge highlights
  ctx.strokeStyle = `rgba(255,255,255,${0.06 + apoc * 0.04})`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, roadTop + 1);
  ctx.lineTo(width, roadTop + 1);
  ctx.stroke();

  // Center dashed line. Move it a tad for parallax.
  const lineY = (roadTop + height) * 0.5 + 40;
  drawDashedLine(ctx, width, lineY, world, line);

  // Wet reflections
  const w = WEATHER[world.resolvedWeather];
  if (w.reflectionStrength > 0.05) {
    drawWetReflections(ctx, width, height, roadTop, world, w.reflectionStrength);
  }
}

function drawDashedLine(
  ctx: CanvasRenderingContext2D,
  width: number,
  y: number,
  world: World,
  color: RGB
) {
  const speed = 600 * (0.35 + world.settings.speed * 0.85);
  const offset = (world.distance * (speed / 60)) % 80;
  ctx.fillStyle = rgb(color);
  for (let x = -offset; x < width + 80; x += 80) {
    ctx.fillRect(x, y - 2, 36, 3);
  }
}

function drawWetReflections(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  roadTop: number,
  world: World,
  strength: number
) {
  ctx.save();
  ctx.globalAlpha = 0.18 * strength;
  // Long horizontal reflective streaks.
  const grad = ctx.createLinearGradient(0, roadTop, 0, height);
  grad.addColorStop(0, "rgba(255,255,255,0.0)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.6)");
  grad.addColorStop(1, "rgba(255,255,255,0.0)");
  ctx.fillStyle = grad;
  for (let i = 0; i < 6; i++) {
    const y = roadTop + 14 + i * 14;
    const len = width * (0.4 + (i / 6) * 0.6);
    const x =
      ((world.distance * (0.5 + i * 0.2)) % (width + len)) -
      len +
      (i * 79) % 120;
    ctx.fillRect(x, y, len, 1);
  }
  ctx.restore();
}
