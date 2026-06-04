//! The per-WebSocket OSC pump.
//!
//! `/ws?session=<uuid>` validates the session, then upgrades to a bridge
//! between one browser/webview and the OSC [`Bridge`](crate::core::bridge):
//! uplink binary frames are dispatched to the matching peer; peer replies
//! (from the bridge's fan-out) are written back. A single task owns the socket
//! for its lifetime — no split needed.
//!
//! [`routes`] is the `/ws` sub-router, merged into the app in
//! [`Server::router`](super::Server).

use std::sync::Arc;
use std::time::Duration;

use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::Router;
use serde::Deserialize;
use tokio::sync::broadcast;
use uuid::Uuid;

use super::Server;
use crate::core::osc::{decode_message, peek_address};
use crate::scope::{self, shm, ScopeShm};

/// How often the WS task polls SHM for a new scope slot. A `_stage`-only peek
/// each tick; the ~8 KB data copy happens only when a new frame is ready
/// (~chunkSize/sampleRate ≈ 47 Hz at 1024/48k), so over-polling is cheap.
const SCOPE_POLL: Duration = Duration::from_millis(5);

/// Per-WS scope subscription: the fixed master-out tap the frontend registered.
struct WsScope {
    sub_id: i32,
    scope_idx: usize,
    /// `_stage` of the last slot we emitted; `-1` until the first frame.
    last_stage: i32,
    /// Monotonic chunk counter, echoed to the worker for ordering/diagnostics.
    tick: u32,
    /// The shared SHM mmap (cached at subscribe; `None` if unavailable).
    shm: Option<Arc<ScopeShm>>,
}

/// The `/ws` route.
pub fn routes() -> Router<Server> {
    Router::new().route("/ws", get(ws_handler))
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
    ws.on_upgrade(move |socket| async move {
        // Refcount the live connection so the reaper never evicts an attached
        // session; detach on close starts the grace window.
        server.inner.sessions.attach(&id);
        run_ws(&server, socket).await;
        server.inner.sessions.detach(&id);
    })
}

/// Bridge one WebSocket for its lifetime: uplink binary frames go to the
/// [`Bridge`](crate::core::bridge); peer replies (from its fan-out) are written
/// back.
async fn run_ws(server: &Server, mut socket: WebSocket) {
    let mut replies = server.inner.bridge.subscribe();
    // The master-out scope subscription for this socket, if the frontend asked
    // for one. `/scope/*` is bridge-internal — intercepted below, never routed.
    let mut scope: Option<WsScope> = None;
    let mut poll = tokio::time::interval(SCOPE_POLL);
    loop {
        tokio::select! {
            _ = poll.tick() => {
                if let Some(chunk) = poll_scope_chunk(scope.as_mut()) {
                    if socket.send(Message::Binary(chunk.into())).await.is_err() {
                        break;
                    }
                }
            }
            msg = socket.recv() => match msg {
                Some(Ok(Message::Binary(bytes))) => {
                    match peek_address(bytes.as_ref()) {
                        Some(scope::SCOPE_SUBSCRIBE) => {
                            scope = subscribe_scope(server, bytes.as_ref()).await;
                        }
                        Some(scope::SCOPE_UNSUBSCRIBE) => {
                            scope = None;
                        }
                        _ => server.inner.bridge.dispatch_command(bytes.as_ref()).await,
                    }
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

/// Parse a `/scope/subscribe` and open (or reuse) the shared SHM mapping.
async fn subscribe_scope(server: &Server, bytes: &[u8]) -> Option<WsScope> {
    let msg = decode_message(bytes)?;
    let (sub_id, scope_idx) = scope::parse_subscribe(&msg)?;
    let shm = server.scope_shm().await;
    tracing::debug!(sub_id, scope_idx, have_shm = shm.is_some(), "scope subscribe");
    Some(WsScope {
        sub_id,
        scope_idx,
        last_stage: -1,
        tick: 0,
        shm,
    })
}

/// If a new SHM slot is ready for this subscription, encode the `/scope/chunk`
/// frame to send. Returns `None` when there's no subscription, no SHM, or no
/// fresh slot since the last poll (the common case — a cheap `_stage` peek).
fn poll_scope_chunk(scope: Option<&mut WsScope>) -> Option<Vec<u8>> {
    let sub = scope?;
    let shm = sub.shm.as_ref()?;
    let stage = shm::read_scope_stage(&shm.region, &shm.layout, sub.scope_idx)?;
    if stage == sub.last_stage {
        return None;
    }
    match shm::read_scope_slot(&shm.region, &shm.layout, sub.scope_idx) {
        Ok(shm::ScopeReadResult::Data { floats, channels, stage, .. }) => {
            sub.last_stage = stage as i32;
            sub.tick = sub.tick.wrapping_add(1);
            Some(scope::encode_scope_chunk(
                sub.sub_id as u32,
                sub.tick,
                false,
                channels as u32,
                &floats,
            ))
        }
        // NotInitialized / NoData: leave `last_stage` so we retry next poll.
        Ok(_) => None,
        Err(e) => {
            tracing::debug!(error = %e, "scope slot read failed");
            None
        }
    }
}
