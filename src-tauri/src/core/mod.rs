//! The application core — everything that is neither HTTP transport
//! ([`crate::router`]) nor the command-line surface ([`crate::cli`]).
//!
//! The OSC/audio domain:
//! * [`osc`] — generic OSC helpers (encode/decode/peek), shared by all peers.
//! * [`peer`] — a connected UDP backend + address-routing primitives.
//! * [`bridge`] — a generic OSC switch: routes outbound packets to peers by
//!   address and fans inbound datagrams out to subscribers. Protocol-agnostic.
//! * [`scsynth`] — the scsynth protocol + a supervisor (register / poll
//!   `/status` / reconnect / unregister) and group messaging, on top of a
//!   [`bridge::Bridge`].
//! * [`scope`] — SHM scope streaming (the tap buffers → `/scope/chunk`).
//!
//! Sessions:
//! * [`blocks`] — the per-session id-partitioning scheme (node-id sub-blocks
//!   + scope-slot spans). Pure math; consumed by [`sessions`], the session
//!   payload, and the scope subscribe gate.
//! * [`sessions`] — per-client LIVE session store: node-id sub-block
//!   allocation + liveness bookkeeping (the data structure; eviction is
//!   driven by the WS layer — a session ends when its socket closes).
//! * [`layouts`] — the SAVED dashboard layouts (persisted JSON).
//!
//! The application shell:
//! * [`server`] — the app-logic facade the router holds as axum `State`:
//!   session lifecycle, the shared scope SHM handle, config access, shutdown.
//! * [`config`] — `config.json` + the canonical app-data-dir paths.
//! * [`plugin`] — plugin-bundle validation + storage.
//! * [`logger`] — tracing to stderr + the optional rotated JSON file.

pub mod blocks;
pub mod bridge;
pub mod config;
pub mod layouts;
pub mod logger;
pub mod osc;
pub mod peer;
pub mod plugin;
pub mod scope;
pub mod scsynth;
pub mod server;
pub mod sessions;
