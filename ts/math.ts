export const Tau = 2 * Math.PI;
export const Epsilon = 2e-52;

export function sin(x: number): number {
  return Math.sin(x);
}

export function cos(x: number): number {
  return Math.cos(x);
}

export function clamp(x: number, min: number, max: number): number {
  if (x < min) { x = min; }
  if (x > max) { x = max; }
  return x;
}
