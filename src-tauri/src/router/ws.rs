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
    ws.on_upgrade(move |socket| async move { run_ws(server, socket).await })
}

/// Bridge one WebSocket for its lifetime: uplink binary frames go to the
/// [`Bridge`](crate::core::bridge); peer replies (from its fan-out) are written
/// back.
async fn run_ws(server: Server, mut socket: WebSocket) {
    let mut replies = server.inner.bridge.subscribe();
    loop {
        tokio::select! {
            msg = socket.recv() => match msg {
                Some(Ok(Message::Binary(bytes))) => {
                    server.inner.bridge.dispatch_command(bytes.as_ref()).await;
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
