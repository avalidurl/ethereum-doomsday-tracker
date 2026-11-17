import { PAGE_UPDATED, PAGE_VERSION } from "../sim/model";

/**
 * Authoritative source-coverage metadata for this publication.
 * Shared by the cached evidence snapshot and the Sources table — keep them identical.
 *
 * Reader-facing distinctions (do not blur these):
 * - Reviewed offline = owner read the cited materials before publish (13 full, 4 partial).
 * - Context / narrative only = cited for background or examples; feeds no number in the model.
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
    scope:
      "Intro post (18 Feb 2026: 117 vulnerabilities, exploit 71.0%) + paper PDF (cdn.openai.com/evmbench/evmbench.pdf: 120 vulnerabilities, exploit 72.2%)",
    statusLabel:
      "Reviewed offline · full (blog + PDF) · blog and paper scores quoted separately, each credited to its own document; harness not run here · informs mechanism only, not a fitted L1 hazard",
    executedHere: false,
  },
  {
    id: "scone",
    title: "Anthropic smart contracts / SCONE",
    url: "https://www.anthropic.com/research/smart-contracts",
    listedDate: "2025-12-01",
    coverage: "full",
    scope: "Cited Anthropic research pages (no separate peer-reviewed PDF located)",
    statusLabel:
      "Reviewed offline · full (cited pages) · published results described from the pages; harness not run here · informs mechanism only, not a fitted L1 hazard",
    executedHere: false,
  },
  {
    id: "anthropic-exploit-evals",
    title: "Anthropic exploit-development evals (SCONE update)",
    url: "https://www.anthropic.com/research/exploit-evals",
    listedDate: "2026-05-22",
    coverage: "full",
    scope:
      "Research page: updated SCONE run on 12 exploits reported after 1 Jan 2026, simulation only, Best@8",
    statusLabel:
      "Reviewed offline · full (page) · smart-contract level only, kept out of the base-layer estimate; harness not run here · informs mechanism only, not a fitted L1 hazard",
    executedHere: false,
  },
  {
    id: "cyberchainbench",
    title: "CyberChainBench (EMNLP 2026 Findings)",
    url: "https://aclanthology.org/2026.findings-emnlp.1343/",
    coverage: "partial",
    scope:
      "Paper PDF: abstract, results tables, exploit and temporal-shift sections (541 DeFiHackLabs incidents, 9 EVM chains, mainnet-fork grading)",
    statusLabel:
      "Reviewed offline · partial (abstract + results sections) · independent academic benchmark; smart-contract level only, kept out of the base-layer estimate; harness not run here",
    executedHere: false,
  },
  {
    id: "binance-7702",
    title: "CoinDesk: how EIP-7702 was used in the Binance theft",
    url: "https://www.coindesk.com/tech/2026/10/30/here-s-how-one-ethereum-permission-let-an-attacker-drain-usd2-5-billion-from-binance",
    listedDate: "2026-10-30",
    coverage: "full",
    scope: "News report (full article); Binance's own account of the breach still incomplete",
    statusLabel:
      "Reviewed offline · full (article) · narrative example only: custody compromise, excluded from the odds by the resolution criteria",
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
    id: "nimbus-2026-02",
    title: "Nimbus v26.2.0 release notes (mainnet fork-off, 8 Feb 2026)",
    url: "https://github.com/status-im/nimbus-eth2/releases/tag/v26.2.0",
    listedDate: "2026-02-14",
    coverage: "full",
    scope: "Client team release notes describing the 8 Feb 2026 mainnet incident and fix",
    statusLabel:
      "Reviewed offline · full (release notes) · narrative client-bug example only; not used as an outage rate",
    executedHere: false,
  },
  {
    id: "lighthouse-10569",
    title: "Lighthouse PR #10569: pubkey cache fix before Gloas",
    url: "https://github.com/sigp/lighthouse/pull/10569",
    listedDate: "2026-11-12",
    coverage: "full",
    scope: "Pull request description; still open (not merged) when checked on 17 Nov 2026",
    statusLabel:
      "Reviewed offline · full (PR description; open, not merged, as of 17 Nov 2026) · narrative client-bug example only; not used as an outage rate",
    executedHere: false,
  },
  {
    id: "google-ecdlp",
    title: "Google Quantum AI ECDLP note",
    url: "https://research.google/blog/safeguarding-cryptocurrency-by-disclosing-quantum-vulnerabilities-responsibly/",
    listedDate: "2026-03-31",
    coverage: "full",
    scope:
      "Research blog + primary whitepaper PDF (dated 30 Mar 2026); arXiv 2603.28846 v2 (15 Apr 2026) checked — headline estimates unchanged",
    statusLabel:
      "Reviewed offline · full (blog + PDF; arXiv v2 of 15 Apr 2026 checked, estimates unchanged) · informs resource vs hardware framing; not a fitted capability-year prior",
    executedHere: false,
  },
  {
    id: "ionq-ecdlp",
    title: "IonQ trapped-ion ECDLP estimate (arXiv 2609.05625)",
    url: "https://arxiv.org/abs/2609.05625",
    listedDate: "2026-09-04",
    coverage: "partial",
    scope: "Abstract, contributions and runtime/footprint summary of the paper PDF",
    statusLabel:
      "Reviewed offline · partial (abstract + summary sections) · slower-hardware counterpart to Google's estimate; resources are not a calendar year; not a fitted capability-year prior",
    executedHere: false,
  },
  {
    id: "ef-pq",
    title: "ethereum.org PQ roadmap",
    url: "https://ethereum.org/roadmap/security/quantum-resistance/",
    coverage: "full",
    scope:
      "ethereum.org quantum-resistance roadmap page (last updated 23 Oct 2026; its activity section is dated April 2026)",
    statusLabel:
      "Reviewed offline · full (page last updated 23 Oct 2026; activity section dated April 2026) · informs migration-stage ontology; not a fitted migration-year prior",
    executedHere: false,
  },
  {
    id: "ef-protocol-priorities",
    title: "EF Protocol: Current and Emerging Priorities",
    url: "https://blog.ethereum.org/2026/09/07/protocol-priorities",
    listedDate: "2026-09-07",
    coverage: "full",
    scope: "EF Protocol cluster blog post (Dec 2029 quantum-resistance target; plan for Q-day as early as 2030)",
    statusLabel:
      "Reviewed offline · full (post) · context for the migration assumption; the assumption itself is unchanged; not a fitted migration-year prior",
    executedHere: false,
  },
  {
    id: "drake-2028",
    title: "Cointelegraph: Justin Drake's Dec 2028 hope (Devcon 8)",
    url: "https://cointelegraph.com/news/ethereum-post-quantum-transition-2028-target",
    listedDate: "2026-11-04",
    coverage: "full",
    scope: "News report of a Devcon talk; secondary source",
    statusLabel:
      "Reviewed offline · full (article) · unofficial, aspirational signal; not the EF roadmap; not used in the model",
    executedHere: false,
  },
  {
    id: "ethlabs-pqai27",
    title: "Ethlabs: pqai27 proposal",
    url: "https://ethlabs.org/writings/pqai27.html",
    listedDate: "2026-11-11",
    coverage: "full",
    scope: "Ethlabs post (also on Ethereum Magicians) proposing post-quantum readiness in 2027",
    statusLabel:
      "Reviewed offline · full (post) · unofficial proposal, not adopted; not the EF roadmap; not used in the model",
    executedHere: false,
  },
  {
    id: "gri-2025",
    title: "GRI Quantum Threat Timeline 2025",
    url: "https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/",
    listedDate: "2026-03-09",
    coverage: "full",
    scope:
      "Landing (9 Mar 2026, 26 experts) + full report PDF + executive summary (RSA-2048 focus; not ported as ETH L1 odds)",
    statusLabel:
      "Reviewed offline · full (report PDF + exec) · RSA expert horizons cited; not ported as ETH L1 odds or a fitted leaf hazard",
    executedHere: false,
  },
  {
    id: "causis",
    title: "Causis CRQC",
    url: "https://quantum.causisresearch.com/",
    coverage: "full",
    scope:
      "Site page + referenced data.json anchors/baseline; calibrates against GRI and builds in the Metaculus crowd; ECC ratio 0.38 from a 2017 paper, no Google 2026 estimate",
    statusLabel:
      "Reviewed offline · full (page + data.json) · calibrated against GRI and builds in Metaculus, so counted with them as one partly shared signal · not executed as this site’s model",
    executedHere: false,
  },
  {
    id: "metaculus-rsa",
    title: "Metaculus RSA-2048 QC date",
    url: "https://www.metaculus.com/questions/30596/date-of-rsa-2048-quantum-factorization/",
    coverage: "partial",
    scope:
      "Public embed: resolution criteria, fine print, background, community forecast (snapshot 17 Nov 2026; API history incomplete)",
    statusLabel:
      "Reviewed offline · partial (criteria + forecast, snapshot 17 Nov 2026: centre Nov 2033) · static summary on this page (not live-fetched) · optional RSA-proxy shape only; not ETH L1 odds",
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
    "Seventeen cited sources: 13 reviewed in full, 4 in partial scope (Hive public listing; Metaculus public embed; key sections of the IonQ and CyberChainBench papers).",
    "Six are context or narrative only and feed no number: the EF 2029 target, Drake’s 2028 hope, the Ethlabs 2027 proposal, the Binance theft, and two client-bug examples.",
    "Reviewed offline before publish. This page shows a static summary — it does not fetch, scrape, or train on sources when opened.",
    "EVMbench, SCONE, Anthropic’s 2026 exploit study and CyberChainBench: published results are described from their papers/pages; those harnesses are not run on this site. They concern smart contracts, not the base layer.",
    "GRI, Metaculus and Causis are counted as one partly shared signal: Causis calibrates against GRI and builds in the Metaculus forecast.",
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
