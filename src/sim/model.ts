/**
 * Ethereum L1 systemic-security scenario model v0.3.2 (audit blockers addressed)
 *
 * Headline: unconditional scenario mean E[P(H_Y|θ)].
 * Fréchet: on mean channel marginals (theft, client) — same estimand family as the mean.
 * Epistemic bands: quantiles of P(H|θ) across θ draws — labelled separately.
 * Client conflict∪outage: one unidentified hazard channel (no duplicate Frechet leaves).
 */

import {
  ETH_ECDLP_ASSUMPTION_KNOTS,
  METACULUS_RSA_KNOTS,
  MIGRATION_ASSUMPTION_KNOTS,
  REGISTRY_VERSION,
} from "../data/priorRegistry";
import { evaluateCalibration, type CalibrationStatus } from "./calibration";
import { frechetUnionBounds } from "./frechet";
import {
  scaleKnotsAboutMedian,
  shiftKnots,
  type Knot,
  yearAtCdf,
} from "./knots";
import { sampleYearFromKnots } from "./knots";

export const PAGE_VERSION = "0.3.2";
export const PAGE_UPDATED = "2026-11-06";
export const ANCHOR_DATE = "2026-11-06";
export const MODEL_VERSION = REGISTRY_VERSION;
export const NOW = 2026;
export const SIM_END = 2055;
export const YEAR_MIN = 2027;
export const YEAR_MAX = 2055;
export const N_DRAWS = 3000;
export const SEED = 42;

/** Default knot half-width reference (years from median to outer interior knot) for width=1. */
export const DEFAULT_Q_WIDTH = 1;
export const DEFAULT_M_WIDTH = 1;

export type ScenarioId = "orderly" | "q_accel" | "delayed" | "client";
export type SpreadId = "50" | "80" | "95";
export type ChartId = "cumulative" | "annual" | "survival";
export type TimelineMode = "eth_assumption" | "rsa_proxy";

export type SimOpts = {
  selectedYear: number;
  /** Capability timeline center (eth_assumption). Ignored for rsa_proxy unless qMuOverride. */
  qMu: number;
  /** Knot width factor about median (1 = published/assumption interior span). Not a Normal σ. */
  qWidth: number;
  mMu: number;
  mWidth: number;
  exploitH: number;
  residual: number;
  clientH: number;
  quantumOn: boolean;
  clientOn: boolean;
  /** Quantum theft channel in H_Y */
  theft: boolean;
  /**
   * Client failure group (conflict ∪ outage). Taxonomy may name both modes; probability uses one
   * unidentified client hazard — toggles are OR'd into a single channel (no split weights).
   */
  conflict: boolean;
  outage: boolean;
  scenario: ScenarioId;
  spread: SpreadId;
  timelineMode: TimelineMode;
  /** When true with rsa_proxy, allow qMu to shift Metaculus knots; default false = source knots unshifted. */
  qMuOverride: boolean;
};

export type ChannelMarginals = {
  theft: number;
  /** Single client channel = conflict ∪ outage under one hazard */
  client: number;
};

export type SimResult = {
  years: number[];
  selectedYear: number;
  /**
   * Unconditional scenario mean E[P(H_Y|θ)] — headline estimand.
   * (Field name `median` retained for UI wiring; prefer `scenarioMean` / readout labels.)
   */
  median: number;
  scenarioMean: number;
  /** Epistemic median of P(H|θ) across draws — not the headline Frechet pair. */
  scenarioP50: number;
  low: number;
  high: number;
  /** Fréchet–Hoeffding on mean channel marginals (theft, client) */
  frechetLow: number;
  frechetHigh: number;
  leafMarginals: ChannelMarginals;
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
  /** Mean P(quantum-only path fires by selectedYear) */
  quantumOnlyMean: number;
  /** Mean P(client-only path fires by selectedYear) */
  clientOnlyMean: number;
  /** @deprecated alias of quantumOnlyMean */
  quantumOnlyMed: number;
  /** @deprecated alias of clientOnlyMean */
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

export function mean(xs: number[]) {
  if (xs.length === 0) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
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

export function metaculusRsaMedianYear(): number {
  return yearAtCdf(METACULUS_RSA_KNOTS, 0.5);
}

export function clientChannelOn(opts: Pick<SimOpts, "clientOn" | "conflict" | "outage">): boolean {
  return opts.clientOn && (opts.conflict || opts.outage);
}

/**
 * Q knots:
 * - eth_assumption: ETH interior knots, width-scaled, recentered to qMu, + scenario shift
 * - rsa_proxy: Metaculus source knots unshifted (unless qMuOverride), width-scaled, + scenario shift only
 */
export function buildQKnots(
  opts: Pick<SimOpts, "timelineMode" | "qMu" | "qWidth" | "scenario" | "qMuOverride">,
): Knot[] {
  const off = scenarioOffsets(opts.scenario);
  if (opts.timelineMode === "rsa_proxy") {
    let k = METACULUS_RSA_KNOTS.map((x) => ({ ...x }));
    k = scaleKnotsAboutMedian(k, opts.qWidth);
    if (opts.qMuOverride) {
      const mid = yearAtCdf(k, 0.5);
      k = shiftKnots(k, opts.qMu - mid);
    }
    return shiftKnots(k, off.qShift);
  }
  let k = ETH_ECDLP_ASSUMPTION_KNOTS.map((x) => ({ ...x }));
  k = scaleKnotsAboutMedian(k, opts.qWidth);
  const mid = yearAtCdf(k, 0.5);
  return shiftKnots(k, opts.qMu - mid + off.qShift);
}

export function buildMKnots(opts: Pick<SimOpts, "mMu" | "mWidth" | "scenario">): Knot[] {
  const off = scenarioOffsets(opts.scenario);
  let k = MIGRATION_ASSUMPTION_KNOTS.map((x) => ({ ...x }));
  k = scaleKnotsAboutMedian(k, opts.mWidth);
  const mid = yearAtCdf(k, 0.5);
  return shiftKnots(k, opts.mMu - mid + off.mShift);
}

export function runCore(opts: Omit<SimOpts, "spread">) {
  const off = scenarioOffsets(opts.scenario);
  const clientH = opts.clientH * off.cMul;
  const qKnots = buildQKnots(opts);
  const mKnots = buildMKnots(opts);

  const theftOn = opts.quantumOn && opts.theft;
  const clientOn = clientChannelOn(opts);

  const years: number[] = [];
  for (let y = NOW; y <= SIM_END; y++) years.push(y);
  const yiSel = Math.max(0, years.indexOf(opts.selectedYear));

  const probs: number[] = [];
  const theftProbs: number[] = [];
  const clientProbs: number[] = [];
  const cumTraj: number[][] = [];
  const annTraj: number[][] = [];
  const survTraj: number[][] = [];

  for (let i = 0; i < N_DRAWS; i++) {
    const rnd = mulberry32((SEED + Math.imul(i + 1, 0x9e3779b9)) >>> 0);
    const q = sampleYearFromKnots(rnd, qKnots);
    const m = sampleYearFromKnots(rnd, mKnots);
    const resid = clamp(opts.residual + normal(rnd, 0, 0.04), 0.01, 0.9);
    const hcNoise = Math.exp(normal(rnd, 0, 0.35));
    const hqNoise = normal(rnd, 0, 0.03);
    const hcBase = Math.max(0, clientH * hcNoise);
    const hqPeak = Math.max(0, opts.exploitH + hqNoise);

    let surv = 1;
    let survTheft = 1;
    let survClient = 1;
    const cum: number[] = [];
    const ann: number[] = [];
    const sv: number[] = [];
    let theftAtSel = 0;
    let clientAtSel = 0;

    for (let yi = 0; yi < years.length; yi++) {
      const y = years[yi]!;
      const exposure = y < m ? 1 : resid;
      const hq = theftOn && y >= q ? hqPeak * exposure : 0;
      const hc = clientOn ? hcBase : 0;
      const h = clamp(1 - (1 - hq) * (1 - hc), 0, 0.95);
      const mass = surv * h;
      surv *= 1 - h;
      if (theftOn) {
        const hqOnly = y >= q ? hqPeak * exposure : 0;
        survTheft *= 1 - clamp(hqOnly, 0, 0.95);
      }
      if (clientOn) {
        survClient *= 1 - clamp(hcBase, 0, 0.95);
      }
      cum.push(1 - surv);
      ann.push(mass);
      sv.push(surv);
      if (yi === yiSel) {
        theftAtSel = theftOn ? 1 - survTheft : 0;
        clientAtSel = clientOn ? 1 - survClient : 0;
      }
    }

    probs.push(cum[yiSel]!);
    if (theftOn) theftProbs.push(theftAtSel);
    if (clientOn) clientProbs.push(clientAtSel);
    cumTraj.push(cum);
    annTraj.push(ann);
    survTraj.push(sv);
  }

  const quantumOnlyMean = theftOn ? mean(theftProbs) : 0;
  const clientOnlyMean = clientOn ? mean(clientProbs) : 0;

  return {
    years,
    yiSel,
    probs,
    cumTraj,
    annTraj,
    survTraj,
    quantumOnlyMean,
    clientOnlyMean,
    leafMarginals: {
      theft: quantumOnlyMean,
      client: clientOnlyMean,
    } satisfies ChannelMarginals,
    theftOn,
    clientOn,
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
  if (core.clientOn) enabledMarginals.push(leafMarginals.client);
  const frechet = frechetUnionBounds(enabledMarginals);

  const scenarioMean = mean(probs);
  const sorted = [...probs].sort((a, b) => a - b);

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

  const baseMean = scenarioMean;
  const perturbs: { label: string; patch: Partial<Omit<SimOpts, "spread">> }[] = [
    { label: "Q center −3y", patch: { qMu: opts.qMu - 3, qMuOverride: true } },
    { label: "Q center +3y", patch: { qMu: opts.qMu + 3, qMuOverride: true } },
    { label: "M center −2y", patch: { mMu: opts.mMu - 2 } },
    { label: "M center +2y", patch: { mMu: opts.mMu + 2 } },
    { label: "Exploit +3pp", patch: { exploitH: opts.exploitH + 0.03 } },
    { label: "Residual +10pp", patch: { residual: clamp(opts.residual + 0.1, 0.01, 0.9) } },
    { label: "Client ×2", patch: { clientH: opts.clientH * 2 } },
    { label: "RSA-proxy (source)", patch: { timelineMode: "rsa_proxy", qMuOverride: false } },
  ];
  const sensitivity = perturbs.map(({ label, patch }) => {
    const alt = runCore({ ...opts, ...patch });
    return { label, delta: mean(alt.probs) - baseMean };
  });

  const calibration = evaluateCalibration();
  const readout =
    `Scenario mean E[P(H≤${opts.selectedYear})]=${pct(scenarioMean)} (unconditional over θ). ` +
    `Fréchet on mean channel marginals (theft, client): ${pct(frechet.low)}–${pct(frechet.high)}. ` +
    `Epistemic ${opts.spread}% band of P(H|θ): ${pct(quantile(sorted, loP))}–${pct(quantile(sorted, hiP))} ` +
    `(p50=${pct(quantile(sorted, 0.5))}). Timeline=${opts.timelineMode}` +
    `${opts.timelineMode === "rsa_proxy" && !opts.qMuOverride ? " (Metaculus knots unshifted)" : ""}. ` +
    `${calibration.message}`;

  return {
    years,
    selectedYear: opts.selectedYear,
    median: scenarioMean,
    scenarioMean,
    scenarioP50: quantile(sorted, 0.5),
    low: quantile(sorted, loP),
    high: quantile(sorted, hiP),
    frechetLow: frechet.low,
    frechetHigh: frechet.high,
    leafMarginals,
    p025: quantile(sorted, 0.025),
    p10: quantile(sorted, 0.1),
    p50: quantile(sorted, 0.5),
    p90: quantile(sorted, 0.9),
    p975: quantile(sorted, 0.975),
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
    quantumOnlyMean: core.quantumOnlyMean,
    clientOnlyMean: core.clientOnlyMean,
    quantumOnlyMed: core.quantumOnlyMean,
    clientOnlyMed: core.clientOnlyMean,
    sensitivity,
    calibration,
    readout,
  };
}

/** Restored legacy unidentified hazard defaults (v0.2.2 magnitudes); knot timelines remain. */
export const DEFAULT_OPTS: SimOpts = {
  selectedYear: 2035,
  qMu: 2038,
  qWidth: DEFAULT_Q_WIDTH,
  mMu: 2031,
  mWidth: DEFAULT_M_WIDTH,
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
  qMuOverride: false,
};

export const V022_COMPARE_OPTS: SimOpts = { ...DEFAULT_OPTS };
