// React glue for the SessionController: a provider that owns the controller's
// lifecycle and hooks that read its reactive stores via useSyncExternalStore.

import { createContext, useContext, useEffect, useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import type { DecodedScopeChunk } from "@sc-app/server-commands";
import {
  SessionController,
  type ConnStatus,
  type LoggedEntry,
} from "./SessionController";

const SessionContext = createContext<SessionController | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  // Create the controller inside the effect so React 18 StrictMode's
  // mount→unmount→mount cycle disposes the first one and runs the second
  // cleanly, rather than re-using a disposed instance.
  const [controller, setController] = useState<SessionController | null>(null);

  useEffect(() => {
    const c = new SessionController();
    setController(c);
    void c.start();
    return () => c.dispose();
  }, []);

  if (!controller) return null;

  return <SessionContext.Provider value={controller}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionController {
  const controller = useContext(SessionContext);
  if (!controller) throw new Error("useSession must be used within a SessionProvider");
  return controller;
}

export function useStatus(): ConnStatus {
  const { status } = useSession();
  return useSyncExternalStore(status.subscribe, status.get);
}

export function useOscLog(): LoggedEntry[] {
  const { log } = useSession();
  return useSyncExternalStore(log.subscribe, log.get);
}

/** The master-out scope's latest-chunk ref, or `null` until connected.
 *  Re-evaluates when the connection status changes (scope starts on connect). */
export function useScopeChunkRef(): { current: DecodedScopeChunk | null } | null {
  const session = useSession();
  const status = useStatus();
  return status === "connected" ? session.scope?.chunkRef ?? null : null;
}
