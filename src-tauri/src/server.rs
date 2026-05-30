//! The HTTP server.
//!
//! A [`Server`] owns HTTP routing plus the backend it bridges to. It serves:
//! * `/api/config` — the frontend config,
//! * `/api/session` (POST) + `/api/session/{id}` (GET/DELETE) — mint/look-up/
//!   drop a [session](crate::session) id,
//! * `/ws?session=<uuid>` — a WebSocket the frontend uses to send OSC; binary
//!   frames are routed (by address regex) to the matching [`Peer`]'s UDP
//!   socket, and peer replies fan back to the WS,
//! * everything else — the frontend, when an [`AssetResolver`] is supplied
//!   (production); API-only otherwise (dev — Vite serves the UI).
//!
//! All traffic is same-origin (or `tauri://` with CSP off), so there's no CORS.

use std::net::SocketAddr;
use std::sync::Arc;

use axum::body::Bytes;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Path, Query, Request, State};
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;
use tokio::sync::{broadcast, mpsc};
use uuid::Uuid;

use crate::asset_resolver::AssetResolver;
use crate::config::AppConfig;
use crate::logger::Logger;
use crate::peer::{self, Peer};
use crate::session::SessionStore;

/// Shared, cheap-to-clone state handed to every route handler.
#[derive(Clone)]
struct AppState {
    config: AppConfig,
    sessions: SessionStore,
    peers: Arc<Vec<Arc<Peer>>>,
}

/// Owns HTTP routing and backend resources. Passed to both run modes.
pub struct Server {
    assets: Option<Arc<dyn AssetResolver>>,
    state: AppState,
    /// Owns the logging guard (keeping the file appender alive for the
    /// server's lifetime).
    #[allow(dead_code)]
    logger: Arc<Logger>,
}

impl Server {
    /// Connect the configured peers, then build the server. Async because
    /// peer connection binds UDP sockets and resolves targets. Holding the
    /// `Logger` keeps the file-appender guard alive for the server's life.
    pub async fn new(
        config: AppConfig,
        assets: Option<Arc<dyn AssetResolver>>,
        logger: Arc<Logger>,
    ) -> Self {
        let peers = peer::connect_all(&config.routes).await;
        let state = AppState {
            config,
            sessions: SessionStore::default(),
            peers: Arc::new(peers),
        };
        Self {
            assets,
            state,
            logger,
        }
    }

    /// Bind a localhost listener and log its address. Separate from
    /// [`serve`](Self::serve) so GUI mode can bind synchronously then
    /// serve on a spawned task.
    pub async fn listen(&self) -> std::io::Result<(TcpListener, SocketAddr)> {
        let listener = TcpListener::bind(("127.0.0.1", self.state.config.port)).await?;
        let addr = listener.local_addr()?;
        tracing::info!(%addr, "sc-app2 server listening");
        Ok((listener, addr))
    }

    /// Serve on a bound listener until the process exits.
    pub async fn serve(self, listener: TcpListener) -> std::io::Result<()> {
        axum::serve(listener, self.router()).await
    }

    fn router(&self) -> Router {
        let mut app = Router::new()
            .route("/api/config", get(get_config))
            .route("/api/session", post(post_session))
            .route("/api/session/{id}", get(get_session).delete(delete_session))
            .route("/ws", get(ws_handler))
            .with_state(self.state.clone());
        // Serve the frontend when a resolver is installed (production);
        // stay API-only otherwise (dev — Vite serves the UI).
        if let Some(assets) = self.assets.clone() {
            app = app.fallback(move |req: Request| serve_static(req, assets.clone()));
        }
        app
    }
}

async fn get_config(State(state): State<AppState>) -> Json<AppConfig> {
    Json(state.config.clone())
}

/// What `/api/session` returns. `routes`/`log_dir` stay server-side.
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SessionInfo {
    session_id: Uuid,
}

async fn post_session(State(state): State<AppState>) -> Response {
    let id = state.sessions.create();
    tracing::info!(session = %id, "session created");
    (StatusCode::CREATED, Json(SessionInfo { session_id: id })).into_response()
}

async fn get_session(State(state): State<AppState>, Path(id): Path<Uuid>) -> Response {
    if state.sessions.contains(&id) {
        Json(SessionInfo { session_id: id }).into_response()
    } else {
        (StatusCode::NOT_FOUND, format!("session {id} not found\n")).into_response()
    }
}

async fn delete_session(State(state): State<AppState>, Path(id): Path<Uuid>) -> Response {
    if state.sessions.remove(&id) {
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
    State(state): State<AppState>,
    Query(query): Query<WsQuery>,
) -> Response {
    let Some(id) = query.session else {
        return (
            StatusCode::BAD_REQUEST,
            "WS upgrade requires ?session=<uuid> — POST /api/session first\n",
        )
            .into_response();
    };
    if !state.sessions.contains(&id) {
        return (
            StatusCode::NOT_FOUND,
            format!("session {id} not found (expired or never created)\n"),
        )
            .into_response();
    }
    let peers = state.peers.clone();
    ws.on_upgrade(move |socket| bridge(socket, peers))
}

/// Bridge one WebSocket to the UDP peers for its lifetime.
///
/// One spawned forwarder per peer drains that peer's inbound `broadcast` into
/// a shared `mpsc`; the main `select!` loop then both reads client frames
/// (→ route to a peer's UDP socket) and writes merged replies back to the WS.
/// A single task owns the socket — no split / shared sink needed.
async fn bridge(mut socket: WebSocket, peers: Arc<Vec<Arc<Peer>>>) {
    let (reply_tx, mut reply_rx) = mpsc::channel::<Vec<u8>>(256);
    let mut forwarders = Vec::with_capacity(peers.len());
    for peer in peers.iter() {
        let mut sub = peer.inbound.subscribe();
        let tx = reply_tx.clone();
        forwarders.push(tokio::spawn(async move {
            loop {
                match sub.recv().await {
                    Ok(bytes) => {
                        if tx.send(bytes).await.is_err() {
                            break; // WS writer gone
                        }
                    }
                    // Dropped some replies under load — keep going.
                    Err(broadcast::error::RecvError::Lagged(_)) => continue,
                    Err(broadcast::error::RecvError::Closed) => break,
                }
            }
        }));
    }
    drop(reply_tx); // only the forwarders hold senders now

    loop {
        tokio::select! {
            msg = socket.recv() => match msg {
                Some(Ok(Message::Binary(bytes))) => route_outbound(bytes.as_ref(), &peers).await,
                Some(Ok(Message::Close(_))) | None => break,
                // Text / ping / pong: nothing to route.
                Some(Ok(_)) => {}
                Some(Err(e)) => {
                    tracing::warn!(error = %e, "ws recv error");
                    break;
                }
            },
            Some(reply) = reply_rx.recv() => {
                if socket.send(Message::Binary(reply.into())).await.is_err() {
                    break;
                }
            }
        }
    }

    for f in forwarders {
        f.abort();
    }
}

/// Route one client OSC packet to its peer's UDP socket (or drop + warn).
async fn route_outbound(bytes: &[u8], peers: &[Arc<Peer>]) {
    let Some(address) = peer::peek_osc_address(bytes) else {
        tracing::warn!("outbound packet has no OSC address; dropping");
        return;
    };
    match peer::route_for(peers, address) {
        Some(peer) => {
            if let Err(e) = peer.socket.send(bytes).await {
                tracing::warn!(peer = %peer.name, error = %e, "udp send failed");
            }
        }
        None => tracing::warn!(address, "no peer for OSC address; dropping"),
    }
}

/// Serve an asset, falling back to `index.html` for client-side routes.
/// Asset-shaped paths that miss get a loud 404 (so a stale build reference
/// doesn't masquerade as HTML).
async fn serve_static(req: Request, assets: Arc<dyn AssetResolver>) -> Response {
    let path = req.uri().path().trim_start_matches('/');
    let key = if path.is_empty() { "index.html" } else { path };

    if let Some(bytes) = assets.get(key) {
        return asset(key, bytes);
    }
    // Misses that should 404 rather than render the SPA shell: API routes
    // and real files (under assets/, or anything with an extension).
    let not_a_route = key.starts_with("api/")
        || key.starts_with("assets/")
        || key.rsplit('/').next().is_some_and(|s| s.contains('.'));
    if not_a_route {
        return (StatusCode::NOT_FOUND, format!("not found: /{key}\n")).into_response();
    }
    match assets.get("index.html") {
        Some(bytes) => asset("index.html", bytes),
        None => (StatusCode::NOT_FOUND, "index.html missing\n").into_response(),
    }
}

/// Wrap asset bytes in a response with a content type guessed from the key.
fn asset(key: &str, bytes: Bytes) -> Response {
    let mime = mime_guess::from_path(key).first_or_octet_stream();
    ([(header::CONTENT_TYPE, mime.as_ref())], bytes).into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::collections::HashMap;

    use axum::body::Body;

    /// A map-backed [`AssetResolver`] for testing the serving logic without
    /// a Tauri context or app.
    struct MapAssets(HashMap<String, Bytes>);

    impl AssetResolver for MapAssets {
        fn get(&self, path: &str) -> Option<Bytes> {
            self.0.get(path).cloned()
        }
    }

    fn assets() -> Arc<dyn AssetResolver> {
        Arc::new(MapAssets(HashMap::from([
            ("index.html".to_string(), Bytes::from_static(b"<html>root</html>")),
            ("assets/app.js".to_string(), Bytes::from_static(b"console.log(1)")),
        ])))
    }

    fn req(path: &str) -> Request {
        Request::builder().uri(path).body(Body::empty()).unwrap()
    }

    fn content_type(res: &Response) -> String {
        res.headers()
            .get(header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_string()
    }

    #[tokio::test]
    async fn root_serves_index_html() {
        let res = serve_static(req("/"), assets()).await;
        assert_eq!(res.status(), StatusCode::OK);
        assert!(content_type(&res).contains("text/html"));
    }

    #[tokio::test]
    async fn known_asset_served_with_its_mime() {
        let res = serve_static(req("/assets/app.js"), assets()).await;
        assert_eq!(res.status(), StatusCode::OK);
        assert!(content_type(&res).contains("javascript"));
    }

    #[tokio::test]
    async fn missing_asset_is_404_not_html() {
        let res = serve_static(req("/assets/missing.js"), assets()).await;
        assert_eq!(res.status(), StatusCode::NOT_FOUND);
        assert!(!content_type(&res).contains("text/html"));
    }

    #[tokio::test]
    async fn client_route_falls_back_to_index() {
        let res = serve_static(req("/some/client/route"), assets()).await;
        assert_eq!(res.status(), StatusCode::OK);
        assert!(content_type(&res).contains("text/html"));
    }

    #[tokio::test]
    async fn unknown_api_route_is_404_not_html() {
        let res = serve_static(req("/api/nope"), assets()).await;
        assert_eq!(res.status(), StatusCode::NOT_FOUND);
        assert!(!content_type(&res).contains("text/html"));
    }
}
