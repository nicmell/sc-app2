//! The application logic layer: session lifecycle on top of the OSC
//! [`core`](crate::core), consumed by the HTTP [`router`](crate::router).
//!
//! Layering is one-directional: `router → server → core`. [`Server`] owns the
//! per-session bookkeeping (the Uuid↔index map, the WS connection refcount, the
//! idle reaper) and the scope SHM mapping, and **delegates everything
//! SuperCollider-side to [`Scsynth`]**: the node-id partitioning scheme, the
//! root group, and the `/g_new`/`/g_freeAll`/`/n_free` messaging all live there.
//! It holds no HTTP types (the asset resolver lives in `router`), so it doubles
//! cleanly as the axum `State`.

use std::net::SocketAddr;
use std::sync::Arc;
use std::time::Duration;

use uuid::Uuid;

use crate::config::AppConfig;
use crate::core::bridge::Bridge;
use crate::core::scsynth::{root_group_id, session_block, Scsynth, SessionBlock};
use crate::core::sessions::SessionStore;
use crate::logger::Logger;
use crate::scope::ScopeShm;

/// How long to wait for scsynth registration (clientID) before failing a POST.
const CLIENT_ID_WAIT: Duration = Duration::from_secs(5);
/// Cap on the reaper's sweep interval (it also tracks `session_ttl_seconds`/4).
const MAX_SWEEP: Duration = Duration::from_secs(15);

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

    pub(crate) fn config(&self) -> &AppConfig {
        &self.inner.config
    }

    pub(crate) fn port(&self) -> u16 {
        self.inner.config.port
    }

    pub(crate) fn bridge(&self) -> &Bridge {
        &self.inner.bridge
    }

    pub(crate) fn sessions(&self) -> &SessionStore {
        &self.inner.sessions
    }

    /// Free the root group + release the scsynth client slot — for shutdown.
    pub(crate) async fn unregister(&self) {
        self.inner.scsynth.unregister().await;
    }

    // ── sessions ──

    /// Mint a session: wait for scsynth registration, allocate an index +
    /// node-id block, and `/g_new` the session group under the root group.
    /// `None` if scsynth never registers within [`CLIENT_ID_WAIT`].
    pub(crate) async fn create_session(&self) -> Option<(Uuid, SessionBlock)> {
        let cid = self.inner.scsynth.await_client_id(CLIENT_ID_WAIT).await?;
        let (id, block) = self.inner.sessions.create(|index| session_block(cid, index));
        self.inner.scsynth.new_group(block.group_id, root_group_id(cid)).await;
        Some((id, block))
    }

    /// Free a session's scsynth group and everything in it. Used by DELETE and
    /// the idle reaper.
    pub(crate) async fn free_session_group(&self, group_id: i32) {
        self.inner.scsynth.free_group(group_id).await;
    }

    /// Spawn the background reaper: evict sessions whose WebSocket has been gone
    /// past `session_ttl_seconds`, freeing each one's group.
    pub(crate) fn spawn_session_reaper(&self) {
        let server = self.clone();
        let grace = Duration::from_secs(self.inner.config.session_ttl_seconds);
        let sweep = std::cmp::min(grace / 4, MAX_SWEEP).max(Duration::from_secs(1));
        tokio::spawn(async move {
            let mut ticker = tokio::time::interval(sweep);
            loop {
                ticker.tick().await;
                for (id, block) in server.inner.sessions.evict_idle(grace) {
                    tracing::info!(session = %id, group = block.group_id, "session evicted (idle past TTL)");
                    server.free_session_group(block.group_id).await;
                }
            }
        });
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
        self.inner
            .config
            .peers
            .iter()
            .find(|p| p.name == "scsynth")
            .and_then(|p| p.target.parse::<SocketAddr>().ok())
            .map(|addr| addr.port())
    }
}
