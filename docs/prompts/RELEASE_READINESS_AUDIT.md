# Prompt — Portal Release-Readiness Audit

> Saved verbatim from the request. This is the checklist for turning Emberwilds
> into a professional HTML5-portal submission. The Platform SDK layer
> (`src/platform/`) already covers the SDK-abstraction and ad/save seams this
> references. Remaining work is tracked at the bottom.

---

You are a senior HTML5 game producer, legal/compliance specialist, and release engineer. Audit and prepare Emberwilds for professional publishing on CrazyGames, Poki, Yandex Games, GameDistribution, GamePix, and other browser portals. Make it look and function like a professionally released commercial game. Inspect the codebase, create missing files, implement missing systems, refactor where needed, and explain every change — don't just describe problems.

## 1. Ownership & branding
Consistent Emberwilds branding across browser title, loading screen, main menu, favicon, metadata, social preview, and portal submission info. Name must be unique.

## 2. Logo & visual branding
Game logo, favicon, app icon, social preview image, loading-screen branding. Fantasy/adventure style matching the game. PNG + transparent + multiple resolutions, desktop + mobile.

## 3. Asset ownership audit
Inventory images, sprites, animations, sounds, music, fonts, libraries, external deps. Classify each: original / commercial-license-required / free-commercial / unknown. Create `ASSET_LICENSES.md` (Asset / Location / Source / License / Commercial-use / Attribution). Replace or flag anything unclear.

## 4. Legal pages
- **Privacy Policy** — game info, analytics, cookies, advertising, third-party + platform SDKs (CrazyGames, Poki, Yandex), data handling, storage/saves, contact. GDPR + CCPA + international.
- **Terms of Service** — acceptable use, IP ownership, restrictions, disclaimer, liability, updates, contact.
- **Cookie / tracking notice** — consent banner if required, analytics + advertising disclosure.

## 5. Analytics
Centralized analytics manager (GA4 + platform analytics + custom events). Game calls `Analytics.track("level_complete")`, never a provider directly. Track player events (start/level/complete/fail/death/quit/session/returning), monetization events (ad requested/completed/reward/interstitial), engagement (buttons/settings/character/replay).

## 6. Advertising
Interstitials only at natural moments (between levels, after game over, before restart) — never during play/jumps/boss fights. Rewarded ads for extra life / continue / bonus / boosts. Use `AdManager.showRewarded()` via the platform layer; no hardcoded SDKs.

## 7. Platform SDK integration
Use the Platform abstraction: `Platform.showInterstitial/showRewarded/save/load/submitScore`. Never call `PokiSDK`/`CrazyGamesSDK`/`YandexSDK` in gameplay files.

## 8. Save system
Priority Cloud → Platform storage → LocalStorage → Memory. Save progress, levels, unlocks, settings, achievements. Handle corrupted/missing saves and version migrations.

## 9. Performance
First playable < 5s (asset compression, lazy load, sprite/audio optimization). Stable 60 FPS (memory leaks, large textures, excess animations/DOM, GC spikes).

## 10. Mobile
Fullscreen, no black bars, responsive scaling, touch controls, mobile UI, correct FOV, landscape. Test iPhone / Android / tablets.

## 11. Browser
Chrome, Safari, Firefox, Edge. Handle missing Web APIs, audio restrictions, storage restrictions.

## 12. Submission package
Screenshots (gameplay/menu/mobile). Marketing (short + long description, keywords, genre, features). Files under `/release`: screenshots/, logo/, icons/, descriptions/, privacy-policy.md, terms-of-service.md, asset-licenses.md, release-checklist.md.

## 13. Security
No exposed API keys, debug menus, dev logs, test accounts, unfinished content, broken links.

## 14. RELEASE_CHECKLIST.md
Branding (logo/title/metadata), Legal (privacy/terms/licenses), Monetization (ads/SDK tested), Technical (mobile/perf/saves), Publishing (screenshots/descriptions/portal builds).

---

## Status against this repo (2026-07-10)

Already in place: GA4 funnel (`src/systems/analytics.ts`), AdSense gated to
emberwilds.fun, robust local save with migrations + backup (`src/systems/save.ts`),
PWA + icons + og-image (self-generated), `store-assets/STORE_SUBMISSION.md` +
10 screenshots, Platform SDK abstraction (`src/platform/`).

Still open: legal pages (privacy/terms/cookie), `ASSET_LICENSES.md` (trivial —
assets are code-generated sprites + procedural audio + one MIT dep, Phaser),
`RELEASE_CHECKLIST.md`, `/release` bundle, wiring `Platform.showInterstitial/
showRewarded` into the between-level and game-over flows, and per-portal build
configs. The asset story is clean, so the legal/licenses work is mostly prose.
