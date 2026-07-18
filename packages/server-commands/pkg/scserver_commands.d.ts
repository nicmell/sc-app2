/* tslint:disable */
/* eslint-disable */

export type ServerMessage = KnownMessage | OtherMsg;
export type ServerReply = KnownReply | OtherMsg;

export function encode(msg: ServerMessage): Uint8Array;
export function encode_bundle(time: OscTimetag, msgs: ServerMessage[]): Uint8Array;
export function decode_reply(bytes: Uint8Array): ServerReply;
export function decode_reply_packet(bytes: Uint8Array): ServerReply[];


/**
 * A numeric value that the server accepts as either `int` or `float`.
 * Used by `/c_set`, `/c_setn`, `/c_fill`, `/n_set`, `/n_setn`, `/n_fill`,
 * `/b_set`, `/b_setn`, `/b_fill`, etc.
 */
export type NumericValue = { float: number } | { int: number };

/**
 * An NTP timetag as the wasm boundary carries it (mirrors `rosc::OscTime`,
 * which has no serde support).
 */
export interface OscTimetag {
    seconds: number;
    fractional: number;
}

/**
 * Escape hatch for addresses outside the catalogue (SC extensions,
 * plug-in commands): a raw address + arg list.
 */
export interface OtherMsg {
    address: string;
    args: OscArg[];
}

/**
 * Every catalogued server-to-client reply, one variant per address. Like
 * [`crate::commands::KnownMessage`], the serde representation is internally
 * tagged BY THE OSC ADDRESS — a decoded reply crosses the wasm boundary as
 * a flat `{ \"address\": \"/n_go\", …fields }` object, so the address itself is
 * the TypeScript discriminant.
 */
export type KnownReply = { address: "/done"; command: string; extras: OscArg[] } | { address: "/fail"; command: string; error: string; extras: OscArg[] } | { address: "/late"; seconds: number; fractions: number; lateSecs: number; lateFracs: number } | ({ address: "/n_go" } & NodeInfo) | ({ address: "/n_end" } & NodeInfo) | ({ address: "/n_on" } & NodeInfo) | ({ address: "/n_off" } & NodeInfo) | ({ address: "/n_move" } & NodeInfo) | ({ address: "/n_info" } & NodeInfo) | ({ address: "/status.reply" } & StatusReply) | { address: "/tr"; nodeId: number; triggerId: number; value: number } | ({ address: "/b_setn" } & BSetnReply) | { address: "/synced"; syncId: number } | ({ address: "/scope/chunk" } & ScopeChunkReply);

/**
 * Every typed command, tagged by its OSC address — the serde tag IS
 * the address, so a serialized command is a flat
 * `{ \"address\": \"/s_new\", ... }` object.
 */
export type KnownMessage = ({ address: "/dirt/play" } & DirtPlay) | ({ address: "/scope/subscribe" } & ScopeSubscribe) | ({ address: "/scope/unsubscribe" } & ScopeUnsubscribe) | ({ address: "/b_alloc" } & BAlloc) | ({ address: "/b_allocRead" } & BAllocRead) | ({ address: "/b_allocReadChannel" } & BAllocReadChannel) | ({ address: "/b_close" } & BClose) | ({ address: "/b_fill" } & BFill) | ({ address: "/b_free" } & BFree) | ({ address: "/b_gen" } & BGen) | ({ address: "/b_get" } & BGet) | ({ address: "/b_getn" } & BGetn) | ({ address: "/b_query" } & BQuery) | ({ address: "/b_read" } & BRead) | ({ address: "/b_readChannel" } & BReadChannel) | ({ address: "/b_set" } & BSet) | ({ address: "/b_setn" } & BSetn) | ({ address: "/b_setSampleRate" } & BSetSampleRate) | ({ address: "/b_write" } & BWrite) | ({ address: "/b_zero" } & BZero) | ({ address: "/c_fill" } & CFill) | ({ address: "/c_get" } & CGet) | ({ address: "/c_getn" } & CGetn) | ({ address: "/c_set" } & CSet) | ({ address: "/c_setn" } & CSetn) | ({ address: "/g_deepFree" } & GDeepFree) | ({ address: "/g_dumpTree" } & GDumpTree) | ({ address: "/g_freeAll" } & GFreeAll) | ({ address: "/g_head" } & GHead) | ({ address: "/g_new" } & GNew) | ({ address: "/g_queryTree" } & GQueryTree) | ({ address: "/g_tail" } & GTail) | ({ address: "/p_new" } & PNew) | ({ address: "/cmd" } & Cmd) | ({ address: "/dumpOSC" } & DumpOSC) | ({ address: "/error" } & Error) | ({ address: "/notify" } & Notify) | ({ address: "/sync" } & Sync) | ({ address: "/n_after" } & NAfter) | ({ address: "/n_before" } & NBefore) | ({ address: "/n_fill" } & NFill) | ({ address: "/n_free" } & NFree) | ({ address: "/n_map" } & NMap) | ({ address: "/n_mapa" } & NMapa) | ({ address: "/n_mapan" } & NMapan) | ({ address: "/n_mapn" } & NMapn) | ({ address: "/n_order" } & NOrder) | ({ address: "/n_query" } & NQuery) | ({ address: "/n_run" } & NRun) | ({ address: "/n_set" } & NSet) | ({ address: "/n_setn" } & NSetn) | ({ address: "/n_trace" } & NTrace) | ({ address: "/s_get" } & SGet) | ({ address: "/s_getn" } & SGetn) | ({ address: "/s_new" } & SNew) | ({ address: "/s_noid" } & SNoid) | ({ address: "/d_free" } & DFree) | ({ address: "/d_load" } & DLoad) | ({ address: "/d_loadDir" } & DLoadDir) | ({ address: "/d_recv" } & DRecv) | ({ address: "/u_cmd" } & UCmd) | { address: "/clearSched" } | { address: "/quit" } | { address: "/rtMemoryStatus" } | { address: "/status" } | { address: "/version" } | { address: "/nrt_end" };

/**
 * Identifier used to address a synth control: either its index in the
 * control list, or its declared name.
 */
export type ControlId = { index: number } | { name: string };

/**
 * Payload of a `/b_setn` reply — samples read from a buffer.
 *
 * The SC wire format is: `/b_setn bufnum startIndex N sample0 sample1 … sampleN-1`.
 */
export interface BSetnReply {
    bufnum: number;
    start: number;
    samples: number[];
}

/**
 * Shared arg layout for `/n_go`, `/n_end`, `/n_on`, `/n_off`, `/n_move`,
 * `/n_info`. The last two fields are only present when the node is a
 * group.
 */
export interface NodeInfo {
    nodeId: number;
    parentId: number;
    prevNode: number;
    nextNode: number;
    /**
     * 1 if the node is a group, 0 if a synth.
     */
    isGroup: number;
    headNode?: number;
    tailNode?: number;
}

/**
 * The `/s_new` control-value alternative: a float, an int, or a bus
 * reference string (e.g. `\"c10\"` for control bus 10, `\"a0\"` for audio
 * bus 0).
 */
export type ControlValue = { float: number } | { int: number } | { bus: string };

/**
 * sc-app bridge extension: payload of a `/scope/chunk` reply — one chunk
 * of a scope-slot stream.
 *
 * Wire layout: `subId:i tickIndex:i isGap:i channels:i data:b`, where the
 * blob is `frames × channels` IEEE-754 float32 in **big-endian**, planar
 * (one frame run per channel — the SHM slot\'s own layout). The crate owns
 * the byte swap in both directions: `samples` is the decoded host-endian
 * `Vec<f32>` (crossing the wasm boundary as a `Float32Array` — the binding
 * layer builds that arm manually, see `wasm.rs`), and
 * [`ScopeChunkReply::encode`] writes it back big-endian. Unlike the
 * scsynth replies above, the bridge is the EMITTER of this one — hence
 * the encode half.
 */
export interface ScopeChunkReply {
    /**
     * The subscription id the chunk belongs to.
     */
    subId: number;
    /**
     * The bridge\'s monotonic poll tick — consumers detect drops by gaps.
     */
    tickIndex: number;
    /**
     * True when the bridge skipped ticks since the previous chunk.
     */
    isGap: boolean;
    channels: number;
    /**
     * Planar samples, `frames × channels` floats.
     */
    samples: Float32Array;
}

/**
 *Add node to head of group.
 *
 *
 */
export interface GHead {
    /**
     *Repeated tuples: group ID; node ID.
     */
    tail: [number, number][];
}

/**
 *Add node to tail of group.
 *
 *
 */
export interface GTail {
    /**
     *Repeated tuples: group ID; node ID.
     */
    tail: [number, number][];
}

/**
 *Allocate buffer space and read a sound file.
 *
 *
 */
export interface BAllocRead {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *path name of a sound file.
     */
    path: string;
    /**
     *starting frame in file (optional. default = 0)
     */
    startFrame: number | undefined;
    /**
     *number of frames to read (optional. default = 0, see below)
     */
    numberOfFrames: number | undefined;
    /**
     *an OSC message to execute upon completion. (optional)
     */
    completionMsg?: Uint8Array;
}

/**
 *Allocate buffer space and read channels from a sound file.
 *
 *
 */
export interface BAllocReadChannel {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *path name of a sound file
     */
    path: string;
    /**
     *starting frame in file
     */
    startFrame: number;
    /**
     *number of frames to read
     */
    numberOfFrames: number;
    /**
     *source file channel indices (one or more) to read
     */
    channels: number[];
    /**
     *an OSC message to execute upon completion. (optional)
     */
    completionMsg?: Uint8Array;
}

/**
 *Allocate buffer space.
 *
 *
 */
export interface BAlloc {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *number of frames
     */
    numFrames: number;
    /**
     *number of channels (optional. default = 1 channel)
     */
    numChannels: number | undefined;
    /**
     *an OSC message to execute upon completion. (optional)
     */
    completionMsg?: Uint8Array;
    /**
     *the required sample rate (optional. default (or 0) = the server's sample rate)
     */
    sampleRate: number | undefined;
}

/**
 *Auto-reassign synth's ID to a reserved value.
 *
 *
 */
export interface SNoid {
    /**
     *synth IDs (one or more) to reassign
     */
    synthIds: number[];
}

/**
 *Call a command to fill a buffer.
 *
 *
 */
export interface BGen {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *command name
     */
    cmd: string;
    /**
     *command arguments — variadic trailing OSC args (types depend on the specific `/b_gen` command being invoked, e.g. `sine1`, `cheby`).
     */
    commandArguments: OscArg[];
}

/**
 *Clear all scheduled bundles. Removes all bundles from the scheduling queue.
 *
 *
 */
export interface ClearSched {}

/**
 *Close soundfile.
 *
 *
 */
export interface BClose {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *an OSC message to execute upon completion. (optional)
     */
    completionMsg?: Uint8Array;
}

/**
 *Create a new group.
 *
 *
 */
export interface GNew {
    /**
     *Repeated tuples: new group ID; add action (0,1,2, 3 or 4 see below); add target ID.
     */
    tail: [number, number, number][];
}

/**
 *Create a new parallel group.
 *
 *
 */
export interface PNew {
    /**
     *Repeated tuples: new group ID; add action (0,1,2, 3 or 4 see below); add target ID.
     */
    tail: [number, number, number][];
}

/**
 *Create a new synth.
 *
 *
 */
export interface SNew {
    /**
     *synth definition name
     */
    defName: string;
    /**
     *synth ID
     */
    nodeId: number;
    /**
     *add action (0,1,2, 3 or 4 see below)
     */
    addAction: number;
    /**
     *add target ID
     */
    targetId: number;
    /**
     *Repeated tuples: a control index or name; floating point and integer arguments are interpreted as control value. a symbol argument consisting of the letter 'c' or 'a' (for control or audio) followed by the bus's index..
     */
    tail: [ControlId, ControlValue][];
}

/**
 *Delete a node.
 *
 *
 */
export interface NFree {
    /**
     *node IDs (one or more)
     */
    nodeIds: number[];
}

/**
 *Delete all nodes in a group.
 *
 *
 */
export interface GFreeAll {
    /**
     *group IDs (one or more)
     */
    groupIds: number[];
}

/**
 *Delete synth definition.
 *
 *
 */
export interface DFree {
    /**
     *synthdef names (one or more) to delete
     */
    synthDefNames: string[];
}

/**
 *Display incoming OSC messages.
 *
 *
 */
export interface DumpOSC {
    /**
     *code
     */
    code: number;
}

/**
 *Enable/disable error message posting.
 *
 *
 */
export interface Error {
    /**
     *mode
     */
    mode: number;
}

/**
 *End real time mode, close file. Not yet implemented. This message should be sent in a bundle in non real time mode. The bundle timestamp will establish the ending time of the file. This command will end non real time mode and close the sound file. Replies to sender with /done when complete.
 *
 *
 */
export interface NrtEnd {}

/**
 *Fill ranges of a node's control value(s).
 *
 *
 */
export interface NFill {
    /**
     *node ID
     */
    nodeId: number;
    /**
     *Repeated tuples: a control index or name; number of values to fill (M); value.
     */
    tail: [ControlId, number, NumericValue][];
}

/**
 *Fill ranges of bus value(s).
 *
 *
 */
export interface CFill {
    /**
     *Repeated tuples: starting bus index; number of buses to fill (M); value.
     */
    tail: [number, number, NumericValue][];
}

/**
 *Fill ranges of sample value(s).
 *
 *
 */
export interface BFill {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *Repeated tuples: sample starting index; number of samples to fill (M); value.
     */
    tail: [number, number, number][];
}

/**
 *Free all synths in this group and all its sub-groups.
 *
 *
 */
export interface GDeepFree {
    /**
     *group IDs (one or more)
     */
    groupIds: number[];
}

/**
 *Free buffer data.
 *
 *
 */
export interface BFree {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *an OSC message to execute upon completion. (optional)
     */
    completionMsg?: Uint8Array;
}

/**
 *Get a representation of this group's node subtree.
 *
 *
 */
export interface GQueryTree {
    /**
     *Repeated tuples: group ID; flag: if not 0 the current control (arg) values for synths will be included.
     */
    tail: [number, number][];
}

/**
 *Get buffer info.
 *
 *
 */
export interface BQuery {
    /**
     *buffer numbers to query
     */
    bufnums: number[];
}

/**
 *Get bus value(s).
 *
 *
 */
export interface CGet {
    /**
     *bus indices (one or more)
     */
    busIndices: number[];
}

/**
 *Get control value(s).
 *
 *
 */
export interface SGet {
    /**
     *synth ID
     */
    nodeId: number;
    /**
     *controls (one or more) — each by index or name
     */
    controls: ControlId[];
}

/**
 *Get info about a node.
 *
 *
 */
export interface NQuery {
    /**
     *node IDs (one or more) to query
     */
    nodeIds: number[];
}

/**
 *Get ranges of bus value(s).
 *
 *
 */
export interface CGetn {
    /**
     *Repeated tuples: starting bus index; number of sequential buses to get (M).
     */
    tail: [number, number][];
}

/**
 *Get ranges of control value(s).
 *
 *
 */
export interface SGetn {
    /**
     *synth ID
     */
    nodeId: number;
    /**
     *Repeated tuples: a control index or name; number of sequential controls to get (M).
     */
    tail: [ControlId, number][];
}

/**
 *Get ranges of sample value(s).
 *
 *
 */
export interface BGetn {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *Repeated tuples: starting sample index; number of sequential samples to get (M).
     */
    tail: [number, number][];
}

/**
 *Get sample value(s).
 *
 *
 */
export interface BGet {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *sample indices (one or more) — the server replies with the value at each index.
     */
    sampleIndices: number[];
}

/**
 *Load a directory of synth definitions.
 *
 *
 */
export interface DLoadDir {
    /**
     *pathname of directory.
     */
    pathnameOfDirectory: string;
    /**
     *an OSC message to execute upon completion. (optional)
     */
    completionMsg?: Uint8Array;
}

/**
 *Load synth definition.
 *
 *
 */
export interface DLoad {
    /**
     *pathname of file. Can be a pattern like \"synthdefs/perc-*\
     */
    pathnameOfFile: string;
    /**
     *an OSC message to execute upon completion. (optional)
     */
    completionMsg?: Uint8Array;
}

/**
 *Map a node's controls to read from a bus.
 *
 *
 */
export interface NMap {
    /**
     *node ID
     */
    nodeId: number;
    /**
     *Repeated tuples: a control index or name; control bus index.
     */
    tail: [ControlId, number][];
}

/**
 *Map a node's controls to read from an audio bus.
 *
 *
 */
export interface NMapa {
    /**
     *node ID
     */
    nodeId: number;
    /**
     *Repeated tuples: a control index or name; audio bus index.
     */
    tail: [ControlId, number][];
}

/**
 *Map a node's controls to read from audio buses.
 *
 *
 */
export interface NMapan {
    /**
     *node ID
     */
    nodeId: number;
    /**
     *Repeated tuples: a control index or name; audio bus index; number of controls to map.
     */
    tail: [ControlId, number, number][];
}

/**
 *Map a node's controls to read from buses.
 *
 *
 */
export interface NMapn {
    /**
     *node ID
     */
    nodeId: number;
    /**
     *Repeated tuples: a control index or name; control bus index; number of controls to map.
     */
    tail: [ControlId, number, number][];
}

/**
 *Move and order a list of nodes.
 *
 *
 */
export interface NOrder {
    /**
     *add action (0,1,2 or 3 see below)
     */
    addAction: number;
    /**
     *add target ID
     */
    targetId: number;
    /**
     *node IDs (one or more) to reorder relative to the target
     */
    nodeIds: number[];
}

/**
 *Notify when async commands have completed.
 *
 *
 */
export interface Sync {
    /**
     *a unique number identifying this command.
     */
    aUniqueNumber: number;
}

/**
 *Place a node after another.
 *
 *
 */
export interface NAfter {
    /**
     *Repeated tuples: the ID of the node to place (A); the ID of the node after which the above is placed (B).
     */
    tail: [number, number][];
}

/**
 *Place a node before another.
 *
 *
 */
export interface NBefore {
    /**
     *Repeated tuples: the ID of the node to place (A); the ID of the node before which the above is placed (B).
     */
    tail: [number, number][];
}

/**
 *Plug-in defined command.
 *
 *
 */
export interface Cmd {
    /**
     *command name
     */
    cmd: string;
    /**
     *variadic trailing OSC args — types depend on the specific plug-in-defined command being invoked.
     */
    anyArguments: OscArg[];
}

/**
 *Post a representation of this group's node subtree.
 *
 *
 */
export interface GDumpTree {
    /**
     *Repeated tuples: group ID; flag; if not 0 the current control (arg) values for synths will be posted.
     */
    tail: [number, number][];
}

/**
 *Queries the amount of currently free real-time memory (in bytes).
 *
 *
 */
export interface RtMemoryStatus {}

/**
 *Query the SuperCollider version. Replies to sender with the following message:
 *
 *
 */
export interface Version {}

/**
 *Query the status. Replies to sender with the following message:
 *
 *
 */
export interface Status {}

/**
 *Quit program. Exits the synthesis server.
 *
 *
 */
export interface Quit {}

/**
 *Read sound file channel data into an existing buffer.
 *
 *
 */
export interface BReadChannel {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *path name of a sound file
     */
    path: string;
    /**
     *starting frame in file
     */
    startFrame: number;
    /**
     *number of frames to read
     */
    numberOfFrames: number;
    /**
     *starting frame in buffer
     */
    startingFrame: number;
    /**
     *leave file open
     */
    leaveFileOpen: number;
    /**
     *source file channel indices (one or more) to read
     */
    channels: number[];
    /**
     *an OSC message to execute upon completion. (optional)
     */
    completionMsg?: Uint8Array;
}

/**
 *Read sound file data into an existing buffer.
 *
 *
 */
export interface BRead {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *path name of a sound file.
     */
    path: string;
    /**
     *starting frame in file (optional. default = 0)
     */
    startFrame: number | undefined;
    /**
     *number of frames to read (optional. default = -1, see below)
     */
    numberOfFrames: number | undefined;
    /**
     *starting frame in buffer (optional. default = 0)
     */
    startingFrame: number | undefined;
    /**
     *leave file open (optional. default = 0)
     */
    leaveFileOpen: number | undefined;
    /**
     *an OSC message to execute upon completion. (optional)
     */
    completionMsg?: Uint8Array;
}

/**
 *Receive a synth definition file.
 *
 *
 */
export interface DRecv {
    /**
     *buffer of data.
     */
    bufferOfData: Uint8Array;
    /**
     *an OSC message to execute upon completion. (optional)
     */
    completionMsg?: Uint8Array;
}

/**
 *Register to receive notifications from server
 *
 *
 */
export interface Notify {
    /**
     *1 to receive notifications, 0 to stop receiving them.
     */
    enable: number;
    /**
     *client ID (optional)
     */
    clientId: number | undefined;
}

/**
 *Send a command to a unit generator.
 *
 *
 */
export interface UCmd {
    /**
     *node ID
     */
    nodeId: number;
    /**
     *unit generator index
     */
    unitGeneratorIndex: number;
    /**
     *command name
     */
    cmd: string;
    /**
     *variadic trailing OSC args — types depend on the UGen command being invoked.
     */
    anyArguments: OscArg[];
}

/**
 *Set a node's control value(s).
 *
 *
 */
export interface NSet {
    /**
     *node ID
     */
    nodeId: number;
    /**
     *Repeated tuples: a control index or name; a control value.
     */
    tail: [ControlId, NumericValue][];
}

/**
 *Set bus value(s).
 *
 *
 */
export interface CSet {
    /**
     *Repeated tuples: a bus index; a control value.
     */
    tail: [number, NumericValue][];
}

/**
 *Set ranges of a node's control value(s).
 *
 *
 */
export interface NSetn {
    /**
     *node ID
     */
    nodeId: number;
    /**
     *Repeated ranges — each `(control, values[])` writes `values.len()` consecutive controls starting at `control`. The count is encoded from the vector length.
     */
    tail: [ControlId, NumericValue[]][];
}

/**
 *Set ranges of bus value(s).
 *
 *
 */
export interface CSetn {
    /**
     *Repeated ranges — each `(start_bus, values[])` writes `values.len()` consecutive buses starting at `start_bus`. The count is encoded from the vector length.
     */
    tail: [number, NumericValue[]][];
}

/**
 *Set ranges of sample value(s).
 *
 *
 */
export interface BSetn {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *Repeated ranges — each `(start_index, samples[])` range writes `samples.len()` consecutive samples starting at `start_index`. The count is computed from the vector length, not passed separately.
     */
    tail: [number, number[]][];
}

/**
 *Set sample value(s).
 *
 *
 */
export interface BSet {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *Repeated tuples: a sample index; a sample value.
     */
    tail: [number, number][];
}

/**
 *Set the sampling rate of the buffer.
 *
 *
 */
export interface BSetSampleRate {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *the desired sampling rate. 0 or nil will set to the Server's sample rate.
     */
    theDesiredSampling: number;
}

/**
 *Trace a node.
 *
 *
 */
export interface NTrace {
    /**
     *node IDs (one or more) to trace
     */
    nodeIds: number[];
}

/**
 *Turn node on or off.
 *
 *
 */
export interface NRun {
    /**
     *Repeated tuples: node ID; run flag.
     */
    tail: [number, number][];
}

/**
 *Write sound file data.
 *
 *
 */
export interface BWrite {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *path name of a sound file.
     */
    path: string;
    /**
     *header format.
     */
    headerFormat: string;
    /**
     *sample format.
     */
    sampleFormat: string;
    /**
     *number of frames to write (optional. default = -1, see below)
     */
    numberOfFrames: number | undefined;
    /**
     *starting frame in buffer (optional. default = 0)
     */
    startingFrame: number | undefined;
    /**
     *leave file open (optional. default = 0)
     */
    leaveFileOpen: number | undefined;
    /**
     *an OSC message to execute upon completion. (optional)
     */
    completionMsg?: Uint8Array;
}

/**
 *Zero sample data.
 *
 *
 */
export interface BZero {
    /**
     *buffer number
     */
    bufnum: number;
    /**
     *an OSC message to execute upon completion. (optional)
     */
    completionMsg?: Uint8Array;
}

/**
 *r" sc-app bridge extension: a SuperDirt/Strudel event, routed by the
 *r" bridge to the strudel peer. The wire format is SuperDirt's
 *r" alternating key/value arg list.
 *
 *
 */
export interface DirtPlay {
    /**
     *r" Repeated tuples: parameter name; parameter value.
     */
    pairs: [string, OscArg][];
}

/**
 *r" sc-app bridge extension: drop a scope-slot stream.
 *
 *
 */
export interface ScopeUnsubscribe {
    /**
     *r" The subscription id to drop.
     */
    subId: number;
}

/**
 *r" sc-app bridge extension: register a scope-slot stream with the bridge.
 *
 *
 */
export interface ScopeSubscribe {
    /**
     *r" Client-minted subscription id, echoed on every chunk.
     */
    subId: number;
    /**
     *r" scsynth SHM scope-buffer index to stream.
     */
    scope: number;
    /**
     *r" Channel count (informational — the SHM header carries the truth).
     */
    channels: number;
    /**
     *r" Requested frames per chunk (informational, as above).
     */
    chunkSize: number;
}

export interface StatusReply {
    unused: number;
    numUgens: number;
    numSynths: number;
    numGroups: number;
    numSynthDefs: number;
    avgCpu: number;
    peakCpu: number;
    nominalSampleRate: number;
    actualSampleRate: number;
}

export type OscArg = { int32: number } | { float32: number } | { float64: number } | { string: string } | { blob: Uint8Array };


/**
 * Wall-clock helper: convert a Unix timestamp in milliseconds (what
 * `Date.now()` yields) into the NTP timetag a bundle carries. Negative or
 * non-finite input yields the OSC "immediate" tag `(0, 1)`.
 */
export function at_unix_ms(ms: number): OscTimetag;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly at_unix_ms: (a: number) => any;
    readonly decode_reply: (a: number, b: number) => [number, number, number];
    readonly decode_reply_packet: (a: number, b: number) => [number, number, number];
    readonly encode: (a: any) => [number, number, number];
    readonly encode_bundle: (a: any, b: any) => [number, number, number];
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
