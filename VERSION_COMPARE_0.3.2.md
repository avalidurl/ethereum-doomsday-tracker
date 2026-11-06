# v0.3.1 → v0.3.2 audit blockers

## Estimand
- Headline **scenario mean** E[P(H_Y|θ)] (field `median`/`scenarioMean`).
- Fréchet on **mean** channel marginals {theft, client} — same estimand family.
- Epistemic bands = quantiles of P(H|θ); **not** labelled as Fréchet.
- Median of draws exposed as `scenarioP50` / `p50` only.

## Defaults restored (unidentified assumptions, not “evidence lowered odds”)
- clientH 0.005, exploitH 0.08, residual 0.15, mMu 2031

## Measured end-2035 (seed 42, N=3000)
- scenarioMean ≈ **7.6%**
- Fréchet (mean marginals) ≈ **5.1% – 7.8%**
- epistemic 80% ≈ **3.3% – 13.4%**
- p50 ≈ **5.6%** (not the headline)
- Prior broken v0.3.0 “4.5% median vs Frechet 3.9–7.8” was invalid estimand + unsupported clientH cut + duplicate client leaves.

## Other fixes
- Single client channel (conflict∪outage)
- qWidth/mWidth knot dispersion (removed dead Normal σ)
- RSA proxy unshifted Metaculus knots by default
- Coherent knot tails (assumption anchors to cdf 0 and 1)
- URL persists theft/conflict/outage/timeline/override
- Channel means at selectedYear; calibration timestamp/p guards
