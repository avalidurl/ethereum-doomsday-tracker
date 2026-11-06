/** @vitest-environment jsdom */
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { YearDraftInput } from "./YearDraftInput";

afterEach(() => {
  cleanup();
});

function Harness({ initial = 2035 }: { initial?: number }) {
  const [year, setYear] = useState(initial);
  return (
    <div>
      <span data-testid="committed">{year}</span>
      <YearDraftInput year={year} onCommit={setYear} />
    </div>
  );
}

function inputEl() {
  return screen.getByLabelText("Year numeric") as HTMLInputElement;
}

describe("YearDraftInput DOM events", () => {
  it("types 2040 + Enter and commits (matches preset path)", () => {
    render(<Harness initial={2035} />);
    const el = inputEl();
    el.focus();
    fireEvent.focus(el);
    fireEvent.change(el, { target: { value: "2040" } });
    fireEvent.keyDown(el, { key: "Enter" });
    // Enter triggers blur
    fireEvent.blur(el);
    expect(screen.getByTestId("committed").textContent).toBe("2040");
    expect(el.value).toBe("2040");
  });

  it("empty blur restores baseline committed year", () => {
    render(<Harness initial={2035} />);
    const el = inputEl();
    fireEvent.focus(el);
    fireEvent.change(el, { target: { value: "" } });
    fireEvent.blur(el);
    expect(screen.getByTestId("committed").textContent).toBe("2035");
    expect(el.value).toBe("2035");
  });

  it("Escape after typing 2045 restores 2035 and does NOT commit via blur", () => {
    const onCommit = vi.fn();
    function EscHarness() {
      const [year, setYear] = useState(2035);
      return (
        <div>
          <span data-testid="committed">{year}</span>
          <YearDraftInput
            year={year}
            onCommit={(y) => {
              onCommit(y);
              setYear(y);
            }}
          />
        </div>
      );
    }
    render(<EscHarness />);
    const el = inputEl();
    fireEvent.focus(el);
    // Select-all style replace → 2045
    fireEvent.change(el, { target: { value: "2" } });
    fireEvent.change(el, { target: { value: "20" } });
    fireEvent.change(el, { target: { value: "204" } });
    fireEvent.change(el, { target: { value: "2045" } });
    expect(el.value).toBe("2045");
    fireEvent.keyDown(el, { key: "Escape" });
    fireEvent.blur(el);
    expect(screen.getByTestId("committed").textContent).toBe("2035");
    expect(el.value).toBe("2035");
    expect(onCommit).not.toHaveBeenCalled();
  });

  it("mid-keystroke partial draft does not clamp until blur", () => {
    render(<Harness initial={2035} />);
    const el = inputEl();
    fireEvent.focus(el);
    fireEvent.change(el, { target: { value: "2" } });
    expect(el.value).toBe("2");
    expect(screen.getByTestId("committed").textContent).toBe("2035");
    fireEvent.change(el, { target: { value: "20" } });
    expect(el.value).toBe("20");
    fireEvent.blur(el);
    // "20" clamps to YEAR_MIN 2027 on commit
    expect(screen.getByTestId("committed").textContent).toBe("2027");
  });
});
