/** @vitest-environment jsdom */
import { cleanup, render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { Essay } from "./Essay";
import { BANNED_PUBLIC_COPY_PHRASES } from "../data/evidenceSnapshot";

afterEach(() => cleanup());

describe("Essay public copy", () => {
  it("does not render outdated ingest/reference-only jargon", () => {
    const { container } = render(<Essay year={2035} scenario="orderly" onScenario={() => {}} />);
    const text = (container.textContent || "").toLowerCase();
    for (const phrase of BANNED_PUBLIC_COPY_PHRASES) {
      expect(text).not.toContain(phrase.toLowerCase());
    }
    expect(text).not.toMatch(/\bingest/i);
    expect(text).not.toContain("reference only / not ingested");
    // positive clarity anchors
    expect(text).toMatch(/6 sources reviewed in full/);
    expect(text).toMatch(/not quantitatively fitted/);
    expect(text).toMatch(/harness is not run on this site/);
  });
});
