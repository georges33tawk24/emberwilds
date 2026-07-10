/**
 * Lazily inject a third-party SDK <script> exactly once. Only the active
 * platform's adapter calls this, so no unused SDK is ever fetched. Rejects on
 * network/load failure — the adapter catches it and the game falls back to a
 * safe unsupported state.
 */
const loaded = new Map<string, Promise<void>>();

export function loadScript(src: string): Promise<void> {
  const existing = loaded.get(src);
  if (existing) return existing;

  const p = new Promise<void>((resolve, reject) => {
    const el = document.createElement('script');
    el.src = src;
    el.async = true;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(el);
  });
  loaded.set(src, p);
  return p;
}
