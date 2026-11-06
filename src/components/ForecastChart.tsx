import type { ChartId, SimResult } from "../sim/model";
import { chartTickFractions, chartYMax } from "../routing/chartScale";

type Props = {
  sim: SimResult;
  chart: ChartId;
  year: number;
  showBand: boolean;
};

export function ForecastChart({ sim, chart, year, showBand }: Props) {
  const w = 360;
  const h = 150;
  const pad = { t: 18, r: 8, b: 18, l: 32 };
  const series =
    chart === "annual"
      ? { primary: sim.annMean, low: sim.annLow, high: sim.annHigh }
      : chart === "survival"
        ? { primary: sim.survMean, low: sim.survLow, high: sim.survHigh }
        : { primary: sim.cumMean, low: sim.cumLow, high: sim.cumHigh };

  // Axis must encompass primary mean even when epistemic band is flat near 0
  const vals = [
    ...series.primary,
    ...(showBand ? [...series.low, ...series.high] : []),
    ...(chart === "cumulative" ? [sim.scenarioMean] : []),
  ];
  const ymax = chartYMax(chart, vals);
  const ticks = chartTickFractions(ymax);
  const n = sim.years.length;
  const x = (i: number) => pad.l + ((w - pad.l - pad.r) * i) / Math.max(1, n - 1);
  const y = (v: number) => pad.t + (h - pad.t - pad.b) * (1 - v / ymax);
  const path = (arr: number[]) =>
    arr.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");

  const yi = Math.max(0, sim.years.indexOf(year));

  return (
    <svg viewBox={`0 0 ${w} ${h}`} role="img" aria-label={`${chart} forecast chart (scenario mean)`}>
      {ticks.map((v, idx) => {
        const yy = y(v);
        return (
          <g key={idx}>
            <line
              x1={pad.l}
              x2={w - pad.r}
              y1={yy}
              y2={yy}
              stroke="#cfc6b8"
              strokeWidth={0.5}
              strokeDasharray="2 3"
            />
            <text x={2} y={yy + 3} fontSize={8} fill="#6b6560" fontFamily="Source Code Pro, monospace">
              {(100 * v).toFixed(v >= 0.1 ? 0 : 1)}%
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
      <path d={path(series.primary)} fill="none" stroke="#8b0000" strokeWidth={1.8} />
      <line x1={x(yi)} x2={x(yi)} y1={pad.t} y2={h - pad.b} stroke="#8b0000" strokeWidth={1} />
      <circle cx={x(yi)} cy={y(series.primary[yi]!)} r={3} fill="#8b0000" />
    </svg>
  );
}
