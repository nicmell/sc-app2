/// <reference lib="webworker" />
// OSC worker entry point (browser): build a MessageEndpoint over `self` and run
// the shared transport relay. No osc-js here — the worker only moves bytes; all
// OSC encode/decode lives on the main thread.

import { runTransportWorker } from "./transportWorker";
import { fromEventTarget } from "./messageEndpoint";
import type { MainToWorker, WorkerToMain } from "./protocol";

runTransportWorker(fromEventTarget<WorkerToMain, MainToWorker>(self));
