//! The OSC/audio domain — no HTTP (that's [`crate::router`]).
//!
//! * [`osc`] — generic OSC helpers (encode/decode/peek), shared by all peers.
//! * [`peer`] — a connected UDP backend + address-routing primitives.
//! * [`bridge`] — a generic OSC switch: routes outbound packets to peers by
//!   address and fans inbound datagrams out to subscribers. Protocol-agnostic.
//! * [`scsynth`] — the scsynth protocol + a supervisor (register / poll
//!   `/status` / reconnect / unregister) that sits on top of a [`bridge::Bridge`].

pub mod bridge;
pub mod ids;
pub mod osc;
pub mod peer;
pub mod scsynth;
