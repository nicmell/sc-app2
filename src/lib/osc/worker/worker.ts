/// <reference lib="webworker" />
import { workerGlobalPort } from "../protocol/port";
import { createOscEndpoint } from "./endpoint";

// osc-js's feature detection (hasProperty) probes `global` (Node) falling
// back to `window` (browser) — a worker scope has NEITHER, and the first
// inbound decode would throw "window is not defined" and kill the
// connection. Alias `global` before any packet work runs.
(globalThis as { global?: unknown }).global ??= globalThis;

createOscEndpoint(workerGlobalPort(self as unknown as DedicatedWorkerGlobalScope));
