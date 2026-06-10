//! The application logic layer: session lifecycle on top of the OSC
//! [`core`](crate::core), consumed by the HTTP [`router`](crate::router).
//!
//! Layering is one-directional: `router → server → core`. [`Server`] owns the
//! per-session bookkeeping (the Uuid↔index map) and the scope SHM mapping, and
//! **delegates everything SuperCollider-side to [`Scsynth`]**: the node-id
//! partitioning scheme and the `/g_freeAll`/`/n_free` messaging live there
//! (the session *group* is created by the frontend). It holds no HTTP types
//! (the asset resolver lives in `router`), so it doubles cleanly as the axum
//! `State`.

use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;

use uuid::Uuid;

use crate::config::AppConfig;
use crate::core::bridge::Bridge;
use crate::core::scsynth::{session_block, Scsynth, SessionBlock};
use crate::core::sessions::SessionStore;
use crate::logger::Logger;
use crate::scope::ScopeShm;

/// How long to wait for scsynth registration (clientID) before failing a POST.
const CLIENT_ID_WAIT: Duration = Duration::from_secs(5);

/// The shared application core. Cheap to clone (Arc-backed), so it doubles as
/// the axum `State`.
#[derive(Clone)]
pub struct Server {
    inner: Arc<Inner>,
}

struct Inner {
    config: AppConfig,
    sessions: SessionStore,
    bridge: Bridge,
    scsynth: Scsynth,
    /// Held only to keep the log file-appender's flush guard alive (never read).
    _logger: Arc<Logger>,
    /// Lazily-opened mmap of scsynth's SHM scope buffers, shared across all WS
    /// connections. `None` once we've tried and failed (cached, not retried).
    scope_shm: tokio::sync::OnceCell<Option<Arc<ScopeShm>>>,
}

impl Server {
    /// Assemble over an already-built OSC [`Bridge`] + scsynth [`Scsynth`]
    /// supervisor (composed in `lib.rs`).
    pub fn new(config: AppConfig, bridge: Bridge, scsynth: Scsynth, logger: Arc<Logger>) -> Self {
        Self {
            inner: Arc::new(Inner {
                config,
                sessions: SessionStore::default(),
                bridge,
                scsynth,
                _logger: logger,
                scope_shm: tokio::sync::OnceCell::new(),
            }),
        }
    }

    // ── accessors (the router reads these; it never touches `inner`) ──

    pub(crate) fn port(&self) -> u16 {
        self.inner.config.port
    }

    pub(crate) fn bridge(&self) -> &Bridge {
        &self.inner.bridge
    }

    pub(crate) fn sessions(&self) -> &SessionStore {
        &self.inner.sessions
    }

    /// Shutdown: end every live session individually (free each one's group,
    /// one by one), then release the scsynth client slot (`/notify 0`).
    pub(crate) async fn unregister(&self) {
        for (id, block) in self.inner.sessions.drain_all() {
            self.inner.scsynth.free_group(block.group_id).await;
            tracing::info!(session = %id, group = block.group_id, "session ended (shutdown)");
        }
        self.inner.scsynth.unregister().await;
    }

    // ── sessions ──

    /// Mint a session: wait for scsynth registration and allocate an index +
    /// node-id block. The frontend creates the session group itself (`/g_new`
    /// at the tail of scsynth's root group) once its WebSocket is open.
    /// `None` if scsynth never registers within [`CLIENT_ID_WAIT`].
    pub(crate) async fn create_session(&self) -> Option<(Uuid, SessionBlock)> {
        let cid = self.inner.scsynth.await_client_id(CLIENT_ID_WAIT).await?;
        Some(self.inner.sessions.create(|index| session_block(cid, index)))
    }

    /// End a session: drop it from the store and free its scsynth group (and
    /// everything in it). Called when the session's WebSocket closes.
    pub(crate) async fn end_session(&self, id: &Uuid) {
        if let Some(block) = self.inner.sessions.remove(id) {
            self.inner.scsynth.free_group(block.group_id).await;
            tracing::info!(session = %id, group = block.group_id, "session ended (ws closed)");
        }
    }

    /// The `scsynth` peer's `host:port` from config — returned by the session
    /// endpoint so the frontend footer can display it.
    pub(crate) fn scsynth_address(&self) -> Option<String> {
        self.inner
            .config
            .peers
            .iter()
            .find(|p| p.name == "scsynth")
            .map(|p| p.target.clone())
    }

    // ── scope SHM ──

    /// The lazily-opened mmap of scsynth's SHM scope buffers, shared across WS
    /// connections. Opens (and locates the scope-buffer vector) on first call;
    /// caches `None` on failure so a missing/unreadable segment isn't retried.
    pub(crate) async fn scope_shm(&self) -> Option<Arc<ScopeShm>> {
        self.inner
            .scope_shm
            .get_or_init(|| async {
                let port = self.scsynth_port()?;
                match ScopeShm::open(port) {
                    Ok(shm) => Some(Arc::new(shm)),
                    Err(e) => {
                        tracing::warn!(error = %e, "scope SHM unavailable");
                        None
                    }
                }
            })
            .await
            .clone()
    }

    /// UDP port of the `scsynth` peer (its SHM segment is named after it).
    fn scsynth_port(&self) -> Option<u16> {
        self.scsynth_address()?
            .parse::<SocketAddr>()
            .ok()
            .map(|addr| addr.port())
    }
}
