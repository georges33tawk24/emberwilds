# Platform SDK Abstraction Layer

The whole game talks to portals (CrazyGames, Poki, Yandex, GameDistribution)
through **one** façade — `Platform`. Gameplay code never touches an SDK global.

```ts
import { Platform } from './platform';

await Platform.init();                 // detects the portal, boots its adapter
Platform.gameplayStart();              // signal real play began
const r = await Platform.showRewarded();
if (r.rewarded) grantExtraLife();
await Platform.save('progress', save.data);
```

## Rules

- **Never** write `if (window.PokiSDK)` etc. in gameplay. That check lives only
  in `services/PlatformDetector.ts`.
- Every method returns a plain, Promise-based result. Unsupported features
  return `{ success: false, reason: 'unsupported' }` — they never throw. An SDK
  exception is caught in the façade and downgraded to a safe result, so an ad
  network hiccup can't crash the game.
- Gate features on capability, not platform: `if (Platform.hasRewardedAds())`.

## Adding a platform = one file

1. Write `adapters/FooAdapter.ts extends BaseAdapter`, overriding only what Foo
   supports (BaseAdapter no-ops the rest).
2. Add one line to `ADAPTERS` in `Platform.ts` and one detection branch in
   `PlatformDetector.ts`.

No gameplay code changes.

## Status of the adapters

| Adapter | State |
|---|---|
| `LocalAdapter` | **Live.** Runs on emberwilds.fun and `npm run dev`. Simulated ads, localStorage save. This is the default when no portal SDK is present. |
| `CrazyGamesAdapter` | Written to the documented SDK v3 API. **Verify with a real game key** in the CrazyGames dashboard before submitting — it can't run outside their wrapper. |
| `PokiAdapter` | Written to the documented SDK v2 API. Verify with a real Poki game id in their inspector. |
| `YandexAdapter` | Written to the documented SDK v2 API. Only inits on Yandex's platform; verify in their console. |
| `GameDistributionAdapter` | Written to the documented API. **Set the real `GAME_ID`** before submitting. |

The live site (LocalAdapter) is exercised by `tsc` + the production build. The
four portal adapters follow each SDK's public docs but need a portal account to
run end-to-end — none can be executed from our own domain.

## Wiring ads into gameplay (not yet done)

The seam exists; the actual call sites are a deliberate follow-up so the live
AdSense build isn't double-served. Natural spots:

- `Platform.showInterstitial()` — in `ClearScene`, between levels (never mid-play).
- `Platform.showRewarded()` — a "continue after death" offer in the game-over flow.

See `docs/prompts/RELEASE_READINESS_AUDIT.md` for the full portal checklist.
