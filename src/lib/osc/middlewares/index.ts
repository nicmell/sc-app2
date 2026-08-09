// Application composition root for main-thread OSC transport middlewares.

import { statusWatchdog } from "../watchdog";
import { workerClient } from "../worker/WorkerClient";
import { errorsMiddleware } from "./errors";
import { logging } from "./logging";
import { status } from "./status";

/** Register the transport observers. Tx logging skips `/clock/*`; scope
 * subscribe/unsubscribe remain logged. Rx logging skips `/scope/chunk`,
 * `/clock/tick`, `/clock/status`, and `/status.reply`; `/fail` and `/late`
 * are both logged and bannered. Registration order has no correctness
 * dependency because every observer calls next synchronously. Phase 2 will
 * run this contract worker-side, beginning with worker.ts's `/clock/*`
 * interception; that symmetry is intentionally not implemented here. */
workerClient.use(logging);
workerClient.use(errorsMiddleware);
workerClient.use(status);
workerClient.use(statusWatchdog.middleware);

export * from "./errors";
export * from "./logging";
export * from "./status";
