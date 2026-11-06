import { PAGE_UPDATED, PAGE_VERSION } from "../sim/model";

/** Status strings mirrored from the Sources chapter — reference-only, not live fetches. */
export type SourceStatus =
  | "reference / not ingested"
  | "reference / not fetched"
  | "reference / not executed";

export type SnapshotSource = {
  id: string;
  title: string;
  url: string;
  status: SourceStatus;
  /** Optional publication or page date shown in the essay when known — not a scrape timestamp. */
  listedDate?: string;
};

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
    "This is a static record of primary sources cited in this publication.",
    "Statuses are reference-only; nothing here was scraped or ingested into the toy model at page load.",
    "Opening this panel does not run research, call APIs, or change forecast probabilities.",
    "Scheduled owner reviews may propose updates in private chat; the public site changes only after a deliberate publish.",
  ],
  weeklyReviewNote:
    "Owner-scheduled source reviews (Mondays ≈10:00 Europe/Istanbul, ±30 min) propose changes in chat only — no automatic research→publish or probability shifts.",
  modelUnchangedNote:
    "Synthetic priors and the seeded Monte Carlo are unchanged by viewing this snapshot. Bands remain model-spread intervals, not calibrated CIs.",
  sources: [
    {
      id: "evmbench",
      title: "OpenAI EVMbench",
      url: "https://openai.com/index/introducing-evmbench/",
      status: "reference / not ingested" as const,
      listedDate: "2026-02-18",
    },
    {
      id: "scone",
      title: "Anthropic smart contracts / SCONE",
      url: "https://www.anthropic.com/research/smart-contracts",
      status: "reference / not ingested" as const,
    },
    {
      id: "hive",
      title: "Ethereum Hive",
      url: "https://hive.ethpandaops.io/",
      status: "reference / not fetched" as const,
    },
    {
      id: "google-ecdlp",
      title: "Google Quantum AI ECDLP note",
      url: "https://research.google/blog/safeguarding-cryptocurrency-by-disclosing-quantum-vulnerabilities-responsibly/",
      status: "reference / not ingested" as const,
    },
    {
      id: "ef-pq",
      title: "ethereum.org PQ roadmap",
      url: "https://ethereum.org/roadmap/security/quantum-resistance/",
      status: "reference / not ingested" as const,
    },
    {
      id: "gri-2025",
      title: "GRI Quantum Threat Timeline 2025",
      url: "https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/",
      status: "reference / not ingested" as const,
    },
    {
      id: "causis",
      title: "Causis CRQC",
      url: "https://quantum.causisresearch.com/",
      status: "reference / not executed" as const,
    },
    {
      id: "metaculus-rsa",
      title: "Metaculus RSA-2048 QC date",
      url: "https://www.metaculus.com/questions/30596/date-of-rsa-2048-quantum-factorization/",
      status: "reference / not ingested" as const,
    },
  ],
} as const;

export type EvidenceSnapshot = typeof EVIDENCE_SNAPSHOT;

export function snapshotHasNoRemoteActions(snap: EvidenceSnapshot = EVIDENCE_SNAPSHOT): boolean {
  return snap.kind === "static_publication_snapshot" && snap.sources.every((s) => s.url.startsWith("https://"));
}
