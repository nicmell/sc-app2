// A tiny multi-listener fan-out: add returns an unsubscribe, emit calls every
// listener, clear drops them all. The OscClient implementations keep one group
// per event (reply / error / scopeChunk) instead of hand-rolling Sets.

import type { Unsubscribe } from "./messageEndpoint";

export interface ListenerGroup<T> {
  /** Register a listener; returns an unsubscribe. */
  add(listener: (value: T) => void): Unsubscribe;
  /** Call every listener with `value`. */
  emit(value: T): void;
  /** Drop all listeners. */
  clear(): void;
}

export function listenerGroup<T>(): ListenerGroup<T> {
  const listeners = new Set<(value: T) => void>();
  return {
    add(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    emit(value) {
      for (const listener of listeners) listener(value);
    },
    clear() {
      listeners.clear();
    },
  };
}
