/**
 * @sc-app/server-commands — the app's scsynth OSC vocabulary.
 *
 * An abstraction/utility layer over the wasm-bindgen build of the
 * scserver-commands Rust crate (`pkg/`, regenerated via
 * `yarn generate:server-commands`): typed `ServerMessage` builders for the
 * commands the app speaks, the encode/decode boundary, and typed
 * `ServerReply` classification for everything inbound. The serde tag IS the
 * OSC address, so every value narrows on its `address` field and typed
 * payloads live under `args` — no tag↔address mapping exists anywhere.
 *
 * ```ts
 * import { sNew, AddToHead, encode, decodeReply } from "@sc-app/server-commands";
 *
 * const bytes = encode(sNew("myDef", 1001, AddToHead, 100, [["freq", 440]]));
 * const reply = decodeReply(inbound); // e.g. { address: "/n_go", args: { nodeId, … } }
 * if (reply.address === "/synced") console.log(reply.args.syncId);
 * ```
 */

// The binary boundary (throws on malformed input) + the NTP conversion.
export { encode, encodeBundle, decodeReply, decodeReplyPacket, atUnixMs } from "./component";

// Typed command builders + add-action constants.
export * from "./builders/index.js";
export {
  COMMANDS,
  KNOWN_ADDRESSES,
  isKnownAddress,
  type CommandSpec,
  type CommandField,
} from "./spec.js";

// Console-log display helpers (no wasm crossings for the typed paths).
export {
  describeMessage,
  describeReply,
  flattenEncoded,
  formatOscArg,
  type FlatMessage,
} from "./describe";

// The crate's own generated types, re-exported under the package root.
export type {
  ServerMessage,
  ServerReply,
  KnownMessage,
  KnownReply,
  OtherMsg,
  ControlId,
  ControlValue,
  NumericValue,
  OscArg,
  OscTimetag,
  NodeInfo,
  StatusReply,
  ScopeChunkReply,
} from "../pkg/scserver_commands.js";
