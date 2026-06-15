// Owns the session lifecycle and its UI-facing state: mint/revive the session
// over HTTP (via src/http), connect the global `oscClient`, track the
// connection status, and autosave the dashboard layout. The OSC domain —
// console log, error banners, scsynth load, heartbeat watchdog — lives on the
// OscClient itself (`@/lib/osc/OscClient`), which also terminates the
// connection on critical failures; this manager only observes the close.
//
// A *live* session still dies with its WebSocket, but its identity + dashboard
// layout persist: the session id is kept in localStorage, the layout is
// periodically PUT to the backend (saved under the app data dir next to the
// plugins), and at boot a stored id is revived via GET — falling back to
// minting a fresh session when that fails.
//
// State lives in the single app store (`@/stores/store.ts`) under its `session`
// slice; the public `status`/`scsynthAddress` are `select` views off that
// slice, so each notifies independently and the React hooks read them via
// useSyncExternalStore.

import { SliceName } from "@/constants/store";
import {
  LAYOUT_SAVE_INTERVAL_MS,
  SCSYNTH_RETRY_LIMIT,
  SCSYNTH_RETRY_MS,
  SESSION_KEY,
} from "@/constants/session";
import { get, HttpError, post, put, wsUrl } from "@/lib/http";
import { oscClient } from "@/lib/osc/OscClient";
import { layout, setLayout } from "@/stores/layout";
import { appStore } from "@/stores/store";
import type { SessionInfo } from "@/types/api";
import type { BoxItem, ConnStatus } from "@/types/stores";

/** Mint a fresh session. The server allocates the group id + node range;
 *  503 = scsynth not registered (the bounded quiet-retry case). */
async function createSession(): Promise<SessionInfo> {
  return await (await post("/api/session")).json();
}

/** Revive a stored session id (GET returns its info + saved layout), or
 *  `null` on failure — the caller falls back to minting a fresh one. A 503
 *  propagates instead: scsynth isn't registered, so the fallback POST would
 *  only burn a second registration long-poll to learn the same thing. */
async function fetchSession(id: string): Promise<SessionInfo | null> {
  try {
    return await (await get(`/api/session/${id}`)).json();
  } catch (e) {
    if (e instanceof HttpError && e.status === 503) throw e;
    return null;
  }
}

export class SessionManager {
  /** This session's slice of the single app store. */
  private readonly state = appStore.slice(SliceName.SESSION);
  readonly status = this.state.select((s) => s.status);
  readonly scsynthAddress = this.state.select((s) => s.scsynthAddress);

  private started = false;
  /** (event, id) pairs of our oscClient subscriptions, for teardown(). */
  private subscriptions: Array<[string, number]> = [];
  private disposed = false;
  /** The layout-autosave timer + the last value it saved (reference compare). */
  private saveTimer: ReturnType<typeof setInterval> | null = null;
  /** Consecutive quiet 503 boot attempts ("scsynth not registered yet") —
   *  bounded by SCSYNTH_RETRY_LIMIT before the error modal takes over. */
  private scsynthAttempts = 0;
  private lastSavedLayout: BoxItem[] | null = null;

  /** Revive the stored session (restoring its saved layout) or mint a fresh
   *  one, connect the global OSC client (which creates the session group and
   *  owns node-id allocation), watch for the connection's end, and start the
   *  periodic layout save. Idempotent — only the first call does anything
   *  (React StrictMode mounts effects twice; main.tsx calls this once at
   *  boot). */
  async start(): Promise<void> {
    if (this.started || this.disposed) return;
    this.started = true;
    try {
      // A stored id revives the saved session (same id, saved layout); any
      // failure — nothing saved, server restarted scsynth-less, … — falls
      // back to minting a fresh session.
      const stored = localStorage.getItem(SESSION_KEY);
      const info = (stored ? await fetchSession(stored) : null) ?? (await createSession());
      const {
        sessionId,
        sessionGroupId,
        nodeIdBase,
        nodeIdCount,
        scopeIndexBase,
        scopeIndexCount,
        scsynthAddress,
      } = info;
      if (this.disposed) return;
      localStorage.setItem(SESSION_KEY, sessionId);
      this.state.update((s) => ({ ...s, scsynthAddress }));
      await oscClient.connect(wsUrl(`/ws?session=${sessionId}`), {
        sessionGroupId,
        nodeIdBase,
        nodeIdCount,
        scopeIndexBase,
        scopeIndexCount,
      });
      if (this.disposed) {
        oscClient.close();
        return;
      }
      // Restore the saved layout only once connected: mounting a panel mounts
      // its <sc-plugin>, which allocates node ids + creates its group — both
      // need the live connection. An empty layout (fresh session) must not
      // clobber the DEFAULT_LAYOUT the store boots with.
      if (info.layout.length > 0) {
        setLayout(info.layout);
        this.lastSavedLayout = layout.get();
      }
      // The close is the single end-of-session signal: the OscClient closes
      // itself on every critical failure (transport error, heartbeat
      // timeout), and an orderly server-side close lands here too.
      this.subscribe("close", () => {
        if (!this.disposed) this.setStatus("error");
      });
      this.startLayoutAutosave(sessionId);
      this.scsynthAttempts = 0;
      this.setStatus("connected");
    } catch (e) {
      if (this.disposed) return;
      // 503 = the server is up but scsynth hasn't registered yet (the user
      // simply hasn't started it): keep the boot overlay and retry quietly —
      // but only for a bounded budget (~20 s), after which the error modal
      // advises that the connection isn't coming (its Retry restarts the
      // cycle). Anything else is a real failure and gets the modal at once.
      if (
        e instanceof HttpError &&
        e.status === 503 &&
        this.scsynthAttempts < SCSYNTH_RETRY_LIMIT
      ) {
        this.scsynthAttempts += 1;
        this.started = false;
        setTimeout(() => void this.start(), SCSYNTH_RETRY_MS);
        return;
      }
      this.setStatus("error");
    }
  }

  /** Periodically PUT the dashboard layout to the session endpoint (the server
   *  stores it next to the plugins, see src-tauri saved_sessions). Skips ticks
   *  where the layout hasn't changed since the last save; failures just retry
   *  on the next tick. */
  private startLayoutAutosave(sessionId: string): void {
    this.saveTimer = setInterval(() => {
      const current = layout.get();
      if (current === this.lastSavedLayout) return;
      put(`/api/session/${sessionId}`, JSON.stringify(current), {
        headers: { "content-type": "application/json" },
      }).then(
        () => {
          this.lastSavedLayout = current;
        },
        (err) => console.warn("[session] layout save failed:", err),
      );
    }, LAYOUT_SAVE_INTERVAL_MS);
  }

  dispose(): void {
    this.disposed = true;
    this.teardown();
  }

  /** Re-run the whole connection flow after a failure (the error modal's
   *  Retry button). Only legal from the "error" state; the immediate flip to
   *  "connecting" also blocks double-clicks. The dashboard layout is left
   *  alone — the existing screen state stays visible below the overlay. */
  async retry(): Promise<void> {
    if (this.disposed || this.status.get() !== "error") return;
    this.teardown();
    this.started = false;
    this.lastSavedLayout = null;
    this.scsynthAttempts = 0; // a manual retry restarts the quiet-retry budget
    this.setStatus("connecting");
    await this.start();
  }

  /** Shared teardown: stop the autosave, drop our subscriptions, and close
   *  the client (a no-op on a never-opened one). The OscClient handles its
   *  own side of the close — scope teardown via the `connected` signal,
   *  watchdog, worker. */
  private teardown(): void {
    if (this.saveTimer !== null) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    // Drop our subscriptions before closing so the intentional close doesn't
    // read as an error.
    for (const [event, id] of this.subscriptions) oscClient.off(event, id);
    this.subscriptions = [];
    oscClient.close();
  }

  private subscribe(event: string, cb: (...args: any[]) => void): void {
    this.subscriptions.push([event, oscClient.on(event, cb)]);
  }

  private setStatus(status: ConnStatus): void {
    this.state.update((s) => ({ ...s, status }));
  }
}

/** The one session for the whole app. It's a module singleton (not
 *  React-context-scoped) so the Lit `sc-*` elements — which live in injected
 *  plugin HTML, outside React's tree — can reach it directly; the React shell
 *  reads it through the hooks in `@/stores/session.ts`. */
export const session = new SessionManager();
