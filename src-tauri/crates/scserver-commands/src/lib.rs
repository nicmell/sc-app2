//! Typed encoders and parsers for the SuperCollider server command protocol.
//!
//! See the [Server Command Reference](https://doc.sccode.org/Reference/Server-Command-Reference.html).

// Vendored from nicmell/sc-crates: keep upstream style — the app's
// clippy -D warnings gate would fail on stylistic lints here.
#![allow(clippy::all)]

pub mod commands;
#[cfg(feature = "component")]
mod component;
mod error;
mod nrt;
mod osc;
mod replies;

pub use commands::{
    ControlId, ControlValue, NumericValue, ScopeSubscribe, ScopeUnsubscribe, ServerMessage,
    SCOPE_SUBSCRIBE_ADDRESS, SCOPE_UNSUBSCRIBE_ADDRESS,
};
pub use error::CommandError;
pub use nrt::NrtScore;
pub use osc::{ntp_from_unix_ms, OscMessage};
pub use replies::{
    BSetnReply, NodeInfo, ScopeChunkReply, ServerReply, StatusReply, SCOPE_CHUNK_ADDRESS,
};

pub use rosc::OscType;
