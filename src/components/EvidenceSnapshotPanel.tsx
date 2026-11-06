import { useId, useState } from "react";
import { EVIDENCE_SNAPSHOT } from "../data/evidenceSnapshot";

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
            Static publication snapshot · v{snap.publicationVersion} · Publication snapshot date:{" "}
            {snap.publicationDate} ({snap.timezoneNote}) — not a live scrape, not “checked today”, no checked-at
            claim. Until a reviewed update is published, this shows the current source list (not fresh findings).
          </p>
          <ul className="snapshot-semantics">
            {snap.semantics.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          <p className="snapshot-note">{snap.weeklyReviewNote}</p>
          <p className="snapshot-note">{snap.modelUnchangedNote}</p>
          <p className="snapshot-note">
            Serving this cached record uses ordinary page traffic only. It does not start paid AI research or change
            the forecast.
          </p>
          <table className="data snapshot-table">
            <thead>
              <tr>
                <th scope="col">Source</th>
                <th scope="col">Status</th>
              </tr>
            </thead>
            <tbody>
              {snap.sources.map((s) => (
                <tr key={s.id}>
                  <td>
                    <a href={s.url} rel="noopener noreferrer">
                      {s.title}
                      {"listedDate" in s && s.listedDate ? ` (${s.listedDate})` : ""}
                    </a>
                  </td>
                  <td>{s.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="snapshot-foot">
            Full bibliography: <a href="#sources">Sources</a> · methods: <a href="#methods">Methods</a>
          </p>
        </aside>
      )}
    </div>
  );
}
