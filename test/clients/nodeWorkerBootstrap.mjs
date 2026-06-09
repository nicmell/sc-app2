// Plain-JS worker_threads bootstrap: register tsx's ESM loader for THIS thread,
// then import the TypeScript worker entry. Avoids depending on `--import tsx`
// execArgv working (which varies by Node version). Spawned by NodeWorkerOscClient.
import { register } from "tsx/esm/api";

register();
await import("./nodeWorkerEntry.ts");
