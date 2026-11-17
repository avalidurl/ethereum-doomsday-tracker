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

export const REGISTRY_VERSION = "0.3.2";
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
      "Metaculus q30596 resolution criteria + recency-weighted community center/interval from public embed. Model knots = 2026-11-06 snapshot (unchanged on the 2026-11-09 check); page rechecked 2026-11-17. Not full authenticated API history.",
    sourceUrl: "https://www.metaculus.com/questions/30596/date-of-rsa-2048-quantum-factorization/",
    asOf: "2026-11-17",
    valueSummary:
      "Model knots (2026-11-06/09 snapshot): center≈Sep 2033; ~Jun 2030–Feb 2039. Recheck 2026-11-17: page shows Nov 2033 (16 Jul 2030–Mar 2039); 26 forecasters on the page, 21 in the latest aggregation (20 on 2026-11-09)",
    notes:
      "RSA-2048 ≠ secp256k1 ECDLP. Must not be copied as Ethereum L1 failure probability. Fine print: classical factorization annuls. Knots are frozen at the cited snapshot; moving them to the 2026-11-17 values is a model change that needs owner approval.",
  },
  {
    id: "gri_2025_rsa_crqc",
    label: "GRI expert CRQC (RSA-2048 in 24h) likelihood bands",
    units: "probability bands over 10y / 15y horizons",
    kind: "elicited_published",
    sourceScope:
      "GRI Quantum Threat Timeline 2025b (landing dated 9 Mar 2026) executive summary + full report — RSA-2048 focus",
    sourceUrl: "https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/",
    asOf: "2026-11-17",
    valueSummary:
      "28–49% within 10y; 51–70% within 15y (26 experts); full report, cautious reading: average ≈69% by 20y",
    notes:
      "Do not port these RSA percentages onto Ethereum ECDSA L1 doom. Display-only comparison in registry. The ≈69% by 20 years is the report's 'pessimistic' (lowest-compatible) average. Causis quotes a 69–86% 20-year band; the 86% figure was not found in the GRI report text.",
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
    notes:
      "Google PDF: ETH threat framed as at-rest (account/admin/code/consensus/DA). Resource estimates ≠ calendar year. arXiv 2603.28846 v2 (15 Apr 2026) keeps the headline estimates (≤1200 logical/≤90M Toffoli or ≤1450/≤70M; <500k physical).",
  },
  {
    id: "eth_migration_complete_year",
    label: "Year PQ migration + residual cleanup materially complete",
    units: "calendar year",
    kind: "user_assumption",
    sourceScope:
      "User-assumption knots; EF ethereum.org PQ page ontology only (page last updated 2026-10-23; activity section dated April 2026) — no dated commitment extracted",
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
    valueSummary: "Default 0.08 — restored legacy unidentified assumption; not calibrated",
    notes:
      "EVMbench, SCONE and Anthropic's May 2026 exploit study are smart-contract (app-layer) evidence and excluded from this parameter.",
  },
  {
    id: "residual_exposure",
    label: "Residual key/TVS exposure after migration milestone",
    units: "fraction",
    kind: "unidentified",
    sourceScope: "Google dormant/at-rest framing qualitative only",
    asOf: "2026-11-06",
    valueSummary: "Default 0.15 — restored legacy unidentified assumption",
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
    valueSummary: "Default 0.005 — restored legacy unidentified assumption; Hive not used as rate",
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
    label: "Causis CRQC causal model (depends on GRI/Metaculus)",
    units: "structural (anchors in data.json)",
    kind: "elicited_published",
    sourceScope:
      "causis data.json SSOT anchors/baseline + calibration block (retrieved 2026-11-06; unchanged 2026-11-09 and 2026-11-17) — not an independent vote",
    sourceUrl: "https://quantum.causisresearch.com/",
    asOf: "2026-11-17",
    valueSummary: "lreq_logical=6190; anchors N0,R2025,ECC_RATIO=0.38,BT_YEAR,Q0",
    notes:
      "Causis names GRI 2025 as its primary calibration benchmark and builds in the Metaculus crowd (~2033), so GRI, Metaculus and Causis count as one partly shared signal — do not stack them as independent. Its ECC_RATIO=0.38 comes from Roetteler et al. 2017 (~2,330 vs ~6,190 logical qubits); data.json has no entry for Google's 2026 ECDLP estimate.",
  },
];

export function registryById(id: string): PriorEntry | undefined {
  return PRIOR_REGISTRY.find((e) => e.id === id);
}
