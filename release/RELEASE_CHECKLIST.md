# Release Checklist — Emberwilds

_Status as of 2026-07-10. ✅ done · ☐ open · ⚠️ needs a real portal account/build to finish._

## Branding
- ✅ Title "Emberwilds" consistent across browser title, main menu, loading screen
- ✅ Favicon / app icons (`public/icon-192.png`, `public/icon-512.png`) — original
- ✅ Social/OG preview image (`public/og-image.png`)
- ✅ Metadata + theme color in `index.html`
- ☐ Confirm the name is free of trademark conflict on each target portal before submitting

## Legal
- ✅ Privacy Policy — `release/PRIVACY_POLICY.md`
- ✅ Terms of Service — `release/TERMS_OF_SERVICE.md`
- ✅ Asset & dependency license audit — `release/ASSET_LICENSES.md` (all original + Phaser/MIT; clean)
- ⚠️ Cookie-consent banner — **only needed for the self-hosted emberwilds.fun build** (GA4 + AdSense in the EU). Portals run their own consent, so no banner is needed for portal builds. Add a lightweight CMP before advertising to EU traffic from our own domain.
- ☐ Replace `contact@emberwilds.fun` with a real monitored inbox in both legal docs

## Monetization
- ✅ Platform SDK abstraction (`src/platform/`) — ads/save/analytics routed through one façade
- ⚠️ Wire `Platform.showInterstitial()` between levels (ClearScene) and `Platform.showRewarded()` into a "continue after death" offer. Safe to add — on emberwilds.fun the LocalAdapter no-ops, so only real portals show ads. Left unwired until it can be tested against a live portal.
- ⚠️ Verify each portal adapter against a real game key (CrazyGames / Poki / Yandex / GameDistribution) — none can run from our own domain

## Technical
- ✅ Mobile: touch controls, responsive scaling, edge-to-edge (no black bars), landscape rotate hint
- ✅ Save system: localStorage with version migrations, backup key, corruption fallback
- ✅ Performance: code-split bundle (Phaser vendor / gamedata / game), PWA offline shell
- ✅ Dev-only handles (`__game`, `__platform`) and verbose logging gated behind `import.meta.env.DEV`
- ☐ Final cross-browser pass: Chrome, Safari, Firefox, Edge (desktop + iOS/Android)
- ☐ Confirm first-playable < 5s on a cold load over 3G-class throttling

## Publishing
- ✅ Screenshots — `store-assets/screenshots/` (10 × 1600×900)
- ✅ Descriptions / taglines / keywords — `store-assets/STORE_SUBMISSION.md`
- ⚠️ Per-portal build configs (each portal wants its SDK present and its own build/zip) — produce once accounts exist

## Security
- ✅ No secrets in the client: the GA id and AdSense publisher id are public-by-design page values; the leaderboard worker holds no client secret
- ✅ No debug menus or test accounts in production
- ☐ Gate the LocalAdapter's `console.info` ad logs behind DEV too (cosmetic — they only fire on our own domain)
- ☐ Link-check the legal/footer links before each submission

## One-line summary
Paperwork and architecture are **done**. What remains all requires a **real
portal account** (adapter verification, ad wiring, per-portal builds) or is a
**self-hosted-only** concern (EU cookie banner). Nothing blocks preparing a
submission package today.
