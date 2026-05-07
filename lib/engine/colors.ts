// Color helpers: parse hex, mix RGB tuples, build CSS strings.
// We avoid per-frame string churn by building palette objects once and
// blending tuples at runtime.

export type RGB = [number, number, number];

export function hexToRgb(hex: string): RGB {
  const h = hex.startsWith("#") ? hex.slice(1) : hex;
  const v = parseInt(
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h,
    16
  );
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

export function rgba(c: RGB, a = 1) {
  return `rgba(${c[0] | 0},${c[1] | 0},${c[2] | 0},${a})`;
}

export function rgb(c: RGB) {
  return `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
}

// Tints a base palette toward a tint by amount [0,1].
export function tint(c: RGB, t: RGB, amount: number): RGB {
  return mix(c, t, amount);
}

// Slightly darken / lighten an RGB.
export function shade(c: RGB, factor: number): RGB {
  return [
    Math.min(255, Math.max(0, c[0] * factor)),
    Math.min(255, Math.max(0, c[1] * factor)),
    Math.min(255, Math.max(0, c[2] * factor)),
  ];
}
