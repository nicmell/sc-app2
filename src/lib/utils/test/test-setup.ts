// Vitest setup (happy-dom). The osc WorkerClient spawns its permanent Web
// Worker at import time, and happy-dom ships no Worker — the suites never
// open a connection, so an inert stub is enough.

import { registerUiComponents } from "@sc-app/ui-components/lit";
import { attachPort } from "@/lib/osc/OscClientProxy";
import { createOscEndpoint } from "@/lib/osc/worker/endpoint";
import { createLoopbackPair } from "./loopback";
import { setWorkerOscClient } from "./osc-endpoint";

const [mainPort, workerPort] = createLoopbackPair();
attachPort(mainPort);
setWorkerOscClient(createOscEndpoint(workerPort));

// The inputs render the ui-components `-base` widgets (sc-slider → sc-base-slider,
// sc-knob → sc-base-knob, …); define them so they upgrade under happy-dom like
// the app's boot does (main.tsx).
registerUiComponents();
