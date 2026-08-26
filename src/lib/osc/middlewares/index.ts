// Application composition root for main-thread OSC transport middlewares.

import { statusWatchdog } from "../watchdog";
import { workerClient } from "../worker/WorkerClient";
import { errorsMiddleware } from "./errors";
import { loggingMiddleware } from "./logging";
import { statusMiddleware } from "./status";

/** Register the transport observers. Tx logging skips `/clock/*`; scope
 * subscribe/unsubscribe remain logged. Rx logging skips `/scope/chunk`,
 * `/clock/tick`, `/clock/status`, and `/status.reply`; `/fail` and `/late`
 * are both logged and toasted. Registration order has no correctness
 * dependency because every observer calls next synchronously. Phase 2 will
 * run this contract worker-side, beginning with worker.ts's `/clock/*`
 * interception; that symmetry is intentionally not implemented here. */
workerClient.use(loggingMiddleware);
workerClient.use(errorsMiddleware);
workerClient.use(statusMiddleware);
workerClient.use(statusWatchdog.middleware);
