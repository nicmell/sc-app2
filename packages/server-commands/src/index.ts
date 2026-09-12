/**
 * @sc-app/server-commands — scsynth OSC messaging layer for the app.
 *
 * Callers work with plain OSC packet objects. These helpers provide
 * per-address constructors and typed reply accessors.
 *
 * ```ts
 * import { sNew, AddToHead } from '@sc-app/server-commands';
 *
 * const msg = sNew('myDef', 1001, AddToHead, 100);
 * ```
 */

// Flatten a packet/bundle into per-message (address, args) entries.
export { flattenPacket, formatOscArg, walkPacket, type FlatOsc } from "./flatten";

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
