import { useEffect, useRef, useState } from "react";
import {
  commitYearDraft,
  isValidYearDraft,
  yearDraftFromCommitted,
} from "../routing/yearDraft";

type Props = {
  /** Committed year from parent (slider / presets / sim). */
  year: number;
  onCommit: (year: number) => void;
  id?: string;
  "aria-label"?: string;
};

/**
 * Free-typing year field: draft string while focused; clamp on blur/Enter.
 * Escape restores the baseline captured at focus start and suppresses the
 * subsequent blur commit (blur would otherwise see a stale draft closure).
 */
export function YearDraftInput({ year, onCommit, id, "aria-label": ariaLabel }: Props) {
  const [draft, setDraft] = useState(() => yearDraftFromCommitted(year));
  const [focused, setFocused] = useState(false);
  const baselineRef = useRef(year);
  const draftRef = useRef(draft);
  const suppressBlurCommitRef = useRef(false);

  draftRef.current = draft;

  // Sync from parent when not editing (slider / presets / reset).
  useEffect(() => {
    if (!focused) setDraft(yearDraftFromCommitted(year));
  }, [year, focused]);

  function commitFromDraft(raw: string, fallback: number) {
    const next = commitYearDraft(raw, fallback);
    setDraft(yearDraftFromCommitted(next));
    if (next !== year) onCommit(next);
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="numeric"
      pattern="[0-9]*"
      value={draft}
      aria-label={ariaLabel ?? "Year numeric"}
      onFocus={() => {
        baselineRef.current = year;
        suppressBlurCommitRef.current = false;
        setFocused(true);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        if (!isValidYearDraft(raw)) return;
        const next = raw.trim() === "" ? raw : raw.replace(/[^\d]/g, "").slice(0, 4);
        setDraft(next);
      }}
      onBlur={() => {
        setFocused(false);
        if (suppressBlurCommitRef.current) {
          suppressBlurCommitRef.current = false;
          setDraft(yearDraftFromCommitted(baselineRef.current));
          return;
        }
        commitFromDraft(draftRef.current, baselineRef.current);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          // Commit via blur path so one code path owns validation.
          (e.target as HTMLInputElement).blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          suppressBlurCommitRef.current = true;
          const restored = yearDraftFromCommitted(baselineRef.current);
          setDraft(restored);
          draftRef.current = restored;
          (e.target as HTMLInputElement).blur();
        }
      }}
    />
  );
}
