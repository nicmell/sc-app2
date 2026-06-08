//! The `/api/session` HTTP routes: mint / fetch / drop.
//!
//! `POST` asks [`Server::create_session`](crate::server::Server::create_session)
//! to allocate a group + node-id range and `/g_new` the session group, and
//! returns them so the frontend can allocate synth ids. `GET` reuses a stored
//! session's block (reload), `DELETE` frees its group. The session store, the
//! id math, and the TTL reaper all live on [`Server`](crate::server) — this is
//! just the transport.

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

/// What the session endpoints return: the id plus the session's assigned group
/// and node-id range, which the frontend allocates synth ids from.
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
}

impl SessionInfo {
    fn new(id: Uuid, block: SessionBlock) -> Self {
        Self {
            session_id: id,
            session_group_id: block.group_id,
            node_id_base: block.node_base,
            node_id_count: block.node_count,
            scope_index: block.scope_index,
        }
    }
}

async fn post_session(State(server): State<Server>) -> Response {
    match server.create_session().await {
        Some((id, block)) => {
            tracing::info!(session = %id, group = block.group_id, "session created");
            (StatusCode::CREATED, Json(SessionInfo::new(id, block))).into_response()
        }
        None => (
            StatusCode::SERVICE_UNAVAILABLE,
            "scsynth not registered yet; retry\n",
        )
            .into_response(),
    }
}

async fn get_session(State(server): State<Server>, Path(id): Path<Uuid>) -> Response {
    // Touch keeps a reloading tab's session fresh; return its existing block so
    // the reload reuses the same group + node range (the group still exists).
    match server.sessions().touch_and_block(&id) {
        Some(block) => Json(SessionInfo::new(id, block)).into_response(),
        None => (StatusCode::NOT_FOUND, format!("session {id} not found\n")).into_response(),
    }
}

async fn delete_session(State(server): State<Server>, Path(id): Path<Uuid>) -> Response {
    match server.sessions().remove(&id) {
        Some(block) => {
            server.free_session_group(block.group_id).await;
            StatusCode::NO_CONTENT.into_response()
        }
        None => (StatusCode::NOT_FOUND, format!("session {id} not found\n")).into_response(),
    }
}
