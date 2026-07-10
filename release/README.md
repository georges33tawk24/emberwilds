# Emberwilds — Portal Submission Bundle

Everything a portal needs, in one place. Binaries (screenshots, icons) are
**referenced, not copied**, so there's a single source of truth.

## Documents (here)
- [`PRIVACY_POLICY.md`](PRIVACY_POLICY.md) — GDPR/CCPA-ready
- [`TERMS_OF_SERVICE.md`](TERMS_OF_SERVICE.md)
- [`ASSET_LICENSES.md`](ASSET_LICENSES.md) — full audit; all original + Phaser/MIT
- [`RELEASE_CHECKLIST.md`](RELEASE_CHECKLIST.md) — what's done and what's left

## Marketing copy (existing)
- `store-assets/STORE_SUBMISSION.md` — title, taglines, short/long descriptions,
  keywords, genre, features. Copy fields straight into each portal's form.

## Visual assets (existing)
- Screenshots: `store-assets/screenshots/` (10 × 1600×900 PNG)
- Icons: `public/icon-192.png`, `public/icon-512.png`
- Social/cover: `public/og-image.png`

## Build
- `npm run build` → `dist/` (static, PWA). That folder is the portal upload.
- Portal builds additionally need the portal's SDK active — the game auto-detects
  it via `src/platform/` (see `src/platform/README.md`). Set `?platform=<name>`
  to force one when testing a build locally.

## Genre / classification
Platformer · Adventure · Action · Casual · Fantasy. Family-friendly, no
user-to-user chat.
