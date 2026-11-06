import type { SimResult, ChartId } from "../sim/model";

type Props = {
  sim: SimResult;
  chart: ChartId;
  year: number;
  showBand: boolean;
};

export function ForecastChart({ sim, chart, year, showBand }: Props) {
  const w = 320;
  const h = 140;
  const pad = { t: 18, r: 8, b: 18, l: 28 };
  const series =
    chart === "annual"
      ? { med: sim.annMed, low: sim.annLow, high: sim.annHigh }
      : chart === "survival"
        ? { med: sim.survMed, low: sim.survLow, high: sim.survHigh }
        : { med: sim.cumMed, low: sim.cumLow, high: sim.cumHigh };

  const vals = [...series.med, ...(showBand ? [...series.low, ...series.high] : [])];
  const ymax = Math.max(0.08, ...vals) * 1.15;
  const n = sim.years.length;
  const x = (i: number) => pad.l + ((w - pad.l - pad.r) * i) / Math.max(1, n - 1);
  const y = (v: number) => pad.t + (h - pad.t - pad.b) * (1 - v / ymax);
  const path = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  const yi = Math.max(0, sim.years.indexOf(year));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${chart} forecast chart`}>
      {[0, 0.5, 1].map((t) => {
        const v = ymax * t;
        const yy = y(v);
        return (
          <g key={t}>
            <line x1={pad.l} x2={w - pad.r} y1={yy} y2={yy} stroke="#cfc6b8" strokeWidth={0.5} strokeDasharray="2 3" />
            <text x={2} y={yy + 3} fontSize={8} fill="#6b6560" fontFamily="Source Code Pro, monospace">
              {(100 * v).toFixed(0)}%
            </text>
          </g>
        );
      })}
      {showBand && (
        <path
          d={`${path(series.high)} ${path([...series.low].reverse()).replace(/^M/, "L")} Z`}
          fill="rgba(139,0,0,0.12)"
          stroke="none"
        />
      )}
      {showBand && (
        <>
          <path d={path(series.low)} fill="none" stroke="#1a1714" strokeWidth={1} strokeDasharray="2 2" opacity={0.55} />
          <path d={path(series.high)} fill="none" stroke="#1a1714" strokeWidth={1} strokeDasharray="2 2" opacity={0.55} />
        </>
      )}
      <path d={path(series.med)} fill="none" stroke="#8b0000" strokeWidth={1.6} strokeDasharray="1.5 2.5" />
      <line x1={x(yi)} x2={x(yi)} y1={pad.t} y2={h - pad.b} stroke="#8b0000" strokeWidth={1} />
      <circle cx={x(yi)} cy={y(series.med[yi]!)} r={3} fill="#8b0000" />
    </svg>
  );
}
