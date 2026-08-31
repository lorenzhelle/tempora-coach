// Small pure lookup helpers shared by rules that map a continuous input
// (weekly volume, goal distance) onto a tuned constant from constants.ts.

/**
 * Piecewise-linear interpolation over sorted [x, y] control points. Clamps
 * to the first/last point's y value outside the covered range.
 */
export function interpolatePiecewiseLinear(
  points: ReadonlyArray<readonly [number, number]>,
  x: number,
): number {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last)
    throw new Error("interpolatePiecewiseLinear requires at least one point");
  if (x <= first[0]) return first[1];
  if (x >= last[0]) return last[1];
  for (let i = 0; i < points.length - 1; i++) {
    const lower = points[i];
    const upper = points[i + 1];
    if (!lower || !upper) continue;
    if (x >= lower[0] && x <= upper[0]) {
      const fraction = (x - lower[0]) / (upper[0] - lower[0]);
      return lower[1] + fraction * (upper[1] - lower[1]);
    }
  }
  return last[1];
}

/**
 * Step-function lookup over sorted [threshold, value] breakpoints: returns
 * the value for the highest threshold that is <= x.
 */
export function lookupAtOrAbove(
  breakpoints: ReadonlyArray<readonly [number, number]>,
  x: number,
): number {
  let current = breakpoints[0]?.[1];
  if (current === undefined)
    throw new Error("lookupAtOrAbove requires at least one breakpoint");
  for (const [threshold, value] of breakpoints) {
    if (x >= threshold) current = value;
  }
  return current;
}
