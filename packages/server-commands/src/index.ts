/**
 * @sc-app/server-commands — scsynth OSC messaging layer for the app.
 *
 * Callers work with plain OSC packet objects. These helpers provide per-address constructors,
 * typed reply accessors, and timetag helpers for sample-accurate
 * scheduling.
 *
 * ```ts
 * import { sNew, AddToHead, inFuture } from '@sc-app/server-commands';
 *
 * const msg = sNew('myDef', 1001, AddToHead, 100);
 * const bundle = { timetag: inFuture(200), packets: [msg] };
 * ```
 */

// Flatten a packet/bundle into per-message (address, args) entries.
export { flattenPacket, formatOscArg, walkPacket, type FlatOsc } from "./flatten";

// Timetag helpers.
export * as timetag from "./timetag";
export { fromTick as tickToTimetag, immediate, inFuture, atDate, type Timetag } from "./timetag";

// Type primitives.
export {
  isBundle,
  isMessage,
  type OscArg,
  type OscBundle,
  type OscMessage,
  type OscPacket,
  type ControlKey,
  type ControlValue,
} from "./types";

// Command constructors.
export * from "./commands";

// Typed reply accessors.
export * from "./replies";
