// Bridge a reactiveStore into React rendering.
import { useSyncExternalStore } from "react";
import type { ReadonlyStore } from "@/lib/utils/reactiveStore";

export function useStore<T>(store: ReadonlyStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get);
}
