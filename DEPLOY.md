# Deployment / gokhanturhan.com integration

## Target

`https://gokhanturhan.com/ethereum-doomsday/`

## Architecture (verified read-only)

- Site: [avalidurl/gokhan-memex](https://github.com/avalidurl/gokhan-memex) — **Astro static** (`output: 'static'`), Cloudflare Pages project historically `gokhan-memex`.
- Static assets already live under `public/` (e.g. `public/turkish-art-blob` — **do not modify**).
- `_redirects` / `_headers` exist; first matching redirect wins.

## Recommended minimal mount (no CF project changes)

1. In this repo: `npm ci && npm run build` → `dist/`.
2. On a **new branch** of `gokhan-memex` (not direct `main`):
   - Copy `dist/**` → `public/ethereum-doomsday/`
   - Do **not** change global CSS, layouts, or art assets.
3. Open a **PR** to memex `main`; merge only after review.
4. Cloudflare Pages rebuild from memex `main` publishes the path automatically if Pages serves `public/` as today.

Optional later automation: GitHub Action in *this* repo that opens/updates the memex PR with rebuilt `public/ethereum-doomsday/` (needs `contents`/`pull-requests` on memex; still no CF token required for static-file mount).

## Alternatives (need Cloudflare auth)

- Separate Cloudflare Pages project for this repo + path route / Worker rewrite to `/ethereum-doomsday/*`.
- Blocked while `user-Cloudflare-api` connector remains `needsAuth`. **Do not** bypass with wrangler tokens or browser logins.

## Verification after live

```bash
curl -sI https://gokhanturhan.com/ethereum-doomsday/ | head
curl -s https://gokhanturhan.com/ethereum-doomsday/ | head
```

Do not claim live until those return 200 with this app’s HTML.
