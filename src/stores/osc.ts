// React bindings for the OSC telemetry singleton (@/lib/osc/telemetry):
// useSyncExternalStore hooks over its reactive views — the bounded tx/rx
// console log, the coalescing error banners, and scsynth's reported load.
// The singleton is re-exported so consumers outside React (the `sc-*` Lit
// elements) reach it the same way.

import { useSyncExternalStore } from "react";
import { oscTelemetry } from "@/lib/osc/telemetry";
import type { ClockStatus, LoggedEntry, ScsynthError, ScsynthStatus } from "@/types/stores";

// Re-export the singleton so app imports go through the store layer.
export { oscClient } from "@/lib/osc/OscClient";
export { oscTelemetry } from "@/lib/osc/telemetry";

/** Subscribe a React component to the bounded OSC log. */
export function useOscLog(): LoggedEntry[] {
  return useSyncExternalStore(oscTelemetry.log.subscribe, oscTelemetry.log.get);
}

/** Subscribe a React component to scsynth's reported load (CPU + sample rate). */
export function useScsynthStatus(): ScsynthStatus | null {
  return useSyncExternalStore(oscTelemetry.scsynthStatus.subscribe, oscTelemetry.scsynthStatus.get);
}

export function useClockStatus(): ClockStatus | null {
  return useSyncExternalStore(oscTelemetry.clock.subscribe, oscTelemetry.clock.get);
}

/** Subscribe a React component to the active OSC error banners. */
export function useScsynthErrors(): ScsynthError[] {
  return useSyncExternalStore(oscTelemetry.errors.subscribe, oscTelemetry.errors.get);
}
