//! The application engine — everything below the command-line surface
//! ([`crate::cli`]), composed by [`start`].
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
//! * [`router`] — the HTTP/WS transport (axum): the API routes, the
//!   per-socket OSC pump, asset serving.
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
pub mod router;
pub mod scope;
pub mod scsynth;
pub mod server;
pub mod sessions;

use std::sync::Arc;

use tokio::net::TcpListener;

use bridge::Bridge;
use scsynth::Scsynth;
use server::Server;

/// Connect the OSC bridge, build the [`Server`] over a fresh scsynth
/// supervisor, and bind the listener — the composition root shared by the
/// serve and GUI run modes ([`crate::cli`]). `assets` (the per-mode input) is
/// handed to [`router::serve`] by the caller, not stored here.
pub async fn start(
    config: config::AppConfig,
    logger: Arc<logger::Logger>,
) -> std::io::Result<(Server, TcpListener)> {
    let bridge = Bridge::connect(
        &config.peers,
        std::time::Duration::from_secs(config.connect_timeout),
    )
    .await;
    // The supervisor owns the scsynth side — it (re)creates its per-client root
    // group on every registration itself.
    let scsynth = Scsynth::supervise(bridge.clone());
    // Gate the HTTP server on the first successful scsynth registration, so
    // clients never reach it before scsynth is up; later outages stay with
    // the supervisor's reconnect loop.
    tracing::info!("waiting for scsynth registration before starting the HTTP server");
    scsynth.await_registration().await;
    let server = Server::new(config, bridge, scsynth, logger);
    let (listener, _addr) = router::listen(&server).await?;
    Ok((server, listener))
}
