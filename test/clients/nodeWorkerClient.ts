// A worker_threads-backed OscClient for the headless test harness — the Node
// analogue of createBrowserWorkerClient. The UniversalWorker is an inline object
// over the EventEmitter side (handler already receives the data; `terminate` is
// genuinely async). The worker runs `nodeWorkerEntry.ts` under a tsx loader (via
// the .mjs bootstrap) so it can import the app's TypeScript directly.

import {Worker, Transferable} from "node:worker_threads";
import {WorkerOscClient} from "../../src/osc/WorkerOscClient";

export function createNodeWorkerClient(wsUrl: string): WorkerOscClient {
    const w = new Worker(new URL("./nodeWorkerBootstrap.mjs", import.meta.url));
    return new WorkerOscClient(wsUrl, {
        // main→worker never transfers; the values are ArrayBuffers when they do,
        // which node's transferList accepts (avoids the deprecated TransferListItem).
        postMessage: (m, t = []) => w.postMessage(m, t as Transferable[]),
        onMessage: (h) => {
            w.on("message", h);
            return () => {
                w.off("message", h);
            };
        },
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
