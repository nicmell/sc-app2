// Owns the live-connection half of the session lifecycle and its UI-facing
// state: connect the global `oscClient` to a resolved session, track the
// connection status, and autosave the session data (dashboard boxes +
// per-box plugin presets). Session RESOLUTION —
// localStorage identity, mint/revive over HTTP, the 503 retry budget — lives
// in the route loaders (`@/lib/session/resolveSession`); Layout hands
// the resolved SessionInfo to `connect()` and calls `disconnect()` on unmount.
// OSC telemetry and the heartbeat watchdog observe OscClient's public
// seams; the client closes itself on critical failures — this manager only
// observes the close.
//
// Reentrancy: every connect()/disconnect() bumps `epoch`; async
// continuations check it and a superseded connect abandons itself WITHOUT
// touching the socket (the successor owns the singleton). disconnect() is
// deferred one tick so a StrictMode cleanup + re-effect keeps the standing
// connection (close-and-reopen races the server's close handling → 409);
// connect() with the SAME SessionInfo cancels the timer and no-ops.
//
// State lives in the single app store (`@/stores/store.ts`) under its `session`
// slice; the public `status`/`scsynthAddress` are `select` views off that
// slice, so each notifies independently and the React hooks read them via
// useSyncExternalStore.

import { SESSION_SAVE_INTERVAL_MS } from "@/constants/session";
import { SliceName } from "@/constants/store";
import { put, wsUrl } from "@/lib/http";
import { oscClient } from "@/lib/osc/OscClient";
import { layout, setLayout } from "@/stores/layout";
import { presets, setBoxPresets, setPresets } from "@/stores/presets";
import { appStore } from "@/stores/store";
import { pushToast } from "@/stores/toasts";
import type { BoxPresets, SessionInfo } from "@/types/api";
import type { BoxItem, ConnStatus } from "@/types/stores";

export class SessionManager {
  /** This session's slice of the single app store. */
  private readonly state = appStore.slice(SliceName.SESSION);
  readonly status = this.state.select((state) => state.status);
  readonly scsynthAddress = this.state.select((state) => state.scsynthAddress);

  /** (event, id) pairs of our oscClient subscriptions, for teardown(). */
  private subscriptions: Array<["close", number]> = [];
  /** The session-autosave worker-clock subscription + last saved references
   *  (one per slice — a tick saves when either moved). */
  private saveOff: (() => void) | null = null;
  /** Unsubscribe from sibling clients' forwarded presets harvests. */
  private presetsOff: (() => void) | null = null;
  private lastSavedBoxes: BoxItem[] | null = null;
  private lastSavedPresets: Record<string, BoxPresets> | null = null;
  /** The reentrancy guard — see the header. */
  private epoch = 0;
  /** The info of the current (pending or live) connection — connect() with
   *  the same object is a no-op, see the StrictMode note on disconnect(). */
  private currentInfo: SessionInfo | null = null;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;

  /** Connect the global OSC client to an already-resolved session (which
   *  creates the session group and owns node-id allocation), restore its saved
   *  session data, watch for the connection's end, and start the periodic
   *  save. Each call supersedes the previous one (epoch guard); HTTP failures
   *  never land here — the route loaders resolve the session first. */
  async connect(info: SessionInfo): Promise<void> {
    if (this.disconnectTimer !== null) {
      clearTimeout(this.disconnectTimer);
      this.disconnectTimer = null;
      // StrictMode remount with the same loader data: keep the standing
      // connection (see the header).
      if (this.currentInfo === info) return;
    }
    this.currentInfo = info;
    const epoch = ++this.epoch;
    this.teardown();
    this.lastSavedBoxes = null;
    this.lastSavedPresets = null;
    this.setStatus("connecting");
    this.state.update((state) => ({ ...state, scsynthAddress: info.scsynthAddress }));

    try {
      await oscClient.connect(wsUrl(`/ws?session=${info.sessionId}`), info.sessionId, {
        sessionGroupId: info.sessionGroupId,
        nodeIdBase: info.nodeIdBase,
        nodeIdCount: info.nodeIdCount,
        scopeIndexBase: info.scopeIndexBase,
        scopeIndexCount: info.scopeIndexCount,
      });
      // Superseded mid-await: nothing to clean up — the successor already
      // tore the old socket down; closing here would kill the NEW connection.
      if (this.epoch !== epoch) return;

      // Restore the saved session data only once connected: mounting a panel
      // mounts its <sc-plugin>, which allocates node ids + creates its group
      // — both need the live connection. Presets land FIRST — setLayout
      // triggers the panel mounts that read them. Both unconditional — a
      // fresh session's empty data must CLEAR a previous session's boxes and
      // values (dead id → mint → redirect happens without a reload).
      setPresets(info.data.presets);
      setLayout(info.data.boxes);
      this.lastSavedBoxes = layout.get();
      this.lastSavedPresets = presets.get();
      // The close is the single end-of-session signal: the OscClient closes
      // itself on every critical failure (transport error, heartbeat
      // timeout), and an orderly server-side close lands here too.
      this.subscribe("close", () => {
        if (this.epoch === epoch) this.setStatus("error");
      });
      this.startSessionAutosave(info.sessionId);
      // Mirror sibling clients' live harvests (box iframes push through the
      // shared worker) into the presets slice, so the dashboard's autosave
      // persists them; setBoxPresets drops boxes outside this realm's
      // layout, so the mirror is safe in every client.
      this.presetsOff = oscClient.onBoxPresets((boxId, entry) =>
        setBoxPresets(boxId, entry.plugin, entry.values),
      );
      this.setStatus("connected");
    } catch {
      if (this.epoch === epoch) this.setStatus("error");
    }
  }

  /** End the live connection (Layout's effect cleanup), deferred one tick
   *  for StrictMode (see the header) — a remount's connect() cancels the
   *  timer, a real unmount fires it. Session identity persists either way;
   *  a later connect() with the same info revives it. */
  disconnect(): void {
    this.disconnectTimer = setTimeout(() => {
      this.disconnectTimer = null;
      this.currentInfo = null;
      this.epoch += 1;
      this.teardown();
    }, 0);
  }

  /** Periodically PUT the session data (boxes + presets) to the session
   *  endpoint (the server stores it opaquely, see src-tauri core/layouts.rs).
   *  Skips ticks where neither slice moved since the last save; failures just
   *  retry on the next tick. */
  private startSessionAutosave(sessionId: string): void {
    this.saveOff = oscClient.subscribeClock(SESSION_SAVE_INTERVAL_MS, () => {
      const boxes = layout.get();
      const boxPresets = presets.get();
      if (boxes === this.lastSavedBoxes && boxPresets === this.lastSavedPresets) return;
      put(`/api/session/${sessionId}`, JSON.stringify({ boxes, presets: boxPresets }), {
        headers: { "content-type": "application/json" },
        // The coalesced toast below is this call's dedicated surface (it
        // also covers the 404 dead-session case the 5xx observer skips).
        notify: false,
      }).then(
        () => {
          this.lastSavedBoxes = boxes;
          this.lastSavedPresets = boxPresets;
        },
        (error: unknown) => {
          console.warn("[session] session save failed:", error);
          // Coalesced (one toast, bumped count) — the autosave retries every
          // tick, and a dead session/registry must not stack toasts.
          pushToast({
            variant: "warn",
            key: "session:data-save",
            message: `session save failed: ${error instanceof Error ? error.message : String(error)}`,
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
    this.presetsOff?.();
    this.presetsOff = null;
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
