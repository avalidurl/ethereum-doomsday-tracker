/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { EvidenceSnapshotPanel } from "./EvidenceSnapshotPanel";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("EvidenceSnapshotPanel", () => {
  it("toggles a cached snapshot region without calling fetch", () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);

    render(<EvidenceSnapshotPanel />);
    const btn = screen.getByRole("button", { name: /latest evidence snapshot \(cached\)/i });
    expect(btn.getAttribute("aria-expanded")).toBe("false");
    expect(screen.queryByRole("region", { name: /cached evidence snapshot/i })).toBeNull();

    fireEvent.click(btn);
    expect(btn.getAttribute("aria-expanded")).toBe("true");
    const region = screen.getByRole("region", { name: /cached evidence snapshot/i });
    expect(region.textContent).toMatch(/static publication snapshot/i);
    expect(region.textContent).toMatch(/Publication snapshot date:/i);
    expect(region.textContent).toMatch(/current source list/i);
    expect(region.textContent).toMatch(/does not start paid AI research/i);
    expect(region.textContent).toMatch(/not a live scrape/i);
    expect(region.textContent).not.toMatch(/check for updates/i);
    expect(screen.getByText(/OpenAI EVMbench/)).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /hide evidence snapshot/i }));
    expect(screen.queryByRole("region", { name: /cached evidence snapshot/i })).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
