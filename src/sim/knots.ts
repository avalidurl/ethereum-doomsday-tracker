/** Piecewise-linear CDF knots → year sample, with coherent CDF/inverse. */

export type Knot = { year: number; cdf: number };

export function validateKnots(knots: Knot[]): Knot[] {
  if (knots.length < 2) throw new Error("need ≥2 knots");
  const sorted = [...knots].sort((a, b) => a.year - b.year);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i]!.cdf < sorted[i - 1]!.cdf) throw new Error("cdf must be nondecreasing");
    if (sorted[i]!.year < sorted[i - 1]!.year) throw new Error("years must be nondecreasing");
  }
  return sorted;
}

/**
 * Extend interior source/assumption knots with explicit user-assumption tails to cdf 0 and 1.
 * Tail years are linear extrapolations of the outer interior span — labelled assumptions, not source data.
 */
export function withAssumptionTails(interior: Knot[]): Knot[] {
  const k = validateKnots(interior);
  const first = k[0]!;
  const last = k[k.length - 1]!;
  const span = Math.max(1, last.year - first.year);
  const leftPad = span * (first.cdf - 0) / Math.max(1e-12, last.cdf - first.cdf || first.cdf || 0.1);
  const rightPad = span * (1 - last.cdf) / Math.max(1e-12, last.cdf - first.cdf || 0.1);
  const out: Knot[] = [];
  if (first.cdf > 0) out.push({ year: first.year - leftPad, cdf: 0 });
  for (const x of k) out.push({ ...x });
  if (last.cdf < 1) out.push({ year: last.year + rightPad, cdf: 1 });
  return validateKnots(out);
}

/** Invert CDF on [0,1] with linear interpolation; requires knots spanning cdf 0..1. */
export function sampleYearFromKnots(rnd: () => number, knots: Knot[]): number {
  const k = withAssumptionTails(knots);
  const u = clamp01(rnd());
  for (let i = 1; i < k.length; i++) {
    const a = k[i - 1]!;
    const b = k[i]!;
    if (u <= b.cdf + 1e-15) {
      if (b.cdf <= a.cdf) return b.year;
      const t = (u - a.cdf) / (b.cdf - a.cdf);
      return a.year + t * (b.year - a.year);
    }
  }
  return k[k.length - 1]!.year;
}

/** P(year ≤ Y) under extended knots (coherent with sampleYearFromKnots). */
export function cdfAtYear(knots: Knot[], Y: number): number {
  const k = withAssumptionTails(knots);
  if (Y < k[0]!.year) return 0;
  if (Y >= k[k.length - 1]!.year) return 1;
  for (let i = 1; i < k.length; i++) {
    const a = k[i - 1]!;
    const b = k[i]!;
    if (Y <= b.year) {
      if (b.year <= a.year) return b.cdf;
      const t = (Y - a.year) / (b.year - a.year);
      return a.cdf + t * (b.cdf - a.cdf);
    }
  }
  return 1;
}

/** Quantile function (inverse CDF) at probability p ∈ [0,1]. */
export function yearAtCdf(knots: Knot[], p: number): number {
  const k = withAssumptionTails(knots);
  const u = clamp01(p);
  for (let i = 1; i < k.length; i++) {
    const a = k[i - 1]!;
    const b = k[i]!;
    if (u <= b.cdf + 1e-15) {
      if (b.cdf <= a.cdf) return b.year;
      const t = (u - a.cdf) / (b.cdf - a.cdf);
      return a.year + t * (b.year - a.year);
    }
  }
  return k[k.length - 1]!.year;
}

export function shiftKnots(knots: Knot[], deltaYears: number): Knot[] {
  return knots.map((x) => ({ year: x.year + deltaYears, cdf: x.cdf }));
}

/** Scale knot years about the 0.5 knot (or mid) by widthFactor (>0). */
export function scaleKnotsAboutMedian(knots: Knot[], widthFactor: number): Knot[] {
  const k = validateKnots(knots);
  const mid = k.find((x) => Math.abs(x.cdf - 0.5) < 1e-9)?.year ?? k[Math.floor(k.length / 2)]!.year;
  const f = Math.max(0.05, widthFactor);
  return k.map((x) => ({ year: mid + (x.year - mid) * f, cdf: x.cdf }));
}

function clamp01(x: number) {
  return Math.min(1, Math.max(0, x));
}
