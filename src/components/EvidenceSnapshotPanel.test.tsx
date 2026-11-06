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
    expect(region.textContent).toMatch(/Cached summary/i);
    expect(region.textContent).toMatch(/Not a live feed/i);
    expect(region.textContent).toMatch(/does not fetch/i);
    expect(region.textContent).not.toMatch(/checked-at/i);
    expect(region.textContent).not.toMatch(/not ingested/i);
    expect(screen.getByText(/OpenAI EVMbench/)).toBeTruthy();
    expect(region.textContent).toMatch(/Reviewed offline · full \(blog \+ PDF\)/);
    expect(region.textContent).toMatch(/6 reviewed in full/i);
    expect(region.textContent).toMatch(/not quantitatively fitted/i);
    expect(region.textContent).not.toMatch(/\bingest/i);
    expect(fetchSpy).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("button", { name: /hide evidence snapshot/i }));
    expect(screen.queryByRole("region", { name: /cached evidence snapshot/i })).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
