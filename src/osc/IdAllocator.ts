// Monotonic node-id allocator over a server-assigned range. Each session is
// handed `[base, base + count)` (see src-tauri core::ids); synths allocate from
// it so ids never collide across sessions or scsynth clients.

export class IdAllocator {
  private next: number;
  private readonly end: number;

  constructor(base: number, count: number) {
    this.next = base;
    this.end = base + count;
  }

  /** Allocate the next id. Throws if the block is exhausted (a bug — the range
   *  is far larger than any realistic session needs). */
  alloc(): number {
    if (this.next >= this.end) {
      throw new Error("IdAllocator: node-id block exhausted");
    }
    return this.next++;
  }
}
