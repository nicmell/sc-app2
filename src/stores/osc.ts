// React bindings for the OSC transport middleware stores:
// useSyncExternalStore hooks over its reactive views — the bounded tx/rx
// console log and scsynth's reported load/clock. Only the middleware views
// consumed by app code are exposed here (the error middleware surfaces
// failures through the global toast stack, stores/toasts).

import { useSyncExternalStore } from "react";
import { log } from "@/lib/osc/middlewares/logging";
import { clock, scsynthStatus } from "@/lib/osc/middlewares/status";
import type { ClockStatus, LoggedEntry, ScsynthStatus } from "@/types/stores";

// Re-export the singleton so app imports go through the store layer.
export { oscClient } from "@/lib/osc/OscClient";
export { log } from "@/lib/osc/middlewares/logging";
export { clock, scsynthStatus } from "@/lib/osc/middlewares/status";

/** Subscribe a React component to the bounded OSC log. */
export function useOscLog(): LoggedEntry[] {
  return useSyncExternalStore(log.subscribe, log.get);
}

/** Subscribe a React component to scsynth's reported load (CPU + sample rate). */
export function useScsynthStatus(): ScsynthStatus | null {
  return useSyncExternalStore(scsynthStatus.subscribe, scsynthStatus.get);
}

export function useClockStatus(): ClockStatus | null {
  return useSyncExternalStore(clock.subscribe, clock.get);
}
