//! The per-WebSocket OSC pump — pure transport.
//!
//! `/ws?session=<uuid>` validates the session, then upgrades to a bridge
//! between one browser/webview and the OSC [`Bridge`](crate::core::bridge):
//! uplink binary frames are dispatched to the matching peer; peer replies (from
//! the bridge's fan-out) are written back. `/scope/*` frames are claimed for
//! the session's [`SessionScopes`] instead of routed — all scope semantics
//! (subscriptions, span gating, chunk staging) live in [`crate::scope`]; this
//! loop only routes frames and ferries bytes.
//!
//! [`routes`] is the `/ws` sub-router, merged into the app in
//! [`router`](super::router).

use axum::extract::ws::{Message, WebSocket, WebSocketUpgrade};
use axum::extract::{Query, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::get;
use axum::Router;
use serde::Deserialize;
use tokio::sync::broadcast;
use uuid::Uuid;

use crate::core::osc::peek_address;
use crate::core::scsynth::SessionBlock;
use crate::scope::{self, SessionScopes};
use crate::server::Server;

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
    //    state (node-id allocator, /g_new group ownership, the scope-slot
    //    span allocator, the layout autosave) lives per-tab in
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
    // The block is fixed for the session's life (it ends with this socket):
    // fetch it once — subscribe validation gates scope slots on its span.
    let Some(block) = server.sessions().block(&id) else {
        return (StatusCode::NOT_FOUND, format!("session {id} not found\n")).into_response();
    };
    ws.on_upgrade(move |socket| async move {
        run_ws(&server, block, socket).await;
        // A session lives exactly as long as its WebSocket: end it (and free
        // its scsynth group) the moment the socket goes away.
        server.end_session(&id).await;
    })
}

/// Bridge one WebSocket for its lifetime: uplink binary frames go to the
/// [`Bridge`](crate::core::bridge) (or the session's [`SessionScopes`]); peer
/// replies (from its fan-out) and staged scope chunks are written back.
async fn run_ws(server: &Server, block: SessionBlock, mut socket: WebSocket) {
    let mut replies = server.bridge().subscribe();
    // This session's whole scope state — subscriptions, span gating, chunk
    // staging — owned here, semantics in crate::scope.
    let mut scopes = SessionScopes::new(block);
    let mut poll = tokio::time::interval(scope::SCOPE_POLL);
    // The poll arm is gated on active subscriptions; skip the tick burst
    // the interval would otherwise replay when a scope re-enables it.
    poll.set_missed_tick_behavior(tokio::time::MissedTickBehavior::Skip);
    loop {
        tokio::select! {
            // Priority order: uplink commands, then control replies, then the
            // chunk poll/drain — re-evaluated between every awaited send, so
            // disposable stream data never delays control traffic.
            biased;
            msg = socket.recv() => match msg {
                Some(Ok(Message::Binary(bytes))) => {
                    match peek_address(bytes.as_ref()) {
                        // `/scope/*` is bridge-internal: claimed, never routed.
                        Some(scope::SCOPE_SUBSCRIBE) => {
                            let shm = server.scope_shm().await;
                            scopes.subscribe(bytes.as_ref(), shm);
                        }
                        Some(scope::SCOPE_UNSUBSCRIBE) => scopes.unsubscribe(bytes.as_ref()),
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
            _ = poll.tick(), if scopes.is_active() => scopes.poll(),
            // Always-ready when something is staged; with `biased` it runs
            // only when nothing above is — one chunk per pass, so replies
            // are re-checked between chunk sends.
            _ = std::future::ready(()), if scopes.has_pending() => {
                let chunk = scopes.next_chunk().expect("has_pending was checked");
                if socket.send(Message::Binary(chunk.into())).await.is_err() {
                    break;
                }
            }
        }
    }
}
