// The shape a session bootstrap must produce (consumed by the app's
// SessionManager). The concrete
// bootstrap (Tauri/browser HTTP, or a test harness POSTing to a mock/real
// server) lives outside this package and is injected; it only has to produce
// this result.

/** The server-assigned session identity + node-id allocation + scope buffer. */
export interface SessionInfo {
  sessionId: string;
  /** scsynth group this session's synths must live under — allocated by the
   *  server, created by the frontend's OscClient once the WS is open. */
  sessionGroupId: number;
  /** First node id the frontend may allocate for this session. */
  nodeIdBase: number;
  /** How many node ids the frontend may allocate. */
  nodeIdCount: number;
  /** scsynth scope-buffer index this session's master-out tap uses. */
  scopeIndex: number;
  /** The scsynth `host:port` the bridge talks to (shown in the footer). */
  scsynthAddress: string | null;
}

/** Session info plus the WebSocket URL to open for it. */
export type BootstrapResult = SessionInfo & { wsUrl: string };

/** Mint a fresh session and return how to connect to it. Injected into
 *  SessionManager so the package stays free of `fetch`/Tauri specifics. */
export type Bootstrap = () => Promise<BootstrapResult>;
