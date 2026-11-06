import { useState, type ReactNode } from "react";
import type { ScenarioId } from "../sim/model";

function Pill({ title, children }: { title: string; children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" className={`pill${open ? " active" : ""}`} aria-expanded={open} onClick={() => setOpen(!open)}>
        {title}
      </button>
      {open && <div className="pill-body">{children}</div>}
    </div>
  );
}

function Chapter({
  id,
  roman,
  title,
  yearPrefix,
  children,
}: {
  id: string;
  roman: string;
  title: string;
  yearPrefix?: string;
  children: ReactNode;
}) {
  return (
    <section className="chapter" id={id}>
      <span className="roman" aria-hidden>
        {roman}
      </span>
      <span className="node" aria-hidden />
      <h2>
        {yearPrefix && <span className="year-prefix">{yearPrefix}</span>}
        {title}
      </h2>
      {children}
    </section>
  );
}

type Props = { year: number; scenario: ScenarioId; onScenario: (s: ScenarioId) => void };

export function Essay({ year, scenario, onScenario }: Props) {
  return (
    <article className="essay">
      <Chapter id="thesis" roman="I" title="Thesis and boundaries">
        <p>
          This publication is an original illustrative risk brief for a proposed question about Ethereum base-layer
          systemic security failure. It borrows analytical constructs familiar from forecasting platforms and security
          benchmarks — resolution criteria, parameter-spread bands, scenario branches, evidence matrices, provenance —
          while using an original editorial layout. It is not a clone of Metaculus, AI 2027, AI 2040, or Commanding
          Heights, and it does not impersonate their interfaces or identities.
        </p>
        <p>
          Over the next one to three decades, two analytically distinct L1 hazard families can, under stressed
          assumptions, produce systemic base-layer failure as defined below: (1) cryptographic exposure of widely used
          signature schemes to cryptographically relevant quantum capability before migration and residual-key cleanup
          complete; (2) classical client and consensus implementation failure capable of finality interruption or
          conflicting finalized views. Application-layer exploits, bridges, custodians, and L2s are treated as separate
          surfaces — consequential for users, addressed by EVMbench and SCONE, but excluded from L1 probability mass
          here.
        </p>
        <div className="callout">
          Every probability is generated from a seeded toy model with adjustable assumptions. Bands are MODEL-SPREAD
          INTERVALS (prior-driven parameter quantiles), not confidence intervals and not posterior credible intervals.
          Deadline year Y means through end of calendar year Y. Anchor: 2026-11-06 (Europe/Istanbul).
        </div>
        <div className="pill-row">
          <Pill title="What this is">
            A long-form scenario publication with a sticky illustrative forecast rail — for stress-testing assumptions,
            not for trading or calibrated doom odds.
          </Pill>
          <Pill title="What this is not">
            Not a live market, not ingested Causis/GRI/Metaculus numbers, not executed EVMbench/SCONE/Hive runs, not an
            official Ethereum Foundation position.
          </Pill>
          <Pill title="Title caveat">
            “Doomsday” is editorial shorthand. Resolution criteria carefully distinguish temporary outage from permanent
            ledger damage.
          </Pill>
        </div>
      </Chapter>

      <Chapter id="scenarios" roman="II" title="Conditional scenarios" yearPrefix={`${year}:`}>
        <p>
          Four fictional conditional branches for editorial stress-testing. They are not reported events and not
          base-rate forecasts. Selecting a branch applies fixed offsets inside the toy model so the rail moves with the
          story.
        </p>
        <div className="seg" style={{ marginBottom: "1rem" }}>
          {(
            [
              ["orderly", "Orderly"],
              ["q_accel", "Q accel"],
              ["delayed", "Delayed"],
              ["client", "Client"],
            ] as const
          ).map(([id, lab]) => (
            <button key={id} type="button" className={scenario === id ? "on" : ""} onClick={() => onScenario(id)}>
              {lab}
            </button>
          ))}
        </div>
        {scenario === "orderly" && (
          <>
            <p>
              Research, specification, and client work on post-quantum account and validator cryptography proceed without
              catastrophic stalls. Migration reaches mainnet before a cryptographically relevant quantum adversary
              arrives. Residual risk remains in dormant EOAs with exposed ECDSA public keys and slow wallet UX. Through
              end-{year}, leftover exposure after migration dominates over a sudden capability surprise.
            </p>
            <ol className="steps">
              <li>
                <strong>2027–2028 — Spec maturity (fictional).</strong> PQ candidates harden; testnets exercise migration
                UX.
              </li>
              <li>
                <strong>2029–2031 — Staged activation (fictional).</strong> Mainnet defaults for fresh accounts;
                validators migrate on a published schedule.
              </li>
              <li>
                <strong>After migration — Residual cleanup.</strong> Legacy exposed keys decline slowly; the residual
                exposure slider still matters.
              </li>
            </ol>
          </>
        )}
        {scenario === "q_accel" && (
          <>
            <p>
              Cryptographically relevant quantum capability against elliptic-curve discrete log arrives earlier (−6 years
              on the median prior). ECDSA EOAs with historically exposed public keys are the acute theft surface; BLS
              validator keys are a distinct consensus-integrity surface. Hash functions face Grover-type considerations
              and are not modeled as the same L1 Yes path as Shor-type ECDLP breaks.
            </p>
            <div className="callout">Not a prediction — a sensitivity story about the ordering of Q and M.</div>
          </>
        )}
        {scenario === "delayed" && (
          <p>
            Migration slips (+5 years on the migration median): specification disputes, client coordination costs, or
            user inertia. Quantum timing unchanged. The mechanism is prolonged exposure of classical public-key material
            after a capability threshold. Recovery after limited theft can still be social and protocol-level — which is
            why resolution separates permanent ledger loss from recoverable incidents.
          </p>
        )}
        {scenario === "client" && (
          <p>
            Classical annual client/consensus hazard is multiplied (×4). Imagined modes: implementation bugs, conflicting
            finalized checkpoints, or unplanned finality interruption meeting the outage threshold. These are not quantum
            attacks and not application reentrancy. A green Hive dashboard does not imply zero systemic risk.
          </p>
        )}
      </Chapter>

      <Chapter id="mechanisms" roman="III" title="Mechanisms and scope">
        <h3>Accounts, validators, exposed keys</h3>
        <p>
          EOAs typically authorize value with ECDSA over secp256k1. Once a public key is exposed, a future
          cryptographically relevant quantum adversary that can solve ECDLP could, in principle, derive the private key.
          Never-exposed accounts sit in a different posture. Validator cryptography (BLS families) leans toward
          consensus integrity rather than simple EOA theft. This page’s quantum layer is a deliberately coarse
          “signature/key exposure” hazard.
        </p>
        <h3>Shor-type vs Grover-type</h3>
        <p>
          Shor-type algorithms target structure in factoring and discrete log — hence ECDSA/ECDLP in Ethereum quantum-risk
          writing. Grover-type search offers quadratic speedups against unstructured search and is often discussed for
          hashes — a different scaling story, usually addressed with parameter adjustments. This toy model does not treat
          hash breakage as an L1 systemic Yes path.
        </p>
        <h3>Classical bugs vs quantum theft</h3>
        <p>
          Classical consensus bugs can halt finality or create conflicting finalized views. Quantum theft paths are
          separate. They can correlate in the real world even when the math treats annual hazards as conditionally
          independent given parameters.
        </p>
        <ul className="subs">
          <li>Application security is separate</li>
          <li>No operational exploitation instructions</li>
          <li>Recovery versus permanent damage</li>
        </ul>
      </Chapter>

      <Chapter id="resolution" roman="IV" title="Proposed resolution criteria">
        <div className="callout">
          Proposed for demo — not official rules. Thresholds are design choices. Independent adjudication would be
          required before any real market or scored tournament used this wording.
        </div>
        <p>
          <strong>Question:</strong> Will Ethereum experience a systemic base-layer security failure before the end of
          calendar year {year}, as defined below?
        </p>
        <p>
          <strong>Date boundary:</strong> Anchor 2026-11-06. Resolves on evidence of an event with onset on or before
          23:59:59 UTC on 31 December {year}.
        </p>
        <p>
          <strong>Yes (OR):</strong> (1) Unauthorized transfers of ≥ 1% of circulating ETH due to an L1 cryptographic or
          consensus-protocol flaw; (2) conflicting finalized checkpoints accepted by otherwise conforming clients; (3)
          unplanned consensus-failure finality interruption lasting ≥ 72 hours.
        </p>
        <table className="data">
          <thead>
            <tr>
              <th>Label</th>
              <th>Meaning</th>
              <th>Aggregate toggle</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Theft</td>
              <td>Large unauthorized L1 redistribution</td>
              <td>Theft</td>
            </tr>
            <tr>
              <td>Conflict</td>
              <td>Conflicting finalized checkpoints</td>
              <td>Conflict</td>
            </tr>
            <tr>
              <td>Outage</td>
              <td>≥72h unplanned finality interruption</td>
              <td>Outage</td>
            </tr>
            <tr>
              <td>Recoverable emergency</td>
              <td>Graceful fork / coordinated recovery</td>
              <td>May avoid Yes</td>
            </tr>
          </tbody>
        </table>
        <p>
          <strong>Exclusions:</strong> app/DeFi/L2/bridge/custody-only; price crashes; planned forks; testnets; unverified
          rumor.
        </p>
        <p>
          <strong>Adjudication recommendation (not an appointed person):</strong> pre-declared committee charter, COI
          rules, ambiguous-case log, frozen criteria before forecasting opens. Evidence hierarchy: converging client-team
          statements → reproducible mainnet artifacts → technical post-mortems → secondary journalism.
        </p>
      </Chapter>

      <Chapter id="evmbench" roman="V" title="EVMbench constructs">
        <p>
          OpenAI + Paradigm introduced EVMbench (public post 18 February 2026) with three modes — Detect, Patch, Exploit
          — and different denominators. Published metadata: 117 curated vulnerabilities from 40 audits; Rust harness;
          historical vulns; isolated Anvil (not live networks). Blog-reported exploit-mode example: GPT‑5.3‑Codex via
          Codex CLI 71.0% vs GPT‑5 33.3%. Detect/patch remain below full coverage. Status here: reference only / not
          ingested / not executed.
        </p>
        <table className="data">
          <thead>
            <tr>
              <th>Mode</th>
              <th>Measures</th>
              <th>Why not L1 odds</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>Detect</td>
              <td>Recall of ground-truth vulns</td>
              <td>App audit skill ≠ L1 failure rate</td>
            </tr>
            <tr>
              <td>Patch</td>
              <td>Remove exploitability, keep function</td>
              <td>Repair reliability ≠ L1 hazard</td>
            </tr>
            <tr>
              <td>Exploit</td>
              <td>Sandbox fund-drain success</td>
              <td>Sandbox ≠ mainnet L1 doom odds</td>
            </tr>
          </tbody>
        </table>
        <div className="callout">
          A responsible bridge would need a written structural model from agent exploit capability → app loss → optional
          L1 secondaries. This site does not implement that bridge.
        </div>
      </Chapter>

      <Chapter id="scone" roman="VI" title="SCONE-bench constructs">
        <p>
          Anthropic’s smart-contract / SCONE line emphasizes agent success with simulated economic loss. Borrowed
          concepts without inventing a scoreboard: success rate; held-out / post-cutoff vs retrospective evaluation;
          outlier sensitivity; simulated losses ≠ observed real-world losses. Status: reference only / not ingested / no
          run claimed.
        </p>
      </Chapter>

      <Chapter id="hive" roman="VII" title="Hive client health">
        <p>
          Hive-style matrices cross clients with test families: pass / fail / unsupported / unknown. Useful for
          monitoring diversity — not drawn here as a fake live matrix. Model health ≠ model risk. A production tracker
          could ingest immutable Hive snapshots as covariates for the client hazard prior — still not a score-to-odds map.
        </p>
      </Chapter>

      <Chapter id="quantum" roman="VIII" title="Quantum resources & EF PQ">
        <p>
          Google Quantum AI-style notes separate required resources under paper assumptions (logical/physical qubits,
          gates, runtime, error correction) from demonstrated hardware. Comparing logical requirements to today’s
          physical counts without the error-correction stack is an apples-to-oranges error this page refuses.
        </p>
        <p>
          EF PQ migration is better as stages than unverified percentages: Research → Specification → Devnet → Audit →
          Mainnet activation → Adoption / residual cleanup. Toy migration year M is a coarse “substantial completion”
          summary.
        </p>
      </Chapter>

      <Chapter id="provenance" roman="IX" title="Elicitation and market provenance">
        <p>
          GRI-style expert elicitations, Metaculus-style crowd distributions, and Causis-style causal models that may
          anchor on both are not independent votes when someone later averages “all sources.” This site treats GRI,
          Metaculus, Causis, and benchmarks as references with ingested=false.
        </p>
        <ul className="subs">
          <li>Source independence / dependence graph</li>
          <li>Liquidity vs crowd size vs resolution precision</li>
          <li>Immutable snapshots before any future ingestion</li>
        </ul>
      </Chapter>

      <Chapter id="methods" roman="X" title="Methods and evaluation plan">
        <p>
          TypeScript Monte Carlo (mulberry32 seed 42, N=3000, Box–Muller). For each draw: Q~Normal, M~Normal, residual
          noise, client lognormal hazard, quantum peak after Q while exposed. Annual competing-risk OR; unconditional
          first-event mass π_y = S<sub>y−1</sub>·h_y; cumulative F_y = 1−S_y. Disabled hazards are exactly zero.
        </p>
        <p>
          Displayed 50/80/95% bands are quantiles of model-derived probabilities under prior parameter variation — not
          frequentist CIs, not bootstrap CIs on observations, not Bayesian posteriors after likelihood updating. Source
          calibration has not been done.
        </p>
        <p>
          <strong>Weaknesses:</strong> conditional independence ignores common causes; Normal year priors are coarse;
          outcome aggregation is a demo convenience; no elicited expert priors; no proper scoring yet. Therefore this
          must not be read as a real overall doom forecast.
        </p>
        <p>
          <strong>Forward plan (not run):</strong> preregister milestones; score with log/Brier without lookahead; no
          hindsight backtesting claimed here.
        </p>
      </Chapter>

      <Chapter id="sources" roman="XI" title="Sources, implementation, version">
        <table className="data">
          <thead>
            <tr>
              <th>Source</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <a href="https://openai.com/index/introducing-evmbench/">OpenAI EVMbench (2026-02-18)</a>
              </td>
              <td>reference / not ingested</td>
            </tr>
            <tr>
              <td>
                <a href="https://www.anthropic.com/research/smart-contracts">Anthropic smart contracts / SCONE</a>
              </td>
              <td>reference / not ingested</td>
            </tr>
            <tr>
              <td>
                <a href="https://hive.ethpandaops.io/">Ethereum Hive</a>
              </td>
              <td>reference / not fetched</td>
            </tr>
            <tr>
              <td>
                <a href="https://research.google/blog/safeguarding-cryptocurrency-by-disclosing-quantum-vulnerabilities-responsibly/">
                  Google Quantum AI ECDLP note
                </a>
              </td>
              <td>reference / not ingested</td>
            </tr>
            <tr>
              <td>
                <a href="https://ethereum.org/roadmap/security/quantum-resistance/">ethereum.org PQ roadmap</a>
              </td>
              <td>reference / not ingested</td>
            </tr>
            <tr>
              <td>
                <a href="https://globalriskinstitute.org/publication/quantum-threat-timeline-report-2025b/">
                  GRI Quantum Threat Timeline 2025
                </a>
              </td>
              <td>reference / not ingested</td>
            </tr>
            <tr>
              <td>
                <a href="https://quantum.causisresearch.com/">Causis CRQC</a>
              </td>
              <td>reference / not executed</td>
            </tr>
            <tr>
              <td>
                <a href="https://www.metaculus.com/questions/30596/date-of-rsa-2048-quantum-factorization/">
                  Metaculus RSA-2048 QC date
                </a>
              </td>
              <td>reference / not ingested</td>
            </tr>
          </tbody>
        </table>
        <p>
          Implementation: Vite + React + TypeScript; self-hosted OFL fonts (EB Garamond, Source Sans 3, Source Code Pro);
          no network calls from the page; Squiggle not used at runtime. Visual language references AI 2040 (cream, deep
          red, sticky analytical rail) and Commanding Heights (centered masthead, roman spine) without copying their
          identity, logos, or narrative.
        </p>
        <p>
          Version 0.2.0 (2026-11-06 Europe/Istanbul): expanded tracker ported from the illustrative Cursor Page to a
          standalone site.
        </p>
      </Chapter>
    </article>
  );
}
