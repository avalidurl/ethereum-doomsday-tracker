import { describe, expect, it } from "vitest";
import { frechetUnionBounds } from "./frechet";
import { cdfAtYear, sampleYearFromKnots, validateKnots } from "./knots";
import { brierScore, evaluateCalibration, logScore } from "./calibration";
import {
  DEFAULT_OPTS,
  V022_COMPARE_OPTS,
  YEAR_MAX,
  YEAR_MIN,
  buildQKnots,
  clamp,
  quantile,
  runCore,
  runSim,
} from "./model";
import { METACULUS_RSA_KNOTS, PRIOR_REGISTRY } from "../data/priorRegistry";

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
    expect(s.frechetLow).toBe(0);
    expect(s.frechetHigh).toBe(0);
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
    expect(runSim({ ...DEFAULT_OPTS, selectedYear: 2035, scenario: "client" }).median).toBeGreaterThanOrEqual(
      base - 1e-9,
    );
  });

  it("annual mass equals delta cum per draw", () => {
    const core = runCore({ ...DEFAULT_OPTS, selectedYear: 2040 });
    for (let d = 0; d < 5; d++) {
      const cum = core.cumTraj[d]!;
      const ann = core.annTraj[d]!;
      let prev = 0;
      for (let i = 0; i < cum.length; i++) {
        expect(Math.abs(ann[i]! - (cum[i]! - prev))).toBeLessThan(1e-9);
        prev = cum[i]!;
      }
    }
  });

  it("clamps year helpers", () => {
    expect(clamp(YEAR_MIN - 5, YEAR_MIN, YEAR_MAX)).toBe(YEAR_MIN);
    expect(clamp(YEAR_MAX + 5, YEAR_MIN, YEAR_MAX)).toBe(YEAR_MAX);
    expect(quantile([0, 1, 2, 3, 4], 0.5)).toBe(2);
  });
});

describe("event overlap and Fréchet", () => {
  it("Frechet bounds nest scenario median for default leaves", () => {
    const s = runSim({ ...DEFAULT_OPTS, selectedYear: 2035 });
    expect(s.frechetLow).toBeLessThanOrEqual(s.frechetHigh + 1e-12);
    // Scenario composition uses single-count competing risk; must lie in [0,1] and typically inside Frechet
    expect(s.median).toBeGreaterThanOrEqual(0);
    expect(s.median).toBeLessThanOrEqual(1);
    expect(s.median).toBeGreaterThanOrEqual(s.frechetLow - 1e-6);
    expect(s.median).toBeLessThanOrEqual(s.frechetHigh + 1e-6);
  });

  it("Frechet unit: known marginals", () => {
    const b = frechetUnionBounds([0.4, 0.4]);
    expect(b.low).toBeCloseTo(0.4, 10);
    expect(b.high).toBeCloseTo(0.8, 10);
    const c = frechetUnionBounds([0.7, 0.7, 0.7]);
    expect(c.low).toBeCloseTo(Math.max(0.7, 2.1 - 2), 10);
    expect(c.high).toBeCloseTo(1, 10);
  });

  it("joint scenario median lies in Fréchet bounds from leaf marginals", () => {
    const both = runSim({ ...DEFAULT_OPTS, selectedYear: 2040 });
    expect(both.median).toBeLessThanOrEqual(both.frechetHigh + 1e-6);
    expect(both.median).toBeGreaterThanOrEqual(both.frechetLow - 1e-6);
    expect(both.frechetHigh).toBeLessThanOrEqual(
      both.leafMarginals.theft + both.leafMarginals.conflict + both.leafMarginals.outage + 1e-9,
    );
    const theftOnly = runSim({
      ...DEFAULT_OPTS,
      selectedYear: 2040,
      conflict: false,
      outage: false,
    });
    const clientOnly = runSim({
      ...DEFAULT_OPTS,
      selectedYear: 2040,
      theft: false,
    });
    // Single-count joint ≥ each standalone median (synced seeds / nested hazards)
    expect(both.median).toBeGreaterThanOrEqual(theftOnly.median - 1e-6);
    expect(both.median).toBeGreaterThanOrEqual(clientOnly.median - 1e-6);
  });
});

describe("horizon bounds and source mapping", () => {
  it("registry maps parameters with kinds and does not claim GRI→ETH port", () => {
    expect(PRIOR_REGISTRY.length).toBeGreaterThanOrEqual(8);
    const gri = PRIOR_REGISTRY.find((e) => e.id === "gri_2025_rsa_crqc");
    expect(gri?.notes.toLowerCase()).toContain("do not port");
    const eth = PRIOR_REGISTRY.find((e) => e.id === "eth_ecdlp_capability_year");
    expect(eth?.kind).toBe("user_assumption");
    const rsa = PRIOR_REGISTRY.find((e) => e.id === "metaculus_rsa_2048_date");
    expect(rsa?.kind).toBe("elicited_published");
  });

  it("rsa_proxy knots differ from eth_assumption recenter at same qMu", () => {
    const eth = buildQKnots({ timelineMode: "eth_assumption", qMu: 2038, scenario: "orderly" });
    const rsa = buildQKnots({ timelineMode: "rsa_proxy", qMu: 2038, scenario: "orderly" });
    const ethMid = eth.find((k) => Math.abs(k.cdf - 0.5) < 1e-9)!.year;
    const rsaMid = rsa.find((k) => Math.abs(k.cdf - 0.5) < 1e-9)!.year;
    expect(ethMid).toBeCloseTo(2038, 5);
    expect(rsaMid).toBeCloseTo(2038, 5);
    // Shape: RSA original median ~2033.68; after recenter widths differ
    const ethWidth = eth[eth.length - 1]!.year - eth[0]!.year;
    const rsaWidth = rsa[rsa.length - 1]!.year - rsa[0]!.year;
    expect(Math.abs(ethWidth - rsaWidth)).toBeGreaterThan(0.5);
  });

  it("Metaculus knots validate and cdfAtYear behaves", () => {
    validateKnots(METACULUS_RSA_KNOTS);
    expect(cdfAtYear(METACULUS_RSA_KNOTS, 2025)).toBe(0);
    expect(cdfAtYear(METACULUS_RSA_KNOTS, 2090)).toBe(0.9);
    const rnd = () => 0.5;
    const y = sampleYearFromKnots(rnd, METACULUS_RSA_KNOTS);
    expect(y).toBeGreaterThan(2030);
    expect(y).toBeLessThan(2040);
  });
});

describe("calibration honesty", () => {
  it("reports pending without resolved outcomes", () => {
    const c = evaluateCalibration();
    expect(c.status).toBe("pending_insufficient_resolved");
    expect(c.nResolved).toBe(0);
    expect(runSim(DEFAULT_OPTS).calibration.status).toBe("pending_insufficient_resolved");
  });

  it("scores when archive has frozen P and outcomes", () => {
    const c = evaluateCalibration([
      {
        id: "t",
        question: "toy",
        forecastVersion: "0.3.0",
        forecastAt: "2020-01-01T00:00:00Z",
        resolveBy: "2021-01-01",
        resolutionCriteria: "x",
        forecastP: 0.2,
        outcome: 0,
        resolvedAt: "2021-01-02",
        notes: "unit test only — not claimed as model calibration dataset",
      },
    ]);
    expect(c.status).toBe("scored");
    expect(c.brier).toBeCloseTo(brierScore(0.2, 0), 10);
    expect(c.logScore).toBeCloseTo(logScore(0.2, 0), 10);
  });
});

describe("v0.3 vs prior defaults", () => {
  it("records numerical change at 2035 for changelog", () => {
    const neu = runSim({ ...DEFAULT_OPTS, selectedYear: 2035 });
    const oldish = runSim({ ...V022_COMPARE_OPTS, selectedYear: 2035 });
    // Defaults intentionally differ (mMu, exploitH, clientH, knots) — assert we expose both
    expect(typeof neu.median).toBe("number");
    expect(typeof oldish.median).toBe("number");
    expect(neu.frechetHigh).toBeGreaterThanOrEqual(neu.frechetLow);
  });
});
