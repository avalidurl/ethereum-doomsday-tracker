import { useId, useState } from "react";
import { EVIDENCE_SNAPSHOT, sourceDisplayTitle } from "../data/evidenceSnapshot";

/**
 * Public cached evidence snapshot.
 * Toggle is local React state only — never fetch(), EventSource, or research triggers.
 */
export function EvidenceSnapshotPanel() {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const snap = EVIDENCE_SNAPSHOT;

  return (
    <div className="snapshot">
      <button
        type="button"
        className="snapshot-btn"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((v) => !v)}
      >
        {open ? "Hide evidence snapshot" : "Latest evidence snapshot (cached)"}
      </button>
      {open && (
        <aside
          id={panelId}
          className="snapshot-panel"
          role="region"
          aria-label="Cached evidence snapshot"
        >
          <p className="snapshot-kicker">
            Cached summary · publication v{snap.publicationVersion} · {snap.publicationDate} ({snap.timezoneNote}).
            Not a live feed.
          </p>
          <ul className="snapshot-semantics">
            {snap.semantics.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="snapshot-note">{snap.weeklyReviewNote}</p>
          <p className="snapshot-note">{snap.modelUnchangedNote}</p>
          <table className="data snapshot-table">
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">Coverage</th>
              </tr>
            </thead>
            <tbody>
              {snap.sources.map((s) => (
                <tr key={s.id}>
                  <td>
                    <a href={s.url} rel="noopener noreferrer">
                      {sourceDisplayTitle(s)}
                    </a>
                  </td>
                  <td>{s.statusLabel}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="snapshot-foot">
            Full list: <a href="#sources">Sources</a> · methods: <a href="#methods">Methods</a>
          </p>
        </aside>
      )}
    </div>
  );
}
