// Vitest setup (happy-dom). The osc WorkerClient spawns its permanent Web
// Worker at import time, and happy-dom ships no Worker — the suites never
// open a connection, so an inert stub is enough.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { initValidator } from "@/lib/plugins/validate";
import { registerUiComponents } from "@sc-app/ui-components/lit";

// happy-dom provides no fetch for the glue's URL path — hand it the bytes.
// import.meta.url is NOT reliably file: here (happy-dom serves modules from
// http://localhost/), so fall back to the repo-root-relative path.
const wasmUrl = new URL(
  "../../../../src-tauri/crates/sc-validate/pkg/sc_validate_bg.wasm",
  import.meta.url,
);
await initValidator(
  readFileSync(
    wasmUrl.protocol === "file:"
      ? wasmUrl
      : resolve(process.cwd(), "src-tauri/crates/sc-validate/pkg/sc_validate_bg.wasm"),
  ),
);

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
