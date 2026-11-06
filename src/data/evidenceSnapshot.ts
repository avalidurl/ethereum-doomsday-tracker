import { PAGE_UPDATED, PAGE_VERSION } from "../sim/model";

/**
 * Authoritative source-coverage metadata for this publication.
 * Shared by the cached evidence snapshot and the Sources table — keep them identical.
 *
 * Semantics:
 * - "Reviewed offline" = owner/dossier review before publish, not a fetch at page load.
 * - coverage full/partial matches the evidence dossier scope claims.
 * - Benchmarks (EVMbench, SCONE) may be content-reviewed without being executed here.
 * - Model assumptions live in the prior registry; they are not source “execution.”
 */

export type CoverageDepth = "full" | "partial";

export type SourceCoverage = {
  id: string;
  title: string;
  url: string;
  /** Optional source publication date (not a scrape timestamp). */
  listedDate?: string;
  coverage: CoverageDepth;
  /** Exact scope claimed — must not overclaim. */
  scope: string;
  /**
   * Reader-facing status for snapshot + Sources table.
   * Separates content review from benchmark execution.
   */
  statusLabel: string;
  /** Always false for harnesses on this site. */
  executedHere: false;
};

/** Single source of truth — do not duplicate status strings in Essay.tsx. */
export const SOURCE_COVERAGE: readonly SourceCoverage[] = [
  {
    id: "evmbench",
    title: "OpenAI EVMbench",
    url: "https://openai.com/index/introducing-evmbench/",
    listedDate: "2026-02-18",
    coverage: "full",
    scope: "Intro post + primary PDF (cdn.openai.com/evmbench/evmbench.pdf)",
    statusLabel: "Reviewed offline · full (blog + PDF) · benchmark not run here",
    executedHere: false,
  },
  {
    id: "scone",
    title: "Anthropic smart contracts / SCONE",
    url: "https://www.anthropic.com/research/smart-contracts",
    coverage: "full",
    scope: "Cited Anthropic research pages (no separate peer-reviewed PDF located)",
    statusLabel: "Reviewed offline · full (cited pages) · benchmark not run here",
    executedHere: false,
  },
  {
    id: "hive",
    title: "Ethereum Hive",
    url: "https://hive.ethpandaops.io/",
    coverage: "partial",
    scope: "Public discovery.json + mainnet listing.jsonl aggregate — not every suite result file",
    statusLabel: "Reviewed offline · partial (public listing) · not fetched at page load",
    executedHere: false,
  },
  {
    id: "google-ecdlp",
    title: "Google Quantum AI ECDLP note",
    url: "https://research.google/blog/safeguarding-cryptocurrency-by-disclosing-quantum-vulnerabilities-responsibly/",
    listedDate: "2026-03-31",
    coverage: "full",
    scope: "Research blog + primary whitepaper PDF",
    statusLabel: "Reviewed offline · full (blog + PDF)",
    executedHere: false,
  },
  {
    id: "ef-pq",
    title: "ethereum.org PQ roadmap",
    url: "https://ethereum.org/roadmap/security/quantum-resistance/",
    coverage: "full",
    scope: "ethereum.org quantum-resistance roadmap page",
    statusLabel: "Reviewed offline · full (page)",
    executedHere: false,
  },
  {
    id: "gri-2025",
    title: "GRI Quantum Threat Timeline 2025",
    url: "https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/",
    coverage: "full",
    scope: "Landing + full report PDF + executive summary (RSA-2048 focus; not ported as ETH L1 odds)",
    statusLabel: "Reviewed offline · full (report PDF + exec)",
    executedHere: false,
  },
  {
    id: "causis",
    title: "Causis CRQC",
    url: "https://quantum.causisresearch.com/",
    coverage: "full",
    scope: "Site page + referenced data.json anchors/baseline",
    statusLabel: "Reviewed offline · full (page + data.json) · UI not run at page load",
    executedHere: false,
  },
  {
    id: "metaculus-rsa",
    title: "Metaculus RSA-2048 QC date",
    url: "https://www.metaculus.com/questions/30596/date-of-rsa-2048-quantum-factorization/",
    coverage: "partial",
    scope: "Public embed: resolution criteria, fine print, background, community forecast (API history incomplete)",
    statusLabel: "Reviewed offline · partial (criteria + forecast) · not fetched at page load",
    executedHere: false,
  },
] as const;

/** @deprecated Prefer statusLabel on SOURCE_COVERAGE — kept only for type narrowing in older tests. */
export type SourceStatus = string;

export type SnapshotSource = SourceCoverage;

/**
 * Static publication snapshot embedded at build time.
 * Opening the UI panel only reads this object — no network, no research job, no model update.
 */
export const EVIDENCE_SNAPSHOT = {
  kind: "static_publication_snapshot" as const,
  title: "Latest evidence snapshot (cached)",
  publicationVersion: PAGE_VERSION,
  publicationDate: PAGE_UPDATED,
  timezoneNote: "Europe/Istanbul",
  semantics: [
    "Cached summary of primary sources cited in this publication (same list as Sources below).",
    "Evidence was reviewed offline before publish. Opening this page does not fetch or re-ingest sources.",
    "EVMbench and SCONE content may be reviewed without running those benchmarks here.",
    "Model assumptions are separate (prior registry); they are not the same as source execution.",
  ],
  weeklyReviewNote:
    "Owner source reviews (Mondays ≈10:00 Europe/Istanbul) propose updates in chat; the public page changes only after a deliberate publish.",
  modelUnchangedNote:
    "This panel is a cached summary only. It does not change scenario probabilities.",
  sources: SOURCE_COVERAGE,
} as const;

export type EvidenceSnapshot = typeof EVIDENCE_SNAPSHOT;

export function snapshotHasNoRemoteActions(snap: EvidenceSnapshot = EVIDENCE_SNAPSHOT): boolean {
  return snap.kind === "static_publication_snapshot" && snap.sources.every((s) => s.url.startsWith("https://"));
}

export function sourceDisplayTitle(s: SourceCoverage): string {
  return s.listedDate ? `${s.title} (${s.listedDate})` : s.title;
}
