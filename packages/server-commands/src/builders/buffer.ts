import type { ServerMessage } from "../../pkg/scserver_commands.js";
import { toOscArg } from "./helpers.js";

/** `/b_alloc` — Allocate buffer space. */
export function bAlloc(
  bufnum: number,
  numFrames: number,
  opts?: { numChannels?: number; completionMsg?: Uint8Array; sampleRate?: number },
): ServerMessage {
  return {
    address: "/b_alloc",
    args: {
      bufnum,
      numFrames,
      numChannels: opts?.numChannels,
      completionMsg: opts?.completionMsg,
      sampleRate: opts?.sampleRate,
    },
  };
}
/** `/b_allocRead` — Allocate buffer space and read a sound file. */
export function bAllocRead(
  bufnum: number,
  path: string,
  opts?: { startFrame?: number; numberOfFrames?: number; completionMsg?: Uint8Array },
): ServerMessage {
  return {
    address: "/b_allocRead",
    args: {
      bufnum,
      path,
      startFrame: opts?.startFrame,
      numberOfFrames: opts?.numberOfFrames,
      completionMsg: opts?.completionMsg,
    },
  };
}
/** `/b_allocReadChannel` — Allocate a buffer and read selected file channels. */
export function bAllocReadChannel(
  bufnum: number,
  path: string,
  startFrame: number,
  numberOfFrames: number,
  channels: readonly number[],
  completionMsg?: Uint8Array,
): ServerMessage {
  return {
    address: "/b_allocReadChannel",
    args: { bufnum, path, startFrame, numberOfFrames, channels: [...channels], completionMsg },
  };
}
/** `/b_close` — Close a sound file. */
export function bClose(bufnum: number, completionMsg?: Uint8Array): ServerMessage {
  return { address: "/b_close", args: { bufnum, completionMsg } };
}
/** `/b_fill` — Fill ranges of sample values. */
export function bFill(
  bufnum: number,
  tail: ReadonlyArray<readonly [number, number, number]>,
): ServerMessage {
  return { address: "/b_fill", args: { bufnum, tail: tail.map((x) => [...x]) } };
}
/** `/b_free` — Free a buffer. */
export function bFree(bufnum: number, completionMsg?: Uint8Array): ServerMessage {
  return { address: "/b_free", args: { bufnum, completionMsg } };
}
/** `/b_gen` — Run a buffer generation command. */
export function bGen(
  bufnum: number,
  cmd: string,
  commandArguments: readonly (number | string | Uint8Array)[],
): ServerMessage {
  return {
    address: "/b_gen",
    args: { bufnum, cmd, commandArguments: commandArguments.map(toOscArg) },
  };
}
/** `/b_get` — Get buffer samples. */
export function bGet(bufnum: number, sampleIndices: readonly number[]): ServerMessage {
  return { address: "/b_get", args: { bufnum, sampleIndices: [...sampleIndices] } };
}
/** `/b_getn` — Get ranges of buffer samples. */
export function bGetn(
  bufnum: number,
  tail: ReadonlyArray<readonly [number, number]>,
): ServerMessage {
  return { address: "/b_getn", args: { bufnum, tail: tail.map((x) => [...x]) } };
}
/** `/b_query` — Query buffers. */
export function bQuery(bufnums: readonly number[]): ServerMessage {
  return { address: "/b_query", args: { bufnums: [...bufnums] } };
}
/** `/b_read` — Read a sound file into a buffer. */
export function bRead(
  bufnum: number,
  path: string,
  opts?: {
    startFrame?: number;
    numberOfFrames?: number;
    startingFrame?: number;
    leaveFileOpen?: number;
    completionMsg?: Uint8Array;
  },
): ServerMessage {
  return {
    address: "/b_read",
    args: {
      bufnum,
      path,
      startFrame: opts?.startFrame,
      numberOfFrames: opts?.numberOfFrames,
      startingFrame: opts?.startingFrame,
      leaveFileOpen: opts?.leaveFileOpen,
      completionMsg: opts?.completionMsg,
    },
  };
}
/** `/b_readChannel` — Read selected sound-file channels into a buffer. */
export function bReadChannel(
  bufnum: number,
  path: string,
  startFrame: number,
  numberOfFrames: number,
  startingFrame: number,
  leaveFileOpen: number,
  channels: readonly number[],
  completionMsg?: Uint8Array,
): ServerMessage {
  return {
    address: "/b_readChannel",
    args: {
      bufnum,
      path,
      startFrame,
      numberOfFrames,
      startingFrame,
      leaveFileOpen,
      channels: [...channels],
      completionMsg,
    },
  };
}
/** `/b_set` — Set individual buffer samples. */
export function bSet(
  bufnum: number,
  tail: ReadonlyArray<readonly [number, number]>,
): ServerMessage {
  return { address: "/b_set", args: { bufnum, tail: tail.map((x) => [...x]) } };
}
/** `/b_setn` — Set contiguous buffer samples. */
export function bSetn(
  bufnum: number,
  tail: ReadonlyArray<readonly [number, readonly number[]]>,
): ServerMessage {
  return { address: "/b_setn", args: { bufnum, tail: tail.map(([h, v]) => [h, [...v]]) } };
}
/** `/b_setSampleRate` — Set a buffer's sample rate. */
export function bSetSampleRate(bufnum: number, theDesiredSampling: number): ServerMessage {
  return { address: "/b_setSampleRate", args: { bufnum, theDesiredSampling } };
}
/** `/b_write` — Write a buffer to a sound file. */
export function bWrite(
  bufnum: number,
  path: string,
  headerFormat: string,
  sampleFormat: string,
  opts?: {
    numberOfFrames?: number;
    startingFrame?: number;
    leaveFileOpen?: number;
    completionMsg?: Uint8Array;
  },
): ServerMessage {
  return {
    address: "/b_write",
    args: {
      bufnum,
      path,
      headerFormat,
      sampleFormat,
      numberOfFrames: opts?.numberOfFrames,
      startingFrame: opts?.startingFrame,
      leaveFileOpen: opts?.leaveFileOpen,
      completionMsg: opts?.completionMsg,
    },
  };
}
/** `/b_zero` — Zero a buffer. */
export function bZero(bufnum: number, completionMsg?: Uint8Array): ServerMessage {
  return { address: "/b_zero", args: { bufnum, completionMsg } };
}
