// React bindings for the Conductor's slice (the module itself lives in
// lib/conductor — see CONDUCTOR.md).

import { useSyncExternalStore } from "react";
import { SliceName } from "@/constants/store";
import { appStore } from "@/stores/store";
import type { ConductorState } from "@/types/stores";

export const conductorState = appStore.slice(SliceName.CONDUCTOR).select((v) => v);

/** Subscribe a React component to the session's musical time. */
export function useConductor(): ConductorState {
  return useSyncExternalStore(conductorState.subscribe, conductorState.get);
}
