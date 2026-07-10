# Security Review — Emberwilds

_Reviewed: 2026-07-10. Method: static grep of `src/`, `backend/`, `index.html`
for secrets, un-gated debug code, dev logs, and leftover markers._

## Result: clean for submission

| Check | Finding |
|---|---|
| Exposed API keys / secrets / passwords | **None.** The only "token"/"secret" matches are game vocabulary (Ember Tokens, secret rooms) — not credentials. |
| Client-visible IDs | GA4 measurement id (`G-…`) and AdSense publisher id (`ca-pub-…`) in `index.html` are **public by design** — they must be in page source to work, and neither is a secret. |
| Leaderboard backend | The Cloudflare Worker holds no client secret; the client only knows its public URL. CORS is locked to `emberwilds.fun` in `wrangler.toml`. |
| Debug menus / dev handles | `window.__game` and `window.__platform` are both gated behind `import.meta.env.DEV` — stripped from production builds. |
| Dev logging in production | No un-gated `console.log` in shipped code. The Platform logger is DEV-only. (LocalAdapter emits an `info` line on simulated ads; it runs only on the self-hosted build and is harmless — optional to gate.) |
| Leftover markers | One `TODO(release)` — the GameDistribution `GAME_ID` placeholder, which is expected and must be filled from the GD portal before that build ships. No `FIXME`/`HACK`. |
| Test accounts / unfinished content | None. No login/account system exists; all 28 levels + 5 bosses ship complete. |

## Before each portal build
- Fill the GameDistribution `GAME_ID` (and any other portal ids) in the relevant adapter.
- Link-check the legal/footer URLs in the built page.
- Confirm the production bundle contains no `__game`/`__platform` (it won't — DEV-gated — but verify after a `npm run build`).
