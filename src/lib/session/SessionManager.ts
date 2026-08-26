// Owns the live-connection half of the session lifecycle and its UI-facing
// state: connect the global `oscClient` to a resolved session, track the
// connection status, and autosave the dashboard layout. Session RESOLUTION —
// localStorage identity, mint/revive over HTTP, the 503 retry budget — lives
// in the route loaders (`@/lib/session/resolveSession`); Layout hands
// the resolved SessionInfo to `connect()` and calls `disconnect()` on unmount.
// OSC telemetry and the heartbeat watchdog observe OscClient's public seams;
// the client itself (`@/lib/osc/OscClient`) also
// terminates the connection on critical failures; this manager only observes
// the close.
//
// State lives in the single app store (`@/stores/store.ts`) under its `session`
// slice; the public `status`/`scsynthAddress` are `select` views off that
// slice, so each notifies independently and the React hooks read them via
// useSyncExternalStore.

import { LAYOUT_SAVE_INTERVAL_MS } from "@/constants/session";
import { SliceName } from "@/constants/store";
import { put, wsUrl } from "@/lib/http";
import { oscClient } from "@/lib/osc/OscClient";
import { layout, setLayout } from "@/stores/layout";
import { appStore } from "@/stores/store";
import { pushToast } from "@/stores/toasts";
import type { SessionInfo } from "@/types/api";
import type { BoxItem, ConnStatus } from "@/types/stores";

export class SessionManager {
  /** This session's slice of the single app store. */
  private readonly state = appStore.slice(SliceName.SESSION);
  readonly status = this.state.select((state) => state.status);
  readonly scsynthAddress = this.state.select((state) => state.scsynthAddress);

  /** (event, id) pairs of our oscClient subscriptions, for teardown(). */
  private subscriptions: Array<["close", number]> = [];
  /** The layout-autosave worker-clock subscription + last saved reference. */
  private saveOff: (() => void) | null = null;
  private lastSavedLayout: BoxItem[] | null = null;
  /** Bumped by every connect()/disconnect(): a stale async connect abandons
   *  itself when the epoch moved under it (a session switch mid-await). */
  private epoch = 0;
  /** The info of the current (pending or live) connection — connect() with
   *  the same object is a no-op, see the StrictMode note on disconnect(). */
  private currentInfo: SessionInfo | null = null;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** Connect the global OSC client to an already-resolved session (which
   *  creates the session group and owns node-id allocation), restore its saved
   *  layout, watch for the connection's end, and start the periodic layout
   *  save. Each call supersedes the previous one (epoch guard); HTTP failures
   *  never land here — the route loaders resolve the session first. */
  async connect(info: SessionInfo): Promise<void> {
    if (this.disconnectTimer !== null) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
      // StrictMode remount with the same loader data: the standing connection
      // is the right one — reopening it would race the server's processing of
      // the close (a 409 on the second WS).
      if (this.currentInfo === info) return;
    }
    this.currentInfo = info;
    const epoch = ++this.epoch;
    this.teardown();
    this.lastSavedLayout = null;
    this.setStatus("connecting");
    this.state.update((state) => ({ ...state, scsynthAddress: info.scsynthAddress }));

    try {
      await oscClient.connect(wsUrl(`/ws?session=${info.sessionId}`), {
        sessionGroupId: info.sessionGroupId,
        nodeIdBase: info.nodeIdBase,
        nodeIdCount: info.nodeIdCount,
        scopeIndexBase: info.scopeIndexBase,
        scopeIndexCount: info.scopeIndexCount,
      });
      // Superseded mid-await: nothing to clean up here — the superseding
      // connect()/disconnect() already tore the old socket down (the worker
      // transport disposes a replaced socket), and the singleton now belongs
      // to the successor. Closing it here would kill the NEW connection.
      if (this.epoch !== epoch) return;

      // Restore the saved layout only once connected: mounting a panel mounts
      // its <sc-plugin>, which allocates node ids + creates its group — both
      // need the live connection. Unconditional — a fresh session's empty
      // layout must CLEAR a previous session's boxes (dead id → mint →
      // redirect happens without a reload).
      setLayout(info.layout);
      this.lastSavedLayout = layout.get();
      // The close is the single end-of-session signal: the OscClient closes
      // itself on every critical failure (transport error, heartbeat
      // timeout), and an orderly server-side close lands here too.
      this.subscribe("close", () => {
        if (this.epoch === epoch) this.setStatus("error");
      });
      this.startLayoutAutosave(info.sessionId);
      this.setStatus("connected");
    } catch {
      if (this.epoch === epoch) this.setStatus("error");
    }
  }

  /** End the live connection (Layout's effect cleanup). Deferred one
   *  tick: React StrictMode runs cleanup + re-effect back to back, and an
   *  immediate teardown would close and reopen the WebSocket — the reopen
   *  races the server's processing of the close and gets rejected (409). The
   *  remount's connect() cancels the timer and keeps the connection; a real
   *  unmount fires it. The session identity persists either way — a later
   *  connect() with the same info revives it. */
  disconnect(): void {
    this.disconnectTimer = setTimeout(() => {
      this.disconnectTimer = null;
      this.currentInfo = null;
      this.epoch += 1;
      this.teardown();
    }, 0);
  }

  /** Periodically PUT the dashboard layout to the session endpoint (the server
   *  stores it next to the plugins, see src-tauri saved_sessions). Skips ticks
   *  where the layout hasn't changed since the last save; failures just retry
   *  on the next tick. */
  private startLayoutAutosave(sessionId: string): void {
    this.saveOff = oscClient.subscribeClock(LAYOUT_SAVE_INTERVAL_MS, () => {
      const current = layout.get();
      if (current === this.lastSavedLayout) return;
      put(`/api/session/${sessionId}`, JSON.stringify(current), {
        headers: { "content-type": "application/json" },
      }).then(
        () => {
          this.lastSavedLayout = current;
        },
        (error: unknown) => {
          console.warn("[session] layout save failed:", error);
          // Coalesced (one toast, bumped count) — the autosave retries every
          // tick, and a dead session/registry must not stack banners.
          pushToast({
            variant: "warn",
            key: "session:layout-save",
            message: `layout save failed: ${error instanceof Error ? error.message : String(error)}`,
          });
        },
      );
    }).off;
  }

  /** Shared teardown: stop the autosave, drop our subscriptions, and close
   *  the client (a no-op on a never-opened one). The OscClient handles its
   *  own side of the close — scope teardown via the `connected` signal,
   *  watchdog, worker. Subscriptions drop before the close so the intentional
   *  close doesn't read as an error. */
  private teardown(): void {
    this.saveOff?.();
    this.saveOff = null;
    for (const [event, id] of this.subscriptions) oscClient.off(event, id);
    this.subscriptions = [];
    oscClient.close();
  }

  private subscribe(
    event: "close",
    callback: (info?: { code?: number; reason?: string }) => void,
  ): void {
    this.subscriptions.push([event, oscClient.on(event, callback)]);
  }

  private setStatus(status: ConnStatus): void {
    this.state.update((state) => ({ ...state, status }));
  }
}

/** The one session for the whole app. It's a module singleton (not
 *  React-context-scoped) so the Lit `sc-*` elements — which live in injected
 *  plugin HTML, outside React's tree — can reach it directly; the React shell
 *  reads it through the hooks in `@/stores/session.ts`. */
export const session = new SessionManager();
