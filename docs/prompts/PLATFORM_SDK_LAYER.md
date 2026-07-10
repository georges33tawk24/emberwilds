# Prompt — Platform SDK Abstraction Layer

> Saved verbatim from the request that drove `src/platform/`. Use it to extend
> or re-derive the layer. Current implementation status is in
> `src/platform/README.md`.

---

You are a senior software architect with extensive experience building commercial HTML5 games for platforms such as CrazyGames, Poki, Yandex Games, GameDistribution, and standalone websites.

Design and implement a production-ready **Platform SDK Abstraction Layer**.

## Goal

The game must NEVER directly communicate with Poki, CrazyGames, Yandex, or any other platform SDK. It must ONLY communicate with a single internal API that auto-detects the platform and routes every request to the correct SDK. Supporting a new platform should mean adding **one adapter file** with no gameplay changes. Design it like a professional game engine.

## Architecture

Modular TypeScript, SOLID, no duplicated logic:

```
src/platform/
    Platform.ts
    adapters/  LocalAdapter.ts  CrazyGamesAdapter.ts  PokiAdapter.ts  YandexAdapter.ts  GameDistributionAdapter.ts
    interfaces/ IPlatformAdapter.ts
    services/  PlatformDetector.ts  SDKLoader.ts  SaveManager.ts
    types/     PlatformTypes.ts
    utils/
```

## Core principle

No `if (window.PokiSDK)` / `if (window.CrazyGames)` / `if (window.ysdk)` anywhere outside the Platform module. Gameplay never knows which platform it runs on.

## Public API (the only surface gameplay uses)

`init, pause, resume, gameplayStart, gameplayStop, showInterstitial, showRewarded, save, load, submitScore, unlockAchievement, login, logout, getPlayer, isLoggedIn, vibrate, share, openURL, rateGame, showLoading, hideLoading, getPlatform, isMobile, isDesktop, hasRewardedAds, hasAchievements, hasCloudSave, hasLeaderboard, hasLogin, hasStorage, onPause, onResume, onVisibilityChanged, onNetworkChange`

Every function returns a consistent Promise-based result. No SDK-specific values leak.

## Requirements

- **Detection** isolated in its own service: CrazyGames, Poki, Yandex, GameDistribution, local dev, standalone.
- **SDK loading** lazy — never load unused SDKs, only init the active platform, async init, graceful load-failure handling.
- **Ads** unified: `showInterstitial()`, `showRewarded()`. Unsupported → `{ success: false, reason: 'unsupported' }`, never throw.
- **Save** priority: Cloud → Platform storage → LocalStorage → Memory. Game doesn't care where.
- **Achievements / Leaderboards / Login**: common interfaces; if unsupported, safely return unavailable.
- **Events**: `onPause, onResume, onAdStarted, onAdFinished, onAdFailed, onPlayerLogin, onPlayerLogout, onNetworkLost, onNetworkRestored`.
- **Error handling**: catch every SDK exception, never crash gameplay, return standardized error objects, log usefully.
- **Logging**: verbose in dev, minimal in production.
- **LocalAdapter**: fully simulates ads/achievements/storage/leaderboards/login/cloud-save so the game runs with zero external SDK.
- **Type safety**: strict TS, no `any`, no unsafe casts, strong interfaces, generics where useful.
- **Performance**: lazy init, cache SDK refs, don't block the game loop.

Implement the complete architecture, generate every file, production-ready, with comments explaining design decisions.
