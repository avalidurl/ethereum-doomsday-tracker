import type { ChartId } from "../sim/model";

/** Probability-like series (cumulative / survival) never scale above 100%. */
export function chartYMax(chart: ChartId, values: number[]): number {
  const peak = Math.max(0, ...values);
  if (chart === "annual") {
    // Unconditional annual mass in [0,1]; give modest headroom but stay ≤ 1
    return Math.min(1, Math.max(0.02, peak * 1.15));
  }
  // cumulative & survival are probabilities
  const withHeadroom = Math.max(0.08, peak * 1.05);
  return Math.min(1, withHeadroom);
}

export function chartTickFractions(ymax: number): number[] {
  if (ymax <= 0) return [0];
  if (ymax >= 0.99) return [0, 0.5, 1];
  if (ymax >= 0.4) return [0, 0.5, 1].map((t) => t * ymax);
  return [0, 0.5, 1].map((t) => t * ymax);
}
