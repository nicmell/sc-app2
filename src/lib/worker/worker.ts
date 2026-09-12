/// <reference lib="webworker" />
// OSC Web Worker entry: composes the WorkerEndpoint over this scope.

import type { TransportCommand } from "@/types/osc";
import { WorkerEndpoint } from "./endpoint";

const scope = self as unknown as DedicatedWorkerGlobalScope;
const endpoint = new WorkerEndpoint((event, transfer) => scope.postMessage(event, { transfer }));

scope.onmessage = (ev: MessageEvent<TransportCommand>) => endpoint.handleCommand(ev.data);
