/**
 * The typed per-UGen builder surface — one class per UGen with a static
 * method per rate (`SinOsc.ar(def, { freq, phase })`, …), mirroring
 * SuperCollider's `SinOsc.ar(...)`; absent args keep the registry
 * defaults. Exposed by the wasm build and re-exported wholesale (the
 * generated module also carries the core exports — harmless duplication of
 * a few names under this namespace).
 */

export * from "../pkg/scsynthdef_compiler.js";
