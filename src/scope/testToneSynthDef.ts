/**
 * Diagnostic test tone — a sine written straight to an output bus. Used to
 * isolate the scope pipeline from SuperDirt: inject a known signal onto bus 0
 * from our own session and confirm the scope draws it (and we hear it). If the
 * scope shows this sine, the tap → SHM → bridge → canvas path is healthy and any
 * flat line is upstream (no audio on the bus). Gated behind a debug flag in
 * ScopeController — never created in normal operation.
 */

import { synthdef } from "@sc-app/synthdef-compiler";

const NAME = "scTestTone";
let cached: Uint8Array | null = null;

export function testToneSynthDefName(): string {
  return NAME;
}

export function compileTestToneSynthDef(): Uint8Array {
  if (cached) return cached;
  // Controls must use literal defaults (the compiler parses the fn source).
  const def = synthdef(NAME, (g, { out = 0, freq = 220, amp = 0.2 }) => {
    const osc = g.SinOsc.ar(freq, 0);
    g.Out.ar(out, g.mul(osc, amp));
  });
  cached = def.toBytes();
  return cached;
}
