// React bindings for the OSC transport middleware stores:
// useSyncExternalStore hooks over its reactive views — the bounded tx/rx
// console log and scsynth's reported load/clock. Only the middleware views
// consumed by app code are exposed here (the error middleware surfaces
// failures through the global toast stack, stores/toasts).

import { useSyncExternalStore } from "react";
import { SliceName } from "@/constants/store";
import { log } from "@/lib/osc/middlewares/logging";
import { scsynthStatus } from "@/lib/osc/middlewares/status";
import { appStore } from "@/stores/store";
import type { ClockStatus, LoggedEntry, ScsynthStatus } from "@/types/stores";

export { log } from "@/lib/osc/middlewares/logging";
export { scsynthStatus } from "@/lib/osc/middlewares/status";

/** The clock-estimate view — its field is written by OscClient's ClockSync
 *  (lib/clock), not by any middleware. */
export const clock = appStore.slice(SliceName.OSC).select((value) => value.clock);

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
