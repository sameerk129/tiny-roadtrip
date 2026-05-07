// Cheap deterministic 1D value noise. Used for mountain silhouettes,
// terrain undulation, and scenery placement.
// Avoids any allocation in the hot path.

import { lerp } from "./rng";

function hash1(x: number): number {
  // Convert to integer space
  let n = Math.floor(x);
  // Tiny xorshift-ish hash
  n = (n << 13) ^ n;
  n = (n * (n * n * 15731 + 789221) + 1376312589) | 0;
  // Normalize to 0..1
  return ((n & 0x7fffffff) / 0x7fffffff);
}

export function valueNoise1D(x: number): number {
  const xi = Math.floor(x);
  const xf = x - xi;
  const a = hash1(xi);
  const b = hash1(xi + 1);
  // smoothstep-like cosine-ish curve
  const u = xf * xf * (3 - 2 * xf);
  return lerp(a, b, u);
}

export function fbm1D(x: number, octaves = 4, lacunarity = 2, gain = 0.5) {
  let amp = 0.5;
  let freq = 1;
  let sum = 0;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * valueNoise1D(x * freq);
    norm += amp;
    amp *= gain;
    freq *= lacunarity;
  }
  return sum / norm;
}
