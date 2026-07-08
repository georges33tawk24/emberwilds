/**
 * One-time gameplay hints. Each hint id fires at most once, ever, across the
 * whole game — tracked in its own localStorage key (not the save blob, so no
 * version bump). Used to teach the moveset's hidden verbs (glide, wall-jump)
 * the first time a player is in a situation to use them.
 */

const KEY = 'emberwilds.hints';

function seenSet(): Set<string> {
  try {
    const raw = localStorage.getItem(KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function hintSeen(id: string): boolean {
  return seenSet().has(id);
}

export function markHintSeen(id: string): void {
  try {
    const s = seenSet();
    s.add(id);
    localStorage.setItem(KEY, JSON.stringify([...s]));
  } catch {
    // storage unavailable — the hint may show again, which is harmless
  }
}
