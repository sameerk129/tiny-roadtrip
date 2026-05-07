// Master render. Called once per frame. The canvas owns no state — all
// dynamic data lives on the World object. We pass a fixed PRNG closure so
// glitch effects stay deterministic per world.seed.

import type { World } from "./types";
import { drawSky } from "./layers/sky";
import { drawStars, drawShootingStars, tickShootingStars } from "./layers/stars";
import { drawMountains } from "./layers/mountains";
import { drawMidground } from "./layers/midground";
import { drawRoad } from "./layers/road";
import { drawCar } from "./layers/car";
import { drawEvents, tickEvents } from "./layers/events";
import {
  drawFog,
  drawGlitch,
  drawFlash,
  drawVignette,
} from "./layers/postfx";
import {
  spawnParticles,
  updateParticles,
  drawParticles,
} from "./particles";
import { tickTransitions } from "./world";
import { WEATHER } from "./weather";

export interface RenderContext {
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;
  world: World;
  rand: () => number;
}

export function step(rc: RenderContext) {
  const { ctx, width, height, world, rand } = rc;
  // Speed in virtual meters per second. Apocalypse adds wobble.
  const speed = 50 + world.settings.speed * 220;
  world.distance += speed * world.dt;

  tickTransitions(world, rand);
  tickEvents(world, width, height, rand);
  tickShootingStars(world, width, rand);

  // Camera shake from apocalypse
  const apoc = world.settings.reality / 100;
  world.shake = apoc * 4;
  const sx = (rand() - 0.5) * world.shake;
  const sy = (rand() - 0.5) * world.shake;

  ctx.save();
  ctx.translate(sx, sy);

  drawSky(ctx, width, height, world);
  drawStars(ctx, width, height, world);
  // background events (UFO, giant moon, sky whale, city explosion)
  drawEvents(ctx, width, height, world, "back");
  drawShootingStars(ctx, world);
  drawMountains(ctx, width, height, world);
  drawMidground(ctx, width, height, world);
  drawFog(ctx, width, height, world);
  // foreground events (gas station, convoy, train, ghost, robot, creature, portal)
  drawEvents(ctx, width, height, world, "front");
  drawRoad(ctx, width, height, world);
  drawCar(ctx, width, height, world);

  // Particles draw on top of road & car (rain in front of everything)
  spawnParticles(world, width, height, rand);
  updateParticles(world, height, width);
  drawParticles(ctx, world);

  drawFlash(ctx, width, height, world);
  drawGlitch(ctx, width, height, world, rand);
  drawVignette(ctx, width, height, world);

  ctx.restore();
}
