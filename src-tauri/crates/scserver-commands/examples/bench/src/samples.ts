// Representative payloads for every SC server command and reply.
//
// `COMMANDS` — one typed `ServerMessage` per command variant (63 + the
// `other` escape hatch, plus the 6 arg-less unit commands). Fed to
// `commands.encode` for the encode benchmark.
//
// `REPLIES` — the reply wire bytes are synthesised at runtime in main.ts
// (via `commands.encode({ tag: 'other', ... })`), so here we only list the
// address + OSC arg list for each documented reply shape.

import type { ServerMessage } from '../pkg/interfaces/scserver-commands-commands.js';
import type { OscArg } from '../pkg/interfaces/scserver-commands-core.js';

// ── OSC arg constructors ──────────────────────────────────────────────
const i32 = (val: number): OscArg => ({ tag: 'int32', val });
const f32 = (val: number): OscArg => ({ tag: 'float32', val });
const f64 = (val: number): OscArg => ({ tag: 'float64', val });
const str = (val: string): OscArg => ({ tag: 'string', val });

// A tiny valid OSC message ("/go" with no args) used wherever a command
// carries an optional `completion-msg` blob.
const CMSG = new Uint8Array([0x2f, 0x67, 0x6f, 0x00, 0x2c, 0x00, 0x00, 0x00]);

// ── polymorphic arg shapes ────────────────────────────────────────────
const cidName = (val: string) => ({ tag: 'name', val } as const);
const cidIndex = (val: number) => ({ tag: 'index', val } as const);
const nvF = (val: number) => ({ tag: 'float', val } as const);
const nvI = (val: number) => ({ tag: 'int', val } as const);
const cvF = (val: number) => ({ tag: 'float', val } as const);
const cvBus = (val: string) => ({ tag: 'bus', val } as const);

export interface Sample {
  name: string;
  msg: ServerMessage;
}

export const COMMANDS: Sample[] = [
  // ── buffer commands ─────────────────────────────────────────────────
  { name: '/b_alloc', msg: { tag: 'b-alloc', val: { bufnum: 0, numFrames: 8192, numChannels: 2 } } },
  { name: '/b_allocRead', msg: { tag: 'b-alloc-read', val: { bufnum: 1, path: 'sounds/a.wav', startFrame: 0, numberOfFrames: 0 } } },
  { name: '/b_allocReadChannel', msg: { tag: 'b-alloc-read-channel', val: { bufnum: 2, path: 'sounds/b.wav', startFrame: 0, numberOfFrames: 44100, channels: [0, 1] } } },
  { name: '/b_close', msg: { tag: 'b-close', val: { bufnum: 3 } } },
  { name: '/b_fill', msg: { tag: 'b-fill', val: { bufnum: 4, tail: [[0, 100, 0.5], [100, 100, -0.5]] } } },
  { name: '/b_free', msg: { tag: 'b-free', val: { bufnum: 5, completionMsg: CMSG } } },
  { name: '/b_gen', msg: { tag: 'b-gen', val: { bufnum: 6, cmd: 'sine1', commandArguments: [i32(7), f32(1.0), f32(0.5)] } } },
  { name: '/b_get', msg: { tag: 'b-get', val: { bufnum: 7, sampleIndices: [0, 100, 200, 300] } } },
  { name: '/b_getn', msg: { tag: 'b-getn', val: { bufnum: 8, tail: [[0, 64], [128, 64]] } } },
  { name: '/b_query', msg: { tag: 'b-query', val: { bufnums: [0, 1, 2, 3] } } },
  { name: '/b_read', msg: { tag: 'b-read', val: { bufnum: 9, path: 'sounds/c.wav', startFrame: 0, numberOfFrames: -1, startingFrame: 0, leaveFileOpen: 0 } } },
  { name: '/b_readChannel', msg: { tag: 'b-read-channel', val: { bufnum: 10, path: 'sounds/d.wav', startFrame: 0, numberOfFrames: -1, startingFrame: 0, leaveFileOpen: 0, channels: [0, 1] } } },
  { name: '/b_set', msg: { tag: 'b-set', val: { bufnum: 11, tail: [[0, 0.1], [1, 0.2], [2, 0.3]] } } },
  { name: '/b_setSampleRate', msg: { tag: 'b-set-sample-rate', val: { bufnum: 12, theDesiredSampling: 48000.0 } } },
  { name: '/b_setn', msg: { tag: 'b-setn', val: { bufnum: 13, tail: [[0, [0.1, 0.2, 0.3, 0.4]]] } } },
  { name: '/b_write', msg: { tag: 'b-write', val: { bufnum: 14, path: 'out/e.wav', headerFormat: 'wav', sampleFormat: 'int16', numberOfFrames: -1, startingFrame: 0, leaveFileOpen: 0 } } },
  { name: '/b_zero', msg: { tag: 'b-zero', val: { bufnum: 15 } } },

  // ── control-bus commands ────────────────────────────────────────────
  { name: '/c_fill', msg: { tag: 'c-fill', val: { tail: [[0, 8, nvF(0.0)], [8, 8, nvI(1)]] } } },
  { name: '/c_get', msg: { tag: 'c-get', val: { busIndices: [0, 1, 2, 3] } } },
  { name: '/c_getn', msg: { tag: 'c-getn', val: { tail: [[0, 16], [16, 16]] } } },
  { name: '/c_set', msg: { tag: 'c-set', val: { tail: [[0, nvF(0.25)], [1, nvI(3)]] } } },
  { name: '/c_setn', msg: { tag: 'c-setn', val: { tail: [[0, [nvF(0.1), nvF(0.2), nvI(3)]]] } } },

  // ── scheduling ──────────────────────────────────────────────────────
  { name: '/clearSched', msg: { tag: 'clear-sched' } },

  // ── plug-in / synthdef ──────────────────────────────────────────────
  { name: '/cmd', msg: { tag: 'cmd', val: { cmd: '/myPlugin', anyArguments: [i32(1), str('go'), f32(2.5)] } } },
  { name: '/d_free', msg: { tag: 'd-free', val: { synthDefNames: ['sine', 'saw', 'noise'] } } },
  { name: '/d_load', msg: { tag: 'd-load', val: { pathnameOfFile: 'synthdefs/perc-*' } } },
  { name: '/d_loadDir', msg: { tag: 'd-load-dir', val: { pathnameOfDirectory: 'synthdefs/' } } },
  { name: '/d_recv', msg: { tag: 'd-recv', val: { bufferOfData: new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]) } } },

  // ── server control ──────────────────────────────────────────────────
  { name: '/dumpOSC', msg: { tag: 'dump-osc', val: { code: 1 } } },
  { name: '/error', msg: { tag: 'error', val: { mode: 1 } } },

  // ── group commands ──────────────────────────────────────────────────
  { name: '/g_deepFree', msg: { tag: 'g-deep-free', val: { groupIds: [1, 2, 3] } } },
  { name: '/g_dumpTree', msg: { tag: 'g-dump-tree', val: { tail: [[0, 1]] } } },
  { name: '/g_freeAll', msg: { tag: 'g-free-all', val: { groupIds: [1, 2] } } },
  { name: '/g_head', msg: { tag: 'g-head', val: { tail: [[1, 1001], [1, 1002]] } } },
  { name: '/g_new', msg: { tag: 'g-new', val: { tail: [[1001, 0, 0], [1002, 0, 0]] } } },
  { name: '/g_queryTree', msg: { tag: 'g-query-tree', val: { tail: [[0, 1]] } } },
  { name: '/g_tail', msg: { tag: 'g-tail', val: { tail: [[1, 1003]] } } },

  // ── node commands ───────────────────────────────────────────────────
  { name: '/n_after', msg: { tag: 'n-after', val: { tail: [[1001, 1002]] } } },
  { name: '/n_before', msg: { tag: 'n-before', val: { tail: [[1003, 1004]] } } },
  { name: '/n_fill', msg: { tag: 'n-fill', val: { nodeId: 1001, tail: [[cidName('freq'), 3, nvF(440.0)]] } } },
  { name: '/n_free', msg: { tag: 'n-free', val: { nodeIds: [1001, 1002, 1003] } } },
  { name: '/n_map', msg: { tag: 'n-map', val: { nodeId: 1001, tail: [[cidName('freq'), 0], [cidName('amp'), 1]] } } },
  { name: '/n_mapa', msg: { tag: 'n-mapa', val: { nodeId: 1001, tail: [[cidName('in'), 4]] } } },
  { name: '/n_mapan', msg: { tag: 'n-mapan', val: { nodeId: 1001, tail: [[cidName('in'), 4, 2]] } } },
  { name: '/n_mapn', msg: { tag: 'n-mapn', val: { nodeId: 1001, tail: [[cidName('freq'), 0, 2]] } } },
  { name: '/n_order', msg: { tag: 'n-order', val: { addAction: 0, targetId: 1, nodeIds: [1001, 1002] } } },
  { name: '/n_query', msg: { tag: 'n-query', val: { nodeIds: [1001, 1002] } } },
  { name: '/n_run', msg: { tag: 'n-run', val: { tail: [[1001, 0], [1002, 1]] } } },
  { name: '/n_set', msg: { tag: 'n-set', val: { nodeId: 1001, tail: [[cidName('freq'), nvF(220.0)], [cidIndex(1), nvI(7)]] } } },
  { name: '/n_setn', msg: { tag: 'n-setn', val: { nodeId: 1001, tail: [[cidName('freq'), [nvF(1), nvF(2), nvF(3)]]] } } },
  { name: '/n_trace', msg: { tag: 'n-trace', val: { nodeIds: [1001] } } },

  // ── notification ────────────────────────────────────────────────────
  { name: '/notify', msg: { tag: 'notify', val: { enable: 1, clientId: 0 } } },
  { name: '/nrt_end', msg: { tag: 'nrt-end' } },

  // ── parallel group ──────────────────────────────────────────────────
  { name: '/p_new', msg: { tag: 'p-new', val: { tail: [[2001, 0, 0]] } } },

  // ── lifecycle ───────────────────────────────────────────────────────
  { name: '/quit', msg: { tag: 'quit' } },
  { name: '/rtMemoryStatus', msg: { tag: 'rt-memory-status' } },

  // ── synth commands ──────────────────────────────────────────────────
  { name: '/s_get', msg: { tag: 's-get', val: { nodeId: 1001, controls: [cidName('freq'), cidIndex(1)] } } },
  { name: '/s_getn', msg: { tag: 's-getn', val: { nodeId: 1001, tail: [[cidName('freq'), 2]] } } },
  { name: '/s_new', msg: { tag: 's-new', val: { defName: 'sine', nodeId: 1001, addAction: 0, targetId: 1, tail: [[cidName('freq'), cvF(440.0)], [cidName('amp'), cvBus('c10')]] } } },
  { name: '/s_noid', msg: { tag: 's-noid', val: { synthIds: [1001, 1002] } } },
  { name: '/status', msg: { tag: 'status' } },
  { name: '/sync', msg: { tag: 'sync', val: { aUniqueNumber: 42 } } },
  { name: '/u_cmd', msg: { tag: 'u-cmd', val: { nodeId: 1001, unitGeneratorIndex: 2, cmd: 'set', anyArguments: [i32(0), f32(1.0)] } } },
  { name: '/version', msg: { tag: 'version' } },

  // ── escape hatch ────────────────────────────────────────────────────
  { name: '/other', msg: { tag: 'other', val: { address: '/my_plugin_cmd', args: [i32(1), str('hello'), f32(3.14)] } } },
];

// ── reply shapes ──────────────────────────────────────────────────────
// name is the reply tag; wire bytes get synthesised from address + args.
export interface ReplySample {
  name: string;
  address: string;
  args: OscArg[];
}

export const REPLIES: ReplySample[] = [
  { name: 'done', address: '/done', args: [str('/b_alloc'), i32(0)] },
  { name: 'fail', address: '/fail', args: [str('/s_new'), str('SynthDef not found: bogus')] },
  { name: 'late', address: '/late', args: [i32(3), i32(0), i32(3), i32(500)] },
  { name: 'n-go (synth)', address: '/n_go', args: [i32(1001), i32(0), i32(-1), i32(-1), i32(0)] },
  { name: 'n-go (group)', address: '/n_go', args: [i32(2001), i32(0), i32(-1), i32(-1), i32(1), i32(-1), i32(-1)] },
  { name: 'n-end', address: '/n_end', args: [i32(1001), i32(0), i32(-1), i32(-1), i32(0)] },
  { name: 'n-on', address: '/n_on', args: [i32(1001), i32(0), i32(-1), i32(-1), i32(0)] },
  { name: 'n-off', address: '/n_off', args: [i32(1001), i32(0), i32(-1), i32(-1), i32(0)] },
  { name: 'n-move', address: '/n_move', args: [i32(1001), i32(0), i32(-1), i32(-1), i32(0)] },
  { name: 'n-info', address: '/n_info', args: [i32(1001), i32(0), i32(-1), i32(-1), i32(0)] },
  { name: 'status-reply', address: '/status.reply', args: [i32(1), i32(42), i32(3), i32(2), i32(10), f32(0.05), f32(0.2), f64(44100), f64(44100)] },
  { name: 'tr', address: '/tr', args: [i32(1001), i32(0), f32(0.75)] },
  { name: 'b-setn', address: '/b_setn', args: [i32(13), i32(0), i32(4), f32(0.1), f32(0.2), f32(0.3), f32(0.4)] },
  { name: 'synced', address: '/synced', args: [i32(42)] },
  { name: 'other', address: '/some/custom/reply', args: [i32(7), str('payload')] },
];

// ── NRT score ─────────────────────────────────────────────────────────
// A tiny timestamped score used for the NRT-encode section.
export const NRT_SCORE: { seconds: number; msg: ServerMessage }[] = [
  { seconds: 0.0, msg: { tag: 'g-new', val: { tail: [[1001, 0, 0]] } } },
  { seconds: 0.0, msg: { tag: 's-new', val: { defName: 'sine', nodeId: 1002, addAction: 0, targetId: 1001, tail: [[cidName('freq'), cvF(440.0)]] } } },
  { seconds: 1.0, msg: { tag: 'n-set', val: { nodeId: 1002, tail: [[cidName('freq'), nvF(880.0)]] } } },
  { seconds: 2.0, msg: { tag: 'n-free', val: { nodeIds: [1002] } } },
];
