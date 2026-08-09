// Main-thread transport middleware contract and error-isolated dispatcher.

import type { TransportCommand, TransportEvent } from "@/types/osc";

export interface TransportMiddleware {
  /** Outbound webview → worker. */
  command?(cmd: TransportCommand, next: (cmd: TransportCommand) => void): void;
  /** Inbound worker → webview. */
  event?(ev: TransportEvent, next: (ev: TransportEvent) => void): void;
}

type TransportPayload = TransportCommand | TransportEvent;
type Stage<T extends TransportPayload> = (payload: T, next: (payload: T) => void) => void;

/** Compose a fresh, reentrant dispatch through the current middleware stages. */
export function composeDispatch<T extends TransportPayload>(
  stages: ReadonlyArray<Stage<T> | undefined>,
  terminal: (payload: T) => void,
): (payload: T) => void {
  return (payload) => {
    const dispatch = (index: number, current: T): void => {
      const stage = stages[index];
      if (!stage) {
        if (index < stages.length) dispatch(index + 1, current);
        else {
          try {
            terminal(current);
          } catch (error) {
            console.error("[osc] transport middleware terminal failed:", error);
          }
        }
        return;
      }
      let continued = false;
      try {
        stage(current, (nextPayload) => {
          continued = true;
          dispatch(index + 1, nextPayload);
        });
      } catch (error) {
        console.error("[osc] transport middleware failed:", error);
        if (!continued) dispatch(index + 1, current);
        return;
      }
      if (!continued && current.type !== "osc") {
        console.warn(`[osc] transport middleware did not propagate lifecycle ${current.type}`);
        dispatch(index + 1, current);
      }
    };
    dispatch(0, payload);
  };
}
