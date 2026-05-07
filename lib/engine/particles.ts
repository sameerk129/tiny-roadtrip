// Particle pool. We reuse a fixed array of Particle slots — never allocate
// during the hot loop. Spawning finds an inactive slot (alive=false) and
// recycles it. This keeps GC pressure near zero even after hours of use.

import type { Particle, World } from "./types";
import { WEATHER } from "./weather";

function findFreeSlot(particles: Particle[]): Particle | null {
  for (let i = 0; i < particles.length; i++) {
    if (!particles[i].alive) return particles[i];
  }
  return null;
}

export function spawnParticles(
  world: World,
  width: number,
  height: number,
  rand: () => number
) {
  const w = WEATHER[world.resolvedWeather];
  if (w.particleKind === "none") return;
  // Particles per frame
  const n = (w.rate * world.dt) | 0;
  for (let i = 0; i < n; i++) {
    const p = findFreeSlot(world.particles);
    if (!p) break;
    p.alive = true;
    p.kind = w.particleKind === "fog" ? "fog" : w.particleKind;
    switch (p.kind) {
      case "rain": {
        p.x = rand() * width * 1.4 - width * 0.2;
        p.y = -10 + rand() * -40;
        p.vx = w.windX + (rand() - 0.5) * 30;
        p.vy = 800 + rand() * 220;
        p.maxLife = 1.6;
        p.size = 1;
        p.color = "rgba(180,205,255,0.55)";
        break;
      }
      case "neon": {
        p.x = rand() * width * 1.4 - width * 0.2;
        p.y = -10 + rand() * -40;
        p.vx = w.windX + (rand() - 0.5) * 40;
        p.vy = 720 + rand() * 200;
        p.maxLife = 1.6;
        p.size = 1.2;
        // Random neon hue
        const hue = (rand() * 360) | 0;
        p.color = `hsla(${hue},100%,70%,0.7)`;
        break;
      }
      case "snow": {
        p.x = rand() * width * 1.4 - width * 0.2;
        p.y = -10 + rand() * -40;
        p.vx = w.windX + (rand() - 0.5) * 60;
        p.vy = 60 + rand() * 100;
        p.maxLife = 8;
        p.size = 1 + rand() * 1.6;
        p.color = "rgba(245,250,255,0.85)";
        break;
      }
      case "ash": {
        p.x = rand() * width * 1.4 - width * 0.2;
        p.y = -10 + rand() * -40;
        p.vx = w.windX + (rand() - 0.5) * 50;
        p.vy = 30 + rand() * 60;
        p.maxLife = 12;
        p.size = 1 + rand() * 1.4;
        const v = (180 + rand() * 50) | 0;
        p.color = `rgba(${v - 60},${v - 70},${v - 80},0.75)`;
        break;
      }
      case "sand": {
        p.x = rand() * width * 1.4 - width * 0.2;
        p.y = rand() * height;
        p.vx = w.windX + (rand() - 0.5) * 80;
        p.vy = (rand() - 0.5) * 60;
        p.maxLife = 1.2;
        p.size = 1 + rand() * 1.2;
        p.color = `rgba(${230 - (rand() * 40) | 0},${
          200 - (rand() * 40) | 0
        },${150 - (rand() * 40) | 0},0.55)`;
        break;
      }
      case "meteor": {
        p.x = rand() * width;
        p.y = rand() * height * 0.4;
        p.vx = -260 - rand() * 200;
        p.vy = 160 + rand() * 80;
        p.maxLife = 2.5;
        p.size = 1.4 + rand() * 1.6;
        p.color = "rgba(255,225,180,0.95)";
        break;
      }
      case "fog": {
        p.x = rand() * width;
        p.y = height * 0.55 + rand() * height * 0.4;
        p.vx = w.windX * 0.4 + (rand() - 0.5) * 12;
        p.vy = (rand() - 0.5) * 6;
        p.maxLife = 14;
        p.size = 60 + rand() * 100;
        p.color = "rgba(220,225,235,0.05)";
        break;
      }
    }
    p.life = p.maxLife;
  }
}

export function updateParticles(world: World, height: number, width: number) {
  const dt = world.dt;
  const ps = world.particles;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    if (!p.alive) continue;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0 || p.y > height + 40 || p.x < -200 || p.x > width + 200) {
      p.alive = false;
    }
  }
}

export function drawParticles(
  ctx: CanvasRenderingContext2D,
  world: World
) {
  const ps = world.particles;
  for (let i = 0; i < ps.length; i++) {
    const p = ps[i];
    if (!p.alive) continue;
    const alpha = Math.min(1, p.life / p.maxLife);
    if (p.kind === "rain" || p.kind === "neon") {
      ctx.strokeStyle = p.color;
      ctx.globalAlpha = alpha;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      const len = 12;
      const dx = p.vx * 0.012;
      const dy = p.vy * 0.012;
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x - dx * 0.6, p.y - dy * 0.6 - len * 0.1);
      ctx.stroke();
    } else if (p.kind === "fog") {
      ctx.globalAlpha = alpha * 0.7;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === "meteor") {
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = p.color;
      ctx.lineWidth = p.size;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(p.x + p.vx * 0.05, p.y + p.vy * 0.05);
      ctx.stroke();
    } else {
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(p.x | 0, p.y | 0, p.size, p.size);
    }
  }
  ctx.globalAlpha = 1;
}
