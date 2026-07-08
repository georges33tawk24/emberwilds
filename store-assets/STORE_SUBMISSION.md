# EMBERWILDS — portal submission kit

Everything needed to submit to CrazyGames, Poki, GameDistribution, itch.io,
Newgrounds, etc. Copy the fields straight into each portal's form.

- **Live game:** https://emberwilds.fun/
- **Screenshots:** `store-assets/screenshots/` (10 × 1600×900 PNG)
- **Cover / social image:** `public/og-image.png` (1200×630)
- **Icon:** `public/icon-192.png`, `public/icon-512.png`

---

## Title & taglines

- **Title:** EMBERWILDS
- **Tagline (≤ 40 chars):** Relight the wilds. Race the world.
- **One-liner (≤ 90 chars):** A warm pixel-art action platformer — run, glide, and stomp to relight a dimming world.

## Short description (≤ ~200 chars, for cards/listings)

Play Sorrel the fox and relight the Warmth Beacons across six hand-crafted
worlds. Run, jump, glide, and ground-pound through 28 levels and 5 bosses.
Chase world-record times on the global leaderboards. No download.

## Long description (store page body)

The Rust — an industrial blight led by Baron Coglar — is draining the warmth
from the wilds and has stolen the Ember Heart. You are **Sorrel**, a small fox
with a big scarf, and you're going to relight every Warmth Beacon and take the
Heart back.

**EMBERWILDS** is a hand-crafted action platformer with a full story campaign:

- **6 worlds, 28 levels, 5 bosses** — sunlit forests, autumn canyons, drowned
  ruins, ash peaks, a frozen snowfield, and the Baron's foundry. Every world
  introduces a new mechanic: swimming, keys & gates, ice physics, conveyor
  belts.
- **A moveset with depth** — run, double-jump, wall-jump, glide on your scarf,
  ground-pound, and charge-shot. Power-ups transform you: fire, frost, and gale.
- **Race the world** — every level has a global **Top-10 leaderboard**. Beat
  your best and watch a translucent **ghost** of your record run beside you.
- **Earn and customize** — collect ember-gems to unlock fox colors, scarves,
  and hats in the Wardrobe. Purely cosmetic — no pay-to-win.
- **Plays anywhere** — desktop and mobile, keyboard or touch, instant load,
  no download, no account required.

Relight the wilds. Then set the times the rest of the world has to chase.

---

## Category & tags

- **Primary genre:** Platformer / Adventure
- **Secondary:** Action, Arcade
- **Tags:** platformer, pixel art, fox, adventure, action, retro, precision
  platformer, singleplayer, leaderboard, speedrun, cute, family-friendly,
  browser game, HTML5

## Controls

**Keyboard**
- Move: Arrow keys / WASD
- Jump (and double-jump): Z / Space / Up
- Shoot / charge: X
- Ground-pound: C / Down+Jump in air
- Pause: Esc — Fullscreen: F

**Touch (mobile)** — on-screen controls, all actions have a button:
- Left/right rocker, Jump, Shoot, Pound; contextual GROVE / TOP 10 / BACK
  plaques; pause & fullscreen top-right.

Gamepad: supported (d-pad + face buttons).

## Content rating

- **Everyone / PEGI 3.** Cartoon action only — no blood, gore, language, or
  suggestive content. Enemies "pop" into leaves/sparks. No chat, no UGC.

## Technical

- HTML5 (Phaser 4 + TypeScript), single-page, **landscape**.
- Fully responsive; fills any aspect from 4:3 tablet to 21:9 phone.
- Loads as 3 cacheable chunks (~450 KB gzipped first load; ~55 KB on updates).
- PWA-installable; works offline after first load.
- No login, no personal data collected. Anonymous device id for leaderboard
  best-times only; display name is user-chosen and filtered.

---

## Screenshot manifest (`store-assets/screenshots/`)

| File | Shows |
|------|-------|
| 01-title.png | Title screen / main menu (hero) |
| 02-thornwood.png | World 1 — Thornwood (sunlit forest) |
| 03-canyon.png | World 2 — Ochre Canyon (desert mesas) |
| 04-mossgrave.png | World 3 — Mossgrave Ruins (drowned halls) |
| 05-cinderpeaks.png | World 4 — The Cinderpeaks (ash & fire) |
| 06-rimefell.png | World 5 — Rimefell (snowfield, ice) |
| 07-foundry.png | World 6 — Coglar Foundry (industrial belts) |
| 08-boss-baron.png | Boss fight — Baron Coglar + health bar |
| 09-worldmap.png | World map — the 28-level overworld |
| 10-wardrobe.png | The Wardrobe — cosmetics shop |

---

## Portal-specific notes & pre-submission checklist

Different portals have different rules. Do these BEFORE submitting:

- **CrazyGames** (do first — their exclusivity program pays the most):
  - They require the **CrazyGames SDK** for ads/analytics and will likely ask
    you to **remove Google AdSense** (`index.html` has the AdSense loader +
    `public/ads.txt`) — portals serve their own ads. Keep a non-AdSense build
    branch for portal submissions, or gate AdSense behind a hostname check
    (`emberwilds.fun` only). **This is a required code change before a
    CrazyGames build.**
  - QA checklist: no external links out of the game, no fixed pixel sizes
    (we're responsive ✓), works in an iframe (test embedded), loads < 15 MB
    (we're ~1.8 MB ✓).
- **Poki:** requires the **Poki SDK** (loading screen, commercial breaks between
  levels, `gameplayStart/Stop`). Another required integration; a natural hook
  point is level start/clear in `GameScene`.
- **GameDistribution:** lightest requirements; their SDK is optional-ish. Good
  for blanketing small sites after CrazyGames/Poki.
- **itch.io / Newgrounds:** upload the `dist/` zip as-is (relative `base` is
  already set, so it runs from a zip). No SDK needed. Fastest first launch.

**Recommended order:** itch.io + Newgrounds today (zero code), then integrate
the CrazyGames SDK and submit there (exclusivity), then Poki, then
GameDistribution. Reddit r/WebGames post once it's live somewhere embeddable.
