import { describe, expect, it } from "vitest";
import { chartTickFractions, chartYMax } from "./chartScale";

describe("chartYMax", () => {
  it("never exceeds 100% for cumulative or survival", () => {
    expect(chartYMax("cumulative", [0.9, 0.95, 1])).toBeLessThanOrEqual(1);
    expect(chartYMax("survival", [1, 0.94, 0.8])).toBeLessThanOrEqual(1);
    // previously 1 * 1.15 = 1.15
    expect(chartYMax("survival", [1])).toBe(1);
  });

  it("bounds annual mass to ≤ 1", () => {
    expect(chartYMax("annual", [0.05, 0.02])).toBeLessThanOrEqual(1);
    expect(chartYMax("annual", [0.9])).toBeLessThanOrEqual(1);
  });

  it("tick tops stay within ymax", () => {
    const ymax = chartYMax("survival", [1]);
    for (const t of chartTickFractions(ymax)) {
      expect(t).toBeLessThanOrEqual(ymax + 1e-12);
    }
  });
});
