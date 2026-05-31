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
use std::sync::{Arc, Mutex};
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
/// scsynth `/status` heartbeat poll interval.
const STATUS_INTERVAL: Duration = Duration::from_secs(2);
/// Consecutive missed `/status.reply`s before scsynth is considered down.
const MAX_STATUS_MISSES: u32 = 3;
/// Delay between reconnection attempts while scsynth is unreachable.
const RETRY_INTERVAL: Duration = Duration::from_secs(2);
/// How long to wait for a `/done /notify` or `/version.reply`.
const REPLY_TIMEOUT: Duration = Duration::from_secs(2);

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
    /// scsynth registration state, filled by `dispatch_reply` from the
    /// `/done /notify` + `/version.reply` responses. Also the signal
    /// `register_scsynth` waits on (a populated `client_id` = ack received).
    scsynth: Mutex<ScsynthState>,
    assets: Option<Arc<dyn AssetResolver>>,
    /// Keeps the file-appender guard alive for the server's lifetime.
    #[allow(dead_code)]
    logger: Arc<Logger>,
}

/// What scsynth tells us, filled by `dispatch_reply`. The bridge is "running"
/// once both the client id (`/done /notify`) and the version (`/version.reply`)
/// are in; `alive` then tracks the `/status` heartbeat.
#[derive(Default)]
struct ScsynthState {
    client_id: Option<i32>,
    version: Option<osc::ScsynthVersion>,
    /// Set true (and logged once) when both fields are first present.
    running: bool,
    /// Whether scsynth is currently responding to the `/status` heartbeat.
    alive: bool,
    /// Monotonic count of `/status.reply`s seen — the poller's liveness signal.
    status_replies: u64,
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
                scsynth: Mutex::new(ScsynthState::default()),
                assets,
                logger,
            }),
        };
        server.spawn_reply_pumps(); // receive: peers → dispatch_reply → clients
        // Supervise the scsynth connection (register → poll /status → reconnect)
        // in the background, so it never blocks boot.
        let bg = server.clone();
        tokio::spawn(async move { bg.supervise_scsynth().await });
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

    /// Serve on a bound listener until a shutdown signal (SIGINT/SIGTERM), then
    /// unregister from scsynth (`/notify 0`) so we don't leak a client slot.
    pub async fn serve(self, listener: TcpListener) -> std::io::Result<()> {
        let router = self.router();
        axum::serve(listener, router)
            .with_graceful_shutdown(shutdown_signal())
            .await?;
        tracing::info!("shutdown signal received; unregistering from scsynth");
        self.unregister_scsynth().await;
        Ok(())
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

    /// Handle one inbound OSC packet from `peer`: tap the bridge-relevant
    /// replies for state, then fan every packet out to all clients verbatim.
    fn dispatch_reply(&self, _peer: &Peer, bytes: Bytes) {
        if let Some(cid) = osc::parse_done_notify(&bytes) {
            self.record_scsynth(|s| s.client_id = Some(cid));
        } else if let Some(version) = osc::parse_version_reply(&bytes) {
            self.record_scsynth(|s| s.version = Some(version));
        } else if osc::is_status_reply(&bytes) {
            // Heartbeat: bump the counter the poller watches for liveness.
            self.inner.scsynth.lock().unwrap().status_replies += 1;
        }
        // No connected clients is fine; ignore the send error.
        let _ = self.inner.clients.send(bytes);
    }

    /// Apply an update to the scsynth state; once both the client id and the
    /// version are present, flag the bridge running and log it once.
    fn record_scsynth(&self, update: impl FnOnce(&mut ScsynthState)) {
        let mut s = self.inner.scsynth.lock().unwrap();
        update(&mut s);
        if !s.running && s.client_id.is_some() && s.version.is_some() {
            s.running = true;
            let client_id = s.client_id.unwrap();
            let version = s.version.as_ref().unwrap();
            tracing::info!(client_id, %version, "scsynth running");
        }
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

    /// Supervise the scsynth connection: (re)register, then poll `/status`
    /// until it stops answering, then reconnect. Reuses [`register_scsynth`]
    /// for both first connect and reconnect; owns the transition logging so
    /// retries don't spam. Bails if no peer handles `/notify`.
    async fn supervise_scsynth(&self) {
        if peer::route_for(&self.inner.peers, "/notify").is_none() {
            tracing::warn!("no peer matches /notify; scsynth supervision disabled");
            return;
        }
        // `down` = the current outage has already been logged (avoids spam).
        let mut down = false;
        loop {
            self.reset_scsynth();
            if self.register_scsynth().await {
                // Connected — `dispatch_reply` logged "scsynth running …".
                down = false;
                self.set_alive(true);
                self.poll_status_until_dead().await; // blocks until scsynth dies
                self.set_alive(false);
            }
            // Not connected (registration failed, or the heartbeat just died).
            if !down {
                tracing::warn!(
                    "scsynth not responding; retrying every {}s",
                    RETRY_INTERVAL.as_secs()
                );
                down = true;
            }
            tokio::time::sleep(RETRY_INTERVAL).await;
        }
    }

    /// One registration attempt, in order: `/notify 1` → wait for the
    /// `/done /notify` ack (so the version round-trip runs against a registered
    /// client) → `/version` → wait until [`dispatch_reply`] flags running.
    /// Returns whether registration completed. Quiet — the supervisor logs.
    async fn register_scsynth(&self) -> bool {
        self.dispatch_command(&osc::notify_packet(true)).await;
        // (clientID 0 is valid, so the ack test is "populated", not "> 0".)
        if !self.await_state(REPLY_TIMEOUT, |s| s.client_id.is_some()).await {
            return false;
        }
        self.dispatch_command(&osc::version_packet()).await;
        self.await_state(REPLY_TIMEOUT, |s| s.running).await
    }

    /// Poll `/status` until scsynth misses [`MAX_STATUS_MISSES`] consecutive
    /// replies (it died); returns so the supervisor can reconnect.
    async fn poll_status_until_dead(&self) {
        let mut misses = 0u32;
        loop {
            let before = self.inner.scsynth.lock().unwrap().status_replies;
            self.dispatch_command(&osc::status_packet()).await;
            tokio::time::sleep(STATUS_INTERVAL).await;
            if self.inner.scsynth.lock().unwrap().status_replies > before {
                misses = 0;
            } else {
                misses += 1;
                if misses >= MAX_STATUS_MISSES {
                    return;
                }
            }
        }
    }

    /// Tell scsynth to drop our client registration (`/notify 0`) on shutdown.
    /// Called by `serve`'s graceful-shutdown path and the GUI exit hook.
    pub(crate) async fn unregister_scsynth(&self) {
        if peer::route_for(&self.inner.peers, "/notify").is_some() {
            self.dispatch_command(&osc::notify_packet(false)).await;
            tracing::info!("sent /notify 0 (unregistered from scsynth)");
        }
    }

    /// Poll the scsynth state until `pred` holds or `timeout` elapses.
    async fn await_state(&self, timeout: Duration, pred: impl Fn(&ScsynthState) -> bool) -> bool {
        tokio::time::timeout(timeout, async {
            while !pred(&self.inner.scsynth.lock().unwrap()) {
                tokio::time::sleep(Duration::from_millis(25)).await;
            }
        })
        .await
        .is_ok()
    }

    /// Clear the registration fields for a fresh (re)connect attempt. Keeps the
    /// monotonic `status_replies` counter and the `alive` flag (supervisor-owned).
    fn reset_scsynth(&self) {
        let mut s = self.inner.scsynth.lock().unwrap();
        s.client_id = None;
        s.version = None;
        s.running = false;
    }

    fn set_alive(&self, alive: bool) {
        self.inner.scsynth.lock().unwrap().alive = alive;
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
