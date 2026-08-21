// DEV-only debug hook: expose the module singletons for CDP-driven live
// debugging — stable handles onto the store, the OSC client (tx/rx log,
// command methods), the toast stack, and the session, so live probes read
// state instead of spelunking the DOM (parsed trees hang off the mounted
// <sc-plugin> hosts). A side-effect import at the composition root
// (main.tsx); the dynamic imports keep every debug-only dependency out of
// the production graph.

if (import.meta.env.DEV) {
  void Promise.all([
    import("@/stores/store"),
    import("@/stores/osc"),
    import("@/stores/toasts"),
    import("@/lib/session/SessionManager"),
    import("@sc-app/server-commands"),
  ]).then(
    ([
      { appStore },
      { oscClient, log, scsynthStatus, clock },
      { toasts },
      { session },
      commands,
    ]) => {
      (window as unknown as Record<string, unknown>).__scDebug = {
        appStore,
        oscClient,
        osc: { log, scsynthStatus, clock },
        toasts,
        session,
        // The OSC constructors (sGetn, nSetn, …) — probes can send raw queries
        // (e.g. a /s_getn readback of a live node's control array) and watch
        // the reply land in the rx log.
        commands,
      };
    },
  );
}
