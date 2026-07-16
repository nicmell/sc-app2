import type { OscCommand, OscEvent, OscLogEntryPayload, OscRequest, OscSession } from "@/types/osc";
import type { DecodedScopeChunk } from "@sc-app/server-commands";
import type { ScsynthStatus } from "@/types/stores";

export interface BuiltMessage<T> {
  msg: T;
  transfer?: Transferable[];
}
let nextRequestId = 1;
const request = <T extends Omit<OscRequest, "id">>(msg: T): BuiltMessage<OscRequest> => ({
  msg: { ...msg, id: nextRequestId++ } as unknown as OscRequest,
});
const command = (msg: OscCommand): BuiltMessage<OscCommand> => ({ msg });
const event = (msg: OscEvent): BuiltMessage<OscEvent> => ({ msg });

export const connectMessage = (url: string, session: OscSession) =>
  request({ type: "connect", url, session });
export const createGroupMessage = (targetId: number) => request({ type: "createGroup", targetId });
export const createSynthMessage = (
  defName: string,
  targetId: number,
  controls: Record<string, number>,
  arrayControls: Array<{ index: number; values: number[] }>,
) => request({ type: "createSynth", defName, targetId, controls, arrayControls });
// Deliberately NOT transferred: callers may hold cached compilations (the
// scope tap defs are memoized per channels/chunkSize), and transferring
// would detach the cached buffer — the next send would post a dead one.
// Synthdef payloads are KB-sized; the structured-clone copy is nothing.
export const sendSynthDefMessage = (bytes: Uint8Array) =>
  request({ type: "sendSynthDef", bytes });
export const setControlMessage = (nodeId: number, name: string, value: number) =>
  command({ type: "setControl", nodeId, name, value });
export const setControlnMessage = (nodeId: number, name: string, values: number[]) =>
  command({ type: "setControln", nodeId, name, values });
export const setNodeRunMessage = (nodeId: number, flag: 0 | 1) =>
  command({ type: "setNodeRun", nodeId, flag });
export const freeSynthMessage = (nodeId: number) => command({ type: "freeSynth", nodeId });
export const freeGroupMessage = (groupId: number) => command({ type: "freeGroup", groupId });
export const freeSynthDefMessage = (name: string) => command({ type: "freeSynthDef", name });
export const subscribeScopeMessage = (
  subId: number,
  scope: number,
  channels: number,
  chunkSize: number,
) => command({ type: "subscribeScope", subId, scope, channels, chunkSize });
export const unsubscribeScopeMessage = (subId: number) =>
  command({ type: "unsubscribeScope", subId });
export const sendDirtMessage = (dirtEvent: Record<string, string | number>, timetag: number) =>
  command({ type: "sendDirt", event: dirtEvent, timetag });
export const closeMessage = () => command({ type: "close" });
export const replyOkMessage = (id: number, result?: unknown) =>
  event({ type: "reply", id, ok: true, result });
export const replyErrorMessage = (id: number, error: string) =>
  event({ type: "reply", id, ok: false, error });
export const openMessage = () => event({ type: "open" });
export const closedMessage = (code?: number, reason?: string) =>
  event({ type: "closed", code, reason });
export const logMessage = (entries: OscLogEntryPayload[]) => event({ type: "log", entries });
export const bannerMessage = (address: string, message: string, variant: "error" | "warn") =>
  event({ type: "banner", address, message, variant });
export const statusMessage = (scsynth: ScsynthStatus) => event({ type: "status", scsynth });
export const scopeChunkMessage = (
  subId: number,
  chunk: DecodedScopeChunk,
): BuiltMessage<OscEvent> => ({
  msg: { type: "scopeChunk", subId, chunk },
  transfer: [chunk.data.buffer],
});
