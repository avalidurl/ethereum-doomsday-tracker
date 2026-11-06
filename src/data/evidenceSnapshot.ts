import { PAGE_UPDATED, PAGE_VERSION } from "../sim/model";

/**
 * Authoritative source-coverage metadata for this publication.
 * Shared by the cached evidence snapshot and the Sources table — keep them identical.
 *
 * Reader-facing distinctions (do not blur these):
 * - Reviewed offline = owner read the cited materials before publish (6 full, 2 partial).
 * - Published results described = numbers/claims taken from papers/pages; harnesses not run here.
 * - Informs mechanism only = may shape narrative/framing; not a quantitatively fitted leaf hazard.
 * - Absent direct rate evidence = no public calibrated L1 outage/theft rate is claimed from these sources.
 * - This page never live-fetches, scrapes, trains, or auto-calibrates from sources when opened.
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
   * Separates offline review, paper description, and model use.
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
    statusLabel:
      "Reviewed offline · full (blog + PDF) · published scores from the paper; harness not run here · informs mechanism only, not a fitted L1 hazard",
    executedHere: false,
  },
  {
    id: "scone",
    title: "Anthropic smart contracts / SCONE",
    url: "https://www.anthropic.com/research/smart-contracts",
    coverage: "full",
    scope: "Cited Anthropic research pages (no separate peer-reviewed PDF located)",
    statusLabel:
      "Reviewed offline · full (cited pages) · published results described from the pages; harness not run here · informs mechanism only, not a fitted L1 hazard",
    executedHere: false,
  },
  {
    id: "hive",
    title: "Ethereum Hive",
    url: "https://hive.ethpandaops.io/",
    coverage: "partial",
    scope: "Public discovery.json + mainnet listing.jsonl aggregate — not every suite result file",
    statusLabel:
      "Reviewed offline · partial (public listing) · static summary on this page (not live-fetched) · not a calibrated L1 outage rate",
    executedHere: false,
  },
  {
    id: "google-ecdlp",
    title: "Google Quantum AI ECDLP note",
    url: "https://research.google/blog/safeguarding-cryptocurrency-by-disclosing-quantum-vulnerabilities-responsibly/",
    listedDate: "2026-03-31",
    coverage: "full",
    scope: "Research blog + primary whitepaper PDF",
    statusLabel:
      "Reviewed offline · full (blog + PDF) · informs resource vs hardware framing; not a fitted capability-year prior",
    executedHere: false,
  },
  {
    id: "ef-pq",
    title: "ethereum.org PQ roadmap",
    url: "https://ethereum.org/roadmap/security/quantum-resistance/",
    coverage: "full",
    scope: "ethereum.org quantum-resistance roadmap page",
    statusLabel:
      "Reviewed offline · full (page) · informs migration-stage ontology; not a fitted migration-year prior",
    executedHere: false,
  },
  {
    id: "gri-2025",
    title: "GRI Quantum Threat Timeline 2025",
    url: "https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/",
    coverage: "full",
    scope: "Landing + full report PDF + executive summary (RSA-2048 focus; not ported as ETH L1 odds)",
    statusLabel:
      "Reviewed offline · full (report PDF + exec) · RSA expert horizons cited; not ported as ETH L1 odds or a fitted leaf hazard",
    executedHere: false,
  },
  {
    id: "causis",
    title: "Causis CRQC",
    url: "https://quantum.causisresearch.com/",
    coverage: "full",
    scope: "Site page + referenced data.json anchors/baseline",
    statusLabel:
      "Reviewed offline · full (page + data.json) · static summary (UI not run at page load) · not executed as this site’s model",
    executedHere: false,
  },
  {
    id: "metaculus-rsa",
    title: "Metaculus RSA-2048 QC date",
    url: "https://www.metaculus.com/questions/30596/date-of-rsa-2048-quantum-factorization/",
    coverage: "partial",
    scope: "Public embed: resolution criteria, fine print, background, community forecast (API history incomplete)",
    statusLabel:
      "Reviewed offline · partial (criteria + forecast) · static summary on this page (not live-fetched) · optional RSA-proxy shape only; not ETH L1 odds",
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
    "Eight cited sources: 6 reviewed in full, 2 in partial scope (Hive public listing; Metaculus public embed).",
    "Reviewed offline before publish. This page shows a static summary — it does not fetch, scrape, or train on sources when opened.",
    "EVMbench and SCONE: published results are described from their papers/pages; those harnesses are not run on this site.",
    "Sources may inform mechanism notes. They are not quantitatively fitted into leaf hazard rates. Direct public calibrated rates for those L1 hazards remain absent.",
    "Model assumptions live in the prior registry and are separate from source review. Opening this panel does not change scenario probabilities.",
  ],
  weeklyReviewNote:
    "Owner source reviews (Mondays ≈10:00 Europe/Istanbul) propose updates in chat; the public page changes only after a deliberate publish.",
  modelUnchangedNote:
    "This panel is a cached summary only. It does not change scenario probabilities, and it is not a live data feed or calibration pipeline.",
  sources: SOURCE_COVERAGE,
} as const;

export type EvidenceSnapshot = typeof EVIDENCE_SNAPSHOT;

export function snapshotHasNoRemoteActions(snap: EvidenceSnapshot = EVIDENCE_SNAPSHOT): boolean {
  return snap.kind === "static_publication_snapshot" && snap.sources.every((s) => s.url.startsWith("https://"));
}

export function sourceDisplayTitle(s: SourceCoverage): string {
  return s.listedDate ? `${s.title} (${s.listedDate})` : s.title;
}

/** Phrases that must not appear in reader-facing publication copy. */
export const BANNED_PUBLIC_COPY_PHRASES = [
  "not ingested",
  "reference only / not ingested",
  "re-ingest",
  "ingestion",
  "dossier digested",
] as const;

export function collectPublicationCopyStrings(): string[] {
  const out: string[] = [];
  for (const s of SOURCE_COVERAGE) {
    out.push(s.statusLabel, s.scope, s.title);
  }
  out.push(...EVIDENCE_SNAPSHOT.semantics);
  out.push(EVIDENCE_SNAPSHOT.weeklyReviewNote, EVIDENCE_SNAPSHOT.modelUnchangedNote, EVIDENCE_SNAPSHOT.title);
  return out;
}
