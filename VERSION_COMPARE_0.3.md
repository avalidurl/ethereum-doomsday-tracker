# v0.2.2 → v0.3.0 default comparison

Generated for owner review. Seed 42, N=3000, selectedYear=2035, scenario=orderly, spread=80.

## Why inputs changed

| Input | v0.2.2 | v0.3.0 | Reason |
|---|---|---|---|
| Timeline family | Independent Normal(qMu,qSig), Normal(mMu,mSig) | Piecewise CDF knots (ETH assumption / RSA proxy) | Unjustified Normal replaced with source-scoped knots; RSA elicited kept distinct from ETH ECDLP assumption |
| mMu default | 2031 | 2032 | Align with migration assumption median knot |
| exploitH | 0.08 | 0.06 | Unidentified; lowered slightly as transparent assumption (not “calibrated”) |
| residual | 0.15 | 0.18 | Unidentified; Google at-rest residual framing — still assumption |
| clientH | 0.005 | 0.004 | Unidentified; Hive not used as rate |
| timelineMode | (absent) | eth_assumption | Explicit ETH vs RSA-proxy switch |
| Outcome handling | theft gates quantum; conflict\|outage gates client (implicit multiply into aggregate) | Leaf taxonomy Theft/Conflict/Outage; single-count union; Fréchet on marginals | Remove arbitrary aggregate multiplier semantics; show identification bounds |
| Client scenario | ×4 hazard | ×4 hazard as **named scenario_stress** in registry | Same stress, honest labeling |

## Outputs at end-2035 (measured this publish, seed 42)

| Quantity | v0.3.0 defaults | same engine w/ v0.2.2 prior knobs |
|---|---|---|
| Scenario median P | **4.5%** | 5.6% |
| Fréchet union bounds | **3.9% – 7.8%** | 4.8% – 9.7% |
| Epistemic 80% band | 2.7% – 11.2% | (same engine) |
| Leaf marginals | theft≈0 (Q median 2038), conflict≈3.9%, outage≈3.9% | — |
| Calibration | pending_insufficient_resolved | — |

Theft leaf near zero by end-2035 under default Q median 2038 is expected: quantum channel has mostly not “arrived” yet; client leaves dominate near-term scenario mass. RSA-proxy mode and/or earlier qMu raise theft contribution.

New fields: `frechetLow`, `frechetHigh`, `leafMarginals`, `calibration`, `readout`.

## Not claimed

- Empirical calibration / Brier superiority
- Port of GRI 28–49% RSA bands onto Ethereum
- Fitted correlation from data
