// Vitest setup (happy-dom). The osc WorkerClient spawns its permanent Web
// Worker at import time, and happy-dom ships no Worker — the suites never
// open a connection, so an inert stub is enough.

import { registerUiComponents } from "@sc-app/ui-components/lit";

class WorkerStub {
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: ErrorEvent) => void) | null = null;
  postMessage(): void {}
  terminate(): void {}
}

globalThis.Worker ??= WorkerStub as unknown as typeof Worker;

// The inputs render the ui-components `-base` widgets (sc-slider → sc-base-slider,
// sc-knob → sc-base-knob, …); define them so they upgrade under happy-dom like
// the app's boot does (main.tsx).
registerUiComponents();
