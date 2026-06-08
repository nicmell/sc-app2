// The single app store. Every domain (session, dashboard layout, installed
// plugins, debug log) is one top-level slice of this one `createStore` — modules
// read/write their slice via `appStore.slice(key)` / `appStore.select(...)`,
// and React subscribes through the hooks. There is no other `createStore` in
// the app.
//
// Cross-module type imports here are `import type` (erased at runtime), so the
// slice modules can import `appStore` as a value without a runtime cycle.

import { createStore } from "../utils/reactiveStore";
import { initialSessionState, type SessionState } from "../lib/sessions/SessionManager";
import type { BoxItem } from "./layout";
import type { PluginInfo } from "../lib/plugins/PluginManager";
import type { DebugEntry } from "../utils/debugLog";

export interface AppState {
  session: SessionState;
  /** Dashboard grid placement, persisted to localStorage. */
  layout: BoxItem[];
  /** Installed-plugin registry, mirrored from the Rust router. */
  plugins: PluginInfo[];
  /** Console-mirror ring buffer for the debug drawer. */
  debug: DebugEntry[];
}

const LAYOUT_KEY = "sc.dashboard.layout";

function loadLayout(): BoxItem[] {
  try {
    const raw = localStorage.getItem(LAYOUT_KEY);
    return raw ? (JSON.parse(raw) as BoxItem[]) : [];
  } catch {
    return [];
  }
}

export const appStore = createStore<AppState>({
  session: initialSessionState,
  layout: loadLayout(),
  plugins: [],
  debug: [],
});

// Persist the layout slice on change (the dashboard survives reloads).
appStore.slice("layout").subscribe((items) => {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(items));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
});
