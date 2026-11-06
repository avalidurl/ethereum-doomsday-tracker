import type { SimResult } from "../sim/model";

export function Histogram({ sim }: { sim: SimResult }) {
  const w = 320;
  const h = 90;
  const n = sim.hist.counts.length;
  const barW = w / n;
  return (
    <svg className="hist-svg" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Model probability histogram with scenario mean marker">
      {sim.hist.counts.map((c, i) => {
        const bh = Math.max(1, c * (h - 16));
        const center = sim.hist.centers[i]!;
        const inBand = center >= sim.low && center <= sim.high;
        return (
          <rect
            key={i}
            x={i * barW + 0.5}
            y={h - 12 - bh}
            width={Math.max(1, barW - 1)}
            height={bh}
            fill={inBand ? "#8b0000" : "#cfc6b8"}
            opacity={inBand ? 0.85 : 0.55}
          />
        );
      })}
      <line
        x1={sim.scenarioMean * w}
        x2={sim.scenarioMean * w}
        y1={2}
        y2={h - 12}
        stroke="#1a1714"
        strokeWidth={1.2}
      />
      <text x={0} y={h - 2} fontSize={9} fill="#6b6560" fontFamily="Source Code Pro, monospace">
        0%
      </text>
      <text x={w - 28} y={h - 2} fontSize={9} fill="#6b6560" fontFamily="Source Code Pro, monospace">
        100%
      </text>
    </svg>
  );
}
