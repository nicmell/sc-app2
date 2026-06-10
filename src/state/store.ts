// The single app store. Every domain (session, dashboard layout, installed
// plugins) is one top-level slice of this one `createStore` — modules
// read/write their slice via `appStore.slice(key)` / `appStore.select(...)`,
// and React subscribes through the hooks. There is no other `createStore` in
// the app.
//
// Cross-module type imports here are `import type` (erased at runtime), so the
// slice modules can import `appStore` as a value without a runtime cycle.

import { createStore } from "../utils/reactiveStore";
import type { SessionState } from "../session/SessionManager";
import type { BoxItem } from "./layout";
import type { PluginInfo } from "../plugins/PluginManager";

export interface AppState {
  session: SessionState;
  /** Dashboard grid placement, persisted to localStorage. */
  layout: BoxItem[];
  /** Installed-plugin registry, mirrored from the Rust router. */
  plugins: PluginInfo[];
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

/** Initial session slice. Defined here (not imported from SessionManager) so
 *  this module has no runtime dependency on the slice modules — they import
 *  `appStore` as a value, and the module-level `session` singleton constructs
 *  against a fully-initialized store regardless of import order. */
const initialSessionState: SessionState = {
  status: "connecting",
  log: [],
  scsynthStatus: null,
  errors: [],
  scsynthAddress: null,
};

export const appStore = createStore<AppState>({
  session: initialSessionState,
  layout: loadLayout(),
  plugins: [],
});

// Persist the layout slice on change (the dashboard survives reloads).
appStore.slice("layout").subscribe((items) => {
  try {
    localStorage.setItem(LAYOUT_KEY, JSON.stringify(items));
  } catch {
    /* storage full / unavailable — non-fatal */
  }
});
