/**
 * Proper-scoring scaffolding + archive.
 * DISPLAY: calibration pending unless a defensible resolved proxy set exists.
 */

export type ForecastArchiveRow = {
  id: string;
  question: string;
  forecastVersion: string;
  forecastAt: string;
  resolveBy: string;
  resolutionCriteria: string;
  forecastP?: number;
  outcome?: 0 | 1;
  resolvedAt?: string;
  notes: string;
};

export type CalibrationStatus = {
  status: "pending_insufficient_resolved" | "scored" | "invalid_rows";
  message: string;
  nResolved: number;
  brier?: number;
  logScore?: number;
};

export const PROSPECTIVE_SCORECARD: ForecastArchiveRow[] = [
  {
    id: "proxy-metaculus-30596",
    question: "Metaculus 30596: RSA-2048 factored by quantum computer (year → Jan 1)",
    forecastVersion: "0.3.2",
    forecastAt: "2026-11-06T20:00:00Z",
    resolveBy: "2075-01-01",
    resolutionCriteria:
      "Jan 1 of year of first QC factorization per credible sources; >2074-12-31 if none; annul if classical first.",
    notes: "External elicited proxy — not Ethereum L1 failure. No frozen forecastP for this model yet.",
  },
  {
    id: "proxy-eth-pq-mainnet-milestone",
    question: "Ethereum mainnet ships a protocol-level PQ signature path for EOAs (owner-adjudicated)",
    forecastVersion: "0.3.2",
    forecastAt: "2026-11-06T20:00:00Z",
    resolveBy: "2040-01-01",
    resolutionCriteria:
      "Yes if a mainnet hard fork enabling native PQ or hybrid PQ signatures for EOAs activates before resolveBy.",
    notes: "forecastP unset until owner freezes a stated P.",
  },
];

function validTs(iso: string): boolean {
  const t = Date.parse(iso);
  return Number.isFinite(t);
}

export function rowIsScoreable(r: ForecastArchiveRow): r is ForecastArchiveRow & {
  forecastP: number;
  outcome: 0 | 1;
  resolvedAt: string;
} {
  if (r.outcome !== 0 && r.outcome !== 1) return false;
  if (typeof r.forecastP !== "number" || !Number.isFinite(r.forecastP) || r.forecastP < 0 || r.forecastP > 1)
    return false;
  if (!r.resolvedAt || !validTs(r.forecastAt) || !validTs(r.resolvedAt)) return false;
  if (Date.parse(r.forecastAt) >= Date.parse(r.resolvedAt)) return false;
  return true;
}

export function evaluateCalibration(archive: ForecastArchiveRow[] = PROSPECTIVE_SCORECARD): CalibrationStatus {
  const resolvedAttempted = archive.filter((r) => r.outcome === 0 || r.outcome === 1);
  const scored = archive.filter(rowIsScoreable);
  if (resolvedAttempted.length > 0 && scored.length < resolvedAttempted.length) {
    return {
      status: "invalid_rows",
      message:
        "Some resolved rows fail guards (forecastAt < resolvedAt, finite p∈[0,1]). No scores reported.",
      nResolved: scored.length,
    };
  }
  if (scored.length === 0) {
    return {
      status: "pending_insufficient_resolved",
      message:
        "Calibration pending / insufficient resolved observations. No defensible in-scope dataset of pre-outcome frozen forecasts with resolutions for this model.",
      nResolved: 0,
    };
  }
  let brier = 0;
  let logScore = 0;
  for (const r of scored) {
    const p = Math.min(1 - 1e-12, Math.max(1e-12, r.forecastP));
    const o = r.outcome;
    brier += (p - o) ** 2;
    logScore += o === 1 ? Math.log(p) : Math.log(1 - p);
  }
  const n = scored.length;
  return {
    status: "scored",
    message: `Scored ${n} resolved rows.`,
    nResolved: n,
    brier: brier / n,
    logScore: logScore / n,
  };
}

export function brierScore(p: number, outcome: 0 | 1): number {
  return (p - outcome) ** 2;
}

export function logScore(p: number, outcome: 0 | 1): number {
  const x = Math.min(1 - 1e-12, Math.max(1e-12, p));
  return outcome === 1 ? Math.log(x) : Math.log(1 - x);
}
