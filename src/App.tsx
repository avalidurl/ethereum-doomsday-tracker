import { useEffect, useMemo, useState } from "react";
import { Essay } from "./components/Essay";
import { EvidenceSnapshotPanel } from "./components/EvidenceSnapshotPanel";
import { ForecastRail } from "./components/ForecastRail";
import {
  DEFAULT_OPTS,
  type ChartId,
  type SimOpts,
  runSim,
  clamp,
  YEAR_MIN,
  YEAR_MAX,
  PAGE_VERSION,
} from "./sim/model";
import "./styles/editorial.css";

/** Forecast state lives in ?query so #anchors (Sources/Methods/…) keep working. */
function parseQuery(): Partial<SimOpts> & { chart?: ChartId; band?: boolean } {
  const sp = new URLSearchParams(window.location.search);
  const out: Partial<SimOpts> & { chart?: ChartId; band?: boolean } = {};
  const num = (k: string) => {
    const v = sp.get(k);
    if (v == null || v === "") return undefined;
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  };
  const y = num("y");
  if (y != null) out.selectedYear = clamp(Math.round(y), YEAR_MIN, YEAR_MAX);
  const qMu = num("qMu"); if (qMu != null) out.qMu = qMu;
  const qWidth = num("qW"); if (qWidth != null) out.qWidth = qWidth;
  // legacy qSig ignored (was dead Normal σ)
  const mMu = num("mMu"); if (mMu != null) out.mMu = mMu;
  const mWidth = num("mW"); if (mWidth != null) out.mWidth = mWidth;
  const ex = num("ex"); if (ex != null) out.exploitH = ex / 100;
  const re = num("re"); if (re != null) out.residual = re / 100;
  const cl = num("cl"); if (cl != null) out.clientH = cl / 100;
  const sc = sp.get("sc");
  if (sc === "orderly" || sc === "q_accel" || sc === "delayed" || sc === "client") out.scenario = sc;
  const spv = sp.get("sp");
  if (spv === "50" || spv === "80" || spv === "95") out.spread = spv;
  const ch = sp.get("ch");
  if (ch === "cumulative" || ch === "annual" || ch === "survival") out.chart = ch;
  if (sp.get("band") === "0") out.band = false;
  if (sp.get("band") === "1") out.band = true;
  if (sp.get("q") === "0") out.quantumOn = false;
  if (sp.get("q") === "1") out.quantumOn = true;
  if (sp.get("c") === "0") out.clientOn = false;
  if (sp.get("c") === "1") out.clientOn = true;
  if (sp.get("th") === "0") out.theft = false;
  if (sp.get("th") === "1") out.theft = true;
  if (sp.get("cf") === "0") out.conflict = false;
  if (sp.get("cf") === "1") out.conflict = true;
  if (sp.get("ou") === "0") out.outage = false;
  if (sp.get("ou") === "1") out.outage = true;
  if (sp.get("qOver") === "1") out.qMuOverride = true;
  if (sp.get("qOver") === "0") out.qMuOverride = false;
  const tm = sp.get("tm");
  if (tm === "eth_assumption" || tm === "rsa_proxy") out.timelineMode = tm;
  return out;
}

function writeQuery(opts: SimOpts, chart: ChartId, showBand: boolean) {
  const sp = new URLSearchParams();
  sp.set("y", String(opts.selectedYear));
  sp.set("sc", opts.scenario);
  sp.set("sp", opts.spread);
  sp.set("ch", chart);
  sp.set("band", showBand ? "1" : "0");
  sp.set("qMu", String(opts.qMu));
  sp.set("qW", String(opts.qWidth));
  sp.set("mMu", String(opts.mMu));
  sp.set("mW", String(opts.mWidth));
  sp.set("ex", String(Math.round(opts.exploitH * 1000) / 10));
  sp.set("re", String(Math.round(opts.residual * 100)));
  sp.set("cl", String(Math.round(opts.clientH * 10000) / 100));
  sp.set("q", opts.quantumOn ? "1" : "0");
  sp.set("c", opts.clientOn ? "1" : "0");
  sp.set("th", opts.theft ? "1" : "0");
  sp.set("cf", opts.conflict ? "1" : "0");
  sp.set("ou", opts.outage ? "1" : "0");
  sp.set("tm", opts.timelineMode);
  sp.set("qOver", opts.qMuOverride ? "1" : "0");
  const next = sp.toString();
  const cur = window.location.search.replace(/^\?/, "");
  if (cur !== next) {
    const url = `${window.location.pathname}?${next}${window.location.hash}`;
    history.replaceState(null, "", url);
  }
}

export default function App() {
  const initial = parseQuery();
  const [opts, setOpts] = useState<SimOpts>({ ...DEFAULT_OPTS, ...initial });
  const [chart, setChart] = useState<ChartId>(initial.chart ?? "cumulative");
  const [showBand, setShowBand] = useState(initial.band ?? true);

  const sim = useMemo(() => runSim(opts), [opts]);

  useEffect(() => {
    writeQuery(opts, chart, showBand);
  }, [opts, chart, showBand]);

  function patch(p: Partial<SimOpts>) {
    setOpts((o) => ({ ...o, ...p }));
  }

  return (
    <>
      <nav className="site-nav">
        <a className="brand" href="#thesis">
          Ethereum Doomsday Tracker
        </a>
        <div className="links">
          <a href="#scenarios">Scenarios</a>
          <a href="#resolution">Resolution</a>
          <a href="#methods">Methods</a>
          <a href="#sources">Sources</a>
        </div>
      </nav>

      <header className="masthead">
        <span className="lead-word">an</span>
        <h1>Ethereum Doomsday Tracker</h1>
        <p className="deck">
          L1 SYSTEMIC-SECURITY SCENARIO MODEL ·{" "}
          <em>Fréchet identification bounds</em> · EVIDENCE-LINKED PRIORS · CALIBRATION
          PENDING
        </p>
        <p className="byline">Original risk publication</p>
        <p className="date">Web edition, November 6, 2026</p>
        <div className="disclaimer-pill">v0.3.2 scenario mean · Fréchet on mean marginals · calibration pending</div>
        <EvidenceSnapshotPanel />
      </header>

      <div className="layout">
        <Essay
          year={opts.selectedYear}
          scenario={opts.scenario}
          onScenario={(s) => patch({ scenario: s })}
        />
        <ForecastRail
          opts={opts}
          sim={sim}
          chart={chart}
          setChart={setChart}
          showBand={showBand}
          setShowBand={setShowBand}
          onChange={patch}
          onReset={() => {
            setOpts({ ...DEFAULT_OPTS });
            setChart("cumulative");
            setShowBand(true);
          }}
        />
      </div>

            <footer className="site-foot">
        {"Ethereum Doomsday Tracker · v" + PAGE_VERSION + " · "}
        <a href="#sources">Sources</a>
        {" · "}
        <a href="#methods">Methods</a>
        {" · "}
        Scenario composition · not calibrated odds
      </footer>
    </>
  );
}
