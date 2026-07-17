/** @module Interface scserver:commands/replies@0.1.0 **/
export function decode(bytes: Uint8Array): ServerReply;
export function decodeBundle(bytes: Uint8Array): ReplyBundle;
export type OscArg = import('./scserver-commands-core.js').OscArg;
export type OscTime = import('./scserver-commands-core.js').OscTime;
export interface DoneInfo {
  address: string,
  extras: Array<OscArg>,
}
export interface FailInfo {
  address: string,
  error: string,
  extras: Array<OscArg>,
}
export interface LateInfo {
  seconds: number,
  fractions: number,
  lateSecs: number,
  lateFracs: number,
}
export interface NodeInfo {
  nodeId: number,
  parentId: number,
  prevId: number,
  nextId: number,
  isGroup: number,
  headId?: number,
  tailId?: number,
}
export interface StatusReplyInfo {
  unused: number,
  numUgens: number,
  numSynths: number,
  numGroups: number,
  numSynthDefs: number,
  avgCpu: number,
  peakCpu: number,
  nominalSampleRate: number,
  actualSampleRate: number,
}
export interface TrInfo {
  nodeId: number,
  triggerId: number,
  value: number,
}
export interface BSetnReply {
  bufnum: number,
  start: number,
  samples: Float32Array,
}
export interface SyncedReply {
  syncId: number,
}
export interface ScopeChunkReply {
  subId: number,
  tickIndex: number,
  isGap: boolean,
  channels: number,
  samples: Float32Array,
}
export interface OtherReply {
  address: string,
  args: Array<OscArg>,
}
export type ServerReply = ServerReplyDone | ServerReplyFail | ServerReplyLate | ServerReplyNGo | ServerReplyNEnd | ServerReplyNOn | ServerReplyNOff | ServerReplyNMove | ServerReplyNInfo | ServerReplyStatusReply | ServerReplyTr | ServerReplyBSetn | ServerReplySynced | ServerReplyScopeChunk | ServerReplyOther;
export interface ServerReplyDone {
  tag: 'done',
  val: DoneInfo,
}
export interface ServerReplyFail {
  tag: 'fail',
  val: FailInfo,
}
export interface ServerReplyLate {
  tag: 'late',
  val: LateInfo,
}
export interface ServerReplyNGo {
  tag: 'n-go',
  val: NodeInfo,
}
export interface ServerReplyNEnd {
  tag: 'n-end',
  val: NodeInfo,
}
export interface ServerReplyNOn {
  tag: 'n-on',
  val: NodeInfo,
}
export interface ServerReplyNOff {
  tag: 'n-off',
  val: NodeInfo,
}
export interface ServerReplyNMove {
  tag: 'n-move',
  val: NodeInfo,
}
export interface ServerReplyNInfo {
  tag: 'n-info',
  val: NodeInfo,
}
export interface ServerReplyStatusReply {
  tag: 'status-reply',
  val: StatusReplyInfo,
}
export interface ServerReplyTr {
  tag: 'tr',
  val: TrInfo,
}
export interface ServerReplyBSetn {
  tag: 'b-setn',
  val: BSetnReply,
}
export interface ServerReplySynced {
  tag: 'synced',
  val: SyncedReply,
}
export interface ServerReplyScopeChunk {
  tag: 'scope-chunk',
  val: ScopeChunkReply,
}
export interface ServerReplyOther {
  tag: 'other',
  val: OtherReply,
}
export interface ReplyBundle {
  time: OscTime,
  replies: Array<ServerReply>,
}
