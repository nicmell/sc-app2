// The single app store. Every domain (session, dashboard layout, per-box
// presets, installed plugins) is one top-level slice of this one
// `createStore` — modules
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
import type { AppState, ConductorState, OscState, SessionState } from "@/types/stores";

/** Initial session slice. */
const initialSessionState: SessionState = {
  status: "connecting",
  scsynthAddress: null,
};

/** Initial OSC slice, shared by OscClient and transport middlewares. */
const initialOscState: OscState = {
  connected: false,
  scsynthStatus: null,
  clock: null,
  log: [],
};

/** The Conductor starts idle at Strudel's default tempo (cps 0.5 =
 *  120 BPM at 4 beats per cycle). */
const initialConductorState: ConductorState = {
  state: "stopped",
  cps: 0.5,
  cycleBase: 0,
  secondsBase: 0,
  anchorAudioTime: null,
};

export const appStore = createStore<AppState>({
  session: initialSessionState,
  osc: initialOscState,
  layout: DEFAULT_LAYOUT,
  presets: {},
  plugins: [],
  toasts: [],
  conductor: initialConductorState,
});
