//! The web layer: HTTP routing, the session API, frontend asset serving, and
//! the per-WebSocket pump.
//!
//! [`Server`] is the axum `State`. It delegates OSC to the generic
//! [`Bridge`](crate::core::bridge) it holds (a WebSocket's binary frames go to
//! [`Bridge::dispatch_command`](crate::core::bridge::Bridge::dispatch_command);
//! peer replies arrive on the bridge's fan-out, one `subscribe` per socket),
//! and unregisters via the [`Scsynth`](crate::core::scsynth) supervisor on
//! shutdown. All traffic is same-origin (or `tauri://` with CSP off) — no CORS.
//!
//! Routes are assembled in [`Server::router`] from per-feature sub-routers
//! ([`session`], [`ws`]) merged onto the bare `/api/config` route, so adding a
//! new feature is a new `mod` + a `.merge(its::routes())`.

pub mod assets;
mod session;
mod ws;

use std::net::SocketAddr;
use std::sync::Arc;

use axum::extract::{Request, State};
use axum::routing::get;
use axum::{Json, Router};
use tokio::net::TcpListener;

use crate::config::AppConfig;
use crate::core::bridge::Bridge;
use crate::core::scsynth::Scsynth;
use crate::logger::Logger;
use assets::AssetResolver;
use session::SessionStore;

/// The shared web-server core. Cheap to clone (Arc-backed), so it doubles as
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
    assets: Option<Arc<dyn AssetResolver>>,
    /// Held only to keep the log file-appender's flush guard alive (never read).
    _logger: Arc<Logger>,
}

impl Server {
    /// Assemble the web server over an already-built OSC [`Bridge`] + scsynth
    /// [`Scsynth`] supervisor (composed in `lib.rs`).
    pub fn new(
        config: AppConfig,
        bridge: Bridge,
        scsynth: Scsynth,
        assets: Option<Arc<dyn AssetResolver>>,
        logger: Arc<Logger>,
    ) -> Self {
        Self {
            inner: Arc::new(Inner {
                config,
                sessions: SessionStore::default(),
                bridge,
                scsynth,
                assets,
                _logger: logger,
            }),
        }
    }

    /// Bind a localhost listener and log its address. Separate from
    /// [`serve`](Self::serve) so GUI mode can bind synchronously then serve on
    /// a spawned task.
    pub async fn listen(&self) -> std::io::Result<(TcpListener, SocketAddr)> {
        let listener = TcpListener::bind(("127.0.0.1", self.inner.config.port)).await?;
        let addr = listener.local_addr()?;
        tracing::info!(%addr, "sc-app2 server listening");
        Ok((listener, addr))
    }

    /// Serve on a bound listener until a shutdown signal (SIGINT/SIGTERM), then
    /// unregister from scsynth (`/notify 0`) so we don't leak a client slot.
    pub async fn serve(self, listener: TcpListener) -> std::io::Result<()> {
        axum::serve(listener, self.router())
            .with_graceful_shutdown(shutdown_signal())
            .await?;
        tracing::info!("shutdown signal received; unregistering from scsynth");
        self.inner.scsynth.unregister().await;
        Ok(())
    }

    /// Release the scsynth client slot — used by the GUI exit hook (the serve
    /// path does this itself on its shutdown signal).
    pub(crate) async fn unregister_scsynth(&self) {
        self.inner.scsynth.unregister().await;
    }

    fn router(&self) -> Router {
        let mut app = Router::new()
            .route("/api/config", get(get_config))
            .merge(session::routes())
            .merge(ws::routes())
            .with_state(self.clone());
        // Serve the frontend when a resolver is installed (production);
        // stay API-only otherwise (dev — Vite serves the UI).
        if let Some(assets) = self.inner.assets.clone() {
            app = app.fallback(move |req: Request| assets::serve_static(req, assets.clone()));
        }
        app
    }
}

async fn get_config(State(server): State<Server>) -> Json<AppConfig> {
    Json(server.inner.config.clone())
}

/// Resolve when the process receives SIGINT (Ctrl-C) or, on unix, SIGTERM —
/// the signal that drives graceful shutdown + scsynth unregistration.
async fn shutdown_signal() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };
    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut sig) => {
                sig.recv().await;
            }
            Err(e) => {
                tracing::warn!(error = %e, "SIGTERM handler unavailable");
                std::future::pending::<()>().await;
            }
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {}
        _ = terminate => {}
    }
}
