/** Lightweight typed event bus decoupling sim, presentation, and audio. */

export interface GameEvents {
  'player:jump': void;
  'player:land': { impact: number };
  'player:hurt': { hearts: number };
  'player:died': void;
  'player:stomp': { x: number; y: number };
  'player:pound': { x: number; y: number };
  'player:shoot': { x: number; y: number; charged: boolean };
  'player:glide': void;
  'player:walljump': void;
  'player:spring': void;
  'player:power': { power: string };
  'player:powerLost': void;
  'enemy:hurt': { x: number; y: number };
  'enemy:died': { x: number; y: number; kind: string };
  'block:break': { tx: number; ty: number };
  'pickup:gem': { count: number; chain: number };
  'pickup:berry': { hearts: number };
  'pickup:token': { index: number };
  'keys:changed': { keys: number };
  'checkpoint': { x: number; y: number };
  'goal': void;
  'hearts:changed': { hearts: number; max: number };
  'boss:spawn': { name: string; hp: number; max: number };
  'boss:hp': { hp: number; max: number };
  'boss:stunned': { x: number; y: number };
  'boss:hit': { x: number; y: number };
  'boss:died': { x: number; y: number };
}

type Handler<T> = (payload: T) => void;

export class EventBus {
  private handlers = new Map<string, Set<Handler<unknown>>>();

  on<K extends keyof GameEvents>(event: K, fn: Handler<GameEvents[K]>): () => void {
    let set = this.handlers.get(event as string);
    if (!set) {
      set = new Set();
      this.handlers.set(event as string, set);
    }
    set.add(fn as Handler<unknown>);
    return () => set!.delete(fn as Handler<unknown>);
  }

  emit<K extends keyof GameEvents>(event: K, ...payload: GameEvents[K] extends void ? [] : [GameEvents[K]]): void {
    const set = this.handlers.get(event as string);
    if (!set) return;
    for (const fn of set) fn(payload[0]);
  }

  clear(): void {
    this.handlers.clear();
  }
}
