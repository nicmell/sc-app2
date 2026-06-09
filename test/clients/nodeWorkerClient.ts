// A worker_threads-backed OscClient for the headless test harness — the Node
// analogue of createBrowserWorkerClient. The WorkerHandle is an inline object
// over the EventEmitter side (handler already receives the data; `terminate` is
// genuinely async). The worker runs `nodeWorkerEntry.ts` under a tsx loader (via
// the .mjs bootstrap) so it can import the app's TypeScript directly.

import { Worker } from "node:worker_threads";
import { WorkerOscClient } from "../../src/osc/WorkerOscClient";
import { fromEventEmitter } from "../../src/osc/messageEndpoint";
import type { MainToWorker, WorkerToMain } from "../../src/types/protocol";

export function createNodeWorkerClient(wsUrl: string): WorkerOscClient {
    const w = new Worker(new URL("./nodeWorkerBootstrap.mjs", import.meta.url));
    return new WorkerOscClient(wsUrl, {
        ...fromEventEmitter<MainToWorker, WorkerToMain>(w),
        onError: (h) => {
            w.on("error", h);
            return () => {
                w.off("error", h);
            };
        },
        terminate: async () => {
            await w.terminate();
        },
    });
}
