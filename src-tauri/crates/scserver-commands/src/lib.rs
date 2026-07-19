//! Typed encoders and parsers for the SuperCollider server command protocol.
//!
//! See the [Server Command Reference](https://doc.sccode.org/Reference/Server-Command-Reference.html).

// Vendored from nicmell/sc-crates: keep upstream style — the app's
// clippy -D warnings gate would fail on stylistic lints here.
#![allow(clippy::all)]

pub mod args;
#[macro_use]
mod commands_macro;
pub mod commands;
mod error;
mod nrt;
mod osc;
mod replies;
#[cfg(feature = "wasm")]
mod wasm;

pub use args::{OscArg, OscTimetag};
pub use commands::{
    ControlId, ControlValue, DirtPlay, KnownMessage, NumericValue, OtherMsg, ScopeSubscribe,
    ScopeUnsubscribe, ServerMessage, DIRT_PLAY_ADDRESS, SCOPE_SUBSCRIBE_ADDRESS,
    SCOPE_UNSUBSCRIBE_ADDRESS,
};
pub use error::CommandError;
pub use nrt::NrtScore;
pub use osc::{ntp_from_unix_ms, OscMessage};
pub use replies::{
    BSetnReply, DoneReply, FailReply, KnownReply, LateReply, NodeInfo, QueryTreeControl,
    QueryTreeNode, QueryTreeReply, ScopeChunkReply, ServerReply, StatusReply, SyncedReply, TrReply,
    QUERY_TREE_ADDRESS, SCOPE_CHUNK_ADDRESS,
};

pub use rosc::OscType;
