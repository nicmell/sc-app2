// Batch-vs-single boundary experiment. Compares:
//   - scserver.encode         : one WASM crossing per message
//   - scserver.encodeBatch    : one WASM crossing for the whole array
//   - osc-js .pack()          : pure JS, per message
// over the full 65-command set, reported as per-message throughput.
import { commands } from './pkg/scserver_commands.js';
import OSC from 'osc-js';
import { measure, keep } from './src/bench.ts';
import { COMMANDS } from './src/samples.ts';

const msgs = COMMANDS.map((c) => c.msg) as any[];

function dv(b: Uint8Array): DataView { return new DataView(b.buffer, b.byteOffset, b.byteLength); }
function oscMsg(bytes: Uint8Array): any {
  const t = new (OSC as any).Message(); t.unpack(dv(bytes));
  const types = String(t.types).replace(/^,/, '');
  const m = new (OSC as any).Message(t.address); m.types = types; m.args = t.args; return m;
}
const oscMsgs = COMMANDS.map((c) => oscMsg(commands.encode(c.msg as any)));

const N = COMMANDS.length;
const fmt = (n: number) => n >= 1e6 ? (n / 1e6).toFixed(2) + 'M' : (n / 1e3).toFixed(0) + 'k';

// per-CALL throughput, where a batch call handles N messages
const single = measure(() => { for (const m of msgs) keep(commands.encode(m).length); }, { minTimeMs: 400 }).opsPerSec;
const batch = measure(() => keep(commands.encodeBatch(msgs).length), { minTimeMs: 400 }).opsPerSec;
const osc = measure(() => { for (const m of oscMsgs) keep(m.pack().length); }, { minTimeMs: 400 }).opsPerSec;

// convert "arrays/sec" to "messages/sec"
const singleMps = single * N;
const batchMps = batch * N;
const oscMps = osc * N;

console.log(`\n${N} commands, per-message throughput:\n`);
console.log(`  scserver.encode  (N crossings): ${fmt(singleMps)} msg/s`);
console.log(`  scserver.batch   (1 crossing) : ${fmt(batchMps)} msg/s   ${(batchMps / singleMps).toFixed(2)}x vs single`);
console.log(`  osc-js .pack     (pure JS)    : ${fmt(oscMps)} msg/s`);
console.log(`\n  batch vs osc-js: ${batchMps >= oscMps ? (batchMps / oscMps).toFixed(2) + 'x FASTER' : (oscMps / batchMps).toFixed(2) + 'x slower'}`);
console.log(`  single vs osc-js: ${(oscMps / singleMps).toFixed(2)}x slower\n`);
