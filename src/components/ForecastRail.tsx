import { useEffect, useState } from "react";
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
import {
  commitYearDraft,
  isValidYearDraft,
  yearDraftFromCommitted,
} from "../routing/yearDraft";
import { ForecastChart } from "./ForecastChart";
import { Histogram } from "./Histogram";

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
  const [yearDraft, setYearDraft] = useState(() => yearDraftFromCommitted(Y));
  const [yearFocused, setYearFocused] = useState(false);

  // Sync draft from slider/presets/reset only when not editing the field
  useEffect(() => {
    if (!yearFocused) setYearDraft(yearDraftFromCommitted(Y));
  }, [Y, yearFocused]);

  function commitYear() {
    const next = commitYearDraft(yearDraft, Y);
    setYearDraft(yearDraftFromCommitted(next));
    if (next !== Y) onChange({ selectedYear: next });
  }

  function revertYear() {
    setYearDraft(yearDraftFromCommitted(Y));
  }

  return (
    <aside className="rail" aria-label="Forecast controls">
      <div className="rail-label">Illustrative forecast rail</div>
      <div className="stat-strip">
        <div className="stat">
          <div className="v danger">{pct(sim.median)}</div>
          <div className="l">Yes by end-{Y}</div>
        </div>
        <div className="stat">
          <div className="v">{pct(1 - sim.median)}</div>
          <div className="l">No (complement)</div>
        </div>
        <div className="stat">
          <div className="v">
            {pct(sim.low)}–{pct(sim.high)}
          </div>
          <div className="l">{opts.spread}% model spread</div>
        </div>
        <div className="stat">
          <div className="v">{N_DRAWS}</div>
          <div className="l">draws · seed {SEED}</div>
        </div>
      </div>

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
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={yearDraft}
            aria-label="Year numeric"
            onFocus={() => setYearFocused(true)}
            onChange={(e) => {
              const raw = e.target.value;
              if (isValidYearDraft(raw)) setYearDraft(raw.trim() === "" ? raw : raw.replace(/[^\d]/g, "").slice(0, 4));
            }}
            onBlur={() => {
              setYearFocused(false);
              commitYear();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                (e.target as HTMLInputElement).blur();
              } else if (e.key === "Escape") {
                e.preventDefault();
                revertYear();
                setYearFocused(false);
                (e.target as HTMLInputElement).blur();
              }
            }}
          />
        </div>
        <div className="seg">
          {[2030, 2035, 2040, 2050].map((y) => (
            <button
              key={y}
              type="button"
              className={Y === y ? "on" : ""}
              onClick={() => {
                setYearFocused(false);
                onChange({ selectedYear: y });
              }}
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
          <span>Theft path</span>
          <input type="checkbox" checked={opts.theft} onChange={(e) => onChange({ theft: e.target.checked })} />
        </div>
        <div className="toggle-row">
          <span>Conflict path</span>
          <input type="checkbox" checked={opts.conflict} onChange={(e) => onChange({ conflict: e.target.checked })} />
        </div>
        <div className="toggle-row">
          <span>Outage ≥72h</span>
          <input type="checkbox" checked={opts.outage} onChange={(e) => onChange({ outage: e.target.checked })} />
        </div>
      </details>

      <details className="rail-group" open>
        <summary>Prior assumptions</summary>
        {(
          [
            ["qMu", "Q median year", 2028, 2055, 1, opts.qMu, (v: number) => ({ qMu: v })],
            ["qSig", "Q spread σ (y)", 0.5, 12, 0.5, opts.qSig, (v: number) => ({ qSig: v })],
            ["mMu", "Migration median", 2027, 2050, 1, opts.mMu, (v: number) => ({ mMu: v })],
            ["mSig", "Migration σ (y)", 0.5, 10, 0.5, opts.mSig, (v: number) => ({ mSig: v })],
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
          <label>Sensitivity (Δ median P)</label>
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

      <p className="rail-note">
        Synthetic priors only. Bands are model-spread intervals, not calibrated CIs. Disabled hazards contribute exactly
        zero.
      </p>
    </aside>
  );
}
