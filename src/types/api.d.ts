// HTTP payload shapes (the Rust router's serialized responses).

import type { BoxItem } from "@/types/stores";
import type { PresetEntry } from "@/types/runtime";

export interface PluginAsset {
  path: string;
  type: string;
}

/** One installed plugin, as listed by `/api/plugins`. */
export interface PluginInfo {
  id: string;
  name: string;
  title?: string;
  description?: string;
  author: string;
  version: string;
  entry: string;
  assets: PluginAsset[];
}

/** One box's persisted plugin state: the plugin id it was captured against —
 *  resume skips the whole box unless it still matches the box's assigned
 *  plugin (a re-upload mints a fresh id) — plus the value map keyed by
 *  element content-hash id (see contentHash.ts). */
export interface BoxPresets {
  plugin: string;
  values: Record<string, PresetEntry>;
}

/** The persisted session payload (opaque to the server, see core/layouts.rs):
 *  the dashboard boxes + each box's plugin presets. */
export interface SessionData {
  boxes: BoxItem[];
  presets: Record<string, BoxPresets>;
}

/** What the session endpoints return: the server-assigned session identity +
 *  node-id allocation + scope buffer + the scsynth address for the footer,
 *  plus (on GET) the saved session data. */
export interface SessionInfo {
  sessionId: string;
  /** scsynth group this session's synths must live under — allocated by the
   *  server, created by the OscClient once the WS is open. */
  sessionGroupId: number;
  /** First node id the frontend may allocate for this session. */
  nodeIdBase: number;
  /** How many node ids the frontend may allocate. */
  nodeIdCount: number;
  /** First scsynth scope-buffer index this session's scope taps may use;
   *  the frontend allocates one slot per <sc-scope> from this span. */
  scopeIndexBase: number;
  /** How many scope-buffer slots the session owns. */
  scopeIndexCount: number;
  /** The scsynth `host:port` the bridge talks to (shown in the footer);
   *  empty if the peer is unconfigured. */
  scsynthAddress: string;
  /** The saved session data; empty boxes/presets when none saved (the route
   *  loader normalizes whatever the opaque storage returns). */
  data: SessionData;
}
