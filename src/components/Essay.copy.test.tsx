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
    expect(text).toMatch(/7 sources reviewed in full/);
    expect(text).toMatch(/not quantitatively fitted/);
    expect(text).toMatch(/harness is not run on this site/);
    // v0.3.5: blog vs paper EVMbench numbers credited separately
    expect(text).toMatch(/the blog post: 117 curated vulnerabilities/);
    expect(text).toMatch(/the paper pdf: 120 vulnerabilities/);
    expect(text).toMatch(/kept out of the base-layer estimate/);
  });
});
