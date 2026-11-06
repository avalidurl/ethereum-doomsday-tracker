import { describe, expect, it } from "vitest";
import {
  DEFAULT_OPTS,
  YEAR_MAX,
  YEAR_MIN,
  clamp,
  quantile,
  runCore,
  runSim,
} from "./model";

describe("runSim invariants", () => {
  it("keeps Yes+No complement and bounds at 2035", () => {
    const s = runSim({ ...DEFAULT_OPTS, selectedYear: 2035 });
    expect(s.median).toBeGreaterThanOrEqual(0);
    expect(s.median).toBeLessThanOrEqual(1);
    expect(s.low).toBeLessThanOrEqual(s.median);
    expect(s.median).toBeLessThanOrEqual(s.high);
    expect(Math.abs(s.median + (1 - s.median) - 1)).toBeLessThan(1e-12);
  });

  it("has nondecreasing cumulative median path", () => {
    const s = runSim({ ...DEFAULT_OPTS, selectedYear: 2055 });
    for (let i = 0; i < s.cumMed.length - 1; i++) {
      expect(s.cumMed[i]!).toBeLessThanOrEqual(s.cumMed[i + 1]! + 1e-12);
    }
  });

  it("nests 50 inside 80 inside 95", () => {
    const a = runSim({ ...DEFAULT_OPTS, selectedYear: 2035, spread: "50" });
    const b = runSim({ ...DEFAULT_OPTS, selectedYear: 2035, spread: "80" });
    const c = runSim({ ...DEFAULT_OPTS, selectedYear: 2035, spread: "95" });
    expect(c.low).toBeLessThanOrEqual(b.low + 1e-12);
    expect(b.low).toBeLessThanOrEqual(a.low + 1e-12);
    expect(a.high).toBeLessThanOrEqual(b.high + 1e-12);
    expect(b.high).toBeLessThanOrEqual(c.high + 1e-12);
  });

  it("monotonic across year endpoints", () => {
    const years = [2027, 2030, 2035, 2040, 2050, 2055];
    const meds = years.map((y) => runSim({ ...DEFAULT_OPTS, selectedYear: y }).median);
    for (let i = 0; i < meds.length - 1; i++) {
      expect(meds[i]!).toBeLessThanOrEqual(meds[i + 1]! + 1e-9);
    }
  });

  it("zeros when layers and outcomes off", () => {
    const s = runSim({
      ...DEFAULT_OPTS,
      quantumOn: false,
      clientOn: false,
      selectedYear: 2040,
    });
    expect(s.median).toBe(0);
    expect(s.high).toBe(0);
    const t = runSim({
      ...DEFAULT_OPTS,
      theft: false,
      conflict: false,
      outage: false,
      selectedYear: 2040,
    });
    expect(t.median).toBe(0);
  });

  it("moves scenarios directionally under fixed seed", () => {
    const base = runSim({ ...DEFAULT_OPTS, selectedYear: 2035, scenario: "orderly" }).median;
    expect(runSim({ ...DEFAULT_OPTS, selectedYear: 2035, scenario: "q_accel" }).median).toBeGreaterThanOrEqual(
      base - 1e-9,
    );
    expect(runSim({ ...DEFAULT_OPTS, selectedYear: 2035, scenario: "delayed" }).median).toBeGreaterThanOrEqual(
      base - 1e-9,
    );
    expect(runSim({ ...DEFAULT_OPTS, selectedYear: 2035, scenario: "client" }).median).toBeGreaterThanOrEqual(
      base - 1e-9,
    );
  });

  it("annual mass equals delta cum per draw", () => {
    const core = runCore({ ...DEFAULT_OPTS, selectedYear: 2040 });
    for (let d = 0; d < 20; d++) {
      const cum = core.cumTraj[d]!;
      const ann = core.annTraj[d]!;
      let prev = 0;
      for (let i = 0; i < cum.length; i++) {
        expect(Math.abs(ann[i]! - (cum[i]! - prev))).toBeLessThan(1e-9);
        prev = cum[i]!;
      }
    }
  });

  it("clamps year endpoints", () => {
    expect(clamp(1999, YEAR_MIN, YEAR_MAX)).toBe(YEAR_MIN);
    expect(clamp(2099, YEAR_MIN, YEAR_MAX)).toBe(YEAR_MAX);
  });

  it("keeps quantile order on probs", () => {
    const s = runSim({ ...DEFAULT_OPTS, selectedYear: 2035 });
    expect(s.p025).toBeLessThanOrEqual(s.p10);
    expect(s.p10).toBeLessThanOrEqual(s.p50);
    expect(s.p50).toBeLessThanOrEqual(s.p90);
    expect(s.p90).toBeLessThanOrEqual(s.p975);
  });
});

describe("quantile helper", () => {
  it("reads ends", () => {
    expect(quantile([0, 1, 2, 3, 4], 0)).toBe(0);
    expect(quantile([0, 1, 2, 3, 4], 1)).toBe(4);
  });
});
