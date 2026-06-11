// React bindings for the OSC client singleton (@/lib/osc/OscClient):
// useSyncExternalStore hooks over its reactive views — the bounded tx/rx
// console log, the coalescing error banners, and scsynth's reported load.
// The singleton is re-exported so consumers outside React (the `sc-*` Lit
// elements) reach it the same way.

import { useSyncExternalStore } from "react";
import { oscClient } from "@/lib/osc/OscClient";
import type { LoggedEntry, ScsynthError, ScsynthStatus } from "@/types/stores";

// Re-export the singleton so app imports go through the store layer.
export { oscClient } from "@/lib/osc/OscClient";

/** Subscribe a React component to the bounded OSC log. */
export function useOscLog(): LoggedEntry[] {
  return useSyncExternalStore(oscClient.log.subscribe, oscClient.log.get);
}

/** Subscribe a React component to scsynth's reported load (CPU + sample rate). */
export function useScsynthStatus(): ScsynthStatus | null {
  return useSyncExternalStore(oscClient.scsynthStatus.subscribe, oscClient.scsynthStatus.get);
}

/** Subscribe a React component to the active OSC error banners. */
export function useScsynthErrors(): ScsynthError[] {
  return useSyncExternalStore(oscClient.errors.subscribe, oscClient.errors.get);
}
