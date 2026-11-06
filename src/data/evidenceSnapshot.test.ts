import { afterEach, describe, expect, it, vi } from "vitest";
import { EVIDENCE_SNAPSHOT, snapshotHasNoRemoteActions } from "./evidenceSnapshot";

describe("EVIDENCE_SNAPSHOT checked-in record", () => {
  it("is a static publication snapshot with publication version/date (not scrape-now)", () => {
    expect(EVIDENCE_SNAPSHOT.kind).toBe("static_publication_snapshot");
    expect(EVIDENCE_SNAPSHOT.publicationVersion).toMatch(/^\d+\.\d+\.\d+$/);
    expect(EVIDENCE_SNAPSHOT.publicationDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(EVIDENCE_SNAPSHOT.title.toLowerCase()).toContain("cached");
    expect(EVIDENCE_SNAPSHOT.semantics.some((s) => /does not run research/i.test(s))).toBe(true);
  });

  it("lists the known primary citations without inventing scrape timestamps", () => {
    expect(EVIDENCE_SNAPSHOT.sources.length).toBeGreaterThanOrEqual(8);
    for (const s of EVIDENCE_SNAPSHOT.sources) {
      expect(s.url.startsWith("https://")).toBe(true);
      expect(s.status.startsWith("reference") || s.status.includes("dossier")).toBe(true);
      expect(Object.keys(s)).not.toContain("scrapedAt");
      expect(Object.keys(s)).not.toContain("checkedAt");
    }
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
    expect(mod.EVIDENCE_SNAPSHOT.sources.length).toBeGreaterThan(0);
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
