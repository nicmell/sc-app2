// The global toast stack: a plain app-store slice any module can push to
// (OSC error middleware, future plugin/preset failures). Repeats with the
// same `key` coalesce into one entry with a bumped `count` — the ToastStack
// countdown deliberately does NOT re-arm on a coalesced repeat (see its
// header note on modal inertness).

import { useSyncExternalStore } from "react";
import { MAX_TOASTS } from "@/constants/toasts";
import { SliceName } from "@/constants/store";
import type { ReadonlyStore } from "@/lib/utils/reactiveStore";
import { appStore } from "@/stores/store";
import type { ToastEntry, ToastVariant } from "@/types/stores";

const state = appStore.slice(SliceName.TOASTS);
/** The read-only view (tests, the dev debug hook); writes go through the actions. */
export const toasts: ReadonlyStore<ToastEntry[]> = state;
let nextToastId = 0;

/** Push a toast. A `key` gives the entry a coalescing identity: an active
 *  toast with the same key bumps its `count` instead of stacking a duplicate
 *  (a recurrence after dismissal mints a new entry). */
export function pushToast(toast: { message: string; variant: ToastVariant; key?: string }): void {
  state.update((entries) => {
    const existing = toast.key && entries.find((entry) => entry.key === toast.key);
    if (existing) {
      return entries.map((entry) =>
        entry === existing ? { ...entry, count: entry.count + 1 } : entry,
      );
    }
    return [...entries, { ...toast, id: nextToastId++, count: 1 }].slice(-MAX_TOASTS);
  });
}

export function dismissToast(id: number): void {
  state.update((entries) => entries.filter((entry) => entry.id !== id));
}

/** Clear toasts — all of them, or only a producer's own via a key predicate. */
export function clearToasts(match?: (entry: ToastEntry) => boolean): void {
  state.update((entries) => (match ? entries.filter((entry) => !match(entry)) : []));
}

/** Subscribe a React component to the toast stack. */
export function useToasts(): ToastEntry[] {
  return useSyncExternalStore(state.subscribe, state.get);
}
