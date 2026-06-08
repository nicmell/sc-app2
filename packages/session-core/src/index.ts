// @sc-app/session-core — the environment-agnostic, headless-testable OSC
// transport + scope layer shared by the browser app and Node tests. The
// high-level session orchestrator (SessionManager) and the reactiveStore
// primitive live in the app (`src/lib`, `src/utils`), not here.

// Scope controller (master-out tap) + its options
export { ScopeController, type ScopeOptions } from "./scope/ScopeController";

// Transport seam + bridge core (the app's Web Worker entry wraps createOscBridge)
export type {
  OscClient,
  OscClientFactory,
  ReplyListener,
  ErrorListener,
  ScopeChunkListener,
} from "./client/OscClient";
export { createOscBridge, type OscBridge, type OscBridgeCallbacks } from "./osc/bridge";

// Protocol + helpers
export type { MainToWorker, WorkerToMain, OscReply } from "./osc/protocol";
export { flattenPacket, type FlatOsc } from "./osc/flatten";
export { dirtPlayBundle, type DirtEvent } from "./osc/dirt";
export { IdAllocator } from "./session/IdAllocator";

// Bootstrap contract (the concrete browser/Tauri bootstrap is injected by the app)
export type { SessionInfo, BootstrapResult, Bootstrap } from "./session/bootstrapTypes";
