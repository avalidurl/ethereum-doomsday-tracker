import { describe, expect, it } from "vitest";
import { frechetUnionBounds } from "./frechet";
import {
  cdfAtYear,
  sampleYearFromKnots,
  validateKnots,
  withAssumptionTails,
  yearAtCdf,
} from "./knots";
import { brierScore, evaluateCalibration, logScore, rowIsScoreable } from "./calibration";
import {
  DEFAULT_OPTS,
  buildQKnots,
  clientChannelOn,
  clamp,
  mean,
  metaculusRsaMedianYear,
  METACULUS_RSA_SOURCE_CENTER,
  effectiveQCenter,
  quantile,
  runSim,
  YEAR_MAX,
  YEAR_MIN,
} from "./model";
import { METACULUS_RSA_KNOTS, PRIOR_REGISTRY } from "../data/priorRegistry";
import { chartYMax } from "../routing/chartScale";
import { mulberry32 } from "./model";

describe("runSim invariants", () => {
  it("keeps mean in [0,1] and Frechet nesting at 2035", () => {
    const s = runSim({ ...DEFAULT_OPTS, selectedYear: 2035 });
    expect(s.scenarioMean).toBeGreaterThanOrEqual(0);
    expect(s.scenarioMean).toBeLessThanOrEqual(1);
    expect(s.median).toBe(s.scenarioMean);
    expect(s.frechetLow).toBeLessThanOrEqual(s.frechetHigh + 1e-12);
    expect(s.scenarioMean).toBeGreaterThanOrEqual(s.frechetLow - 1e-9);
    expect(s.scenarioMean).toBeLessThanOrEqual(s.frechetHigh + 1e-9);
    expect(s.low).toBeLessThanOrEqual(s.scenarioP50 + 1e-12);
    expect(s.scenarioP50).toBeLessThanOrEqual(s.high + 1e-12);
  });

  it("has nondecreasing cumulative median path", () => {
    const s = runSim({ ...DEFAULT_OPTS, selectedYear: 2055 });
    for (let i = 0; i < s.cumMed.length - 1; i++) {
      expect(s.cumMed[i]!).toBeLessThanOrEqual(s.cumMed[i + 1]! + 1e-12);
    }
  });

  it("nests epistemic 50 inside 80 inside 95", () => {
    const a = runSim({ ...DEFAULT_OPTS, selectedYear: 2035, spread: "50" });
    const b = runSim({ ...DEFAULT_OPTS, selectedYear: 2035, spread: "80" });
    const c = runSim({ ...DEFAULT_OPTS, selectedYear: 2035, spread: "95" });
    expect(c.low).toBeLessThanOrEqual(b.low + 1e-12);
    expect(b.low).toBeLessThanOrEqual(a.low + 1e-12);
    expect(a.high).toBeLessThanOrEqual(b.high + 1e-12);
    expect(b.high).toBeLessThanOrEqual(c.high + 1e-12);
  });

  it("monotonic mean across year endpoints", () => {
    const years = [2027, 2030, 2035, 2040, 2050, 2055];
    const means = years.map((y) => runSim({ ...DEFAULT_OPTS, selectedYear: y }).scenarioMean);
    for (let i = 0; i < means.length - 1; i++) {
      expect(means[i]!).toBeLessThanOrEqual(means[i + 1]! + 1e-9);
    }
  });

  it("zeros when layers/channels off", () => {
    const s = runSim({ ...DEFAULT_OPTS, quantumOn: false, clientOn: false, selectedYear: 2040 });
    expect(s.scenarioMean).toBe(0);
    expect(s.frechetHigh).toBe(0);
    const t = runSim({
      ...DEFAULT_OPTS,
      theft: false,
      conflict: false,
      outage: false,
      selectedYear: 2040,
    });
    expect(t.scenarioMean).toBe(0);
  });

  it("restored legacy unidentified defaults", () => {
    expect(DEFAULT_OPTS.clientH).toBe(0.005);
    expect(DEFAULT_OPTS.exploitH).toBe(0.08);
    expect(DEFAULT_OPTS.residual).toBe(0.15);
    expect(DEFAULT_OPTS.mMu).toBe(2031);
  });
});

describe("Frechet estimand consistency (audit regressions)", () => {
  it("mean never exceeds Frechet high for audit repro toggles", () => {
    const cases = [
      { ...DEFAULT_OPTS, selectedYear: 2035, outage: false },
      { ...DEFAULT_OPTS, selectedYear: 2035, scenario: "q_accel" as const, outage: false },
      {
        ...DEFAULT_OPTS,
        selectedYear: 2038,
        clientH: 0.001,
        exploitH: 0.15,
        conflict: true,
        outage: true,
        theft: true,
      },
    ];
    for (const opts of cases) {
      const s = runSim(opts);
      expect(s.scenarioMean).toBeLessThanOrEqual(s.frechetHigh + 1e-9);
      expect(s.scenarioMean).toBeGreaterThanOrEqual(s.frechetLow - 1e-9);
    }
  });

  it(
    "randomized toggle grid: mean in Frechet for many seeds of options",
    () => {
    const rnd = mulberry32(99);
    for (let i = 0; i < 24; i++) {
      const opts = {
        ...DEFAULT_OPTS,
        selectedYear: 2030 + Math.floor(rnd() * 20),
        theft: rnd() > 0.3,
        conflict: rnd() > 0.5,
        outage: rnd() > 0.5,
        quantumOn: rnd() > 0.2,
        clientOn: rnd() > 0.2,
        scenario: (["orderly", "q_accel", "delayed", "client"] as const)[Math.floor(rnd() * 4)]!,
        exploitH: 0.02 + rnd() * 0.12,
        clientH: 0.001 + rnd() * 0.01,
        timelineMode: rnd() > 0.5 ? ("eth_assumption" as const) : ("rsa_proxy" as const),
        qMuOverride: false,
      };
      if (!opts.theft && !clientChannelOn(opts)) continue;
      const s = runSim(opts);
      expect(s.scenarioMean).toBeLessThanOrEqual(s.frechetHigh + 1e-8);
      expect(s.scenarioMean).toBeGreaterThanOrEqual(s.frechetLow - 1e-8);
    }
  },
    20000,
  );

  it("conflict-only and outage-only share identical client marginal (one channel)", () => {
    const a = runSim({ ...DEFAULT_OPTS, selectedYear: 2035, theft: false, conflict: true, outage: false });
    const b = runSim({ ...DEFAULT_OPTS, selectedYear: 2035, theft: false, conflict: false, outage: true });
    expect(a.leafMarginals.client).toBeCloseTo(b.leafMarginals.client, 12);
    expect(a.scenarioMean).toBeCloseTo(b.scenarioMean, 12);
    // Frechet has a single client marginal — not duplicated
    expect(a.frechetLow).toBeCloseTo(a.leafMarginals.client, 12);
    expect(a.frechetHigh).toBeCloseTo(a.leafMarginals.client, 12);
  });

  it("Frechet unit known marginals", () => {
    const b = frechetUnionBounds([0.4, 0.4]);
    expect(b.low).toBeCloseTo(0.4, 10);
    expect(b.high).toBeCloseTo(0.8, 10);
  });
});

describe("knot CDF/inverse coherence", () => {
  it("no artificial 10%/90% point masses; tails reach 0 and 1", () => {
    const ext = withAssumptionTails(METACULUS_RSA_KNOTS);
    expect(ext[0]!.cdf).toBe(0);
    expect(ext[ext.length - 1]!.cdf).toBe(1);
    const rnd = mulberry32(7);
    const samples: number[] = [];
    for (let i = 0; i < 5000; i++) samples.push(sampleYearFromKnots(rnd, METACULUS_RSA_KNOTS));
    const y10 = yearAtCdf(METACULUS_RSA_KNOTS, 0.1);
    const fracAtFirstInterior = samples.filter((y) => Math.abs(y - METACULUS_RSA_KNOTS[0]!.year) < 1e-9).length / samples.length;
    expect(fracAtFirstInterior).toBeLessThan(0.05);
    expect(cdfAtYear(METACULUS_RSA_KNOTS, yearAtCdf(METACULUS_RSA_KNOTS, 0.5))).toBeCloseTo(0.5, 5);
    expect(cdfAtYear(METACULUS_RSA_KNOTS, y10)).toBeCloseTo(0.1, 5);
    expect(cdfAtYear(METACULUS_RSA_KNOTS, 2100)).toBe(1);
    expect(cdfAtYear(METACULUS_RSA_KNOTS, 2000)).toBe(0);
  });

  it("qWidth changes dispersion (not a dead control)", () => {
    const narrow = buildQKnots({
      timelineMode: "eth_assumption",
      qMu: 2038,
      qWidth: 0.5,
      scenario: "orderly",
      qMuOverride: false,
    });
    const wide = buildQKnots({
      timelineMode: "eth_assumption",
      qMu: 2038,
      qWidth: 2,
      scenario: "orderly",
      qMuOverride: false,
    });
    const nSpan = narrow[narrow.length - 1]!.year - narrow[0]!.year;
    const wSpan = wide[wide.length - 1]!.year - wide[0]!.year;
    // compare after tails via yearAtCdf span of interior — use raw scale on assumption knots
    expect(wSpan).toBeGreaterThan(nSpan + 1);
    const a = runSim({ ...DEFAULT_OPTS, qWidth: 0.5, selectedYear: 2035 });
    const b = runSim({ ...DEFAULT_OPTS, qWidth: 2, selectedYear: 2035 });
    // widths affect epistemic spread and/or mean when quantum matters later — at least not identical joint
    expect(a.high - a.low + a.scenarioMean).not.toBe(b.high - b.low + b.scenarioMean);
  });
});

describe("RSA proxy unshifted", () => {
  it("rsa_proxy without override keeps Metaculus median (~2033.7)", () => {
    const k = buildQKnots({
      timelineMode: "rsa_proxy",
      qMu: 2038,
      qWidth: 1,
      scenario: "orderly",
      qMuOverride: false,
    });
    expect(yearAtCdf(k, 0.5)).toBeCloseTo(metaculusRsaMedianYear(), 5);
  });

  it("rsa_proxy default mean at 2035 is not lowered by false 2038 recenter", () => {
    const eth = runSim({ ...DEFAULT_OPTS, timelineMode: "eth_assumption", selectedYear: 2035 });
    const rsa = runSim({
      ...DEFAULT_OPTS,
      timelineMode: "rsa_proxy",
      qMuOverride: false,
      selectedYear: 2035,
    });
    // Earlier CRQC proxy should raise (not lower) near-term quantum contribution vs eth 2038 center
    expect(rsa.leafMarginals.theft).toBeGreaterThanOrEqual(eth.leafMarginals.theft - 1e-9);
  });
});

describe("horizon channel means", () => {
  it("quantumOnlyMean uses selectedYear not end-horizon only", () => {
    const early = runSim({ ...DEFAULT_OPTS, selectedYear: 2030, conflict: false, outage: false });
    const late = runSim({ ...DEFAULT_OPTS, selectedYear: 2050, conflict: false, outage: false });
    expect(early.quantumOnlyMean).toBeLessThanOrEqual(late.quantumOnlyMean + 1e-9);
    expect(early.quantumOnlyMean).toBe(early.leafMarginals.theft);
  });
});

describe("calibration guards", () => {
  it("pending without resolved outcomes", () => {
    expect(evaluateCalibration().status).toBe("pending_insufficient_resolved");
  });

  it("rejects forecastAt >= resolvedAt and out-of-range p", () => {
    expect(
      rowIsScoreable({
        id: "x",
        question: "q",
        forecastVersion: "0.3.2",
        forecastAt: "2022-01-01T00:00:00Z",
        resolveBy: "2023-01-01",
        resolutionCriteria: "c",
        forecastP: 0.2,
        outcome: 0,
        resolvedAt: "2021-01-01T00:00:00Z",
        notes: "bad order",
      }),
    ).toBe(false);
    expect(
      rowIsScoreable({
        id: "x",
        question: "q",
        forecastVersion: "0.3.2",
        forecastAt: "2020-01-01T00:00:00Z",
        resolveBy: "2021-01-01",
        resolutionCriteria: "c",
        forecastP: 1.5,
        outcome: 0,
        resolvedAt: "2021-01-02T00:00:00Z",
        notes: "bad p",
      }),
    ).toBe(false);
    const ok = evaluateCalibration([
      {
        id: "t",
        question: "toy",
        forecastVersion: "0.3.2",
        forecastAt: "2020-01-01T00:00:00Z",
        resolveBy: "2021-01-01",
        resolutionCriteria: "x",
        forecastP: 0.2,
        outcome: 0,
        resolvedAt: "2021-01-02T00:00:00Z",
        notes: "unit test",
      },
    ]);
    expect(ok.status).toBe("scored");
    expect(ok.brier).toBeCloseTo(brierScore(0.2, 0), 10);
    expect(ok.logScore).toBeCloseTo(logScore(0.2, 0), 10);
  });
});

describe("registry", () => {
  it("still warns not to port GRI RSA to ETH", () => {
    expect(PRIOR_REGISTRY.find((e) => e.id === "gri_2025_rsa_crqc")?.notes.toLowerCase()).toContain("do not port");
  });
  it("clamp helpers", () => {
    expect(clamp(YEAR_MIN - 5, YEAR_MIN, YEAR_MAX)).toBe(YEAR_MIN);
    expect(quantile([0, 1, 2, 3, 4], 0.5)).toBe(2);
    expect(mean([1, 2, 3])).toBe(2);
    validateKnots(METACULUS_RSA_KNOTS);
  });
});

describe("v0.3.3 chart mean trajectories", () => {
  it("selectedYear cumMean matches scenarioMean; annual sums and survival=1-cum", () => {
    for (const opts of [
      { ...DEFAULT_OPTS, selectedYear: 2035 },
      { ...DEFAULT_OPTS, selectedYear: 2035, scenario: "q_accel" as const },
      {
        ...DEFAULT_OPTS,
        selectedYear: 2035,
        timelineMode: "rsa_proxy" as const,
        qMuOverride: false,
        qMu: 2038,
      },
      {
        ...DEFAULT_OPTS,
        selectedYear: 2040,
        conflict: false,
        outage: false,
        theft: true,
        quantumOn: true,
      },
    ]) {
      const s = runSim(opts);
      const yi = s.years.indexOf(opts.selectedYear);
      expect(yi).toBeGreaterThanOrEqual(0);
      expect(s.cumMean[yi]!).toBeCloseTo(s.scenarioMean, 10);
      // survival mean = 1 - cumulative mean (same draws)
      expect(s.survMean[yi]!).toBeCloseTo(1 - s.cumMean[yi]!, 10);
      // annual masses sum to cumMean at that year
      const annSum = s.annMean.slice(0, yi + 1).reduce((a, b) => a + b, 0);
      expect(annSum).toBeCloseTo(s.cumMean[yi]!, 8);
      // nondecreasing cumMean
      for (let i = 0; i < s.cumMean.length - 1; i++) {
        expect(s.cumMean[i]!).toBeLessThanOrEqual(s.cumMean[i + 1]! + 1e-12);
      }
    }
  });

  it("quantum-only 50% band can be flat near 0 while mean stays positive and chart ymax includes mean", () => {
    const s = runSim({
      ...DEFAULT_OPTS,
      selectedYear: 2035,
      scenario: "q_accel",
      spread: "50",
      conflict: false,
      outage: false,
      clientOn: false,
      theft: true,
      quantumOn: true,
    });
    expect(s.scenarioMean).toBeGreaterThan(0);
    const yi = s.years.indexOf(2035);
    expect(s.cumMean[yi]!).toBeCloseTo(s.scenarioMean, 10);
    // Often p25≈0 for skewed theft; mean can exceed high band edge or sit above median
    expect(s.cumMean[yi]!).toBeGreaterThan(s.cumMed[yi]! - 1e-12);
    // emulate ForecastChart vals for cumulative with band
    const vals = [...s.cumMean, ...s.cumLow, ...s.cumHigh, s.scenarioMean];
    const ymax = chartYMax("cumulative", vals);
    expect(ymax).toBeGreaterThanOrEqual(s.scenarioMean);
  });

  it(
    "random option grid: year-dot cumMean equals headline",
    () => {
    const rnd = mulberry32(2026);
    for (let i = 0; i < 12; i++) {
      const opts = {
        ...DEFAULT_OPTS,
        selectedYear: 2028 + Math.floor(rnd() * 25),
        theft: rnd() > 0.2,
        conflict: rnd() > 0.4,
        outage: rnd() > 0.4,
        quantumOn: rnd() > 0.15,
        clientOn: rnd() > 0.15,
        scenario: (["orderly", "q_accel", "delayed", "client"] as const)[Math.floor(rnd() * 4)]!,
        spread: (["50", "80", "95"] as const)[Math.floor(rnd() * 3)]!,
        timelineMode: rnd() > 0.5 ? ("eth_assumption" as const) : ("rsa_proxy" as const),
        qMuOverride: rnd() > 0.7,
        qMu: 2030 + rnd() * 20,
      };
      const s = runSim(opts);
      const yi = s.years.indexOf(opts.selectedYear);
      expect(s.cumMean[yi]!).toBeCloseTo(s.scenarioMean, 10);
      expect(s.survMean[yi]!).toBeCloseTo(1 - s.cumMean[yi]!, 10);
    }
  },
    30000,
  );
});

describe("v0.3.3 effective Q center / RSA sensitivity", () => {
  it("exposes cited source center ≈2033.68 and effectiveQCenter for rsa without override", () => {
    expect(METACULUS_RSA_SOURCE_CENTER).toBeCloseTo(2033.68, 1);
    expect(effectiveQCenter({
      timelineMode: "rsa_proxy",
      qMu: 2038,
      qMuOverride: false,
      qWidth: 1,
      scenario: "orderly",
    })).toBe(METACULUS_RSA_SOURCE_CENTER);
    expect(effectiveQCenter({
      timelineMode: "rsa_proxy",
      qMu: 2035,
      qMuOverride: true,
      qWidth: 1,
      scenario: "orderly",
    })).toBe(2035);
    expect(effectiveQCenter({
      timelineMode: "eth_assumption",
      qMu: 2038,
      qMuOverride: false,
      qWidth: 1,
      scenario: "orderly",
    })).toBe(2038);
  });

  it("rsa_proxy URL-like opts: Q center −3y raises risk (earlier) vs base", () => {
    const baseOpts = {
      ...DEFAULT_OPTS,
      timelineMode: "rsa_proxy" as const,
      qMuOverride: false,
      qMu: 2038, // ignored until override — source center active
      selectedYear: 2035,
    };
    const s = runSim(baseOpts);
    expect(effectiveQCenter(baseOpts)).toBeCloseTo(METACULUS_RSA_SOURCE_CENTER, 5);
    const row = s.sensitivity.find((x) => x.label === "Q center −3y");
    expect(row).toBeDefined();
    // shifting active center earlier must increase near-term risk
    expect(row!.delta).toBeGreaterThan(0);
    const plus = s.sensitivity.find((x) => x.label === "Q center +3y");
    expect(plus!.delta).toBeLessThan(0);
  });

  it("source-center range step 0.01 can represent cited center exactly", () => {
    const step = 0.01;
    const snapped = Math.round(METACULUS_RSA_SOURCE_CENTER / step) * step;
    expect(Math.abs(snapped - METACULUS_RSA_SOURCE_CENTER)).toBeLessThan(1e-9);
  });
});
