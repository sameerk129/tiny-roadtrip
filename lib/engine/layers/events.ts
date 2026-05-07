// Event system. Random ambient events appear with a cooldown. Each event
// has a duration during which its draw routine runs. State is stored in
// world.events as a small array with payload data.

import type { ActiveEvent, EventId, World } from "../types";
import { TIME_MODS } from "../timeOfDay";
import { ROAD_TOP_FRAC } from "./road";

const ALL_EVENTS: EventId[] = [
  "ufo",
  "creature",
  "gas_station",
  "convoy",
  "lightning",
  "static_burst",
  "meteor",
  "ghost",
  "portal",
  "train",
  "giant_moon",
  "split_road",
  "sky_whale",
  "city_explosion",
  "robot",
];

export function tickEvents(
  world: World,
  width: number,
  height: number,
  rand: () => number
) {
  world.eventCooldown -= world.dt;
  if (world.eventCooldown <= 0 && world.events.length < 3) {
    const id = ALL_EVENTS[Math.floor(rand() * ALL_EVENTS.length)];
    spawnEvent(world, id, width, height, rand);
    world.eventCooldown = 14 + rand() * 30;
  }
  for (let i = world.events.length - 1; i >= 0; i--) {
    const e = world.events[i];
    e.t += world.dt;
    if (e.t >= e.duration) world.events.splice(i, 1);
  }
}

function spawnEvent(
  world: World,
  id: EventId,
  width: number,
  height: number,
  rand: () => number
) {
  const data: Record<string, number> = {};
  let duration = 12;
  switch (id) {
    case "ufo":
      data.x = width + 80;
      data.y = 60 + rand() * 100;
      data.vx = -120 - rand() * 80;
      data.amp = 8 + rand() * 12;
      duration = (width + 200) / Math.abs(data.vx);
      break;
    case "creature":
      data.start = world.distance + 600;
      data.h = 80 + rand() * 120;
      duration = 18;
      break;
    case "gas_station":
      data.start = world.distance + 400;
      duration = 12;
      break;
    case "convoy":
      data.start = world.distance + 300;
      data.count = 2 + Math.floor(rand() * 3);
      duration = 16;
      break;
    case "lightning":
      data.delay = 1 + rand() * 2;
      duration = 4;
      break;
    case "static_burst":
      duration = 2.5;
      break;
    case "meteor":
      data.x = width + 100;
      data.y = 40 + rand() * 60;
      data.vx = -300 - rand() * 200;
      data.vy = 80 + rand() * 60;
      duration = 4;
      break;
    case "ghost":
      data.start = world.distance + 380;
      duration = 12;
      break;
    case "portal":
      data.x = width * 0.65 + rand() * width * 0.2;
      data.y = height * 0.45 + rand() * 30;
      duration = 8;
      break;
    case "train":
      data.x = width + 200;
      data.vx = -260;
      data.cars = 4 + Math.floor(rand() * 4);
      duration = (width + 600) / Math.abs(data.vx);
      break;
    case "giant_moon":
      data.x = width * 0.7;
      data.y = height * 0.32;
      data.r = 80 + rand() * 40;
      duration = 30;
      break;
    case "split_road":
      duration = 10;
      break;
    case "sky_whale":
      data.x = width + 150;
      data.y = height * 0.25 + rand() * 60;
      data.vx = -50 - rand() * 30;
      duration = (width + 400) / Math.abs(data.vx);
      break;
    case "city_explosion":
      data.x = width * 0.7 + rand() * width * 0.2;
      data.y = height * 0.55;
      duration = 5;
      break;
    case "robot":
      data.start = world.distance + 600;
      data.h = 110 + rand() * 60;
      duration = 18;
      break;
  }
  world.events.push({ id, t: 0, duration, data });
}

export function drawEvents(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World,
  layer: "back" | "front"
) {
  for (let i = 0; i < world.events.length; i++) {
    const e = world.events[i];
    const isBack = ["ufo", "giant_moon", "sky_whale", "city_explosion"].includes(
      e.id
    );
    if ((layer === "back") !== isBack) continue;
    drawEvent(ctx, width, height, world, e);
  }
}

function drawEvent(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World,
  e: ActiveEvent
) {
  switch (e.id) {
    case "ufo":
      drawUFO(ctx, width, height, world, e);
      break;
    case "creature":
      drawCreature(ctx, width, height, world, e);
      break;
    case "gas_station":
      drawGasStation(ctx, width, height, world, e);
      break;
    case "convoy":
      drawConvoy(ctx, width, height, world, e);
      break;
    case "lightning":
      drawLightning(ctx, width, height, world, e);
      break;
    case "static_burst":
      drawStaticBurst(ctx, width, height, world, e);
      break;
    case "meteor":
      drawBigMeteor(ctx, width, height, world, e);
      break;
    case "ghost":
      drawGhost(ctx, width, height, world, e);
      break;
    case "portal":
      drawPortal(ctx, width, height, world, e);
      break;
    case "train":
      drawTrain(ctx, width, height, world, e);
      break;
    case "giant_moon":
      drawGiantMoon(ctx, width, height, world, e);
      break;
    case "split_road":
      drawSplitRoad(ctx, width, height, world, e);
      break;
    case "sky_whale":
      drawSkyWhale(ctx, width, height, world, e);
      break;
    case "city_explosion":
      drawCityExplosion(ctx, width, height, world, e);
      break;
    case "robot":
      drawRobot(ctx, width, height, world, e);
      break;
  }
}

function drawUFO(
  ctx: CanvasRenderingContext2D,
  _w: number,
  _h: number,
  world: World,
  e: ActiveEvent
) {
  e.data.x += e.data.vx * world.dt;
  const x = e.data.x;
  const y = e.data.y + Math.sin(world.t * 1.6) * (e.data.amp || 6);
  ctx.save();
  ctx.fillStyle = "rgba(20,30,40,0.85)";
  ctx.beginPath();
  ctx.ellipse(x, y, 16, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(x, y - 3, 8, 4, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // beam
  const beamA = 0.18 + Math.sin(world.t * 6) * 0.05;
  ctx.fillStyle = `rgba(180,255,200,${beamA})`;
  ctx.beginPath();
  ctx.moveTo(x - 2, y + 3);
  ctx.lineTo(x + 2, y + 3);
  ctx.lineTo(x + 12, y + 50);
  ctx.lineTo(x - 12, y + 50);
  ctx.closePath();
  ctx.fill();
  // blinking lights
  if (Math.floor(world.t * 8) % 2) {
    ctx.fillStyle = "rgba(255,80,80,1)";
    ctx.fillRect(x - 12, y, 2, 1);
    ctx.fillStyle = "rgba(120,255,120,1)";
    ctx.fillRect(x + 10, y, 2, 1);
  }
  ctx.restore();
}

function distanceProgress(world: World, start: number, span = 1200) {
  // returns [-inf..inf]: 0 at object on screen
  const d = world.distance - start;
  return d / span;
}

function midgroundParallaxX(world: World, start: number, width: number) {
  // World scrolls so far objects approach from the right.
  // Simple formula: x = width - (distance - start) * speed
  const speed = 0.4;
  return width - (world.distance - start) * speed;
}

function drawCreature(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World,
  e: ActiveEvent
) {
  const x = midgroundParallaxX(world, e.data.start, width);
  if (x < -200 || x > width + 200) return;
  const h = e.data.h;
  const y = height * 0.78;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  // huge silhouette: torso + neck + head
  ctx.beginPath();
  ctx.ellipse(x, y - 8, 60, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillRect(x + 30, y - h, 8, h);
  ctx.beginPath();
  ctx.arc(x + 34, y - h, 8, 0, Math.PI * 2);
  ctx.fill();
  // glow eye
  ctx.fillStyle = "rgba(255,80,80,0.9)";
  ctx.fillRect(x + 36, y - h, 2, 1);
  ctx.restore();
}

function drawGasStation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World,
  e: ActiveEvent
) {
  const x = midgroundParallaxX(world, e.data.start, width);
  if (x < -120 || x > width + 60) return;
  const y = height * 0.74;
  ctx.save();
  // Canopy
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(x - 4, y - 26, 56, 6);
  ctx.fillRect(x + 2, y - 22, 4, 24);
  ctx.fillRect(x + 42, y - 22, 4, 24);
  // Pumps
  ctx.fillStyle = "#aa3a30";
  ctx.fillRect(x + 12, y - 14, 4, 14);
  ctx.fillRect(x + 30, y - 14, 4, 14);
  // Sign
  ctx.fillStyle = "rgba(255,210,140,0.85)";
  ctx.fillRect(x + 18, y - 38, 14, 9);
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(x + 21, y - 35, 2, 3);
  ctx.fillRect(x + 25, y - 35, 2, 3);
  // light flicker
  if (Math.random() > 0.85) {
    ctx.fillStyle = "rgba(255,220,160,0.5)";
    ctx.fillRect(x - 4, y - 26, 56, 1);
  }
  ctx.restore();
}

function drawConvoy(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World,
  e: ActiveEvent
) {
  const startX = midgroundParallaxX(world, e.data.start, width);
  const y = height * 0.83;
  const count = e.data.count | 0;
  for (let i = 0; i < count; i++) {
    const x = startX - i * 28;
    if (x < -40 || x > width + 40) continue;
    ctx.fillStyle = "#3c3a2a";
    ctx.fillRect(x, y - 6, 22, 6);
    ctx.fillStyle = "#1a1810";
    ctx.fillRect(x + 14, y - 10, 8, 4);
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(x + 4, y, 2, 0, Math.PI * 2);
    ctx.arc(x + 18, y, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255,240,180,0.6)";
    ctx.fillRect(x + 21, y - 5, 1, 1);
  }
}

function drawLightning(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World,
  e: ActiveEvent
) {
  if (e.t < e.data.delay) return;
  const since = e.t - e.data.delay;
  if (since > 0.4) return;
  // flash
  const a = Math.max(0, 1 - since / 0.4);
  world.flash = Math.max(world.flash, a * 0.55);
  // bolt
  if (since < 0.15) {
    ctx.save();
    ctx.strokeStyle = `rgba(220,230,255,${a})`;
    ctx.lineWidth = 2;
    let x = width * (0.5 + Math.sin(e.t * 33) * 0.3);
    let y = 0;
    ctx.beginPath();
    ctx.moveTo(x, y);
    while (y < height * 0.55) {
      x += (Math.random() - 0.5) * 24;
      y += 8 + Math.random() * 8;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }
}

function drawStaticBurst(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  _world: World,
  e: ActiveEvent
) {
  const a = 1 - e.t / e.duration;
  ctx.save();
  ctx.globalAlpha = a * 0.18;
  for (let i = 0; i < 200; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#fff" : "#000";
    ctx.fillRect(
      (Math.random() * width) | 0,
      (Math.random() * height) | 0,
      2,
      2
    );
  }
  ctx.restore();
}

function drawBigMeteor(
  ctx: CanvasRenderingContext2D,
  _w: number,
  _h: number,
  world: World,
  e: ActiveEvent
) {
  e.data.x += e.data.vx * world.dt;
  e.data.y += e.data.vy * world.dt;
  ctx.save();
  ctx.strokeStyle = "rgba(255,220,160,0.95)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(e.data.x, e.data.y);
  ctx.lineTo(e.data.x - e.data.vx * 0.12, e.data.y - e.data.vy * 0.12);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,240,200,1)";
  ctx.beginPath();
  ctx.arc(e.data.x, e.data.y, 1.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawGhost(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World,
  e: ActiveEvent
) {
  const x = midgroundParallaxX(world, e.data.start, width);
  if (x < -40 || x > width + 40) return;
  const y = height * 0.78;
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.fillStyle = "rgba(220,235,255,0.7)";
  ctx.fillRect(x, y - 18, 6, 18);
  // raised arm
  ctx.fillRect(x + 7, y - 16, 4, 1);
  // head
  ctx.beginPath();
  ctx.arc(x + 3, y - 22, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawPortal(
  ctx: CanvasRenderingContext2D,
  _w: number,
  _h: number,
  world: World,
  e: ActiveEvent
) {
  const lifeT = e.t / e.duration;
  const opening = lifeT < 0.3 ? lifeT / 0.3 : lifeT > 0.7 ? 1 - (lifeT - 0.7) / 0.3 : 1;
  const x = e.data.x;
  const y = e.data.y;
  const r = 26 * opening;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 0; i < 3; i++) {
    const a = 0.3 - i * 0.08;
    const hue = (world.t * 60 + i * 60) % 360;
    ctx.strokeStyle = `hsla(${hue},90%,65%,${a})`;
    ctx.lineWidth = 4 - i;
    ctx.beginPath();
    ctx.ellipse(x, y, r + i * 2, r * 1.4 + i * 2, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTrain(
  ctx: CanvasRenderingContext2D,
  _w: number,
  height: number,
  world: World,
  e: ActiveEvent
) {
  e.data.x += e.data.vx * world.dt;
  const baseY = height * 0.69;
  const cars = e.data.cars | 0;
  ctx.save();
  // tracks
  ctx.fillStyle = "rgba(0,0,0,0.5)";
  ctx.fillRect(-100, baseY + 6, 5000, 1);
  for (let i = 0; i < cars; i++) {
    const x = e.data.x + i * 36;
    ctx.fillStyle = i === 0 ? "#3a3a4a" : "#2a2a35";
    ctx.fillRect(x, baseY - 8, 30, 14);
    ctx.fillStyle = "rgba(255,240,180,0.7)";
    ctx.fillRect(x + 4, baseY - 5, 4, 3);
    ctx.fillRect(x + 12, baseY - 5, 4, 3);
    ctx.fillRect(x + 20, baseY - 5, 4, 3);
    ctx.fillStyle = "#0a0a0a";
    ctx.beginPath();
    ctx.arc(x + 6, baseY + 6, 2, 0, Math.PI * 2);
    ctx.arc(x + 24, baseY + 6, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawGiantMoon(
  ctx: CanvasRenderingContext2D,
  _w: number,
  _h: number,
  _world: World,
  e: ActiveEvent
) {
  const x = e.data.x;
  const y = e.data.y;
  const r = e.data.r;
  ctx.save();
  // glow
  const grad = ctx.createRadialGradient(x, y, r * 0.1, x, y, r * 2);
  grad.addColorStop(0, "rgba(255,235,220,0.9)");
  grad.addColorStop(0.45, "rgba(255,220,200,0.25)");
  grad.addColorStop(1, "rgba(255,220,200,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r * 2, 0, Math.PI * 2);
  ctx.fill();
  // disc
  ctx.fillStyle = "#fff5e2";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // craters
  ctx.fillStyle = "rgba(180,160,140,0.5)";
  ctx.beginPath();
  ctx.arc(x - r * 0.3, y - r * 0.1, r * 0.12, 0, Math.PI * 2);
  ctx.arc(x + r * 0.2, y + r * 0.25, r * 0.08, 0, Math.PI * 2);
  ctx.arc(x + r * 0.05, y - r * 0.3, r * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSplitRoad(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World,
  e: ActiveEvent
) {
  // Mirage: thin glowing branches diverging from horizon.
  const a = Math.sin((e.t / e.duration) * Math.PI);
  const horizon = height * ROAD_TOP_FRAC;
  ctx.save();
  ctx.globalAlpha = a * 0.5;
  ctx.strokeStyle = "rgba(255,255,255,0.6)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(width * 0.5, horizon);
    ctx.lineTo(width * 0.5 + (i - 2) * 60, horizon - 60 - i * 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawSkyWhale(
  ctx: CanvasRenderingContext2D,
  _w: number,
  _h: number,
  world: World,
  e: ActiveEvent
) {
  e.data.x += e.data.vx * world.dt;
  const x = e.data.x;
  const y = e.data.y + Math.sin(world.t * 0.6) * 6;
  ctx.save();
  ctx.fillStyle = "rgba(60,80,120,0.55)";
  // body
  ctx.beginPath();
  ctx.ellipse(x, y, 56, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  // tail
  ctx.beginPath();
  ctx.moveTo(x + 50, y);
  ctx.lineTo(x + 70, y - 12);
  ctx.lineTo(x + 70, y + 12);
  ctx.closePath();
  ctx.fill();
  // fin
  ctx.beginPath();
  ctx.moveTo(x - 6, y + 6);
  ctx.lineTo(x - 16, y + 18);
  ctx.lineTo(x - 26, y + 6);
  ctx.closePath();
  ctx.fill();
  // eye
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  ctx.fillRect(x - 30, y - 2, 1, 1);
  ctx.restore();
}

function drawCityExplosion(
  ctx: CanvasRenderingContext2D,
  width: number,
  _h: number,
  world: World,
  e: ActiveEvent
) {
  const t = e.t / e.duration;
  if (t < 0.4) {
    world.flash = Math.max(world.flash, (1 - t / 0.4) * 0.4);
  }
  const x = e.data.x;
  const y = e.data.y;
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  const r = t * 80;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
  grad.addColorStop(0, "rgba(255,200,80,0.9)");
  grad.addColorStop(1, "rgba(255,80,40,0)");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  // smoke column
  ctx.globalCompositeOperation = "source-over";
  ctx.fillStyle = `rgba(20,18,18,${0.4 * (1 - t)})`;
  ctx.fillRect(x - 4, y - 60 * t, 8, 60 * t);
  ctx.restore();
}

function drawRobot(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  world: World,
  e: ActiveEvent
) {
  const x = midgroundParallaxX(world, e.data.start, width);
  if (x < -120 || x > width + 100) return;
  const y = height * 0.78;
  const h = e.data.h;
  ctx.save();
  ctx.fillStyle = "rgba(20,22,26,0.9)";
  // legs
  ctx.fillRect(x, y - h * 0.4, 6, h * 0.4);
  ctx.fillRect(x + 18, y - h * 0.4, 6, h * 0.4);
  // torso
  ctx.fillRect(x - 4, y - h, 32, h * 0.7);
  // head
  ctx.fillRect(x + 4, y - h - 12, 18, 12);
  // eye glow
  ctx.fillStyle = "rgba(255,80,80,0.9)";
  ctx.fillRect(x + 8, y - h - 7, 4, 2);
  ctx.fillRect(x + 16, y - h - 7, 4, 2);
  // shoulder cannon
  ctx.fillStyle = "rgba(20,22,26,0.9)";
  ctx.fillRect(x - 12, y - h * 0.7, 12, 4);
  ctx.restore();
}
