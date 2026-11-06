import { describe, expect, it } from "vitest";
import {
  commitYearDraft,
  isValidYearDraft,
  parseYearDraft,
  yearDraftFromCommitted,
} from "./yearDraft";

describe("year draft typing", () => {
  it("allows partial drafts without clamping to bounds", () => {
    expect(isValidYearDraft("")).toBe(true);
    expect(isValidYearDraft("2")).toBe(true);
    expect(isValidYearDraft("20")).toBe(true);
    expect(isValidYearDraft("204")).toBe(true);
    expect(isValidYearDraft("2040")).toBe(true);
    expect(parseYearDraft("2")).toBe(2); // not yet a committed year
    expect(commitYearDraft("2", 2035)).toBe(2027); // clamp only on commit
  });

  it("does not reject intermediate 2040 typing sequence", () => {
    // Select-all then type 2,0,4,0 — drafts stay free until commit
    const steps = ["2", "20", "204", "2040"];
    for (const s of steps) {
      expect(isValidYearDraft(s)).toBe(true);
    }
    expect(commitYearDraft("2040", 2035)).toBe(2040);
  });

  it("clamps only on commit", () => {
    expect(commitYearDraft("1999", 2035)).toBe(2027);
    expect(commitYearDraft("2099", 2035)).toBe(2055);
    expect(commitYearDraft("", 2035)).toBe(2035);
    expect(commitYearDraft("abc", 2035)).toBe(2035);
  });

  it("syncs draft from committed year", () => {
    expect(yearDraftFromCommitted(2047)).toBe("2047");
  });
});
