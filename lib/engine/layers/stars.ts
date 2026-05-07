// Stars + occasional shooting stars. Visible at night/midnight/eclipse.
// Stars are stored once in a pool; we draw them every frame with a tiny
// per-star sin twinkle. Cheap.

import { TIME_MODS } from "../timeOfDay";
import type { World } from "../types";

export function drawStars(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World
) {
  const tA = TIME_MODS[world.timeA];
  const tB = TIME_MODS[world.timeB];
  const alpha =
    tA.starsAlpha + (tB.starsAlpha - tA.starsAlpha) * world.timeBlend;
  if (alpha <= 0.01) return;

  ctx.save();
  for (let i = 0; i < world.stars.length; i++) {
    const s = world.stars[i];
    const tw = 0.6 + 0.4 * Math.sin(world.t * 2 + s.twinkle);
    ctx.globalAlpha = alpha * s.brightness * tw;
    ctx.fillStyle = "#fff";
    const x = s.x * width;
    const y = s.y * height;
    ctx.fillRect(x | 0, y | 0, 1, 1);
    if (s.brightness > 0.85) {
      ctx.fillRect((x | 0) + 1, y | 0, 1, 1);
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawShootingStars(
  ctx: CanvasRenderingContext2D,
  world: World
) {
  for (let i = 0; i < world.shootingStars.length; i++) {
    const s = world.shootingStars[i];
    if (s.life <= 0) continue;
    const a = Math.min(1, s.life / s.maxLife);
    ctx.strokeStyle = `rgba(255,255,255,${a})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(s.x, s.y);
    ctx.lineTo(s.x - s.vx * 0.05, s.y - s.vy * 0.05);
    ctx.stroke();
  }
}

export function tickShootingStars(
  world: World,
  width: number,
  rand: () => number
) {
  const tA = TIME_MODS[world.timeA];
  const tB = TIME_MODS[world.timeB];
  const chance =
    tA.shootingChance +
    (tB.shootingChance - tA.shootingChance) * world.timeBlend;
  if (rand() < chance * world.dt) {
    for (let i = 0; i < world.shootingStars.length; i++) {
      const s = world.shootingStars[i];
      if (s.life <= 0) {
        s.x = rand() * width;
        s.y = rand() * 80 + 20;
        s.vx = -300 - rand() * 200;
        s.vy = 100 + rand() * 60;
        s.life = 0.7 + rand() * 0.4;
        s.maxLife = s.life;
        break;
      }
    }
  }
  for (let i = 0; i < world.shootingStars.length; i++) {
    const s = world.shootingStars[i];
    if (s.life <= 0) continue;
    s.x += s.vx * world.dt;
    s.y += s.vy * world.dt;
    s.life -= world.dt;
  }
}
