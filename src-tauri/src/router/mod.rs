//! The web layer: HTTP routing, the session API, frontend asset serving, and
//! the per-WebSocket pump.
//!
//! [`Server`] is the axum `State`. It delegates OSC to the generic
//! [`Bridge`](crate::core::bridge) it holds (a WebSocket's binary frames go to
//! [`Bridge::dispatch_command`](crate::core::bridge::Bridge::dispatch_command);
//! peer replies arrive on the bridge's fan-out, one `subscribe` per socket),
//! and unregisters via the [`Scsynth`](crate::core::scsynth) supervisor on
//! shutdown. All traffic is same-origin (or `tauri://` with CSP off) — no CORS.

pub mod assets;
mod session;

use std::net::SocketAddr;
use std::sync::Arc;

use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Path, Query, Request, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use uuid::Uuid;

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
            .route("/api/session", post(post_session))
            .route("/api/session/{id}", get(get_session).delete(delete_session))
            .route("/ws", get(ws_handler))
            .with_state(self.clone());
        // Serve the frontend when a resolver is installed (production);
        // stay API-only otherwise (dev — Vite serves the UI).
        if let Some(assets) = self.inner.assets.clone() {
            app = app.fallback(move |req: Request| assets::serve_static(req, assets.clone()));
        }
        app
    }

    /// Bridge one WebSocket for its lifetime: uplink binary frames go to the
    /// [`Bridge`]; peer replies (from its fan-out) are written back. A single
    /// task owns the socket — no split needed.
    async fn run_ws(&self, mut socket: WebSocket) {
        let mut replies = self.inner.bridge.subscribe();
        loop {
            tokio::select! {
                msg = socket.recv() => match msg {
                    Some(Ok(Message::Binary(bytes))) => {
                        self.inner.bridge.dispatch_command(bytes.as_ref()).await;
                    }
                    Some(Ok(Message::Close(_))) | None => break,
                    // Text / ping / pong: nothing to route.
                    Some(Ok(_)) => {}
                    Some(Err(e)) => {
                        tracing::warn!(error = %e, "ws recv error");
                        break;
                    }
                },
                reply = replies.recv() => match reply {
                    Ok(bytes) => {
                        if socket.send(Message::Binary(bytes)).await.is_err() {
                            break;
                        }
                    }
                    Err(broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(broadcast::error::RecvError::Closed) => break,
                },
            }
        }
    }
}

async fn get_config(State(server): State<Server>) -> Json<AppConfig> {
    Json(server.inner.config.clone())
}

/// What `/api/session` returns. `routes`/`log_dir` stay server-side.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SessionInfo {
    session_id: Uuid,
}

async fn post_session(State(server): State<Server>) -> Response {
    let id = server.inner.sessions.create();
    tracing::info!(session = %id, "session created");
    (StatusCode::CREATED, Json(SessionInfo { session_id: id })).into_response()
}

async fn get_session(State(server): State<Server>, Path(id): Path<Uuid>) -> Response {
    if server.inner.sessions.contains(&id) {
        Json(SessionInfo { session_id: id }).into_response()
    } else {
        (StatusCode::NOT_FOUND, format!("session {id} not found\n")).into_response()
    }
}

async fn delete_session(State(server): State<Server>, Path(id): Path<Uuid>) -> Response {
    if server.inner.sessions.remove(&id) {
        StatusCode::NO_CONTENT.into_response()
    } else {
        (StatusCode::NOT_FOUND, format!("session {id} not found\n")).into_response()
    }
}

#[derive(Deserialize)]
struct WsQuery {
    session: Option<Uuid>,
}

/// Upgrade `/ws?session=<uuid>` to the OSC bridge after validating the session.
async fn ws_handler(
    ws: WebSocketUpgrade,
    State(server): State<Server>,
    Query(query): Query<WsQuery>,
) -> Response {
    let Some(id) = query.session else {
        return (
            StatusCode::BAD_REQUEST,
            "WS upgrade requires ?session=<uuid> — POST /api/session first\n",
        )
            .into_response();
    };
    if !server.inner.sessions.contains(&id) {
        return (
            StatusCode::NOT_FOUND,
            format!("session {id} not found (expired or never created)\n"),
        )
            .into_response();
    }
    ws.on_upgrade(move |socket| async move { server.run_ws(socket).await })
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
