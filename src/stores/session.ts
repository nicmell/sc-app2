// React bindings for the session singleton (@/lib/session/SessionManager):
// useSyncExternalStore hooks over its reactive views. The singleton itself is
// re-exported so existing imports (the `sc-*` Lit elements) keep working; the
// domain types live in @/types/stores. The OSC-side hooks (log, banners,
// scsynth load) live in `@/stores/osc` over the OscClient.

import { useSyncExternalStore } from "react";
import { session } from "@/lib/session/SessionManager";
import type { ConnStatus } from "@/types/stores";

// Re-export the singleton so existing app imports keep working.
export { session } from "@/lib/session/SessionManager";

/** Subscribe a React component to the connection status. */
export function useStatus(): ConnStatus {
  return useSyncExternalStore(session.status.subscribe, session.status.get);
}

/** Subscribe a React component to the scsynth address the bridge talks to
 *  (from the session response; the footer shows it). */
export function useScsynthAddress(): string | null {
  return useSyncExternalStore(session.scsynthAddress.subscribe, session.scsynthAddress.get);
}
