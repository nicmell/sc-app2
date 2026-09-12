// Application composition root for main-thread OSC transport middlewares.

import { workerClient } from "@/lib/osc/WorkerClient";
import { errorsMiddleware } from "./errors";
import { loggingMiddleware } from "./logging";
import { statusMiddleware } from "./status";

/** Register the transport observers. Tx logging skips `/clock/*`; scope
 * subscribe/unsubscribe remain logged. Rx logging skips `/scope/chunk`,
 * `/clock/pong`, and `/status.reply`; `/fail` and `/late` are both logged
 * and toasted. Registration order has no correctness dependency because
 * every observer calls next synchronously. */
workerClient.use(loggingMiddleware);
workerClient.use(errorsMiddleware);
workerClient.use(statusMiddleware);
