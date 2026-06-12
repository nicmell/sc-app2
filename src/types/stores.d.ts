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
}

/** A scsynth command failure (`/fail`) or late-bundle warning (`/late`),
 *  surfaced to the user as a toast banner. Repeated identical failures coalesce
 *  into one entry with a bumped `count`. */
export interface ScsynthError {
  id: number;
  /** The failed command address (e.g. `/s_new`) — empty for `/late`. */
  address: string;
  message: string;
  variant: "error" | "warn";
  count: number;
  ts: number;
}

/** The session slice of the app store: the UI-facing connection lifecycle. */
export interface SessionState {
  status: ConnStatus;
  /** The scsynth `host:port` the bridge talks to (from the session response). */
  scsynthAddress: string | null;
}

/** The OSC slice of the app store, owned by the OscClient. */
export interface OscState {
  /** Transport-level "connection ready" — the session group exists and the
   *  node-id allocator is armed. Consumers like the ScopeController arm on
   *  this; distinct from the session slice's UI `status`. */
  connected: boolean;
  log: LoggedEntry[];
  scsynthStatus: ScsynthStatus | null;
  errors: ScsynthError[];
}

/** One mounted plugin's live runtime values, keyed by the control's full
 *  named path (e.g. `"s1.freq"`; a plugin-level control is just `"freq"`).
 *  Seeded from the declarative `value` attributes in the load pass; written
 *  through `ScControl.setValue` (the single write path that also dispatches
 *  `/n_set`). */
export type PluginRuntimeValues = Record<string, number>;

/** The single app store's root state — one slice per domain. */
export interface AppState {
  session: SessionState;
  /** The OSC transport's telemetry (console log, banners, scsynth load). */
  osc: OscState;
  /** Dashboard grid placement. Restored from / periodically saved to the
   *  backend's saved-session storage by the SessionManager. */
  layout: BoxItem[];
  /** Installed-plugin registry, mirrored from the Rust router. */
  plugins: PluginInfo[];
  /** Live runtime values per mounted plugin (keyed by the plugin root's
   *  element id — the dashboard box id); dropped wholesale on unmount. */
  runtime: Record<string, PluginRuntimeValues>;
}
