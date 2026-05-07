// The tiny car. Drawn near the bottom-left quadrant.
// All accessories (camper, neon, antenna, solar, armor, cargo, headlights)
// are toggleable from settings.car. Subtle bob from a sin wave to feel alive.

import type { World } from "../types";
import { ROAD_TOP_FRAC } from "./road";
import { TIME_MODS } from "../timeOfDay";

export function drawCar(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World
) {
  const opts = world.settings.car;
  const baseX = Math.max(80, width * 0.22);
  const lineY = (height * ROAD_TOP_FRAC + height) * 0.5 + 40;
  // Settle the car just below the dashed line, on the road.
  const groundY = lineY + 26;
  // Tiny bobbing
  const bob = Math.sin(world.t * 14) * 0.6;
  const x = baseX;
  const y = groundY + bob;

  const tA = TIME_MODS[world.timeA];
  const tB = TIME_MODS[world.timeB];
  const ambient =
    tA.ambientLight + (tB.ambientLight - tA.ambientLight) * world.timeBlend;

  // Headlight cone — drawn first so it's behind the car
  if (opts.headlights) {
    const intensity = 1 - ambient;
    if (intensity > 0.05) {
      const grad = ctx.createRadialGradient(x + 18, y - 6, 0, x + 18, y - 6, 220);
      grad.addColorStop(0, `rgba(255,240,180,${0.4 * intensity})`);
      grad.addColorStop(1, "rgba(255,240,180,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(x + 16, y - 6);
      ctx.lineTo(x + 220, y - 36);
      ctx.lineTo(x + 220, y + 18);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Neon glow under chassis
  if (opts.neon) {
    const grad = ctx.createRadialGradient(x + 6, y + 6, 1, x + 6, y + 6, 36);
    grad.addColorStop(0, "rgba(120,255,220,0.55)");
    grad.addColorStop(1, "rgba(120,255,220,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x + 6, y + 6, 36, 8, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shadow
  ctx.fillStyle = "rgba(0,0,0,0.35)";
  ctx.beginPath();
  ctx.ellipse(x + 6, y + 8, 22, 3, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  const bodyW = 30;
  const bodyH = 8;
  const cabW = 16;
  const cabH = 6;

  // Armor underplate
  if (opts.armor) {
    ctx.fillStyle = "#3c4047";
    ctx.fillRect(x - 4, y - 1, bodyW + 8, 4);
  }

  // Main body
  ctx.fillStyle = opts.armor ? "#5a4f44" : "#cf6b4a";
  ctx.fillRect(x - 2, y - bodyH, bodyW, bodyH);

  // Camper extension
  if (opts.camper) {
    ctx.fillStyle = "#e6dcc1";
    ctx.fillRect(x - 6, y - bodyH - 4, 16, 4);
    // tiny window
    ctx.fillStyle = "rgba(180,210,240,0.8)";
    ctx.fillRect(x - 4, y - bodyH - 3, 4, 2);
  }

  // Cabin
  ctx.fillStyle = opts.armor ? "#3a3a40" : "#9a3f30";
  ctx.fillRect(x + 4, y - bodyH - cabH, cabW, cabH);
  // Window
  ctx.fillStyle = "rgba(180,220,255,0.85)";
  ctx.fillRect(x + 6, y - bodyH - cabH + 1, cabW - 4, cabH - 2);

  // Rooftop cargo
  if (opts.rooftopCargo) {
    ctx.fillStyle = "#3a2a1a";
    ctx.fillRect(x + 5, y - bodyH - cabH - 3, cabW - 2, 3);
    ctx.fillStyle = "#1a1208";
    ctx.fillRect(x + 5, y - bodyH - cabH - 3, cabW - 2, 1);
  }

  // Solar panels
  if (opts.solar) {
    ctx.fillStyle = "#1c2d4a";
    ctx.fillRect(x + 5, y - bodyH - cabH - 1, cabW - 2, 1);
    ctx.fillStyle = "rgba(120,180,255,0.6)";
    ctx.fillRect(x + 6, y - bodyH - cabH - 1, 2, 1);
    ctx.fillRect(x + 10, y - bodyH - cabH - 1, 2, 1);
    ctx.fillRect(x + 14, y - bodyH - cabH - 1, 2, 1);
  }

  // Antenna
  if (opts.antenna) {
    ctx.strokeStyle = "#1a1a1a";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 18, y - bodyH - cabH);
    ctx.lineTo(x + 18, y - bodyH - cabH - 12);
    ctx.stroke();
    // blinking tip
    if (Math.floor(world.t * 2) % 2 === 0) {
      ctx.fillStyle = "rgba(255,80,80,0.95)";
      ctx.fillRect(x + 17, y - bodyH - cabH - 13, 2, 2);
    }
  }

  // Wheels
  ctx.fillStyle = "#0a0a0a";
  // wheel rotation tracked via world.distance
  const r = 3;
  const wx1 = x + 2;
  const wx2 = x + bodyW - 6;
  ctx.beginPath();
  ctx.arc(wx1, y + 2, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(wx2, y + 2, r, 0, Math.PI * 2);
  ctx.fill();
  // hubcap spokes (rotation cue)
  const rot = world.distance * 0.08;
  ctx.strokeStyle = "rgba(255,255,255,0.25)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(wx1 + Math.cos(rot) * 2, y + 2 + Math.sin(rot) * 2);
  ctx.lineTo(wx1 - Math.cos(rot) * 2, y + 2 - Math.sin(rot) * 2);
  ctx.moveTo(wx2 + Math.cos(rot) * 2, y + 2 + Math.sin(rot) * 2);
  ctx.lineTo(wx2 - Math.cos(rot) * 2, y + 2 - Math.sin(rot) * 2);
  ctx.stroke();

  // Headlight bulb
  if (opts.headlights) {
    ctx.fillStyle = "rgba(255,250,200,0.95)";
    ctx.fillRect(x + bodyW - 3, y - 6, 2, 2);
  }
  // Tail light
  ctx.fillStyle = "rgba(220,40,40,0.85)";
  ctx.fillRect(x - 2, y - 5, 1, 2);
}
