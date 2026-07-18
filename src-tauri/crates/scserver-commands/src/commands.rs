//! Typed encoders for every SuperCollider server command, plus the
//! polymorphic arg enums some commands use.
//!
//! The standard SC catalog is spec-driven: `build.rs` deserializes
//! `assets/specs/server-commands.json` (repo root) and emits the
//! `sc_commands!` invocation included below — edit the SPEC, never this
//! catalog. The sc-app bridge extensions (`/dirt/play`, `/scope/*`) are
//! hand-maintained invocations of the same macro at the bottom of this
//! file.

#![allow(non_snake_case, unused_mut)]

use crate::args::OscArg;
use crate::OscMessage;
use rosc::OscType;
use serde::{Deserialize, Serialize};
#[cfg(feature = "wasm")]
use tsify::Tsify;

// ── Polymorphic arg types ───────────────────────────────────────────────

/// Identifier used to address a synth control: either its index in the
/// control list, or its declared name.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub enum ControlId {
    Index(i32),
    Name(String),
}

impl From<i32> for ControlId {
    fn from(v: i32) -> Self {
        ControlId::Index(v)
    }
}

impl From<&str> for ControlId {
    fn from(v: &str) -> Self {
        ControlId::Name(v.to_string())
    }
}

impl From<String> for ControlId {
    fn from(v: String) -> Self {
        ControlId::Name(v)
    }
}

impl From<ControlId> for OscType {
    fn from(v: ControlId) -> Self {
        match v {
            ControlId::Index(i) => OscType::Int(i),
            ControlId::Name(s) => OscType::String(s),
        }
    }
}

/// A numeric value that the server accepts as either `int` or `float`.
/// Used by `/c_set`, `/c_setn`, `/c_fill`, `/n_set`, `/n_setn`, `/n_fill`,
/// `/b_set`, `/b_setn`, `/b_fill`, etc.
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub enum NumericValue {
    Float(f32),
    Int(i32),
}

impl From<f32> for NumericValue {
    fn from(v: f32) -> Self {
        NumericValue::Float(v)
    }
}

impl From<i32> for NumericValue {
    fn from(v: i32) -> Self {
        NumericValue::Int(v)
    }
}

impl From<NumericValue> for OscType {
    fn from(v: NumericValue) -> Self {
        match v {
            NumericValue::Float(f) => OscType::Float(f),
            NumericValue::Int(i) => OscType::Int(i),
        }
    }
}

/// The `/s_new` control-value alternative: a float, an int, or a bus
/// reference string (e.g. `"c10"` for control bus 10, `"a0"` for audio
/// bus 0).
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub enum ControlValue {
    Float(f32),
    Int(i32),
    /// Bus reference — a symbol like `"c10"` or `"a0"` that instructs the
    /// server to map the control to that bus at synth creation.
    Bus(String),
}

impl From<f32> for ControlValue {
    fn from(v: f32) -> Self {
        ControlValue::Float(v)
    }
}

impl From<i32> for ControlValue {
    fn from(v: i32) -> Self {
        ControlValue::Int(v)
    }
}

impl From<&str> for ControlValue {
    fn from(v: &str) -> Self {
        ControlValue::Bus(v.to_string())
    }
}

impl From<String> for ControlValue {
    fn from(v: String) -> Self {
        ControlValue::Bus(v)
    }
}

impl From<ControlValue> for OscType {
    fn from(v: ControlValue) -> Self {
        match v {
            ControlValue::Float(f) => OscType::Float(f),
            ControlValue::Int(i) => OscType::Int(i),
            ControlValue::Bus(s) => OscType::String(s),
        }
    }
}

// ── The spec-driven command catalog ─────────────────────────────────────

include!(concat!(env!("OUT_DIR"), "/commands_registry.rs"));

// ── sc-app bridge extensions (not in the SC command reference) ──────────
//
// The `/scope/*` protocol is spoken between the sc-app frontend and its
// Rust OSC bridge (never routed to scsynth): a client registers a
// scope-slot stream and the bridge answers with `/scope/chunk` replies
// (see `ScopeChunkReply` in `replies`). Unlike the scsynth commands
// above, the bridge is the CONSUMER of these — so they also carry
// `from_message`/`decode` parsers. `/dirt/play` is a SuperDirt event the
// bridge routes to the strudel peer.

/// OSC address a client sends to register a scope-slot stream.
pub const SCOPE_SUBSCRIBE_ADDRESS: &str = "/scope/subscribe";
/// OSC address a client sends to drop a scope-slot stream.
pub const SCOPE_UNSUBSCRIBE_ADDRESS: &str = "/scope/unsubscribe";
/// OSC address of a SuperDirt/Strudel event.
pub const DIRT_PLAY_ADDRESS: &str = "/dirt/play";

sc_commands! {
    /// sc-app bridge extension: register a scope-slot stream with the bridge.
    "/scope/subscribe" ScopeSubscribe {
        /// Client-minted subscription id, echoed on every chunk.
        scalar sub_id: i32,
        /// scsynth SHM scope-buffer index to stream.
        scalar scope: i32,
        /// Channel count (informational — the SHM header carries the truth).
        scalar channels: i32,
        /// Requested frames per chunk (informational, as above).
        scalar chunk_size: i32,
    }
    /// sc-app bridge extension: drop a scope-slot stream.
    "/scope/unsubscribe" ScopeUnsubscribe {
        /// The subscription id to drop.
        scalar sub_id: i32,
    }
    /// sc-app bridge extension: a SuperDirt/Strudel event, routed by the
    /// bridge to the strudel peer. The wire format is SuperDirt's
    /// alternating key/value arg list.
    "/dirt/play" DirtPlay {
        /// Repeated tuples: parameter name; parameter value.
        tail pairs: (String, OscArg),
    }
}

impl ScopeSubscribe {
    /// Parse a decoded `/scope/subscribe` message (Int32 args only).
    pub fn from_message(msg: &OscMessage) -> Result<Self, crate::CommandError> {
        let addr = SCOPE_SUBSCRIBE_ADDRESS;
        Ok(Self {
            sub_id: crate::replies::take_int(msg, 0, addr)?,
            scope: crate::replies::take_int(msg, 1, addr)?,
            channels: crate::replies::take_int(msg, 2, addr)?,
            chunk_size: crate::replies::take_int(msg, 3, addr)?,
        })
    }

    /// Decode raw OSC bytes into the typed command.
    pub fn decode(bytes: &[u8]) -> Result<Self, crate::CommandError> {
        Self::from_message(&OscMessage::decode(bytes)?)
    }
}

impl ScopeUnsubscribe {
    /// Parse a decoded `/scope/unsubscribe` message (Int32 arg only).
    pub fn from_message(msg: &OscMessage) -> Result<Self, crate::CommandError> {
        Ok(Self {
            sub_id: crate::replies::take_int(msg, 0, SCOPE_UNSUBSCRIBE_ADDRESS)?,
        })
    }

    /// Decode raw OSC bytes into the typed command.
    pub fn decode(bytes: &[u8]) -> Result<Self, crate::CommandError> {
        Self::from_message(&OscMessage::decode(bytes)?)
    }
}

// ── ServerMessage: typed dispatch over every command ────────────────────

/// Escape hatch for addresses outside the catalogue (SC extensions,
/// plug-in commands): a raw address + arg list.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub struct OtherMsg {
    pub address: String,
    pub args: Vec<OscArg>,
}

/// A command in transit: catalogued, or the raw escape hatch. Construct via
/// `From<…>` (`let msg: ServerMessage = BAlloc::new(0, 8192).into();`) and
/// call [`ServerMessage::encode`] for OSC wire bytes. (Plain enum — the wasm
/// boundary discriminates known-vs-other itself, so no serde here.)
#[derive(Debug, Clone)]
pub enum ServerMessage {
    Known(KnownMessage),
    Other(OtherMsg),
}

for_each_command!(define_known_message {
    DirtPlay "/dirt/play",
    ScopeSubscribe "/scope/subscribe",
    ScopeUnsubscribe "/scope/unsubscribe",
});

impl ServerMessage {
    /// Lower to the underlying `OscMessage` (raw address + arg list).
    pub fn to_osc_message(self) -> OscMessage {
        match self {
            Self::Known(k) => k.to_osc_message(),
            Self::Other(o) => {
                OscMessage::with_args(o.address, o.args.into_iter().map(OscType::from).collect())
            }
        }
    }

    /// Serialise the command to OSC wire bytes.
    pub fn encode(self) -> Result<Vec<u8>, crate::CommandError> {
        self.to_osc_message().encode()
    }
}

impl From<KnownMessage> for ServerMessage {
    fn from(k: KnownMessage) -> Self {
        ServerMessage::Known(k)
    }
}

impl From<OtherMsg> for ServerMessage {
    fn from(o: OtherMsg) -> Self {
        ServerMessage::Other(o)
    }
}
