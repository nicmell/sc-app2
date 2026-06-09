/// <reference lib="webworker" />
// OSC worker entry point (browser): build a MessageEndpoint over `self` and run
// the shared worker runtime. `workerBootstrap` MUST be imported first — it shims
// `window` for osc-js (pulled in via the bridge inside runOscWorker) and buffers
// early messages until the handler is wired (exposed as the endpoint's onMessage).

import { setWorkerMessageHandler } from "./workerBootstrap";
import { runOscWorker } from "./oscWorkerMain";

runOscWorker({
  postMessage: (msg, transfer) => self.postMessage(msg, transfer ?? []),
  onMessage: (handler) => setWorkerMessageHandler(handler),
});
