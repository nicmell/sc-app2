// Vitest setup (happy-dom). The osc WorkerClient spawns its permanent Web
// Worker at import time, and happy-dom ships no Worker — the suites never
// open a connection, so an inert stub is enough.

class WorkerStub {
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: ErrorEvent) => void) | null = null;
  postMessage(): void {}
  terminate(): void {}
}

globalThis.Worker ??= WorkerStub as unknown as typeof Worker;
