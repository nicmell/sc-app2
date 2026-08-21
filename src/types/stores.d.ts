// The app-store domain shapes, gathered here (old sc-app convention) so the
// store and its slice modules only ever exchange types — `.d.ts` modules can't
// carry runtime values, which makes the "no runtime imports into store.ts"
// invariant structural.

import type { PluginInfo } from "@/types/api";

/** A grid cell: react-grid-layout geometry + the assigned plugin id. */
export interface BoxItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
  plugin?: string;
}

export type ConnStatus = "connecting" | "connected" | "error";

/** One decoded OSC message for the console. */
export interface OscLogEntry {
  ts: number; // client wall-clock ms
  dir: "tx" | "rx"; // tx = we sent it, rx = we received it
  address: string;
  args: string[];
}

/** A log entry plus a stable React key. */
export type LoggedEntry = OscLogEntry & { id: number };

/** scsynth's live load, parsed from its `/status.reply` heartbeat — what the
 *  footer reports. The Rust bridge polls `/status` and fans the reply out to us. */
export interface ScsynthStatus {
  avgCpu: number;
  peakCpu: number;
  sampleRate: number;
  /** Live counts from /status.reply — numSynths is the voice-leak detector. */
  numUgens: number;
  numSynths: number;
  numGroups: number;
}

export interface ClockStatus {
  offset: number;
  rtt: number;
}

/** The sc-base-toast accent variants a toast entry can carry. */
export type ToastVariant = "default" | "info" | "success" | "warn" | "error";

/** One entry in the global toast stack. Any producer pushes via
 *  `stores/toasts`; repeats with the same `key` coalesce into one entry with a
 *  bumped `count` instead of stacking. */
export interface ToastEntry {
  /** Coalescing identity (producers namespace their own, e.g. `osc:/s_new:…`);
   *  omitted = never coalesced. Also the handle for a producer's bulk clear. */
  key?: string;
  id: number;
  message: string;
  variant: ToastVariant;
  count: number;
}

/** The session slice of the app store: the UI-facing connection lifecycle. */
export interface SessionState {
  status: ConnStatus;
  /** The scsynth `host:port` the bridge talks to (from the session response). */
  scsynthAddress: string | null;
}

/** The OSC slice: OscClient owns connected; transport middlewares own the rest. */
export interface OscState {
  /** Transport-level "connection ready" — the session group exists and the
   *  node-id allocator is armed. Consumers like the plugin lifecycle arm on
   *  this; distinct from the session slice's UI `status`. */
  connected: boolean;
  log: LoggedEntry[];
  scsynthStatus: ScsynthStatus | null;
  clock: ClockStatus | null;
}

/** The single app store's root state — one slice per domain. */
export interface AppState {
  session: SessionState;
  /** OSC transport observations (console log, scsynth load, clock). */
  osc: OscState;
  /** Dashboard grid placement. Restored from / periodically saved to the
   *  backend's saved-session storage by the SessionManager. */
  layout: BoxItem[];
  /** Installed-plugin registry, mirrored from the Rust router. */
  plugins: PluginInfo[];
  /** The global toast stack — any module pushes via `stores/toasts`. */
  toasts: ToastEntry[];
}
