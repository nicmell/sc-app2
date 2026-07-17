/** @module Interface scserver:commands/commands@0.1.0 **/
export function encode(msg: ServerMessage): Uint8Array;
export function encodeBatch(msgs: Array<ServerMessage>): Uint8Array;
export function encodeBundle(time: OscTime, msgs: Array<ServerMessage>): Uint8Array;
export function atUnixMs(ms: number): OscTime;
export type OscArg = import('./scserver-commands-core.js').OscArg;
export type OscTime = import('./scserver-commands-core.js').OscTime;
export type ControlId = ControlIdIndex | ControlIdName;
export interface ControlIdIndex {
  tag: 'index',
  val: number,
}
export interface ControlIdName {
  tag: 'name',
  val: string,
}
export type NumericValue = NumericValueFloat | NumericValueInt;
export interface NumericValueFloat {
  tag: 'float',
  val: number,
}
export interface NumericValueInt {
  tag: 'int',
  val: number,
}
export type ControlValue = ControlValueFloat | ControlValueInt | ControlValueBus;
export interface ControlValueFloat {
  tag: 'float',
  val: number,
}
export interface ControlValueInt {
  tag: 'int',
  val: number,
}
export interface ControlValueBus {
  tag: 'bus',
  val: string,
}
export interface BAllocArgs {
  bufnum: number,
  numFrames: number,
  numChannels?: number,
  completionMsg?: Uint8Array,
  sampleRate?: number,
}
export interface BAllocReadArgs {
  bufnum: number,
  path: string,
  startFrame?: number,
  numberOfFrames?: number,
  completionMsg?: Uint8Array,
}
export interface BAllocReadChannelArgs {
  bufnum: number,
  path: string,
  startFrame: number,
  numberOfFrames: number,
  channels: Int32Array,
  completionMsg?: Uint8Array,
}
export interface BCloseArgs {
  bufnum: number,
  completionMsg?: Uint8Array,
}
export interface BFillArgs {
  bufnum: number,
  tail: Array<[number, number, number]>,
}
export interface BFreeArgs {
  bufnum: number,
  completionMsg?: Uint8Array,
}
export interface BGenArgs {
  bufnum: number,
  cmd: string,
  commandArguments: Array<OscArg>,
}
export interface BGetArgs {
  bufnum: number,
  sampleIndices: Int32Array,
}
export interface BGetnArgs {
  bufnum: number,
  tail: Array<[number, number]>,
}
export interface BQueryArgs {
  bufnums: Int32Array,
}
export interface BReadArgs {
  bufnum: number,
  path: string,
  startFrame?: number,
  numberOfFrames?: number,
  startingFrame?: number,
  leaveFileOpen?: number,
  completionMsg?: Uint8Array,
}
export interface BReadChannelArgs {
  bufnum: number,
  path: string,
  startFrame: number,
  numberOfFrames: number,
  startingFrame: number,
  leaveFileOpen: number,
  channels: Int32Array,
  completionMsg?: Uint8Array,
}
export interface BSetArgs {
  bufnum: number,
  tail: Array<[number, number]>,
}
export interface BSetSampleRateArgs {
  bufnum: number,
  theDesiredSampling: number,
}
export interface BSetnArgs {
  bufnum: number,
  tail: Array<[number, Float32Array]>,
}
export interface BWriteArgs {
  bufnum: number,
  path: string,
  headerFormat: string,
  sampleFormat: string,
  numberOfFrames?: number,
  startingFrame?: number,
  leaveFileOpen?: number,
  completionMsg?: Uint8Array,
}
export interface BZeroArgs {
  bufnum: number,
  completionMsg?: Uint8Array,
}
export interface CFillArgs {
  tail: Array<[number, number, NumericValue]>,
}
export interface CGetArgs {
  busIndices: Int32Array,
}
export interface CGetnArgs {
  tail: Array<[number, number]>,
}
export interface CSetArgs {
  tail: Array<[number, NumericValue]>,
}
export interface CSetnArgs {
  tail: Array<[number, Array<NumericValue>]>,
}
export interface CmdArgs {
  cmd: string,
  anyArguments: Array<OscArg>,
}
export interface DFreeArgs {
  synthDefNames: Array<string>,
}
export interface DLoadArgs {
  pathnameOfFile: string,
  completionMsg?: Uint8Array,
}
export interface DLoadDirArgs {
  pathnameOfDirectory: string,
  completionMsg?: Uint8Array,
}
export interface DRecvArgs {
  bufferOfData: Uint8Array,
  completionMsg?: Uint8Array,
}
export interface DumpOscArgs {
  code: number,
}
export interface ErrorArgs {
  mode: number,
}
export interface GDeepFreeArgs {
  groupIds: Int32Array,
}
export interface GDumpTreeArgs {
  tail: Array<[number, number]>,
}
export interface GFreeAllArgs {
  groupIds: Int32Array,
}
export interface GHeadArgs {
  tail: Array<[number, number]>,
}
export interface GNewArgs {
  tail: Array<[number, number, number]>,
}
export interface GQueryTreeArgs {
  tail: Array<[number, number]>,
}
export interface GTailArgs {
  tail: Array<[number, number]>,
}
export interface NAfterArgs {
  tail: Array<[number, number]>,
}
export interface NBeforeArgs {
  tail: Array<[number, number]>,
}
export interface NFillArgs {
  nodeId: number,
  tail: Array<[ControlId, number, NumericValue]>,
}
export interface NFreeArgs {
  nodeIds: Int32Array,
}
export interface NMapArgs {
  nodeId: number,
  tail: Array<[ControlId, number]>,
}
export interface NMapaArgs {
  nodeId: number,
  tail: Array<[ControlId, number]>,
}
export interface NMapanArgs {
  nodeId: number,
  tail: Array<[ControlId, number, number]>,
}
export interface NMapnArgs {
  nodeId: number,
  tail: Array<[ControlId, number, number]>,
}
export interface NOrderArgs {
  addAction: number,
  targetId: number,
  nodeIds: Int32Array,
}
export interface NQueryArgs {
  nodeIds: Int32Array,
}
export interface NRunArgs {
  tail: Array<[number, number]>,
}
export interface NSetArgs {
  nodeId: number,
  tail: Array<[ControlId, NumericValue]>,
}
export interface NSetnArgs {
  nodeId: number,
  tail: Array<[ControlId, Array<NumericValue>]>,
}
export interface NTraceArgs {
  nodeIds: Int32Array,
}
export interface NotifyArgs {
  enable: number,
  clientId?: number,
}
export interface PNewArgs {
  tail: Array<[number, number, number]>,
}
export interface SGetArgs {
  nodeId: number,
  controls: Array<ControlId>,
}
export interface SGetnArgs {
  nodeId: number,
  tail: Array<[ControlId, number]>,
}
export interface SNewArgs {
  defName: string,
  nodeId: number,
  addAction: number,
  targetId: number,
  tail: Array<[ControlId, ControlValue]>,
}
export interface SNoidArgs {
  synthIds: Int32Array,
}
export interface SyncArgs {
  aUniqueNumber: number,
}
export interface UCmdArgs {
  nodeId: number,
  unitGeneratorIndex: number,
  cmd: string,
  anyArguments: Array<OscArg>,
}
export interface ScopeSubscribeArgs {
  subId: number,
  scope: number,
  channels: number,
  chunkSize: number,
}
export interface ScopeUnsubscribeArgs {
  subId: number,
}
export interface OtherMsg {
  address: string,
  args: Array<OscArg>,
}
export type ServerMessage = ServerMessageBAlloc | ServerMessageBAllocRead | ServerMessageBAllocReadChannel | ServerMessageBClose | ServerMessageBFill | ServerMessageBFree | ServerMessageBGen | ServerMessageBGet | ServerMessageBGetn | ServerMessageBQuery | ServerMessageBRead | ServerMessageBReadChannel | ServerMessageBSet | ServerMessageBSetSampleRate | ServerMessageBSetn | ServerMessageBWrite | ServerMessageBZero | ServerMessageCFill | ServerMessageCGet | ServerMessageCGetn | ServerMessageCSet | ServerMessageCSetn | ServerMessageClearSched | ServerMessageCmd | ServerMessageDFree | ServerMessageDLoad | ServerMessageDLoadDir | ServerMessageDRecv | ServerMessageDumpOsc | ServerMessageError | ServerMessageGDeepFree | ServerMessageGDumpTree | ServerMessageGFreeAll | ServerMessageGHead | ServerMessageGNew | ServerMessageGQueryTree | ServerMessageGTail | ServerMessageNAfter | ServerMessageNBefore | ServerMessageNFill | ServerMessageNFree | ServerMessageNMap | ServerMessageNMapa | ServerMessageNMapan | ServerMessageNMapn | ServerMessageNOrder | ServerMessageNQuery | ServerMessageNRun | ServerMessageNSet | ServerMessageNSetn | ServerMessageNTrace | ServerMessageNotify | ServerMessageNrtEnd | ServerMessagePNew | ServerMessageQuit | ServerMessageRtMemoryStatus | ServerMessageSGet | ServerMessageSGetn | ServerMessageSNew | ServerMessageSNoid | ServerMessageScopeSubscribe | ServerMessageScopeUnsubscribe | ServerMessageStatus | ServerMessageSync | ServerMessageUCmd | ServerMessageVersion | ServerMessageOther;
export interface ServerMessageBAlloc {
  tag: 'b-alloc',
  val: BAllocArgs,
}
export interface ServerMessageBAllocRead {
  tag: 'b-alloc-read',
  val: BAllocReadArgs,
}
export interface ServerMessageBAllocReadChannel {
  tag: 'b-alloc-read-channel',
  val: BAllocReadChannelArgs,
}
export interface ServerMessageBClose {
  tag: 'b-close',
  val: BCloseArgs,
}
export interface ServerMessageBFill {
  tag: 'b-fill',
  val: BFillArgs,
}
export interface ServerMessageBFree {
  tag: 'b-free',
  val: BFreeArgs,
}
export interface ServerMessageBGen {
  tag: 'b-gen',
  val: BGenArgs,
}
export interface ServerMessageBGet {
  tag: 'b-get',
  val: BGetArgs,
}
export interface ServerMessageBGetn {
  tag: 'b-getn',
  val: BGetnArgs,
}
export interface ServerMessageBQuery {
  tag: 'b-query',
  val: BQueryArgs,
}
export interface ServerMessageBRead {
  tag: 'b-read',
  val: BReadArgs,
}
export interface ServerMessageBReadChannel {
  tag: 'b-read-channel',
  val: BReadChannelArgs,
}
export interface ServerMessageBSet {
  tag: 'b-set',
  val: BSetArgs,
}
export interface ServerMessageBSetSampleRate {
  tag: 'b-set-sample-rate',
  val: BSetSampleRateArgs,
}
export interface ServerMessageBSetn {
  tag: 'b-setn',
  val: BSetnArgs,
}
export interface ServerMessageBWrite {
  tag: 'b-write',
  val: BWriteArgs,
}
export interface ServerMessageBZero {
  tag: 'b-zero',
  val: BZeroArgs,
}
export interface ServerMessageCFill {
  tag: 'c-fill',
  val: CFillArgs,
}
export interface ServerMessageCGet {
  tag: 'c-get',
  val: CGetArgs,
}
export interface ServerMessageCGetn {
  tag: 'c-getn',
  val: CGetnArgs,
}
export interface ServerMessageCSet {
  tag: 'c-set',
  val: CSetArgs,
}
export interface ServerMessageCSetn {
  tag: 'c-setn',
  val: CSetnArgs,
}
export interface ServerMessageClearSched {
  tag: 'clear-sched',
}
export interface ServerMessageCmd {
  tag: 'cmd',
  val: CmdArgs,
}
export interface ServerMessageDFree {
  tag: 'd-free',
  val: DFreeArgs,
}
export interface ServerMessageDLoad {
  tag: 'd-load',
  val: DLoadArgs,
}
export interface ServerMessageDLoadDir {
  tag: 'd-load-dir',
  val: DLoadDirArgs,
}
export interface ServerMessageDRecv {
  tag: 'd-recv',
  val: DRecvArgs,
}
export interface ServerMessageDumpOsc {
  tag: 'dump-osc',
  val: DumpOscArgs,
}
export interface ServerMessageError {
  tag: 'error',
  val: ErrorArgs,
}
export interface ServerMessageGDeepFree {
  tag: 'g-deep-free',
  val: GDeepFreeArgs,
}
export interface ServerMessageGDumpTree {
  tag: 'g-dump-tree',
  val: GDumpTreeArgs,
}
export interface ServerMessageGFreeAll {
  tag: 'g-free-all',
  val: GFreeAllArgs,
}
export interface ServerMessageGHead {
  tag: 'g-head',
  val: GHeadArgs,
}
export interface ServerMessageGNew {
  tag: 'g-new',
  val: GNewArgs,
}
export interface ServerMessageGQueryTree {
  tag: 'g-query-tree',
  val: GQueryTreeArgs,
}
export interface ServerMessageGTail {
  tag: 'g-tail',
  val: GTailArgs,
}
export interface ServerMessageNAfter {
  tag: 'n-after',
  val: NAfterArgs,
}
export interface ServerMessageNBefore {
  tag: 'n-before',
  val: NBeforeArgs,
}
export interface ServerMessageNFill {
  tag: 'n-fill',
  val: NFillArgs,
}
export interface ServerMessageNFree {
  tag: 'n-free',
  val: NFreeArgs,
}
export interface ServerMessageNMap {
  tag: 'n-map',
  val: NMapArgs,
}
export interface ServerMessageNMapa {
  tag: 'n-mapa',
  val: NMapaArgs,
}
export interface ServerMessageNMapan {
  tag: 'n-mapan',
  val: NMapanArgs,
}
export interface ServerMessageNMapn {
  tag: 'n-mapn',
  val: NMapnArgs,
}
export interface ServerMessageNOrder {
  tag: 'n-order',
  val: NOrderArgs,
}
export interface ServerMessageNQuery {
  tag: 'n-query',
  val: NQueryArgs,
}
export interface ServerMessageNRun {
  tag: 'n-run',
  val: NRunArgs,
}
export interface ServerMessageNSet {
  tag: 'n-set',
  val: NSetArgs,
}
export interface ServerMessageNSetn {
  tag: 'n-setn',
  val: NSetnArgs,
}
export interface ServerMessageNTrace {
  tag: 'n-trace',
  val: NTraceArgs,
}
export interface ServerMessageNotify {
  tag: 'notify',
  val: NotifyArgs,
}
export interface ServerMessageNrtEnd {
  tag: 'nrt-end',
}
export interface ServerMessagePNew {
  tag: 'p-new',
  val: PNewArgs,
}
export interface ServerMessageQuit {
  tag: 'quit',
}
export interface ServerMessageRtMemoryStatus {
  tag: 'rt-memory-status',
}
export interface ServerMessageSGet {
  tag: 's-get',
  val: SGetArgs,
}
export interface ServerMessageSGetn {
  tag: 's-getn',
  val: SGetnArgs,
}
export interface ServerMessageSNew {
  tag: 's-new',
  val: SNewArgs,
}
export interface ServerMessageSNoid {
  tag: 's-noid',
  val: SNoidArgs,
}
export interface ServerMessageScopeSubscribe {
  tag: 'scope-subscribe',
  val: ScopeSubscribeArgs,
}
export interface ServerMessageScopeUnsubscribe {
  tag: 'scope-unsubscribe',
  val: ScopeUnsubscribeArgs,
}
export interface ServerMessageStatus {
  tag: 'status',
}
export interface ServerMessageSync {
  tag: 'sync',
  val: SyncArgs,
}
export interface ServerMessageUCmd {
  tag: 'u-cmd',
  val: UCmdArgs,
}
export interface ServerMessageVersion {
  tag: 'version',
}
export interface ServerMessageOther {
  tag: 'other',
  val: OtherMsg,
}
