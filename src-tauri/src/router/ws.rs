//! The per-WebSocket OSC pump — pure transport.
//!
//! `/ws?session=<uuid>` validates the session, then upgrades to a bridge
//! between one browser/webview and the OSC [`Bridge`](crate::core::bridge):
//! uplink binary frames are dispatched to the matching peer; peer replies (from
//! the bridge's fan-out) are written back. `/scope/*` frames are claimed by the
//! scope subscription instead of routed; all SHM/scope logic lives in
//! [`crate::scope`] — this loop only ferries bytes.
//!
//! [`routes`] is the `/ws` sub-router, merged into the app in
//! [`router`](super::router).

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

use crate::core::osc::{decode_message, peek_address};
use crate::scope::{self, ScopeSubscription};
use crate::server::Server;

/// How often the WS task polls SHM for a new scope slot. A `_stage`-only peek
/// each tick; the data copy happens only when a new frame is ready
/// (~chunkSize/sampleRate ≈ 47 Hz at 1024/48k), so over-polling is cheap.
const SCOPE_POLL: Duration = Duration::from_millis(5);

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
    // A session is owned by exactly one socket: a second tab shares the same
    // localStorage id, and letting it attach would free the group under the
    // first tab when either socket closes.
    //
    // TODO(multi-tab): rejecting is the stopgap. Two real solutions, checked
    // for feasibility:
    //
    // 1. Per-tab sessions (preferred — works with the backend as-is): every
    //    tab always POSTs a fresh session (own id, own WS, own group +
    //    node-id block + scope index — the server already supports any
    //    number of live sessions with disjoint blocks). What's missing is
    //    only decoupling the *saved layout* from the live-session id: fetch
    //    the layout under the stored id without reviving it (or copy it onto
    //    the fresh session at mint), and accept last-writer-wins on the
    //    saved layout + the stored id.
    // 2. A frontend SharedWorker owning the one WebSocket across tabs.
    //    Verified insufficient as a socket-only change: the per-connection
    //    state (node-id allocator, /g_new group ownership, the scope
    //    SUB_ID/scopeIndex, the layout autosave) lives per-tab in
    //    OscClient/SessionManager, so two tabs over one shared socket would
    //    collide on node ids and the scope subscription and fight over the
    //    layout PUT. It only works if the allocator + OSC client core move
    //    into the SharedWorker (tabs become thin views) — a much larger
    //    refactor, also gated on SharedWorker availability in the embedders
    //    (back in WKWebView only since Safari 16). Option 1 is the
    //    pragmatic path; 2 pays off only if truly shared live state across
    //    tabs is ever wanted.
    match server.sessions().attach(&id) {
        Err(()) => {
            return (
                StatusCode::NOT_FOUND,
                format!("session {id} not found (expired or never created)\n"),
            )
                .into_response();
        }
        Ok(false) => {
            return (
                StatusCode::CONFLICT,
                format!("session {id} already has an active connection (another tab?)\n"),
            )
                .into_response();
        }
        Ok(true) => {}
    }
    ws.on_upgrade(move |socket| async move {
        run_ws(&server, socket).await;
        // A session lives exactly as long as its WebSocket: end it (and free
        // its scsynth group) the moment the socket goes away.
        server.end_session(&id).await;
    })
}

/// Bridge one WebSocket for its lifetime: uplink binary frames go to the
/// [`Bridge`](crate::core::bridge) (or the scope subscription); peer replies
/// (from its fan-out) and scope chunks are written back.
async fn run_ws(server: &Server, mut socket: WebSocket) {
    let mut replies = server.bridge().subscribe();
    // The master-out scope subscription for this socket, if the frontend asked
    // for one. `/scope/*` is bridge-internal — claimed below, never routed.
    let mut scope: Option<ScopeSubscription> = None;
    let mut poll = tokio::time::interval(SCOPE_POLL);
    // The poll arm is gated on an active subscription; skip the tick burst
    // the interval would otherwise replay when the scope re-enables it.
    poll.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
    loop {
        tokio::select! {
            _ = poll.tick(), if scope.is_some() => {
                if let Some(chunk) = scope.as_mut().and_then(ScopeSubscription::poll) {
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
                        _ => server.bridge().dispatch_command(bytes.as_ref()).await,
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
async fn subscribe_scope(server: &Server, bytes: &[u8]) -> Option<ScopeSubscription> {
    let msg = decode_message(bytes)?;
    let (sub_id, scope_idx) = scope::parse_subscribe(&msg)?;
    let shm = server.scope_shm().await;
    tracing::debug!(sub_id, scope_idx, have_shm = shm.is_some(), "scope subscribe");
    Some(ScopeSubscription::new(sub_id, scope_idx, shm))
}
