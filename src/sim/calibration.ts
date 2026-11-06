/**
 * Proper-scoring scaffolding + archive.
 * DISPLAY: calibration pending unless a defensible resolved proxy set exists.
 * Changing model odds ≠ calibration.
 */

export type ForecastArchiveRow = {
  id: string;
  question: string;
  forecastVersion: string;
  forecastAt: string; // ISO
  resolveBy: string;
  resolutionCriteria: string;
  /** Our model's stated forecast at freeze time — must be recorded before resolution */
  forecastP?: number;
  outcome?: 0 | 1;
  resolvedAt?: string;
  notes: string;
};

export type CalibrationStatus = {
  status: "pending_insufficient_resolved" | "scored";
  message: string;
  nResolved: number;
  brier?: number;
  logScore?: number;
};

/** Prospective scorecard — resolvable proxies; no fabricated outcomes. */
export const PROSPECTIVE_SCORECARD: ForecastArchiveRow[] = [
  {
    id: "proxy-metaculus-30596",
    question: "Metaculus 30596: RSA-2048 factored by quantum computer (year → Jan 1)",
    forecastVersion: "0.3.0",
    forecastAt: "2026-11-06T20:00:00Z",
    resolveBy: "2075-01-01",
    resolutionCriteria:
      "Jan 1 of year of first QC factorization per credible sources; >2074-12-31 if none; annul if classical first.",
    notes:
      "External elicited question — tracking as related CRQC proxy, NOT as Ethereum L1 failure. Our model does not claim this as its own calibrated forecast of ETH doom.",
  },
  {
    id: "proxy-eth-pq-mainnet-milestone",
    question: "Ethereum mainnet ships a protocol-level PQ signature path for EOAs (owner-adjudicated)",
    forecastVersion: "0.3.0",
    forecastAt: "2026-11-06T20:00:00Z",
    resolveBy: "2040-01-01",
    resolutionCriteria:
      "Yes if a mainnet hard fork enabling native PQ or hybrid PQ signatures for externally owned accounts is activated before resolveBy; else No. Adjudication note required at resolve.",
    notes: "Resolvable migration proxy — forecastP left unset until owner freezes a stated P.",
  },
];

/** Search result: no in-scope defensible resolved timestamped set with pre-outcome freezes for THIS model. */
export function evaluateCalibration(archive: ForecastArchiveRow[] = PROSPECTIVE_SCORECARD): CalibrationStatus {
  const resolved = archive.filter((r) => r.outcome === 0 || r.outcome === 1);
  if (resolved.length === 0) {
    return {
      status: "pending_insufficient_resolved",
      message:
        "Calibration pending / insufficient resolved observations. No defensible in-scope dataset of pre-outcome frozen forecasts with resolutions for this model. Elicited external forecasts (GRI, Metaculus) are not our calibration.",
      nResolved: 0,
    };
  }
  // If outcomes exist, score only rows with forecastP
  const scored = resolved.filter((r) => typeof r.forecastP === "number");
  if (scored.length === 0) {
    return {
      status: "pending_insufficient_resolved",
      message: "Outcomes exist but no frozen forecastP — cannot score.",
      nResolved: resolved.length,
    };
  }
  let brier = 0;
  let logScore = 0;
  for (const r of scored) {
    const p = Math.min(1 - 1e-12, Math.max(1e-12, r.forecastP!));
    const o = r.outcome!;
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
