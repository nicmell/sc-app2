//! The per-WebSocket OSC pump — pure transport.
//!
//! `/ws?session=<uuid>` validates the session, then upgrades to a bridge
//! between one browser/webview and the OSC [`Bridge`](crate::core::bridge):
//! uplink binary frames are dispatched to the matching peer; peer replies (from
//! the bridge's fan-out) are written back. Bridge-internal `/scope/*` and
//! `/clock/*` frames are intercepted before peer routing. `/scope/*` is
//! claimed for the session's [`SessionScopes`] instead of routed — all scope semantics
//! (subscriptions, span gating, chunk staging) live in [`crate::core::scope`]; this
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

use super::error::ApiError;
use crate::core::blocks::SessionBlock;
use crate::core::osc::peek_address;
use crate::core::scope::{self, SessionScopes};
use crate::core::server::Server;
use crate::core::{clock, osc};

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
        return ApiError::new(
            StatusCode::BAD_REQUEST,
            "ws-session-required",
            "WS upgrade requires ?session=<uuid> — POST /api/session first",
        )
        .into_response();
    };
    // A session is owned by exactly one socket — and that socket is held by
    // the frontend's SHARED worker, which every same-origin client (the
    // dashboard, its box iframes, popped-out tabs) joins; see the repo's
    // docs/multi-tab.md. Multi-tab therefore never trips this guard in
    // practice: the 409 remains as the server-side invariant check (a second
    // NON-shared client — another browser/profile, or the no-SharedWorker
    // fallback in a second tab — must not free the group under the first).
    match server.sessions().attach(&id) {
        Err(()) => {
            return ApiError::session_unknown_because(&id, "expired or never created")
                .into_response();
        }
        Ok(false) => {
            return ApiError::new(
                StatusCode::CONFLICT,
                "session-busy",
                format!("session {id} already has an active connection (another tab?)"),
            )
            .into_response();
        }
        Ok(true) => {}
    }
    // The block is fixed for the session's life (it ends with this socket):
    // fetch it once — subscribe validation gates scope slots on its span.
    let Some(block) = server.sessions().block(&id) else {
        return ApiError::session_unknown(&id).into_response();
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
    // staging — owned here, semantics in crate::core::scope.
    let mut scopes = SessionScopes::new(block);
    let mut poll = scope::poll_interval();
    loop {
        tokio::select! {
            // Priority order: uplink commands, then control replies, then the
            // chunk poll/drain — re-evaluated between every awaited send, so
            // disposable stream data never delays control traffic.
            biased;
            msg = socket.recv() => match msg {
                Some(Ok(Message::Binary(bytes))) => {
                    match peek_address(bytes.as_ref()) {
                        // Bridge-internal families are claimed, never routed.
                        Some(clock::CLOCK_PING) => {
                            let srv = clock::unix_ms();
                            let Some(seq) = osc::decode_message(bytes.as_ref())
                                .as_ref()
                                .and_then(clock::parse_ping)
                            else {
                                tracing::warn!("malformed /clock/ping ignored");
                                continue;
                            };
                            if socket
                                .send(Message::Binary(clock::encode_pong(seq, srv).into()))
                                .await
                                .is_err()
                            {
                                break;
                            }
                        }
                        Some(scope::SCOPE_SUBSCRIBE) => {
                            let shm = server.scope_shm().await;
                            scopes.subscribe(bytes.as_ref(), shm);
                        }
                        Some(scope::SCOPE_UNSUBSCRIBE) => {
                            scopes.unsubscribe(bytes.as_ref())
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
