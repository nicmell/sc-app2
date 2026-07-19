/**
 * @sc-app/server-commands — the app's scsynth OSC vocabulary.
 *
 * An abstraction/utility layer over the wasm-bindgen build of the
 * scserver-commands Rust crate (`pkg/`, regenerated via
 * `yarn generate:server-commands`): typed builders for every spec command
 * (exported through `src/builders.ts`) return OSC wire bytes directly. The
 * package also frames pre-encoded bundles and classifies inbound replies as
 * typed, address-discriminated `{ address, args }` values.
 *
 * ```ts
 * import { sNew, AddToHead, decodeReply } from "@sc-app/server-commands";
 *
 * const bytes = sNew("myDef", 1001, AddToHead, 100, [["freq", 440]]); // wire-ready
 * const reply = decodeReply(inbound); // e.g. { address: "/n_go", args: { nodeId, … } }
 * if (reply.address === "/synced") console.log(reply.args.syncId);
 * ```
 */

// The binary boundary (throws on malformed input) + the NTP conversion.
export {
  encodeBundle,
  decodeReply,
  decodeReplyPacket,
  decodeRawPacket,
  atUnixMs,
} from "./component";

// Typed command builders + add-action constants.
export * from "./builders.js";

// Console-log display helpers over the actual encoded packet bytes.
export { flattenEncoded, formatOscArg, type FlatMessage } from "./describe";

// The crate's generated reply and low-level Rust API types.
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
