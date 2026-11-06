/** Toy L1 competing-risk Monte Carlo — illustrative priors only. v0.2 */
export const PAGE_VERSION = "0.2.0";
export const PAGE_UPDATED = "2026-11-06";
export const ANCHOR_DATE = "2026-11-06";
export const NOW = 2026;
export const SIM_END = 2055;
export const YEAR_MIN = 2027;
export const YEAR_MAX = 2055;
export const N_DRAWS = 3000;
export const SEED = 42;

export type ScenarioId = "orderly" | "q_accel" | "delayed" | "client";
export type SpreadId = "50" | "80" | "95";
export type ChartId = "cumulative" | "annual" | "survival";

export type SimOpts = {
  selectedYear: number;
  qMu: number;
  qSig: number;
  mMu: number;
  mSig: number;
  exploitH: number;
  residual: number;
  clientH: number;
  quantumOn: boolean;
  clientOn: boolean;
  theft: boolean;
  conflict: boolean;
  outage: boolean;
  scenario: ScenarioId;
  spread: SpreadId;
};

export type SimResult = {
  years: number[];
  selectedYear: number;
  median: number;
  low: number;
  high: number;
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
    orderly: { q: 0, m: 0, cMul: 1 },
    q_accel: { q: -6, m: 0, cMul: 1 },
    delayed: { q: 0, m: 5, cMul: 1 },
    client: { q: 0, m: 0, cMul: 4 },
  }[scenario];
}

export function spreadBounds(spread: SpreadId): [number, number] {
  if (spread === "50") return [0.25, 0.75];
  if (spread === "80") return [0.1, 0.9];
  return [0.025, 0.975];
}

export function runCore(opts: Omit<SimOpts, "spread">) {
  const off = scenarioOffsets(opts.scenario);
  const qMu = opts.qMu + off.q;
  const mMu = opts.mMu + off.m;
  const clientH = opts.clientH * off.cMul;
  const qAct = opts.quantumOn && opts.theft;
  const cAct = opts.clientOn && (opts.conflict || opts.outage);

  const rnd = mulberry32(SEED);
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
    const q = normal(rnd, qMu, opts.qSig);
    const m = normal(rnd, mMu, opts.mSig);
    const resid = clamp(opts.residual + normal(rnd, 0, 0.04), 0.01, 0.9);
    const hc = cAct ? Math.max(0, clientH * Math.exp(normal(rnd, 0, 0.35))) : 0;
    const hqPeak = qAct ? Math.max(0, opts.exploitH + normal(rnd, 0, 0.03)) : 0;

    let surv = 1;
    let survQ = 1;
    let survC = 1;
    const cum: number[] = [];
    const ann: number[] = [];
    const sv: number[] = [];

    for (const y of years) {
      const exposure = y < m ? 1 : resid;
      const hq = qAct && y >= q ? hqPeak * exposure : 0;
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
  };
}

function colQuantile(traj: number[][], yi: number, p: number) {
  const col = traj.map((t) => t[yi]!).sort((a, b) => a - b);
  return quantile(col, p);
}

export function runSim(opts: SimOpts): SimResult {
  const core = runCore(opts);
  const [loP, hiP] = spreadBounds(opts.spread);
  const { years, probs, cumTraj, annTraj, survTraj } = core;

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
    { label: "Scenario: quantum accel", patch: { scenario: "q_accel" } },
  ];
  const sensitivity = perturbs.map(({ label, patch }) => {
    const alt = runCore({ ...opts, ...patch });
    return { label, delta: quantile(alt.probs, 0.5) - baseMed };
  });

  return {
    years,
    selectedYear: opts.selectedYear,
    median: quantile(probs, 0.5),
    low: quantile(probs, loP),
    high: quantile(probs, hiP),
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
  };
}

export const DEFAULT_OPTS: SimOpts = {
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
};
