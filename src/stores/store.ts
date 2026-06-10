// The single app store. Every domain (session, dashboard layout, installed
// plugins) is one top-level slice of this one `createStore` — modules
// read/write their slice via `appStore.slice(key)` / `appStore.select(...)`,
// and React subscribes through the hooks. There is no other `createStore` in
// the app.
//
// Cross-module shapes come from `@/types` (type-only by construction), so the
// slice modules can import `appStore` as a value — and the module-level
// singletons (oscClient, session) construct against a fully-initialized store
// regardless of import order.

import { DEFAULT_LAYOUT } from "@/constants/layout";
import { createStore } from "@/lib/utils/reactiveStore";
import type { AppState, SessionState } from "@/types/stores";

/** Initial session slice. */
const initialSessionState: SessionState = {
  status: "connecting",
  log: [],
  scsynthStatus: null,
  errors: [],
  scsynthAddress: null,
};

export const appStore = createStore<AppState>({
  session: initialSessionState,
  layout: DEFAULT_LAYOUT,
  plugins: [],
});
