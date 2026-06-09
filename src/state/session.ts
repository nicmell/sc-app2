// The session singleton: one SessionManager for the whole app, owning the
// OSC worker connection + status/log stores + the scope tap. It's a module
// singleton (not React-context-scoped) so the Lit `sc-*` elements — which live
// in injected plugin HTML, outside React's tree — can reach it directly. The
// React shell reads it through the hooks below.

import { useSyncExternalStore } from "react";
import {
  SessionManager,
  type ConnStatus,
  type LoggedEntry,
  type ScsynthStatus,
  type ScsynthError,
} from "../session/SessionManager";
import { createBrowserWorkerClient } from "../osc/WorkerOscClient";
import { bootstrapSession } from "../session/bootstrap";

// Re-export the controller types so existing app imports keep working.
export type { ConnStatus, LoggedEntry, ScsynthStatus, ScsynthError } from "../session/SessionManager";

const scopeFlag = (key: string) =>
  typeof localStorage !== "undefined" && !!localStorage.getItem(key);

/** The one session for the whole app. Wires the browser environment — a Vite
 *  Web Worker client + the Tauri/HTTP bootstrap — into the env-agnostic
 *  controller; the `sc-*` Lit elements read this singleton directly. */
export const session = new SessionManager({
  createClient: createBrowserWorkerClient,
  bootstrap: bootstrapSession,
  scopeOptions: {
    debug: scopeFlag("sc.scopeDebug"),
    testTone: scopeFlag("sc.scopeTestTone"),
  },
});

let started = false;

/** Start the session once (bootstrap + worker connect). Idempotent. */
export function startSession(): void {
  if (started) return;
  started = true;
  void session.start();
}

/** Subscribe a React component to the connection status. */
export function useStatus(): ConnStatus {
  return useSyncExternalStore(session.status.subscribe, session.status.get);
}

/** Subscribe a React component to the bounded OSC log. */
export function useOscLog(): LoggedEntry[] {
  return useSyncExternalStore(session.log.subscribe, session.log.get);
}

/** Subscribe a React component to scsynth's reported load (CPU + sample rate). */
export function useScsynthStatus(): ScsynthStatus | null {
  return useSyncExternalStore(session.scsynthStatus.subscribe, session.scsynthStatus.get);
}

/** Subscribe a React component to the active scsynth error banners. */
export function useScsynthErrors(): ScsynthError[] {
  return useSyncExternalStore(session.scsynthErrors.subscribe, session.scsynthErrors.get);
}
