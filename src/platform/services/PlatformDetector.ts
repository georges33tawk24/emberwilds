/**
 * The ONLY place that sniffs which portal we're running inside. Every
 * `if (window.PokiSDK)`-style check lives here and nowhere else — gameplay
 * asks Platform.getPlatform() and gets a name, never a global.
 *
 * Detection order matters: portals wrap the game in an iframe and expose a
 * global or a URL/referrer hint. `?platform=` forces one for local testing.
 */
import type { PlatformName } from '../types';

export function detectPlatform(): PlatformName {
  // explicit override for testing a build locally: ?platform=poki
  const forced = new URLSearchParams(window.location.search).get('platform');
  if (isPlatformName(forced)) return forced;

  const w = window as unknown as Record<string, unknown>;
  const host = window.location.hostname;
  const ref = document.referrer;

  if (w.CrazyGames || host.includes('crazygames.')) return 'crazygames';
  if (w.PokiSDK || host.includes('poki.') || ref.includes('poki.com')) return 'poki';
  if (w.YaGames || host.includes('yandex') || ref.includes('yandex')) return 'yandex';
  if (w.gdsdk || ref.includes('gamedistribution.com')) return 'gamedistribution';

  // our own domain and everything else: the self-hosted / local build
  return 'local';
}

function isPlatformName(v: string | null): v is PlatformName {
  return (
    v === 'local' ||
    v === 'crazygames' ||
    v === 'poki' ||
    v === 'yandex' ||
    v === 'gamedistribution'
  );
}
