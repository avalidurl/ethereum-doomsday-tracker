# Deployment — Workers Static Assets (own repo → push-to-deploy)

## Goal

`https://gokhanturhan.com/ethereum-doomsday/` served from **this** repository via Cloudflare **Workers Static Assets** + **Workers Builds** (GitHub). Existing gokhan-memex Pages site and `turkish-art-blob` stay untouched.

## Why this works (docs, Oct 2026)

Cloudflare added `assets.base_path` so a Worker can serve `./dist` from a URL prefix without rewriting file layout ([Serving a subdirectory](https://developers.cloudflare.com/workers/static-assets/routing/advanced/serving-a-subdirectory/)). Requires **Wrangler ≥ 4.148** (this repo pins **4.158**).

Combined with zone routes limited to:

- `gokhanturhan.com/ethereum-doomsday`
- `gokhanturhan.com/ethereum-doomsday/*`

…requests outside that prefix never hit this Worker.

## Prepared in-repo (not activated)

| File | Role |
|------|------|
| `wrangler.jsonc` | Worker name, `assets.directory=./dist`, `assets.base_path=/ethereum-doomsday`, scoped `routes`, `not_found_handling=none`, `run_worker_first` |
| `worker/index.ts` | Bare-path **308** → trailing slash (keeps query); out-of-scope **404**; else `ASSETS.fetch` |
| `src/routing/prefix.ts` | Pure routing policy + unit tests |
| Vite `base: /ethereum-doomsday/` | Asset URLs already include the public prefix |

**Status:** config + tests ready. **Not live.** Cloudflare connector auth still pending — do **not** run `wrangler deploy` / account API until authorized.

## Activate later (human + Cloudflare dashboard)

1. Connect Cloudflare account (MCP `user-Cloudflare-api` or dashboard login).
2. Workers & Pages → **Create** → import **this** GitHub repo `avalidurl/ethereum-doomsday-tracker`.
3. Ensure Worker **name** = `ethereum-doomsday-tracker` (must match `wrangler.jsonc` `name`).
4. Workers Builds settings:
   - **Build command:** `npm run build`
   - **Deploy command:** `npx wrangler deploy`
   - **Preview command:** `npx wrangler preview` (optional)
   - Root directory: `/` (repo root)
5. Confirm zone routes only for `/ethereum-doomsday` and `/ethereum-doomsday/*` on `gokhanturhan.com` (already declared in `wrangler.jsonc`; dashboard may ask to attach).
6. Push to `main` → automatic build/deploy.
7. Verify: `curl -sI https://gokhanturhan.com/ethereum-doomsday/` → 200; `/` and art paths unchanged.

## Node version (Workers Builds)

Wrangler **4.158** requires **Node.js ≥ 22**. This repo sets:

- `package.json` `"engines": { "node": ">=22" }`
- `.nvmrc` / `.node-version` → `22`
- Workers Builds → Environment variable **`NODE_VERSION=22`** (or select Node 22 in the build image)

Local Vite preview may still run under Node 20 for UI review; use isolated Node 22 for `npm run deploy:dry` / `validate:worker` (see `scripts/wrangler-dry-run.mjs`).

## Tooling note

Wrangler **4.158** requires **Node.js ≥ 22**. Local Vite/Vitest still run on Node 20; run `wrangler deploy --dry-run` / deploy from CI or a Node 22 environment.

## Local checks (no Cloudflare account)

```bash
npm test
npm run typecheck
npm run build
npm run deploy:dry   # packages only; does not publish if dry-run succeeds without auth quirks
npm run preview      # http://127.0.0.1:4173/ethereum-doomsday/
```

## Not used

- One-time copy into memex `public/` (no automatic updates)
- Broad `gokhanturhan.com/*` Worker route
- GitHub Actions deploy (token lacks `workflow` scope; Workers Builds replaces it)
