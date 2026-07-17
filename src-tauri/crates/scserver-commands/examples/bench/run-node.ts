// Headless runner — same harness/samples as the browser app, executed
// under Node/V8 for a real number when no browser driver is available.
import { commands, nrt, replies } from './pkg/scserver_commands.js';
import OSC from 'osc-js';
import { measure, keep } from './src/bench.ts';
import { COMMANDS, REPLIES, NRT_SCORE } from './src/samples.ts';

function dv(b: Uint8Array): DataView { return new DataView(b.buffer, b.byteOffset, b.byteLength); }
function oscMsg(bytes: Uint8Array): any {
  const t = new (OSC as any).Message(); t.unpack(dv(bytes));
  const types = String(t.types).replace(/^,/, '');
  const m = new (OSC as any).Message(t.address); m.types = types; m.args = t.args; return m;
}
function eq(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false; return true;
}
const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : n >= 1e3 ? (n / 1e3).toFixed(0) + 'k' : n.toFixed(0);
const rel = (r: number) => r >= 1 ? `${r.toFixed(2)}x faster` : `${(1 / r).toFixed(2)}x slower`;
const geomean = (xs: number[]) => Math.exp(xs.reduce((a, x) => a + Math.log(x), 0) / xs.length);
const pad = (s: string, n: number) => s.padEnd(n);
const padl = (s: string, n: number) => s.padStart(n);

const encRatios: number[] = [], decRatios: number[] = [];
let equivAll = true;

console.log('\n=== ENCODE (command -> OSC bytes) ===');
console.log(pad('command', 22) + padl('sc ops/s', 11) + padl('oj ops/s', 11) + padl('verdict', 16));
for (const { name, msg } of COMMANDS) {
  const scB: Uint8Array = commands.encode(msg as any);
  const om = oscMsg(scB);
  if (!eq(scB, om.pack())) equivAll = false;
  const sc = measure(() => keep(commands.encode(msg as any).length), { minTimeMs: 250 }).opsPerSec;
  const oj = measure(() => keep(om.pack().length), { minTimeMs: 250 }).opsPerSec;
  encRatios.push(sc / oj);
  console.log(pad(name, 22) + padl(fmt(sc), 11) + padl(fmt(oj), 11) + padl(rel(sc / oj), 16));
}

console.log('\n=== DECODE (OSC bytes -> reply) ===');
console.log(pad('reply', 22) + padl('sc ops/s', 11) + padl('oj ops/s', 11) + padl('verdict', 16));
for (const { name, address, args } of REPLIES) {
  const bytes: Uint8Array = commands.encode({ tag: 'other', val: { address, args } } as any);
  const d = dv(bytes);
  const sc = measure(() => keep(replies.decode(bytes).tag.length), { minTimeMs: 250 }).opsPerSec;
  const oj = measure(() => { const m = new (OSC as any).Message(); m.unpack(d); keep(m.args.length); }, { minTimeMs: 250 }).opsPerSec;
  decRatios.push(sc / oj);
  console.log(pad(name, 22) + padl(fmt(sc), 11) + padl(fmt(oj), 11) + padl(rel(sc / oj), 16));
}

console.log('\n=== NRT (score assembly) ===');
{
  const oscE = NRT_SCORE.map((e) => oscMsg(commands.encode(e.msg as any)));
  const sc = measure(() => { const s = new nrt.NrtScore(); for (const e of NRT_SCORE) s.at(e.seconds, e.msg as any); keep(s.encode().length); }, { minTimeMs: 250 }).opsPerSec;
  const oj = measure(() => { let n = 0; for (const m of oscE) n += new (OSC as any).Bundle([m]).pack().length; keep(n); }, { minTimeMs: 250 }).opsPerSec;
  console.log(pad('NRT score (4 msgs)', 22) + padl(fmt(sc), 11) + padl(fmt(oj), 11) + padl(rel(sc / oj), 16));
}

console.log('\n=== VERDICT ===');
console.log(`commands encoded: ${COMMANDS.length}   replies decoded: ${REPLIES.length}   byte-equivalent: ${equivAll ? 'ALL' : 'MISMATCH'}`);
console.log(`ENCODE geomean: scserver ${rel(geomean(encRatios))} than osc-js`);
console.log(`DECODE geomean: scserver ${rel(geomean(decRatios))} than osc-js  (scserver also classifies to a typed reply)`);
console.log(`engine: Node ${process.version} / V8\n`);
