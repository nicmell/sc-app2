//! The `/api/session` HTTP routes: mint / fetch.
//!
//! `POST` asks [`Server::create_session`](crate::server::Server::create_session)
//! to allocate a group id + node-id range and returns them (plus the scsynth
//! address for the footer); the frontend creates the session group itself
//! (`/g_new` at the tail of scsynth's root group) once its WebSocket is open,
//! and the session ends when that WebSocket closes (see `router/ws.rs`).
//! `GET` returns a live session's block and `DELETE` ends one explicitly —
//! both kept for future use. The session store and the id math live on
//! [`Server`](crate::server) — this is just the transport.

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Serialize;
use uuid::Uuid;

use crate::core::scsynth::SessionBlock;
use crate::server::Server;

/// The `/api/session` routes (mint / fetch / drop).
pub fn routes() -> Router<Server> {
    Router::new()
        .route("/api/session", post(post_session))
        .route("/api/session/{id}", get(get_session).delete(delete_session))
}

/// What the session endpoints return: the id, the session's assigned group and
/// node-id range (which the frontend allocates synth ids from), and the
/// scsynth address the bridge talks to (shown in the footer).
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct SessionInfo {
    session_id: Uuid,
    session_group_id: i32,
    node_id_base: i32,
    node_id_count: i32,
    /// scsynth scope-buffer index for this session's master-out tap (so
    /// concurrent windows don't write the same SHM scope buffer).
    scope_index: i32,
    /// The `scsynth` peer's `host:port` from config (`None` if unconfigured).
    scsynth_address: Option<String>,
}

impl SessionInfo {
    fn new(id: Uuid, block: SessionBlock, scsynth_address: Option<String>) -> Self {
        Self {
            session_id: id,
            session_group_id: block.group_id,
            node_id_base: block.node_base,
            node_id_count: block.node_count,
            scope_index: block.scope_index,
            scsynth_address,
        }
    }
}

async fn post_session(State(server): State<Server>) -> Response {
    match server.create_session().await {
        Some((id, block)) => {
            tracing::info!(session = %id, group = block.group_id, "session created");
            (
                StatusCode::CREATED,
                Json(SessionInfo::new(id, block, server.scsynth_address())),
            )
                .into_response()
        }
        None => (
            StatusCode::SERVICE_UNAVAILABLE,
            "scsynth not registered yet; retry\n",
        )
            .into_response(),
    }
}

async fn get_session(State(server): State<Server>, Path(id): Path<Uuid>) -> Response {
    match server.sessions().block(&id) {
        Some(block) => Json(SessionInfo::new(id, block, server.scsynth_address())).into_response(),
        None => (StatusCode::NOT_FOUND, format!("session {id} not found\n")).into_response(),
    }
}

async fn delete_session(State(server): State<Server>, Path(id): Path<Uuid>) -> Response {
    if !server.sessions().contains(&id) {
        return (StatusCode::NOT_FOUND, format!("session {id} not found\n")).into_response();
    }
    server.end_session(&id).await;
    StatusCode::NO_CONTENT.into_response()
}
