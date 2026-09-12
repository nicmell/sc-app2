// Repo-owned sclang classlib (PURE-BRIDGE.md §3.1). Class definitions
// only — sclang class files cannot carry top-level statements;
// sc-startup.scd calls the ScApp* entry points explicitly, keeping the
// whole boot sequence in one readable place. Prefix ScApp — the
// classlib namespace is global.
ScApp {
    *banner {
        "sc-app classes loaded".postln;
    }
}
