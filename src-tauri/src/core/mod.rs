//! The OSC/audio domain — no HTTP (that's [`crate::router`]).
//!
//! * [`osc`] — generic OSC helpers (encode/decode/peek), shared by all peers.
//! * [`peer`] — a connected UDP backend + address-routing primitives.
//! * [`bridge`] — a generic OSC switch: routes outbound packets to peers by
//!   address and fans inbound datagrams out to subscribers. Protocol-agnostic.
//! * [`blocks`] — the per-session id-partitioning scheme (node-id sub-blocks
//!   + scope-slot spans). Pure math; consumed by [`sessions`], the session
//!   payload, and the scope subscribe gate.
//! * [`scsynth`] — the scsynth protocol + a supervisor (register / poll
//!   `/status` / reconnect / unregister) and group messaging, on top of a
//!   [`bridge::Bridge`].
//! * [`sessions`] — per-client session store: node-id sub-block allocation +
//!   liveness bookkeeping (the data structure; eviction is driven by the WS
//!   layer — a session ends when its socket closes).

pub mod blocks;
pub mod bridge;
pub mod osc;
pub mod peer;
pub mod scsynth;
pub mod sessions;
