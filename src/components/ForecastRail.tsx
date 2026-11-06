import {
  type ChartId,
  type ScenarioId,
  type SimOpts,
  type SimResult,
  type SpreadId,
  YEAR_MAX,
  YEAR_MIN,
  N_DRAWS,
  SEED,
  pct,
} from "../sim/model";
import { ForecastChart } from "./ForecastChart";
import { Histogram } from "./Histogram";
import { YearDraftInput } from "./YearDraftInput";

type Props = {
  opts: SimOpts;
  sim: SimResult;
  chart: ChartId;
  setChart: (c: ChartId) => void;
  showBand: boolean;
  setShowBand: (v: boolean) => void;
  onChange: (patch: Partial<SimOpts>) => void;
  onReset: () => void;
};

export function ForecastRail({
  opts,
  sim,
  chart,
  setChart,
  showBand,
  setShowBand,
  onChange,
  onReset,
}: Props) {
  const Y = opts.selectedYear;

  return (
    <aside className="rail" aria-label="Forecast controls">
      <div className="rail-label">Scenario forecast rail (v0.3)</div>
      <div className="stat-strip">
        <div className="stat">
          <div className="v danger">{pct(sim.scenarioMean)}</div>
          <div className="l">Scenario mean Yes by end-{Y}</div>
        </div>
        <div className="stat">
          <div className="v">{pct(1 - sim.scenarioMean)}</div>
          <div className="l">Scenario mean No</div>
        </div>
        <div className="stat">
          <div className="v">
            {pct(sim.frechetLow)}–{pct(sim.frechetHigh)}
          </div>
          <div className="l">Fréchet (mean marginals)</div>
        </div>
        <div className="stat">
          <div className="v">
            {pct(sim.low)}–{pct(sim.high)}
          </div>
          <div className="l">{opts.spread}% epistemic (P|θ)</div>
        </div>
      </div>
      <p className="rail-note" style={{ marginTop: 0 }}>
        Headline is E[P(H|θ)], not the median of draws. Fréchet uses mean theft/client channel marginals (same
        estimand family). Epistemic band is quantiles of P(H|θ). Client conflict∪outage share one hazard. Draws{" "}
        {N_DRAWS} · seed {SEED}. p50={pct(sim.scenarioP50)}.
      </p>

      <div className="chart-frame">
        <span className="year-chip">{Y}</span>
        <ForecastChart sim={sim} chart={chart} year={Y} showBand={showBand} />
      </div>

      <div className="seg" role="group" aria-label="Chart series">
        {(
          [
            ["cumulative", "Cumulative"],
            ["annual", "Annual mass"],
            ["survival", "Survival"],
          ] as const
        ).map(([id, lab]) => (
          <button key={id} type="button" className={chart === id ? "on" : ""} onClick={() => setChart(id)}>
            {lab}
          </button>
        ))}
      </div>
      <div className="seg">
        <button type="button" className={showBand ? "on" : ""} onClick={() => setShowBand(true)}>
          + spread band
        </button>
        <button type="button" className={!showBand ? "on" : ""} onClick={() => setShowBand(false)}>
          median only
        </button>
      </div>

      <div className="ctrl">
        <label htmlFor="year-range">Deadline year (end of year)</label>
        <div className="row">
          <input
            id="year-range"
            type="range"
            min={YEAR_MIN}
            max={YEAR_MAX}
            step={1}
            value={Y}
            onChange={(e) => onChange({ selectedYear: Number(e.target.value) })}
            aria-valuemin={YEAR_MIN}
            aria-valuemax={YEAR_MAX}
            aria-valuenow={Y}
          />
          <YearDraftInput year={Y} onCommit={(y) => onChange({ selectedYear: y })} />
        </div>
        <div className="seg">
          {[2030, 2035, 2040, 2050].map((y) => (
            <button
              key={y}
              type="button"
              className={Y === y ? "on" : ""}
              onClick={() => onChange({ selectedYear: y })}
            >
              {y}
            </button>
          ))}
        </div>
      </div>

      <div className="ctrl">
        <label htmlFor="scenario">Scenario branch</label>
        <select
          id="scenario"
          value={opts.scenario}
          onChange={(e) => onChange({ scenario: e.target.value as ScenarioId })}
        >
          <option value="orderly">Orderly migration</option>
          <option value="q_accel">Quantum acceleration</option>
          <option value="delayed">Delayed mitigation</option>
          <option value="client">Client-consensus crisis</option>
        </select>
      </div>

      <div className="ctrl">
        <label>Model-spread width</label>
        <div className="seg">
          {(["50", "80", "95"] as SpreadId[]).map((s) => (
            <button key={s} type="button" className={opts.spread === s ? "on" : ""} onClick={() => onChange({ spread: s })}>
              {s}%
            </button>
          ))}
        </div>
        <p className="rail-note">Prior-driven parameter quantiles — not a confidence interval.</p>
      </div>

      <details className="rail-group" open>
        <summary>Layers & outcomes</summary>
        <div className="toggle-row">
          <span>Quantum signature / keys</span>
          <input type="checkbox" checked={opts.quantumOn} onChange={(e) => onChange({ quantumOn: e.target.checked })} />
        </div>
        <div className="toggle-row">
          <span>Client / consensus</span>
          <input type="checkbox" checked={opts.clientOn} onChange={(e) => onChange({ clientOn: e.target.checked })} />
        </div>
        <div className="toggle-row">
          <span>App / DeFi (excluded)</span>
          <input type="checkbox" checked={false} disabled readOnly />
        </div>
        <div className="toggle-row">
          <span>Channel: quantum theft</span>
          <input type="checkbox" checked={opts.theft} onChange={(e) => onChange({ theft: e.target.checked })} />
        </div>
        <div className="toggle-row">
          <span>Channel: client failure (conflict ∪ outage ≥72h)</span>
          <input
            type="checkbox"
            checked={opts.conflict || opts.outage}
            onChange={(e) => {
              const on = e.target.checked;
              onChange({ conflict: on, outage: on });
            }}
          />
        </div>
        <p className="rail-note">
          Taxonomy may name conflict and outage separately; this model uses one unidentified client hazard (no split
          weights).
        </p>
      </details>

      <details className="rail-group" open>
        <summary>Capability timeline source</summary>
        <div className="seg" role="group" aria-label="Timeline mode">
          {(
            [
              ["eth_assumption", "ETH ECDLP assumption"],
              ["rsa_proxy", "RSA Metaculus proxy"],
            ] as const
          ).map(([id, lab]) => (
            <button
              key={id}
              type="button"
              className={opts.timelineMode === id ? "on" : ""}
              onClick={() => {
                if (id === "rsa_proxy") {
                  onChange({
                    timelineMode: "rsa_proxy",
                    qMuOverride: false,
                    qMu: 2033.68,
                  });
                } else {
                  onChange({ timelineMode: "eth_assumption", qMuOverride: false, qMu: 2038 });
                }
              }}
            >
              {lab}
            </button>
          ))}
        </div>
        <p className="rail-note">
          RSA proxy uses Metaculus 30596 knots <strong>unshifted</strong> (source center ≈2033.7) unless you enable an
          explicit override. Not identification with Ethereum L1 failure. GRI RSA % not ported.
        </p>
      </details>

      <details className="rail-group" open>
        <summary>Prior assumptions</summary>
        {(
          [
            ["qMu", "Q center year", 2028, 2055, 1, opts.qMu, (v: number) => ({ qMu: v, qMuOverride: true })],
            ["qW", "Q knot width ×", 0.25, 3, 0.05, opts.qWidth, (v: number) => ({ qWidth: v })],
            ["mMu", "Migration center", 2027, 2050, 1, opts.mMu, (v: number) => ({ mMu: v })],
            ["mW", "M knot width ×", 0.25, 3, 0.05, opts.mWidth, (v: number) => ({ mWidth: v })],
            ["exploit", "Exploit hazard %/y", 0, 25, 0.5, opts.exploitH * 100, (v: number) => ({ exploitH: v / 100 })],
            ["resid", "Residual exposure %", 1, 60, 1, opts.residual * 100, (v: number) => ({ residual: v / 100 })],
            ["client", "Client hazard %/y", 0, 3, 0.05, opts.clientH * 100, (v: number) => ({ clientH: v / 100 })],
          ] as const
        ).map(([id, lab, min, max, step, val, patch]) => (
          <div className="ctrl" key={id}>
            <label htmlFor={id}>
              {lab}: {typeof val === "number" ? (Number.isInteger(step) ? val.toFixed(0) : val.toFixed(2)) : val}
            </label>
            <input
              id={id}
              type="range"
              min={min}
              max={max}
              step={step}
              value={val}
              onChange={(e) => onChange(patch(Number(e.target.value)))}
            />
          </div>
        ))}
      </details>

      <button type="button" className="btn" onClick={onReset} style={{ marginTop: "0.75rem" }}>
        Reset defaults
      </button>

      <details className="rail-group">
        <summary>Distribution & sensitivity</summary>
        <div className="ctrl">
          <label>P histogram at {Y}</label>
          <Histogram sim={sim} />
        </div>
        <div className="ctrl">
          <label>Sensitivity (Δ scenario mean)</label>
          {sim.sensitivity.map((s) => {
            const mag = Math.min(1, Math.abs(s.delta) / 0.08);
            const pos = s.delta >= 0;
            return (
              <div className="sens-bar" key={s.label}>
                <span className="lab">{s.label}</span>
                <span className="track">
                  <span
                    className="fill"
                    style={{
                      left: pos ? "50%" : `${50 - mag * 50}%`,
                      width: `${mag * 50}%`,
                    }}
                  />
                </span>
                <span className="num">
                  {s.delta >= 0 ? "+" : ""}
                  {pct(s.delta)}
                </span>
              </div>
            );
          })}
        </div>
      </details>

      <div className="ctrl">
        <label>Leaf marginals @ {Y}</label>
        <p className="rail-note">
          theft {pct(sim.leafMarginals.theft)} · client {pct(sim.leafMarginals.client)}
        </p>
      </div>
      <p className="rail-note">{sim.readout}</p>
      <p className="rail-note">
        Calibration: {sim.calibration.status === "pending_insufficient_resolved" ? "pending / insufficient resolved observations" : "scored"}.
        Disabled leaves contribute exactly zero.
      </p>
    </aside>
  );
}
