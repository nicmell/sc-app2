// Owns the per-session OSC connection and the UI-facing reactive state:
// connection status, a bounded OSC log (tx + rx), scsynth load, and error
// banners. Talks to the session endpoints itself (via src/http) and to the
// bridge through the global `oscClient`.
//
// A *live* session still dies with its WebSocket, but its identity + dashboard
// layout persist: the session id is kept in localStorage, the layout is
// periodically PUT to the backend (saved under the app data dir next to the
// plugins), and at boot a stored id is revived via GET — falling back to
// minting a fresh session when that fails.
//
// State lives in the single app store (`@/stores/store.ts`) under its `session`
// slice; the public `status`/`log`/`scsynthStatus`/`scsynthErrors` are `select`
// views off that slice, so each notifies independently and the React hooks read
// them via useSyncExternalStore.

import OSC from "osc-js";
import {
  flattenPacket,
  SCOPE_CHUNK_ADDRESS,
  type OscArg,
  type OscPacket,
} from "@sc-app/server-commands";
import { OSC_REPLIES } from "@/constants/osc";
import { SliceName } from "@/constants/store";
import {
  CREATE_SESSION_RETRIES,
  CREATE_SESSION_RETRY_MS,
  LAYOUT_SAVE_INTERVAL_MS,
  MAX_ERRORS,
  MAX_LOG,
  SESSION_KEY,
} from "@/constants/session";
import { get, post, put, wsUrl, HttpError } from "@/lib/http";
import { oscClient } from "@/lib/osc/OscClient";
import { ScopeController } from "@/lib/scope/ScopeController";
import { layout, setLayout } from "@/stores/layout";
import { appStore } from "@/stores/store";
import type { SessionInfo } from "@/types/api";
import type { BoxItem, ConnStatus, ScsynthStatus } from "@/types/stores";

/** Parse a `/status.reply`'s args. Layout (scsynth):
 *  `[1, ugens, synths, groups, defs, avgCpu, peakCpu, srNominal, srActual]`. */
function parseStatus(args: ReadonlyArray<OscArg>): ScsynthStatus {
  return {
    avgCpu: Number(args[5]) || 0,
    peakCpu: Number(args[6]) || 0,
    sampleRate: Number(args[8]) || 0,
  };
}

/** Mint a fresh session. The server allocates the group id + node range; it
 *  can briefly return 503 if scsynth hasn't finished registering, so retry. */
async function createSession(): Promise<SessionInfo> {
  for (let attempt = 0; attempt < CREATE_SESSION_RETRIES; attempt++) {
    try {
      return await (await post("/api/session")).json();
    } catch (err) {
      if (!(err instanceof HttpError) || err.status !== 503) throw err;
      await new Promise((r) => setTimeout(r, CREATE_SESSION_RETRY_MS));
    }
  }
  throw new Error("POST /api/session → 503 (scsynth not registered)");
}

/** Revive a stored session id (GET returns its info + saved layout), or
 *  `null` on any failure — the caller falls back to minting a fresh one. */
async function fetchSession(id: string): Promise<SessionInfo | null> {
  try {
    return await (await get(`/api/session/${id}`)).json();
  } catch {
    return null;
  }
}

export class SessionManager {
  /** This session's slice of the single app store. */
  private readonly state = appStore.slice(SliceName.SESSION);
  readonly status = this.state.select((s) => s.status);
  readonly log = this.state.select((s) => s.log);
  readonly scsynthStatus = this.state.select((s) => s.scsynthStatus);
  readonly scsynthErrors = this.state.select((s) => s.errors);
  readonly scsynthAddress = this.state.select((s) => s.scsynthAddress);

  private started = false;
  private connected = false;
  /** (event, id) pairs of our oscClient subscriptions, for dispose(). */
  private subscriptions: Array<[string, number]> = [];
  private scopeController: ScopeController | null = null;
  private nextId = 0;
  private disposed = false;
  /** The layout-autosave timer + the last value it saved (reference compare). */
  private saveTimer: ReturnType<typeof setInterval> | null = null;
  private lastSavedLayout: BoxItem[] | null = null;

  /** Dismiss one banner by id (the toast's × / auto-dismiss timer). */
  dismissError(id: number): void {
    this.state.update((s) => ({ ...s, errors: s.errors.filter((e) => e.id !== id) }));
  }

  /** Drop every banner. */
  clearErrors(): void {
    this.state.update((s) => ({ ...s, errors: [] }));
  }

  /** The master-out scope, available once connected. */
  get scope(): ScopeController | null {
    return this.scopeController;
  }

  /** Revive the stored session (restoring its saved layout) or mint a fresh
   *  one, connect the global OSC client (which creates the session group and
   *  owns node-id allocation), wire its events into the store, and start the
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
      const { sessionId, sessionGroupId, nodeIdBase, nodeIdCount, scopeIndex, scsynthAddress } = info;
      if (this.disposed) return;
      localStorage.setItem(SESSION_KEY, sessionId);
      if (info.layout) {
        setLayout(info.layout);
        this.lastSavedLayout = layout.get();
      }
      this.state.update((s) => ({ ...s, scsynthAddress }));
      await oscClient.connect(wsUrl(`/ws?session=${sessionId}`), { sessionGroupId, nodeIdBase, nodeIdCount });
      if (this.disposed) {
        oscClient.close();
        return;
      }
      this.connected = true;
      this.subscribe("*", (msg: OSC.Message) => this.handleReply(msg));
      // A transport error or an unexpected close both surface as "error".
      this.subscribe("error", () => {
        if (!this.disposed) this.setStatus("error");
      });
      this.subscribe("close", () => {
        if (!this.disposed) this.setStatus("error");
      });
      // Start the master-out scope tap + subscription now that we're connected.
      this.scopeController = new ScopeController(oscClient, sessionGroupId, scopeIndex);
      this.scopeController.start();
      this.startLayoutAutosave(sessionId);
      this.setStatus("connected");
    } catch {
      if (!this.disposed) this.setStatus("error");
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

  /** Send an OSC packet over the bridge, logging it as `tx`. */
  send(packet: OscPacket): void {
    if (!this.connected) return;
    for (const { address, args } of flattenPacket(packet)) this.append("tx", address, args);
    oscClient.send(packet);
  }

  dispose(): void {
    this.disposed = true;
    if (this.saveTimer !== null) {
      clearInterval(this.saveTimer);
      this.saveTimer = null;
    }
    this.scopeController?.dispose();
    this.scopeController = null;
    // Drop our subscriptions before closing so the intentional close doesn't
    // read as an error.
    for (const [event, id] of this.subscriptions) oscClient.off(event, id);
    this.subscriptions = [];
    if (this.connected) {
      this.connected = false;
      oscClient.close();
    }
  }

  private subscribe(event: string, cb: (...args: any[]) => void): void {
    this.subscriptions.push([event, oscClient.on(event, cb)]);
  }

  private setStatus(status: ConnStatus): void {
    this.state.update((s) => ({ ...s, status }));
  }

  /** Route an inbound reply: `/status.reply` updates the scsynth-status slice
   *  (and is kept out of the console); `/scope/chunk` streams at ~47 Hz and is
   *  consumed by the ScopeController's own subscription, so it's skipped here;
   *  `/fail` and `/late` additionally raise a banner; everything else is
   *  logged as `rx`. */
  private handleReply(reply: OSC.Message): void {
    if (reply.address === SCOPE_CHUNK_ADDRESS) return;
    if (reply.address === OSC_REPLIES.STATUS) {
      const next = parseStatus(reply.args as ReadonlyArray<OscArg>);
      this.state.update((s) => ({ ...s, scsynthStatus: next }));
      return;
    }
    // `/fail <command> <error> [extras…]` and `/late <seconds>` are mirrored to
    // the browser console so every failure is visible there, and also raise a
    // toast banner. Either way they still fall through to the OSC console as
    // the full history.
    if (reply.address === OSC_REPLIES.FAIL) {
      const command = String(reply.args[0] ?? "?");
      const message = String(reply.args[1] ?? "(no message)");
      console.error(`[scsynth] ${command}: ${message}`);
      this.pushError(command, message, "error");
    } else if (reply.address === OSC_REPLIES.LATE) {
      const seconds = Number(reply.args[0]) || 0;
      const message = `bundle ran ${seconds.toFixed(3)}s late`;
      console.warn(`[scsynth] /late: ${message}`);
      this.pushError("/late", message, "warn");
    }
    this.append("rx", reply.address, reply.args.map((a) => String(a)));
  }

  /** Add a banner, coalescing an identical (address + message) one into a
   *  bumped count + refreshed timestamp (which restarts its auto-dismiss). */
  private pushError(address: string, message: string, variant: "error" | "warn"): void {
    this.state.update((s) => {
      const existing = s.errors.find((e) => e.address === address && e.message === message);
      const errors = existing
        ? s.errors.map((e) => (e === existing ? { ...e, count: e.count + 1, ts: Date.now() } : e))
        : [...s.errors, { id: this.nextId++, address, message, variant, count: 1, ts: Date.now() }].slice(
            -MAX_ERRORS,
          );
      return { ...s, errors };
    });
  }

  private append(dir: "tx" | "rx", address: string, args: string[]): void {
    this.state.update((s) => ({
      ...s,
      log: [...s.log, { ts: Date.now(), dir, address, args, id: this.nextId++ }].slice(-MAX_LOG),
    }));
  }
}

/** The one session for the whole app. It's a module singleton (not
 *  React-context-scoped) so the Lit `sc-*` elements — which live in injected
 *  plugin HTML, outside React's tree — can reach it directly; the React shell
 *  reads it through the hooks in `@/stores/session.ts`. */
export const session = new SessionManager();
