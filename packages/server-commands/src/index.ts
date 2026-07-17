/**
 * @sc-app/server-commands — the app's scsynth OSC vocabulary.
 *
 * An abstraction/utility layer over the wasm component transpiled from the
 * scserver-commands Rust crate (`pkg/`, regenerated via
 * `yarn generate:server-commands`): typed `ServerMessage` builders for the
 * commands the app speaks, the encode/decode boundary, typed `ServerReply`
 * classification for everything inbound, and display formatting for the
 * OSC console.
 *
 * ```ts
 * import { sNew, AddToHead, encode, decodeReply } from "@sc-app/server-commands";
 *
 * const bytes = encode(sNew("myDef", 1001, AddToHead, 100, [["freq", 440]]));
 * const reply = decodeReply(inbound); // e.g. { tag: "n-go", val: {...} }
 * ```
 */

// The binary boundary (throws on malformed input) + the NTP conversion.
export { encode, encodeBundle, decodeReply, decodeReplyPacket, atUnixMs } from "./component";

// Typed command builders + add-action constants.
export * from "./builders";

// Console-log display helpers (no wasm crossings for the typed paths).
export {
  describeMessage,
  describeReply,
  flattenEncoded,
  formatOscArg,
  type FlatMessage,
} from "./describe";

// The component's own types, re-exported under the package root.
export type {
  ServerMessage,
  ControlId,
  ControlValue,
  NumericValue,
} from "../pkg/interfaces/scserver-commands-commands.js";
export type {
  ServerReply,
  NodeInfo,
  StatusReplyInfo,
  FailInfo,
  DoneInfo,
  SyncedReply,
  ScopeChunkReply,
  ReplyBundle,
} from "../pkg/interfaces/scserver-commands-replies.js";
export type { OscArg, OscTime } from "../pkg/interfaces/scserver-commands-core.js";
