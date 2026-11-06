import { afterEach, describe, expect, it, vi } from "vitest";
import {
  BANNED_PUBLIC_COPY_PHRASES,
  collectPublicationCopyStrings,
  EVIDENCE_SNAPSHOT,
  SOURCE_COVERAGE,
  snapshotHasNoRemoteActions,
} from "./evidenceSnapshot";

describe("EVIDENCE_SNAPSHOT checked-in record", () => {
  it("is a static publication snapshot with publication version/date (not scrape-now)", () => {
    expect(EVIDENCE_SNAPSHOT.kind).toBe("static_publication_snapshot");
    expect(EVIDENCE_SNAPSHOT.publicationVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(EVIDENCE_SNAPSHOT.publicationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(EVIDENCE_SNAPSHOT.title.toLowerCase()).toContain("cached");
    expect(EVIDENCE_SNAPSHOT.semantics.some((s) => /does not fetch/i.test(s))).toBe(true);
    expect(EVIDENCE_SNAPSHOT.semantics.some((s) => /6 reviewed in full/i.test(s))).toBe(true);
    expect(EVIDENCE_SNAPSHOT.semantics.some((s) => /not quantitatively fitted/i.test(s))).toBe(true);
  });

  it("shares one authoritative SOURCE_COVERAGE list with honest full/partial scopes", () => {
    expect(EVIDENCE_SNAPSHOT.sources).toBe(SOURCE_COVERAGE);
    expect(SOURCE_COVERAGE.length).toBe(8);
    const full = SOURCE_COVERAGE.filter((s) => s.coverage === "full");
    const partial = SOURCE_COVERAGE.filter((s) => s.coverage === "partial");
    expect(full.map((s) => s.id).sort()).toEqual(
      ["causis", "ef-pq", "evmbench", "google-ecdlp", "gri-2025", "scone"].sort(),
    );
    expect(partial.map((s) => s.id).sort()).toEqual(["hive", "metaculus-rsa"].sort());
    for (const s of SOURCE_COVERAGE) {
      expect(s.url.startsWith("https://")).toBe(true);
      expect(s.statusLabel.toLowerCase()).toContain("reviewed offline");
      expect(s.executedHere).toBe(false);
      expect(Object.keys(s)).not.toContain("scrapedAt");
      expect(Object.keys(s)).not.toContain("checkedAt");
    }
    expect(SOURCE_COVERAGE.find((s) => s.id === "evmbench")!.statusLabel).toMatch(/harness not run here/i);
    expect(SOURCE_COVERAGE.find((s) => s.id === "hive")!.statusLabel).toMatch(/partial/i);
    expect(SOURCE_COVERAGE.find((s) => s.id === "hive")!.statusLabel).toMatch(/not a calibrated L1 outage rate/i);
  });

  it("bans outdated ingest/reference jargon in publication copy strings", () => {
    const blob = collectPublicationCopyStrings().join("\n").toLowerCase();
    for (const phrase of BANNED_PUBLIC_COPY_PHRASES) {
      expect(blob).not.toContain(phrase.toLowerCase());
    }
    // also ban bare 'ingested' / 'ingest' stems in these strings
    expect(blob).not.toMatch(/\bingest/i);
  });

  it("snapshotHasNoRemoteActions stays true for the checked-in object", () => {
    expect(snapshotHasNoRemoteActions()).toBe(true);
  });
});

describe("no network side effects on module load", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("does not call fetch when the snapshot module is evaluated", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    vi.resetModules();
    const mod = await import("./evidenceSnapshot");
    expect(mod.SOURCE_COVERAGE.length).toBe(8);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
