// React bindings for the session singleton (@/lib/session/SessionManager):
// useSyncExternalStore hooks over its reactive views. The singleton itself is
// re-exported so existing imports (the `sc-*` Lit elements, ToastStack) keep
// working; the domain types live in @/types/stores.

import { useSyncExternalStore } from "react";
import { session } from "@/lib/session/SessionManager";
import type { ConnStatus, LoggedEntry, ScsynthStatus, ScsynthError } from "@/types/stores";

// Re-export the singleton so existing app imports keep working.
export { session } from "@/lib/session/SessionManager";

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

/** Subscribe a React component to the scsynth address the bridge talks to
 *  (from the session response; the footer shows it). */
export function useScsynthAddress(): string | null {
  return useSyncExternalStore(session.scsynthAddress.subscribe, session.scsynthAddress.get);
}

/** Subscribe a React component to the active scsynth error banners. */
export function useScsynthErrors(): ScsynthError[] {
  return useSyncExternalStore(session.scsynthErrors.subscribe, session.scsynthErrors.get);
}
