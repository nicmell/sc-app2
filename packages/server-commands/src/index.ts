/**
 * @sc-app/server-commands — the app's scsynth OSC vocabulary.
 *
 * An abstraction/utility layer over the wasm-bindgen build of the
 * scserver-commands Rust crate (`pkg/`, regenerated via
 * `yarn generate:server-commands`): typed `ServerMessage` builders for every
 * spec command (exported through the `src/builders/` barrel), the
 * encode/decode boundary, and typed
 * `ServerReply` classification for everything inbound. The serde tag IS the
 * OSC address, so every value narrows on its `address` field and typed
 * payloads live under `args` — no tag↔address mapping exists anywhere.
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

// Console-log display helpers (no wasm crossings for the typed paths).
export { flattenEncoded, formatOscArg, type FlatMessage } from "./describe";

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
