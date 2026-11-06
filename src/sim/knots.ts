/** Piecewise-linear CDF knots → year sample. */

export type Knot = { year: number; cdf: number };

export function validateKnots(knots: Knot[]): Knot[] {
  if (knots.length < 2) throw new Error("need ≥2 knots");
  const sorted = [...knots].sort((a, b) => a.year - b.year);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]!.cdf < sorted[i - 1]!.cdf) throw new Error("cdf must be nondecreasing");
  }
  return sorted;
}

/** Invert empirical CDF with linear interpolation; clamps outside [first,last]. */
export function sampleYearFromKnots(rnd: () => number, knots: Knot[]): number {
  const k = validateKnots(knots);
  const u = rnd();
  if (u <= k[0]!.cdf) return k[0]!.year;
  if (u >= k[k.length - 1]!.cdf) return k[k.length - 1]!.year;
  for (let i = 1; i < k.length; i++) {
    const a = k[i - 1]!;
    const b = k[i]!;
    if (u <= b.cdf) {
      const t = (u - a.cdf) / Math.max(1e-12, b.cdf - a.cdf);
      return a.year + t * (b.year - a.year);
    }
  }
  return k[k.length - 1]!.year;
}

/** P(year ≤ Y) under linear CDF knots. */
export function cdfAtYear(knots: Knot[], Y: number): number {
  const k = validateKnots(knots);
  if (Y <= k[0]!.year) {
    if (Y < k[0]!.year) return 0;
    return k[0]!.cdf;
  }
  if (Y >= k[k.length - 1]!.year) return k[k.length - 1]!.cdf;
  for (let i = 1; i < k.length; i++) {
    const a = k[i - 1]!;
    const b = k[i]!;
    if (Y <= b.year) {
      const t = (Y - a.year) / Math.max(1e-12, b.year - a.year);
      return a.cdf + t * (b.cdf - a.cdf);
    }
  }
  return k[k.length - 1]!.cdf;
}

/** Shift all knot years by delta (scenario). */
export function shiftKnots(knots: Knot[], deltaYears: number): Knot[] {
  return knots.map((x) => ({ year: x.year + deltaYears, cdf: x.cdf }));
}
