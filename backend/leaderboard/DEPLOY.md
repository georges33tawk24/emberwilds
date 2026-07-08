# EMBERWILDS leaderboard — DEPLOYED AND LIVE ✅

Worker: https://emberwilds-leaderboard.georges33tawk24.workers.dev
KV namespace SCORES: 2715bfd599b64d31bd88b7c7b01c1640 (bound in wrangler.toml)
Client: LEADERBOARD_URL is set in src/systems/leaderboard.ts — new best
clears submit automatically; the world map shows WORLD BEST per level.

To redeploy after editing worker.mjs: `npx wrangler deploy` from this
directory. The steps below are kept for reference / a fresh account.

1. **Create a free Cloudflare account** (the same one that serves
   emberwilds.fun via Pages works fine): https://dash.cloudflare.com/sign-up

2. **From this directory** (`backend/leaderboard/`):

   ```bash
   npx wrangler login                      # opens the browser once
   npx wrangler kv namespace create SCORES # prints an id
   ```

   Paste the printed id into `wrangler.toml` where it says
   `PASTE_KV_NAMESPACE_ID_HERE`, then:

   ```bash
   npx wrangler deploy
   ```

   Wrangler prints the worker URL, e.g.
   `https://emberwilds-leaderboard.<your-subdomain>.workers.dev`.

3. **Turn it on in the game:** open `src/systems/leaderboard.ts` and set

   ```ts
   export const LEADERBOARD_URL = 'https://emberwilds-leaderboard.<...>.workers.dev';
   ```

   Commit + push — Pages deploys, and world-best times appear on the world
   map while new best clears submit automatically.

## What the worker does

- `POST /score` — validates level/uid, caps times to 3s–30min, sanitizes the
  display name (12-char allowlist + blocklist, falls back to FOX), rate
  limits one submission per device per level per minute, and keeps a top-20
  per level in KV (one entry per device, best time wins).
- `GET /leaderboard?level=N` — the top 20, cached 30s.
- CORS locked to `ALLOWED_ORIGIN` in wrangler.toml.

The whole handler is unit-tested in the main repo (`tests/leaderboard.test.ts`)
against a Map-backed KV mock — `npm test` covers it.

## Later (per GROWTH_ROADMAP)

- Replay validation: the sim is deterministic and Phaser-free, so the client
  can submit its input recording and the worker can re-simulate the run to
  verify the time before accepting it. The ghost system already records runs.
- Turnstile on POST /score if abuse ever shows up.
