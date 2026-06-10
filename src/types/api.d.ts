// HTTP payload shapes (the Rust router's serialized responses).

import type { BoxItem } from "@/types/stores";

export interface PluginAsset {
  path: string;
  type: string;
}

/** One installed plugin, as listed by `/api/plugins`. */
export interface PluginInfo {
  id: string;
  name: string;
  author: string;
  version: string;
  entry: string;
  assets: PluginAsset[];
}

/** What the session endpoints return: the server-assigned session identity +
 *  node-id allocation + scope buffer + the scsynth address for the footer,
 *  plus (on GET) the saved dashboard layout. */
export interface SessionInfo {
  sessionId: string;
  /** scsynth group this session's synths must live under — allocated by the
   *  server, created by the OscClient once the WS is open. */
  sessionGroupId: number;
  /** First node id the frontend may allocate for this session. */
  nodeIdBase: number;
  /** How many node ids the frontend may allocate. */
  nodeIdCount: number;
  /** scsynth scope-buffer index this session's master-out tap uses. */
  scopeIndex: number;
  /** The scsynth `host:port` the bridge talks to (shown in the footer). */
  scsynthAddress: string | null;
  /** The saved dashboard layout, if this session has one on the server. */
  layout: BoxItem[] | null;
}
