/**
 * Minimal object pool — projectiles, particles, and pickups recycle through
 * pools so the hot path allocates nothing per frame.
 */
export class Pool<T> {
  private free: T[] = [];
  readonly active = new Set<T>();

  constructor(
    private readonly create: () => T,
    private readonly reset: (item: T) => void,
    prealloc = 0,
  ) {
    for (let i = 0; i < prealloc; i++) this.free.push(this.create());
  }

  obtain(): T {
    const item = this.free.pop() ?? this.create();
    this.active.add(item);
    return item;
  }

  release(item: T): void {
    if (!this.active.delete(item)) return;
    this.reset(item);
    this.free.push(item);
  }

  releaseAll(): void {
    for (const item of this.active) {
      this.reset(item);
      this.free.push(item);
    }
    this.active.clear();
  }
}
