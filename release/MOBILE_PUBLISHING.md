# EMBERWILDS — Mobile Publishing (Google Play + App Store)

The game is wrapped natively with **Capacitor 8**. The entire built game
(`dist/`) is bundled *inside* the app, so it runs 100% offline — this is what
keeps it clear of Apple's guideline 4.2 (it is a real, self-contained game, not
a thin website wrapper) and means the apps never depend on emberwilds.fun.

- **App name:** Emberwilds  ·  **App ID:** `fun.emberwilds.game`
- **Orientation:** landscape (locked, phone + tablet)  ·  **Fullscreen** immersive
- **Ads:** OFF on native for v1 (the web ad layer resolves to the no-op `local`
  adapter off-portal). No ad SDK ships → nothing to disclose for ads, no ATT.
- **Data collected:** GA4 analytics (consent-gated, Consent Mode v2) and, if the
  player opts into the leaderboard, a display name + anonymous device id + clear
  time. See the Data Safety / Privacy Labels section below.

---

## 1. Prerequisites (one-time)

| | Android | iOS |
|---|---|---|
| Tooling | Android Studio + SDK (set `ANDROID_HOME`) | Xcode (already installed here) |
| Account | Google Play Console — **$25 once** | Apple Developer — **$99/yr** |
| Signing | an **upload keystore** (create in Android Studio) | Apple **certificate + provisioning** (Xcode auto-manages) |

## 2. The build loop (every time the game changes)

```bash
npm run build            # compile + bundle the game into dist/
npx cap sync             # copy dist/ into the native android/ + ios/ projects
# then open the native IDE:
npx cap open android     # Android Studio
npx cap open ios         # Xcode
```
Convenience scripts are in `package.json`: `npm run cap:sync`, `cap:android`, `cap:ios`.

## 3. Android → Google Play (AAB)

1. `npm run build && npx cap sync && npx cap open android`.
2. In Android Studio, set the version in `android/app/build.gradle`
   (`versionCode` +1 each upload, `versionName` e.g. `1.0.0`).
3. **Build ▸ Generate Signed App Bundle** → create/select your **upload keystore**
   → release → produces `app-release.aab`.
4. Play Console ▸ Create app ▸ upload the `.aab` to a track (internal → production).
5. Complete the store listing + the compliance forms (section 5).

## 4. iOS → App Store (IPA)

1. `npm run build && npx cap sync && npx cap open ios`.
2. In Xcode: select the **App** target ▸ Signing & Capabilities ▸ set your Team
   (automatic signing). Set the version/build under General.
3. Set the run destination to **Any iOS Device**, then **Product ▸ Archive**.
4. Organizer ▸ **Distribute App ▸ App Store Connect** → upload.
5. In App Store Connect, attach the build to a version, complete the listing +
   the privacy labels (section 5), submit for review.

---

## 5. STORE COMPLIANCE — do all of these before submitting

### 5a. Privacy policy (REQUIRED by both stores)
- Host `release/PRIVACY_POLICY.md` at a public URL (e.g. **emberwilds.fun/privacy**)
  and paste that URL into both consoles.
- It **must** name: Google Analytics 4 (analytics), the leaderboard (display name
  + anonymous device id + times), and that no data is sold or used for ad tracking.
  Verify the hosted copy says this before submitting.

### 5b. Google Play — Data Safety form
Declare (matches what the app actually does):
- **App activity → analytics/interactions** — *collected*, purpose *Analytics*,
  **not shared**, processed in transit with encryption, collection *optional*
  (consent-gated in the EEA).
- **App info & performance** (GA4) — *collected*, *Analytics*.
- **Identifiers → a user/device ID** — *collected* only if the player uses the
  leaderboard, purpose *App functionality*, **not for ads/tracking**.
- **User content → name** — *collected* only for the leaderboard, *App
  functionality*, and the player can change/blank it in-game (YOUR NAME).
- Data is **encrypted in transit**; provide the account/data-deletion note (5f).
- **No** location, contacts, photos, financial, or health data. **No** data
  shared with third parties for advertising.

### 5c. Apple — App Privacy "nutrition labels"
- **Data Used to Track You:** *None* (no cross-app tracking, no IDFA, no ads) →
  so **no App Tracking Transparency prompt is required**. In App Store Connect
  answer "Do you track?" = **No**.
- **Data Linked / Not Linked to You:** *Usage Data* (analytics) — Not Linked;
  *User ID* + *User Content* (name) — only if leaderboard used, purpose App
  Functionality.

### 5d. Content / age rating (IARC questionnaire — both stores)
- Emberwilds is **cartoon fantasy action**: a fox stomps/shoots cartoon
  creatures and bosses. **No blood, gore, realistic violence, language, drugs,
  gambling, or user-to-user chat.** Answer the questionnaire honestly with
  "mild/cartoon fantasy violence" and **no** to everything else.
- Expected rating: **Everyone / PEGI 7 / 4+**.

### 5e. Ads & tracking
- v1 ships **no ads** on native and **no ad SDK**, so there is nothing to declare
  for ads, and no ATT. If you later add **AdMob**: you must add the ATT prompt
  (iOS), re-answer "Do you track?" = Yes, declare the advertising SDK in both
  forms, and wire AdMob consent to the existing Consent Mode v2.

### 5f. Account & data deletion (Google Play REQUIREMENT)
- The game has **no accounts** — progress is local. The only server data is an
  *optional* leaderboard row keyed to an anonymous device id.
- Provide a deletion path in the listing: a support email that removes a
  leaderboard entry on request (the worker can delete by uid). Note this in the
  Data Safety "data deletion" field and the privacy policy.

### 5g. Store listing assets (already in `release/`)
- **Icon:** generated (1024² source in `assets/icon.png`).
- **Screenshots:** `store-assets/screenshots/` — 10 landscape 1920×1080 shots
  re-taken on the Phase-3 maps (Play needs ≥2; Apple resizes from these).
- **Feature graphic (Play):** `store-assets/feature-graphic-1024x500.png` ✓
- **Descriptions:** `release/descriptions/`.

---

## 6. What was set up in the repo
- `capacitor.config.ts` — appId/appName, `webDir: dist`, warm splash, immersive.
- `android/` + `ios/` — native projects (commit them; build artifacts are
  git-ignored by Capacitor's own `.gitignore`s).
- `src/systems/native.ts` — hides the status bar, dismisses the splash when the
  canvas is up, routes Android **Back** → ESC (pause/back-out, never a hard exit).
- Landscape lock: `AndroidManifest.xml` (`sensorLandscape`) + `Info.plist`
  (landscape only, `UIRequiresFullScreen`, status bar hidden).
- Service worker is disabled on native (Capacitor already bundles offline).
- Icons/splash: `scripts/genAppAssets.mjs` → `assets/*` → `npx @capacitor/assets
  generate` (re-run if the logo changes).

## 7. Re-generate icons/splash later
```bash
node scripts/genAppAssets.mjs
npx @capacitor/assets generate --splashBackgroundColor '#14100d' --iconBackgroundColor '#2A1F1B'
npx cap sync
```
