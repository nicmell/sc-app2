// OSC-bundle variant — EACH message wrapped in its OWN single-message
// bundle (one bundle = one message = one boundary crossing). This does NOT
// amortise the WASM boundary; it measures per-message bundle encode/decode.
import { commands, replies } from './pkg/scserver_commands.js';
import OSC from 'osc-js';
import { measure, keep } from './src/bench.ts';
import { COMMANDS, REPLIES } from './src/samples.ts';

function dv(b: Uint8Array): DataView { return new DataView(b.buffer, b.byteOffset, b.byteLength); }
function oscMsg(bytes: Uint8Array): any {
  const t = new (OSC as any).Message(); t.unpack(dv(bytes));
  const types = String(t.types).replace(/^,/, '');
  const m = new (OSC as any).Message(t.address); m.types = types; m.args = t.args; return m;
}
const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : (n / 1e3).toFixed(0) + 'k';
const rel = (r: number) => r >= 1 ? `${r.toFixed(2)}x FASTER` : `${(1 / r).toFixed(2)}x slower`;
const geomean = (xs: number[]) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);
const TIME = { seconds: 0, fractional: 1 }; // OSC "immediately"

// ── ENCODE: each command in its own single-message bundle ─────────────
const encRatios: number[] = [];
console.log(`\n=== ENCODE — one bundle per command (${COMMANDS.length}) ===`);
for (const { name, msg } of COMMANDS) {
  const one = [msg] as any[];
  const oscOne = [oscMsg(commands.encode(msg as any))];
  const sc = measure(() => keep(commands.encodeBundle(TIME, one).length), { minTimeMs: 200 }).opsPerSec;
  const oj = measure(() => keep(new (OSC as any).Bundle(oscOne).pack().length), { minTimeMs: 200 }).opsPerSec;
  encRatios.push(sc / oj);
}

// ── DECODE: each reply in its own single-message bundle ───────────────
const decRatios: number[] = [];
let scDecoded = 0, ojDecoded = 0, classified = 0;
console.log(`=== DECODE — one bundle per reply (${REPLIES.length}) ===`);
for (const { name, address, args } of REPLIES) {
  const bytes: Uint8Array = commands.encodeBundle(TIME, [{ tag: 'other', val: { address, args } }] as any);
  const d = dv(bytes);
  const b = replies.decodeBundle(bytes);
  scDecoded += b.replies.length;
  if (b.replies[0] && b.replies[0].tag !== 'other') classified++;
  const ob = new (OSC as any).Bundle(); ob.unpack(d); ojDecoded += ob.bundleElements.length;
  const sc = measure(() => keep(replies.decodeBundle(bytes).replies.length), { minTimeMs: 200 }).opsPerSec;
  const oj = measure(() => { const bb = new (OSC as any).Bundle(); bb.unpack(d); keep(bb.bundleElements.length); }, { minTimeMs: 200 }).opsPerSec;
  decRatios.push(sc / oj);
}

// aggregate throughput (single representative case) for a headline number
const sample = COMMANDS.find((c) => c.name === '/n_set')!.msg as any;
const sampleOsc = [oscMsg(commands.encode(sample))];
const encScMps = measure(() => keep(commands.encodeBundle(TIME, [sample]).length), { minTimeMs: 300 }).opsPerSec;
const encOjMps = measure(() => keep(new (OSC as any).Bundle(sampleOsc).pack().length), { minTimeMs: 300 }).opsPerSec;

console.log(`\n=== VERDICT (one message per bundle, one crossing per message) ===`);
console.log(`ENCODE geomean over ${COMMANDS.length} commands: scserver ${rel(geomean(encRatios))} than osc-js`);
console.log(`DECODE geomean over ${REPLIES.length} replies:  scserver ${rel(geomean(decRatios))} than osc-js`);
console.log(`  headline (/n_set 1-msg bundle): scserver ${fmt(encScMps)} vs osc-js ${fmt(encOjMps)} msg/s`);
console.log(`correctness: scserver ${scDecoded}/${REPLIES.length} replies (${classified} typed), osc-js ${ojDecoded}/${REPLIES.length} elements`);
console.log(`engine: Node ${process.version} / V8\n`);
