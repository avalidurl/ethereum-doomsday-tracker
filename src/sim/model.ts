/**
 * Ethereum L1 systemic-security scenario model v0.3
 *
 * - Versioned prior registry (see priorRegistry.ts)
 * - Knot/CDF timelines (RSA elicited kept separate from ETH ECDLP assumption)
 * - Event taxonomy with Fréchet union bounds (no fabricated correlation)
 * - Scenario composition under stated assumptions ≠ calibrated doom odds
 * - Calibration status: pending unless resolved archive exists
 */

import {
  ETH_ECDLP_ASSUMPTION_KNOTS,
  METACULUS_RSA_KNOTS,
  MIGRATION_ASSUMPTION_KNOTS,
  REGISTRY_VERSION,
} from "../data/priorRegistry";
import { evaluateCalibration, type CalibrationStatus } from "./calibration";
import { frechetUnionBounds } from "./frechet";
import { sampleYearFromKnots, shiftKnots, type Knot } from "./knots";

export const PAGE_VERSION = "0.3.0";
export const PAGE_UPDATED = "2026-11-06";
export const ANCHOR_DATE = "2026-11-06";
export const MODEL_VERSION = REGISTRY_VERSION;
export const NOW = 2026;
export const SIM_END = 2055;
export const YEAR_MIN = 2027;
export const YEAR_MAX = 2055;
export const N_DRAWS = 3000;
export const SEED = 42;

export type ScenarioId = "orderly" | "q_accel" | "delayed" | "client";
export type SpreadId = "50" | "80" | "95";
export type ChartId = "cumulative" | "annual" | "survival";
/** eth_assumption = default ECDLP knots; rsa_proxy = Metaculus RSA shape as explicit related scenario (not identification). */
export type TimelineMode = "eth_assumption" | "rsa_proxy";

export type SimOpts = {
  selectedYear: number;
  /** Kept for UI: shifts eth knots so median≈qMu when using assumption mode helpers — see buildQKnots */
  qMu: number;
  qSig: number;
  mMu: number;
  mSig: number;
  exploitH: number;
  residual: number;
  clientH: number;
  quantumOn: boolean;
  clientOn: boolean;
  /** Leaf: material quantum at-rest theft path in resolution union */
  theft: boolean;
  /** Leaf: conflicting finalized views */
  conflict: boolean;
  /** Leaf: ≥72h finality interruption */
  outage: boolean;
  scenario: ScenarioId;
  spread: SpreadId;
  timelineMode: TimelineMode;
};

export type LeafMarginals = {
  theft: number;
  conflict: number;
  outage: number;
};

export type SimResult = {
  years: number[];
  selectedYear: number;
  /** Scenario-composition P(H_Y) under stated dependence/composition assumptions — NOT a calibrated doom point */
  median: number;
  /** Epistemic model-spread band on scenario composition */
  low: number;
  high: number;
  /** Fréchet–Hoeffding identification bounds on union of enabled leaf marginals */
  frechetLow: number;
  frechetHigh: number;
  leafMarginals: LeafMarginals;
  p025: number;
  p10: number;
  p50: number;
  p90: number;
  p975: number;
  cumLow: number[];
  cumMed: number[];
  cumHigh: number[];
  annLow: number[];
  annMed: number[];
  annHigh: number[];
  survLow: number[];
  survMed: number[];
  survHigh: number[];
  hist: { centers: number[]; counts: number[] };
  quantumOnlyMed: number;
  clientOnlyMed: number;
  sensitivity: { label: string; delta: number }[];
  calibration: CalibrationStatus;
  readout: string;
};

export function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function normal(rnd: () => number, mu: number, sigma: number) {
  const u1 = Math.max(1e-12, rnd());
  const u2 = rnd();
  const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
  return mu + sigma * z;
}

export function clamp(x: number, lo: number, hi: number) {
  return Math.min(hi, Math.max(lo, x));
}

export function quantile(sorted: number[], p: number) {
  if (sorted.length === 0) return 0;
  const idx = Math.round((sorted.length - 1) * p);
  return sorted[idx]!;
}

export function pct(x: number, digits = 1) {
  return `${(100 * x).toFixed(digits)}%`;
}

export function scenarioOffsets(scenario: ScenarioId) {
  return {
    orderly: { qShift: 0, mShift: 0, cMul: 1 },
    q_accel: { qShift: -6, mShift: 0, cMul: 1 },
    delayed: { qShift: 0, mShift: 5, cMul: 1 },
    client: { qShift: 0, mShift: 0, cMul: 4 },
  }[scenario];
}

export function spreadBounds(spread: SpreadId): [number, number] {
  if (spread === "50") return [0.25, 0.75];
  if (spread === "80") return [0.1, 0.9];
  return [0.025, 0.975];
}

/** Build Q knots: recenter eth assumption so 0.5 knot ≈ qMu; rsa_proxy uses Metaculus shape + qMu recenter. */
export function buildQKnots(opts: Pick<SimOpts, "timelineMode" | "qMu" | "scenario">): Knot[] {
  const off = scenarioOffsets(opts.scenario);
  const base =
    opts.timelineMode === "rsa_proxy"
      ? METACULUS_RSA_KNOTS.map((k) => ({ ...k }))
      : ETH_ECDLP_ASSUMPTION_KNOTS.map((k) => ({ ...k }));
  const mid = base.find((k) => k.cdf === 0.5)?.year ?? base[Math.floor(base.length / 2)]!.year;
  const delta = opts.qMu - mid + off.qShift;
  return shiftKnots(base, delta);
}

export function buildMKnots(opts: Pick<SimOpts, "mMu" | "scenario">): Knot[] {
  const off = scenarioOffsets(opts.scenario);
  const base = MIGRATION_ASSUMPTION_KNOTS.map((k) => ({ ...k }));
  const mid = base.find((k) => k.cdf === 0.5)?.year ?? 2032;
  const delta = opts.mMu - mid + off.mShift;
  return shiftKnots(base, delta);
}

/**
 * Event taxonomy (horizon end-Y):
 *   H_Y = Theft ∪ Conflict ∪ Outage
 * Theft ← quantum channel (if quantumOn & theft)
 * Conflict ∪ Outage ← client channel (if clientOn & respective leaf)
 * Single MC path does not double-count: one failure year fires H once.
 * Leaf marginals tracked separately for Fréchet bounds.
 */

/** Single-leaf probability vector (same per-draw seeds as joint). */
function runCoreLeafProbs(
  opts: Omit<SimOpts, "spread">,
  qKnots: Knot[],
  mKnots: Knot[],
  years: number[],
  yiSel: number,
  leaf: "theft" | "conflict" | "outage",
): number[] {
  const off = scenarioOffsets(opts.scenario);
  const clientH = opts.clientH * off.cMul;
  const out: number[] = [];
  for (let i = 0; i < N_DRAWS; i++) {
    const rnd = mulberry32((SEED + Math.imul(i + 1, 0x9e3779b9)) >>> 0);
    const q = sampleYearFromKnots(rnd, qKnots);
    const m = sampleYearFromKnots(rnd, mKnots);
    const resid = clamp(opts.residual + normal(rnd, 0, 0.04), 0.01, 0.9);
    const hcNoise = Math.exp(normal(rnd, 0, 0.35));
    const hqNoise = normal(rnd, 0, 0.03);
    const hqPeak = leaf === "theft" ? Math.max(0, opts.exploitH + hqNoise) : 0;
    const hcBase = leaf !== "theft" ? Math.max(0, clientH * hcNoise) : 0;
    let surv = 1;
    const cum: number[] = [];
    for (const y of years) {
      const exposure = y < m ? 1 : resid;
      const hq = leaf === "theft" && y >= q ? hqPeak * exposure : 0;
      const hc = leaf !== "theft" ? hcBase : 0;
      const h = clamp(1 - (1 - hq) * (1 - hc), 0, 0.95);
      surv *= 1 - h;
      cum.push(1 - surv);
    }
    out.push(cum[yiSel]!);
  }
  out.sort((a, b) => a - b);
  return out;
}

export function runCore(opts: Omit<SimOpts, "spread">) {
  const off = scenarioOffsets(opts.scenario);
  const clientH = opts.clientH * off.cMul;
  const qKnots = buildQKnots(opts);
  const mKnots = buildMKnots(opts);

  const theftOn = opts.quantumOn && opts.theft;
  const conflictOn = opts.clientOn && opts.conflict;
  const outageOn = opts.clientOn && opts.outage;
  const clientLeafOn = conflictOn || outageOn;

  const years: number[] = [];
  for (let y = NOW; y <= SIM_END; y++) years.push(y);
  const yiSel = Math.max(0, years.indexOf(opts.selectedYear));

  const probs: number[] = [];
  const cumTraj: number[][] = [];
  const annTraj: number[][] = [];
  const survTraj: number[][] = [];
  let qOnlySum = 0;
  let cOnlySum = 0;

  for (let i = 0; i < N_DRAWS; i++) {
    // Per-draw seed: option toggles must not desynchronize the RNG stream
    const rnd = mulberry32((SEED + Math.imul(i + 1, 0x9e3779b9)) >>> 0);
    const q = sampleYearFromKnots(rnd, qKnots);
    const m = sampleYearFromKnots(rnd, mKnots);
    // Always consume hazard noise slots in fixed order (even if channel off)
    const resid = clamp(opts.residual + normal(rnd, 0, 0.04), 0.01, 0.9);
    const hcNoise = Math.exp(normal(rnd, 0, 0.35));
    const hqNoise = normal(rnd, 0, 0.03);
    const hcBase = clientLeafOn ? Math.max(0, clientH * hcNoise) : 0;
    const hqPeak = theftOn ? Math.max(0, opts.exploitH + hqNoise) : 0;

    let surv = 1;
    let survQ = 1;
    let survC = 1;
    const cum: number[] = [];
    const ann: number[] = [];
    const sv: number[] = [];

    for (const y of years) {
      const exposure = y < m ? 1 : resid;
      const hq = theftOn && y >= q ? hqPeak * exposure : 0;
      const hc = clientLeafOn ? hcBase : 0;
      const h = clamp(1 - (1 - hq) * (1 - hc), 0, 0.95);
      const mass = surv * h;
      surv *= 1 - h;
      survQ *= 1 - clamp(hq, 0, 0.95);
      survC *= 1 - clamp(hc, 0, 0.95);
      cum.push(1 - surv);
      ann.push(mass);
      sv.push(surv);
    }

    probs.push(cum[yiSel]!);
    cumTraj.push(cum);
    annTraj.push(ann);
    survTraj.push(sv);
    qOnlySum += 1 - survQ;
    cOnlySum += 1 - survC;
  }

  // Leaf marginals = scenario median under each leaf alone (same seed family) for Fréchet inputs
  const leafTheft = theftOn
    ? quantile(
        runCoreLeafProbs(opts, qKnots, mKnots, years, yiSel, "theft"),
        0.5,
      )
    : 0;
  const leafConflict = conflictOn
    ? quantile(runCoreLeafProbs(opts, qKnots, mKnots, years, yiSel, "conflict"), 0.5)
    : 0;
  const leafOutage = outageOn
    ? quantile(runCoreLeafProbs(opts, qKnots, mKnots, years, yiSel, "outage"), 0.5)
    : 0;

  probs.sort((a, b) => a - b);
  return {
    years,
    yiSel,
    probs,
    cumTraj,
    annTraj,
    survTraj,
    quantumOnlyMed: qOnlySum / N_DRAWS,
    clientOnlyMed: cOnlySum / N_DRAWS,
    leafMarginals: {
      theft: leafTheft,
      conflict: leafConflict,
      outage: leafOutage,
    } satisfies LeafMarginals,
    theftOn,
    conflictOn,
    outageOn,
  };
}

function colQuantile(traj: number[][], yi: number, p: number) {
  const col = traj.map((t) => t[yi]!).sort((a, b) => a - b);
  return quantile(col, p);
}

export function runSim(opts: SimOpts): SimResult {
  const core = runCore(opts);
  const [loP, hiP] = spreadBounds(opts.spread);
  const { years, probs, cumTraj, annTraj, survTraj, leafMarginals } = core;

  const enabledMarginals: number[] = [];
  if (core.theftOn) enabledMarginals.push(leafMarginals.theft);
  if (core.conflictOn) enabledMarginals.push(leafMarginals.conflict);
  if (core.outageOn) enabledMarginals.push(leafMarginals.outage);
  const frechet = frechetUnionBounds(enabledMarginals);

  const cumLow: number[] = [];
  const cumMed: number[] = [];
  const cumHigh: number[] = [];
  const annLow: number[] = [];
  const annMed: number[] = [];
  const annHigh: number[] = [];
  const survLow: number[] = [];
  const survMed: number[] = [];
  const survHigh: number[] = [];

  for (let yi = 0; yi < years.length; yi++) {
    cumLow.push(colQuantile(cumTraj, yi, loP));
    cumMed.push(colQuantile(cumTraj, yi, 0.5));
    cumHigh.push(colQuantile(cumTraj, yi, hiP));
    annLow.push(colQuantile(annTraj, yi, loP));
    annMed.push(colQuantile(annTraj, yi, 0.5));
    annHigh.push(colQuantile(annTraj, yi, hiP));
    survLow.push(colQuantile(survTraj, yi, loP));
    survMed.push(colQuantile(survTraj, yi, 0.5));
    survHigh.push(colQuantile(survTraj, yi, hiP));
  }

  const bins = 24;
  const counts = new Array(bins).fill(0) as number[];
  for (const p of probs) {
    const bi = Math.min(bins - 1, Math.floor(clamp(p, 0, 0.999999) * bins));
    counts[bi]!++;
  }
  const maxC = Math.max(...counts, 1);
  const centers = counts.map((_, i) => (i + 0.5) / bins);
  const norm = counts.map((c) => c / maxC);

  const baseMed = quantile(probs, 0.5);
  const perturbs: { label: string; patch: Partial<Omit<SimOpts, "spread">> }[] = [
    { label: "Q median −3y", patch: { qMu: opts.qMu - 3 } },
    { label: "Q median +3y", patch: { qMu: opts.qMu + 3 } },
    { label: "M median −2y", patch: { mMu: opts.mMu - 2 } },
    { label: "M median +2y", patch: { mMu: opts.mMu + 2 } },
    { label: "Exploit +3pp", patch: { exploitH: opts.exploitH + 0.03 } },
    { label: "Residual +10pp", patch: { residual: clamp(opts.residual + 0.1, 0.01, 0.9) } },
    { label: "Client ×2", patch: { clientH: opts.clientH * 2 } },
    { label: "RSA-proxy timeline", patch: { timelineMode: "rsa_proxy" } },
  ];
  const sensitivity = perturbs.map(({ label, patch }) => {
    const alt = runCore({ ...opts, ...patch });
    return { label, delta: quantile(alt.probs, 0.5) - baseMed };
  });

  const calibration = evaluateCalibration();
  const median = quantile(probs, 0.5);
  const readout =
    `Scenario composition P(H≤${opts.selectedYear})=${pct(median)} under competing-risk union ` +
    `(no double-count). Fréchet identification bounds on enabled leaves: ` +
    `${pct(frechet.low)}–${pct(frechet.high)}. ` +
    `Epistemic band (${opts.spread}% model-spread): ${pct(quantile(probs, loP))}–${pct(quantile(probs, hiP))}. ` +
    `Timeline: ${opts.timelineMode}. ${calibration.message}`;

  return {
    years,
    selectedYear: opts.selectedYear,
    median,
    low: quantile(probs, loP),
    high: quantile(probs, hiP),
    frechetLow: frechet.low,
    frechetHigh: frechet.high,
    leafMarginals,
    p025: quantile(probs, 0.025),
    p10: quantile(probs, 0.1),
    p50: quantile(probs, 0.5),
    p90: quantile(probs, 0.9),
    p975: quantile(probs, 0.975),
    cumLow,
    cumMed,
    cumHigh,
    annLow,
    annMed,
    annHigh,
    survLow,
    survMed,
    survHigh,
    hist: { centers, counts: norm },
    quantumOnlyMed: core.quantumOnlyMed,
    clientOnlyMed: core.clientOnlyMed,
    sensitivity,
    calibration,
    readout,
  };
}

/** v0.3 defaults — changed vs v0.2.2: knot timelines, lower unidentified hazards, timelineMode, taxonomy. */
export const DEFAULT_OPTS: SimOpts = {
  selectedYear: 2035,
  qMu: 2038,
  qSig: 4.5, // retained for UI compatibility; sampling uses knots
  mMu: 2032,
  mSig: 2.5,
  exploitH: 0.06,
  residual: 0.18,
  clientH: 0.004,
  quantumOn: true,
  clientOn: true,
  theft: true,
  conflict: true,
  outage: true,
  scenario: "orderly",
  spread: "80",
  timelineMode: "eth_assumption",
};

/** Frozen v0.2.2-style defaults for comparison tests / changelog (Normal-era semantics approximated). */
export const V022_COMPARE_OPTS: SimOpts = {
  selectedYear: 2035,
  qMu: 2038,
  qSig: 4.5,
  mMu: 2031,
  mSig: 2.5,
  exploitH: 0.08,
  residual: 0.15,
  clientH: 0.005,
  quantumOn: true,
  clientOn: true,
  theft: true,
  conflict: true,
  outage: true,
  scenario: "orderly",
  spread: "80",
  timelineMode: "eth_assumption",
};
