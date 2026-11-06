/**
 * Versioned prior / evidence registry.
 * Each parameter links to source scope, date, units, and epistemic kind.
 * Elicited published forecasts ≠ this model's calibration.
 */

export type PriorKind =
  | "empirical"
  | "elicited_published"
  | "user_assumption"
  | "unidentified"
  | "scenario_stress";

export type PriorEntry = {
  id: string;
  label: string;
  units: string;
  kind: PriorKind;
  /** Exact source scope — not a claim the whole paper was used for this number */
  sourceScope: string;
  sourceUrl?: string;
  asOf: string;
  valueSummary: string;
  notes: string;
};

export const REGISTRY_VERSION = "0.3.0";
export const REGISTRY_AS_OF = "2026-11-06";

/** Metaculus 30596 — RSA-2048 factorization by QC (elicited crowd). NOT Ethereum ECDSA. */
export const METACULUS_RSA_KNOTS: { year: number; cdf: number }[] = [
  { year: 2030.45, cdf: 0.1 }, // ~10 Jun 2030
  { year: 2033.68, cdf: 0.5 }, // ~5 Sep 2033 community center
  { year: 2039.14, cdf: 0.9 }, // ~21 Feb 2039
];

/**
 * Default Ethereum ECDLP-capability timeline knots — user assumption.
 * Deliberately distinct from Metaculus RSA; wider / later. Not a port of GRI RSA %.
 */
export const ETH_ECDLP_ASSUMPTION_KNOTS: { year: number; cdf: number }[] = [
  { year: 2032, cdf: 0.1 },
  { year: 2038, cdf: 0.5 },
  { year: 2046, cdf: 0.9 },
];

/** Migration-complete year knots — user assumption informed by EF PQ roadmap existence, not a dated EF commitment. */
export const MIGRATION_ASSUMPTION_KNOTS: { year: number; cdf: number }[] = [
  { year: 2029, cdf: 0.1 },
  { year: 2032, cdf: 0.5 },
  { year: 2038, cdf: 0.9 },
];

export const PRIOR_REGISTRY: PriorEntry[] = [
  {
    id: "metaculus_rsa_2048_date",
    label: "RSA-2048 QC factorization date (crowd)",
    units: "calendar year (date question → Jan 1 of resolve year)",
    kind: "elicited_published",
    sourceScope:
      "Metaculus q30596 resolution criteria + recency-weighted community center/interval from public embed (2026-11-06). Not full authenticated API history.",
    sourceUrl: "https://www.metaculus.com/questions/30596/date-of-rsa-2048-quantum-factorization/",
    asOf: "2026-11-06",
    valueSummary: "center≈2033-09; ~2030-06–2039-02; N≈20–26 forecasters",
    notes:
      "RSA-2048 ≠ secp256k1 ECDLP. Must not be copied as Ethereum L1 failure probability. Fine print: classical factorization annuls.",
  },
  {
    id: "gri_2025_rsa_crqc",
    label: "GRI expert CRQC (RSA-2048 in 24h) likelihood bands",
    units: "probability bands over 10y / 15y horizons",
    kind: "elicited_published",
    sourceScope: "GRI Quantum Threat Timeline 2025b executive summary — RSA-2048 focus",
    sourceUrl: "https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/",
    asOf: "2026-11-06",
    valueSummary: "28–49% within 10y; 51–70% within 15y (26 experts)",
    notes: "Do not port these RSA percentages onto Ethereum ECDSA L1 doom. Display-only comparison in registry.",
  },
  {
    id: "eth_ecdlp_capability_year",
    label: "Year ECDLP-256 CRQC capability relevant to ETH at-rest risk",
    units: "calendar year",
    kind: "user_assumption",
    sourceScope:
      "User-assumption knots (default 2032/2038/2046). Informed by existence of Google ECDLP resource estimates + Metaculus RSA as related CRQC-era signal — not numerically identified with either.",
    sourceUrl: "https://quantumai.google/static/site-assets/downloads/cryptocurrency-whitepaper.pdf",
    asOf: "2026-11-06",
    valueSummary: "CDF knots 0.1@2032, 0.5@2038, 0.9@2046 (adjustable)",
    notes: "Google PDF: ETH threat framed as at-rest (account/admin/code/consensus/DA). Resource estimates ≠ calendar year.",
  },
  {
    id: "eth_migration_complete_year",
    label: "Year PQ migration + residual cleanup materially complete",
    units: "calendar year",
    kind: "user_assumption",
    sourceScope: "User-assumption knots; EF ethereum.org PQ page ontology only — no dated commitment extracted",
    sourceUrl: "https://ethereum.org/roadmap/security/quantum-resistance/",
    asOf: "2026-11-06",
    valueSummary: "CDF knots 0.1@2029, 0.5@2032, 0.9@2038 (adjustable)",
    notes: "Unidentified from public EF page alone; slider remains assumption.",
  },
  {
    id: "quantum_theft_peak_hazard",
    label: "Peak annual hazard for material L1-relevant quantum theft while exposed",
    units: "probability / year",
    kind: "unidentified",
    sourceScope: "No defensible public frequency series for CRQC-era ETH L1 theft",
    asOf: "2026-11-06",
    valueSummary: "Default 0.06 — user assumption / unidentified; not calibrated",
    notes: "EVMbench/SCONE are app-layer and excluded from this parameter.",
  },
  {
    id: "residual_exposure",
    label: "Residual key/TVS exposure after migration milestone",
    units: "fraction",
    kind: "unidentified",
    sourceScope: "Google dormant/at-rest framing qualitative only",
    asOf: "2026-11-06",
    valueSummary: "Default 0.18 — unidentified",
    notes: "Point value is an assumption for scenarios; identification bounds via Fréchet on leaves.",
  },
  {
    id: "client_annual_hazard",
    label: "Classical client/consensus annual hazard (conflict∪outage channel)",
    units: "probability / year",
    kind: "unidentified",
    sourceScope:
      "Hive public listing.jsonl is conformance health, not a calibrated finality-failure rate (dossier 2026-11-06).",
    sourceUrl: "https://hive.ethpandaops.io/generic/listing.jsonl",
    asOf: "2026-11-06",
    valueSummary: "Default 0.004 — unidentified; Hive not used as rate",
    notes: "Do not treat Hive fail counts as P(outage).",
  },
  {
    id: "scenario_client_stress_mult",
    label: "Client-stress scenario hazard multiplier",
    units: "dimensionless",
    kind: "scenario_stress",
    sourceScope: "Named stress only — not empirical",
    asOf: "2026-11-06",
    valueSummary: "×4 under scenario=client",
    notes: "Transparent stress knob, not a silent outcome multiplier on the headline event.",
  },
  {
    id: "causis_cluster",
    label: "Causis CRQC causal model (correlated with GRI/Metaculus)",
    units: "structural (anchors in data.json)",
    kind: "elicited_published",
    sourceScope: "causis data.json SSOT anchors/baseline (retrieved 2026-11-06) — not an independent vote",
    sourceUrl: "https://quantum.causisresearch.com/",
    asOf: "2026-11-06",
    valueSummary: "lreq_logical=6190; anchors N0,R2025,ECC_RATIO,BT_YEAR,Q0",
    notes: "Evidence cluster correlation — do not stack with GRI+Metaculus as independent.",
  },
];

export function registryById(id: string): PriorEntry | undefined {
  return PRIOR_REGISTRY.find((e) => e.id === id);
}
