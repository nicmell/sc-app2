// Browser benchmark — scserver-commands (Rust → WASM component, transpiled
// by jco) vs osc-js (pure JS), across every SC server command (encode) and
// reply (decode).
//
// Fairness notes:
//  • Encode: both sides serialise an in-memory message object to OSC wire
//    bytes. scserver.encode ALSO lowers the typed command shape into flat
//    OSC args; osc-js packs args that are already flat. We derive the osc-js
//    message from scserver's own output, so the two encode byte-identical
//    payloads — the "equiv" column asserts it.
//  • Decode: scserver.replies.decode parses OSC *and* classifies into a
//    typed reply record; osc-js only parses to a generic message. scserver
//    therefore does strictly more work per call — keep that in mind.

import { commands, nrt, replies } from '../pkg/scserver_commands.js';
import OSC from 'osc-js';
import { measure, keep, drainSink } from './bench.js';
import { COMMANDS, REPLIES, NRT_SCORE } from './samples.js';

// ── helpers ───────────────────────────────────────────────────────────
function bytesEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}

function dvOf(bytes: Uint8Array): DataView {
  return new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
}

/** Build a real osc-js `Message` (explicit types preserved) from OSC wire
 *  bytes. Reusable both standalone and inside an `OSC.Bundle`. */
function oscMessageFromBytes(bytes: Uint8Array): any {
  const tmp = new (OSC as any).Message();
  tmp.unpack(dvOf(bytes));
  const types = String(tmp.types).replace(/^,/, '');
  const m = new (OSC as any).Message(tmp.address);
  m.types = types;
  m.args = tmp.args;
  return m;
}

function fmt(n: number): string {
  if (n >= 1e6) return (n / 1e6).toFixed(2) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'k';
  return n.toFixed(0);
}

function geomean(xs: number[]): number {
  if (!xs.length) return 0;
  const s = xs.reduce((a, x) => a + Math.log(x), 0);
  return Math.exp(s / xs.length);
}

const out = document.getElementById('out')!;
const statusEl = document.getElementById('status')!;
const runBtn = document.getElementById('run') as HTMLButtonElement;

interface Row {
  name: string;
  bytes: number;
  sc: number;
  oj: number;
  equiv: boolean | null; // null = not byte-comparable (decode / nrt)
}

/** Yield to the browser so the status line repaints between cases. */
const tick = () => new Promise((r) => setTimeout(r, 0));

// ── encode: every command ─────────────────────────────────────────────
async function benchEncode(): Promise<Row[]> {
  const rows: Row[] = [];
  for (const { name, msg } of COMMANDS) {
    statusEl.textContent = `encoding ${name} …`;
    await tick();

    const scBytes: Uint8Array = commands.encode(msg as any);
    const oscMsg = oscMessageFromBytes(scBytes);
    const ojBytes: Uint8Array = oscMsg.pack();
    const equiv = bytesEqual(scBytes, ojBytes);

    const sc = measure(() => keep(commands.encode(msg as any).length)).opsPerSec;
    const oj = measure(() => keep(oscMsg.pack().length)).opsPerSec;
    rows.push({ name, bytes: scBytes.length, sc, oj, equiv });
  }
  return rows;
}

// ── decode: every reply ───────────────────────────────────────────────
async function benchDecode(): Promise<Row[]> {
  const rows: Row[] = [];
  for (const { name, address, args } of REPLIES) {
    statusEl.textContent = `decoding ${name} …`;
    await tick();

    // Synthesise wire bytes via the `other` escape hatch.
    const bytes: Uint8Array = commands.encode({ tag: 'other', val: { address, args } } as any);
    const dv = dvOf(bytes);

    // sanity: both decoders accept the bytes
    replies.decode(bytes);
    const probe = new (OSC as any).Message();
    probe.unpack(dv);

    const sc = measure(() => keep(replies.decode(bytes).tag.length)).opsPerSec;
    const oj = measure(() => {
      const m = new (OSC as any).Message();
      m.unpack(dv);
      keep(m.args.length);
    }).opsPerSec;
    rows.push({ name, bytes: bytes.length, sc, oj, equiv: null });
  }
  return rows;
}

// ── nrt: score assembly ───────────────────────────────────────────────
async function benchNrt(): Promise<Row> {
  statusEl.textContent = 'nrt score …';
  await tick();

  // Pre-derive osc-js Messages for each score entry (setup, not timed).
  const oscEntries = NRT_SCORE.map((e) => ({
    seconds: e.seconds,
    m: oscMessageFromBytes(commands.encode(e.msg as any)),
  }));

  const scBytes = (() => {
    const s = new nrt.NrtScore();
    for (const e of NRT_SCORE) s.at(e.seconds, e.msg as any);
    return s.encode();
  })();

  const sc = measure(() => {
    const s = new nrt.NrtScore();
    for (const e of NRT_SCORE) s.at(e.seconds, e.msg as any);
    keep(s.encode().length);
  }).opsPerSec;

  // osc-js has no NRT file format — closest analog is one OSC Bundle per
  // timestamp. Framing (4-byte length prefixes) is excluded, so this
  // slightly flatters osc-js. Reported for scale, not as a like-for-like.
  const oj = measure(() => {
    let n = 0;
    for (const e of oscEntries) {
      const b = new (OSC as any).Bundle([e.m]);
      n += b.pack().length;
    }
    keep(n);
  }).opsPerSec;

  return { name: 'NRT score (4 msgs)', bytes: scBytes.length, sc, oj, equiv: null };
}

// ── osc bundle: EACH message wrapped in its OWN single-message bundle ──
// One bundle = one message = one boundary crossing. This does NOT amortise
// the WASM boundary — it's the honest "every message sent as a bundle"
// case. scserver encodeBundle/decodeBundle vs osc-js's native OSC.Bundle.
const OSC_TIME = { seconds: 0, fractional: 1 }; // OSC "immediately"

// A representative spread: arg-less, typical, control-pairs, big list, blob.
const BUNDLE_ENCODE = ['/status', '/n_set', '/s_new', '/b_setn', '/d_recv'];
const BUNDLE_DECODE = ['status-reply', 'n-go (synth)', 'b-setn'];

async function benchBundle(): Promise<Row[]> {
  statusEl.textContent = 'osc bundle (1 msg/bundle) …';
  await tick();
  const rows: Row[] = [];

  for (const name of BUNDLE_ENCODE) {
    const msg = COMMANDS.find((c) => c.name === name)!.msg as any;
    const one = [msg];
    const oscOne = [oscMessageFromBytes(commands.encode(msg))];
    const bytes = commands.encodeBundle(OSC_TIME, one);
    const sc = measure(() => keep(commands.encodeBundle(OSC_TIME, one).length)).opsPerSec;
    const oj = measure(() => keep(new (OSC as any).Bundle(oscOne).pack().length)).opsPerSec;
    rows.push({ name: `encode · ${name}`, bytes: bytes.length, sc, oj, equiv: null });
  }

  for (const name of BUNDLE_DECODE) {
    const r = REPLIES.find((x) => x.name === name)!;
    const bytes: Uint8Array = commands.encodeBundle(OSC_TIME, [{ tag: 'other', val: { address: r.address, args: r.args } }] as any);
    const d = dvOf(bytes);
    replies.decodeBundle(bytes); // sanity
    const sc = measure(() => keep(replies.decodeBundle(bytes).replies.length)).opsPerSec;
    const oj = measure(() => { const b = new (OSC as any).Bundle(); b.unpack(d); keep(b.bundleElements.length); }).opsPerSec;
    rows.push({ name: `decode · ${name}`, bytes: bytes.length, sc, oj, equiv: null });
  }
  return rows;
}

// ── rendering ─────────────────────────────────────────────────────────
function ratioCell(sc: number, oj: number): string {
  const r = sc / oj;
  const faster = r >= 1;
  const label = faster ? `${r.toFixed(2)}× faster` : `${(1 / r).toFixed(2)}× slower`;
  return `<td class="${faster ? 'win-sc' : 'win-oj'}">${label}</td>`;
}

function table(rows: Row[], showEquiv: boolean): string {
  const body = rows
    .map((r) => {
      const equivCell = showEquiv
        ? r.equiv
          ? '<td class="ok">✓</td>'
          : '<td class="bad">✗</td>'
        : '';
      return `<tr>
        <td>${r.name}</td>
        <td>${r.bytes}</td>
        <td class="sc">${fmt(r.sc)}</td>
        <td class="oj">${fmt(r.oj)}</td>
        ${ratioCell(r.sc, r.oj)}
        ${equivCell}
      </tr>`;
    })
    .join('');
  return `<div class="scroll"><table>
    <thead><tr>
      <th>message</th><th>bytes</th>
      <th>scserver ops/s</th><th>osc-js ops/s</th><th>scserver vs osc-js</th>
      ${showEquiv ? '<th>equiv</th>' : ''}
    </tr></thead>
    <tbody>${body}</tbody>
  </table></div>`;
}

function summaryCards(encode: Row[], decode: Row[], bundle: Row[]): string {
  const encGeo = geomean(encode.map((r) => r.sc / r.oj));
  const decGeo = geomean(decode.map((r) => r.sc / r.oj));
  const bunGeo = geomean(bundle.map((r) => r.sc / r.oj));
  const allEquiv = encode.every((r) => r.equiv);
  const card = (k: string, v: string, cls = '') => `<div class="card"><div class="k">${k}</div><div class="v ${cls}">${v}</div></div>`;
  const rel = (g: number) => (g >= 1 ? `${g.toFixed(2)}× faster` : `${(1 / g).toFixed(2)}× slower`);
  return `<div class="cards">
    ${card('1-msg bundle (geomean)', rel(bunGeo), bunGeo >= 1 ? 'sc' : 'oj')}
    ${card('Single encode (geomean)', rel(encGeo))}
    ${card('Single decode (geomean)', rel(decGeo))}
    ${card('Byte-equivalent', allEquiv ? 'all ✓' : 'MISMATCH ✗')}
  </div>`;
}

async function run() {
  runBtn.disabled = true;
  out.innerHTML = '';
  const encode = await benchEncode();
  const decode = await benchDecode();
  const bundle = await benchBundle();
  const nrtRow = await benchNrt();
  statusEl.textContent = 'done.';
  keep(drainSink() & 0); // reference the sink so it isn't dead

  out.innerHTML =
    summaryCards(encode, decode, bundle) +
    `<h2>OSC bundle — each message in its own single-message bundle</h2>
     <p class="note">One bundle = one message = one WASM crossing (scserver
       <code>encodeBundle</code>/<code>decodeBundle</code>) vs osc-js's native <code>Bundle</code>.
       The boundary is NOT amortised here. It lands ≈ a wash: osc-js's own Bundle-object
       overhead offsets scserver's boundary tax.</p>` +
    table(bundle, false) +
    `<h2>Encode — command → OSC wire bytes (single message)</h2>
     <p class="note">scserver.encode lowers the typed command into OSC args and serialises;
       osc-js packs pre-flattened args. "equiv" confirms both produce identical bytes.</p>` +
    table(encode, true) +
    `<h2>Decode — OSC bytes → reply</h2>
     <p class="note">scserver.replies.decode parses AND classifies into a typed reply record;
       osc-js only parses to a generic message, so it does less work per call.</p>` +
    table(decode, false) +
    `<h2>NRT score assembly</h2>
     <p class="note">scserver builds the full length-framed NRT command file; osc-js has no NRT
       format, so its column packs one OSC Bundle per timestamp (framing excluded) — shown for
       scale only.</p>` +
    table([nrtRow], false);

  runBtn.disabled = false;
}

runBtn.addEventListener('click', run);
