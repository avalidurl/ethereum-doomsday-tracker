# Ethereum Doomsday Tracker

Standalone illustrative risk publication: an original Ethereum L1 systemic-security forecast brief with a sticky forecast rail, conditional scenarios, and reference-only benchmark panels.

**Not calibrated odds. Not a live market. Synthetic seeded priors only.**

Visual language references [AI 2040](https://ai-2040.com/) (cream / deep red / sticky analytical rail) and [Commanding Heights](https://commanding-heights.com/) (editorial masthead, roman spine) without copying their identity, logos, or narrative.

## Stack

- Vite + React + TypeScript
- Self-hosted OFL fonts: EB Garamond, Source Sans 3, Source Code Pro (`@fontsource/*`)
- Base path: `/ethereum-doomsday/` (for mounting under gokhanturhan.com)

## Scripts

```bash
npm install
npm test          # vitest — real JS simulation invariants
npm run typecheck
npm run build     # outputs to dist/
npm run preview   # http://0.0.0.0:4173/ethereum-doomsday/
npm run dev       # http://0.0.0.0:5173/ethereum-doomsday/
```

## Model (v0.2)

- mulberry32 seed **42**, **N=3000** draws, Box–Muller normals
- Competing-risk annual hazards; unconditional first-event mass `S_prev × h`
- 50/80/95% bands = **model-spread** (prior quantiles), **not** statistical CIs
- Sources (EVMbench, SCONE, Hive, GRI, Causis, Metaculus, EF PQ, Google) are **reference-only / not ingested**

## Deployment notes

Intended public URL: `https://gokhanturhan.com/ethereum-doomsday/`

Suggested integration with [gokhan-memex](https://github.com/avalidurl/gokhan-memex) (Astro → Cloudflare Pages):

1. Build this repo (`npm run build`).
2. Copy `dist/` contents into memex `public/ethereum-doomsday/` on a branch + PR (do not touch `public/turkish-art-blob` or global CSS).
3. Optional later: GitHub Action in this repo that opens/updates that PR on main pushes.
4. Cloudflare Pages continues deploying memex `main` as today.

Cloudflare connector auth may be required for project binding changes; this repo itself needs no CF secrets for static hosting via memex `public/`.

## License

Content and code: all rights reserved by the publisher unless otherwise noted. Fonts: SIL Open Font License via Fontsource.


## Deployment (prepared)

See [DEPLOY.md](./DEPLOY.md). Repo includes `wrangler.jsonc` + `worker/index.ts` for
Cloudflare Workers Static Assets under `gokhanturhan.com/ethereum-doomsday/` with
`assets.base_path`. **Not deployed yet** — Cloudflare auth pending. Use Workers Builds
(GitHub) once authorized; do not broaden zone routes beyond the prefix.
