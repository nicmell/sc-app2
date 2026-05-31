//! The HTTP server + OSC bridge.
//!
//! [`Server`] is the shared, cheap-to-clone core (everything lives behind an
//! `Arc`), so it doubles as the axum `State`. It owns HTTP routing plus the
//! connected UDP [`Peer`]s and bridges OSC in two directions:
//!
//! * [`Server::dispatch_command`] — an outbound packet from a WebSocket client
//!   is routed to the peer whose address `pattern` matches (`/dirt/play` →
//!   strudel, `/notify` → scsynth).
//! * [`Server::dispatch_reply`] — an inbound packet from any peer is handled
//!   and fanned out to every connected client.
//!
//! Receiving is decoupled from the scsynth registration: one pump task per peer
//! drains its inbound into `dispatch_reply` (→ a single `clients` broadcast that
//! every WS subscribes to), while `/notify` is just an outbound
//! `dispatch_command` whose `/done` reply arrives back through `dispatch_reply`
//! like any other message.
//!
//! All traffic is same-origin (or `tauri://` with CSP off), so there's no CORS.

use std::net::SocketAddr;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;

use axum::body::Bytes;
use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Path, Query, Request, State};
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::{Deserialize, Serialize};
use tokio::net::TcpListener;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::asset_resolver::AssetResolver;
use crate::config::AppConfig;
use crate::logger::Logger;
use crate::osc;
use crate::peer::{self, Peer};
use crate::session::SessionStore;

/// Capacity of the client-reply broadcast (peer datagrams fanned to all WS).
const CLIENTS_CAPACITY: usize = 256;

/// The shared server core: HTTP routing + the OSC bridge. Cheap to clone
/// (Arc-backed), so it doubles as the axum `State`.
#[derive(Clone)]
pub struct Server {
    inner: Arc<Inner>,
}

struct Inner {
    config: AppConfig,
    sessions: SessionStore,
    peers: Vec<Arc<Peer>>,
    /// Peer replies, fanned out to every connected WebSocket client.
    clients: broadcast::Sender<Bytes>,
    /// Flipped by `dispatch_reply` on the scsynth `/done /notify`; watched by
    /// `register_scsynth` to warn if scsynth never confirms.
    scsynth_registered: AtomicBool,
    assets: Option<Arc<dyn AssetResolver>>,
    /// Keeps the file-appender guard alive for the server's lifetime.
    #[allow(dead_code)]
    logger: Arc<Logger>,
}

impl Server {
    /// Connect the configured peers, start the per-peer receive pumps, and
    /// register with scsynth. Async because peer connection binds UDP sockets.
    pub async fn new(
        config: AppConfig,
        assets: Option<Arc<dyn AssetResolver>>,
        logger: Arc<Logger>,
    ) -> Self {
        let peers = peer::connect_all(&config.routes).await;
        let (clients, _rx) = broadcast::channel(CLIENTS_CAPACITY);
        let server = Self {
            inner: Arc::new(Inner {
                config,
                sessions: SessionStore::default(),
                peers,
                clients,
                scsynth_registered: AtomicBool::new(false),
                assets,
                logger,
            }),
        };
        server.spawn_reply_pumps(); // receive: peers → dispatch_reply → clients
        server.register_scsynth().await; // send: /notify (reply handled by dispatch_reply)
        server
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
            .with_state(self.clone());
        // Serve the frontend when a resolver is installed (production);
        // stay API-only otherwise (dev — Vite serves the UI).
        if let Some(assets) = self.inner.assets.clone() {
            app = app.fallback(move |req: Request| serve_static(req, assets.clone()));
        }
        app
    }

    // ── OSC bridge ──────────────────────────────────────────────────────

    /// Route an outbound OSC packet to the peer whose `pattern` matches its
    /// address, and send it. Returns the chosen peer, or `None` if the packet
    /// has no address or no peer matches (in which case it's dropped + warned).
    async fn dispatch_command(&self, bytes: &[u8]) -> Option<Arc<Peer>> {
        let Some(address) = peer::peek_osc_address(bytes) else {
            tracing::warn!("outbound packet has no OSC address; dropping");
            return None;
        };
        let Some(peer) = peer::route_for(&self.inner.peers, address) else {
            tracing::warn!(address, "no peer for OSC address; dropping");
            return None;
        };
        if let Err(e) = peer.socket.send(bytes).await {
            tracing::warn!(peer = %peer.name, error = %e, "udp send failed");
        }
        Some(peer.clone())
    }

    /// Handle one inbound OSC packet from `peer`: decide what to do with it,
    /// then fan it out to every connected client. (Currently: log the scsynth
    /// registration when it arrives, and forward everything verbatim.)
    fn dispatch_reply(&self, peer: &Peer, bytes: Bytes) {
        if let Some(cid) = osc::parse_done_notify(&bytes) {
            self.inner.scsynth_registered.store(true, Ordering::Relaxed);
            tracing::info!(peer = %peer.name, client_id = cid, "scsynth /notify confirmed");
        }
        // No connected clients is fine; ignore the send error.
        let _ = self.inner.clients.send(bytes);
    }

    /// Receive side: one task per peer drains its inbound datagrams into
    /// [`dispatch_reply`]. Subscriptions are registered synchronously (before
    /// any `/notify` is sent) so an early reply can't be missed.
    fn spawn_reply_pumps(&self) {
        for peer in &self.inner.peers {
            let mut inbound = peer.inbound.subscribe();
            let server = self.clone();
            let peer = peer.clone();
            tokio::spawn(async move {
                loop {
                    match inbound.recv().await {
                        Ok(bytes) => server.dispatch_reply(&peer, Bytes::from(bytes)),
                        // Dropped some replies under load — keep going.
                        Err(broadcast::error::RecvError::Lagged(_)) => continue,
                        Err(broadcast::error::RecvError::Closed) => break,
                    }
                }
            });
        }
    }

    /// Register the bridge with scsynth: dispatch `/notify 1` (routed by regex
    /// to the scsynth peer — the only one whose pattern matches). Fire-and-
    /// forget; the `/done /notify` reply comes back through [`dispatch_reply`]
    /// like any other inbound message.
    async fn register_scsynth(&self) {
        if self.dispatch_command(&osc::notify_packet()).await.is_none() {
            tracing::warn!("no peer matched /notify; skipping scsynth registration");
            return;
        }
        // Watchdog, decoupled from the receive path: warn if scsynth hasn't
        // confirmed within 2 s. `dispatch_reply` flips the flag when `/done`
        // arrives. Spawned, so it never blocks boot.
        let server = self.clone();
        tokio::spawn(async move {
            tokio::time::sleep(Duration::from_secs(2)).await;
            if !server.inner.scsynth_registered.load(Ordering::Relaxed) {
                tracing::warn!("no /done /notify within 2s (is scsynth running?)");
            }
        });
    }

    /// Bridge one WebSocket for its lifetime: uplink binary frames go to
    /// [`dispatch_command`]; peer replies (from the shared `clients` broadcast)
    /// are written back. A single task owns the socket — no split needed.
    async fn bridge(&self, mut socket: WebSocket) {
        let mut replies = self.inner.clients.subscribe();
        loop {
            tokio::select! {
                msg = socket.recv() => match msg {
                    Some(Ok(Message::Binary(bytes))) => {
                        self.dispatch_command(bytes.as_ref()).await;
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
    ws.on_upgrade(move |socket| async move { server.bridge(socket).await })
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
