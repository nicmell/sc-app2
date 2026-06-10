//! The `/api/session` HTTP routes: mint / fetch-or-revive / save / drop.
//!
//! `POST` asks [`Server::create_session`](crate::server::Server::create_session)
//! to allocate a group id + node-id range and returns them (plus the scsynth
//! address for the footer); the frontend creates the session group itself
//! (`/g_new` at the tail of scsynth's root group) once its WebSocket is open,
//! and the session ends when that WebSocket closes (see `router/ws.rs`).
//!
//! The dashboard layout is persisted server-side ([`crate::saved_sessions`]):
//! the frontend periodically `PUT`s it, and at boot `GET` either returns the
//! live session or **revives** a saved one under the same id (fresh block) so
//! the layout survives across app runs. `DELETE` ends a live session
//! explicitly (kept for future use). The session store and the id math live
//! on [`Server`](crate::server) — this is just the transport.

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Serialize;
use uuid::Uuid;

use crate::core::scsynth::SessionBlock;
use crate::saved_sessions;
use crate::server::Server;

/// The `/api/session` routes (mint / fetch-or-revive / save / drop).
pub fn routes() -> Router<Server> {
    Router::new()
        .route("/api/session", post(post_session))
        .route(
            "/api/session/{id}",
            get(get_session).put(put_session).delete(delete_session),
        )
}

/// What the session endpoints return: the id, the session's assigned group and
/// node-id range (which the frontend allocates synth ids from), the scsynth
/// address the bridge talks to (shown in the footer), and — on GET — the saved
/// dashboard layout, if any.
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
    /// The saved dashboard layout (opaque to the server), if one exists.
    layout: Option<serde_json::Value>,
}

impl SessionInfo {
    fn new(server: &Server, id: Uuid, block: SessionBlock, layout: Option<serde_json::Value>) -> Self {
        Self {
            session_id: id,
            session_group_id: block.group_id,
            node_id_base: block.node_base,
            node_id_count: block.node_count,
            scope_index: block.scope_index,
            scsynth_address: server.scsynth_address(),
            layout,
        }
    }
}

const SCSYNTH_UNAVAILABLE: (StatusCode, &str) =
    (StatusCode::SERVICE_UNAVAILABLE, "scsynth not registered yet; retry\n");

async fn post_session(State(server): State<Server>) -> Response {
    match server.create_session().await {
        Some((id, block)) => {
            tracing::info!(session = %id, group = block.group_id, "session created");
            (StatusCode::CREATED, Json(SessionInfo::new(&server, id, block, None))).into_response()
        }
        None => SCSYNTH_UNAVAILABLE.into_response(),
    }
}

/// Fetch a live session — or revive a saved one under the same id (fresh
/// block), so a browser's stored session id restores its layout at boot.
async fn get_session(State(server): State<Server>, Path(id): Path<Uuid>) -> Response {
    let layout = saved_sessions::load_layout(&id);
    if let Some(block) = server.sessions().block(&id) {
        return Json(SessionInfo::new(&server, id, block, layout)).into_response();
    }
    if layout.is_none() {
        return (StatusCode::NOT_FOUND, format!("session {id} not found\n")).into_response();
    }
    match server.create_session_with_id(id).await {
        Some(block) => {
            tracing::info!(session = %id, group = block.group_id, "session revived");
            Json(SessionInfo::new(&server, id, block, layout)).into_response()
        }
        None => SCSYNTH_UNAVAILABLE.into_response(),
    }
}

/// Save the session's dashboard layout (the frontend PUTs it periodically).
async fn put_session(
    State(server): State<Server>,
    Path(id): Path<Uuid>,
    Json(layout): Json<serde_json::Value>,
) -> Response {
    if !server.sessions().contains(&id) {
        return (StatusCode::NOT_FOUND, format!("session {id} not found\n")).into_response();
    }
    match saved_sessions::save_layout(&id, &layout) {
        Ok(()) => StatusCode::NO_CONTENT.into_response(),
        Err(e) => (StatusCode::INTERNAL_SERVER_ERROR, e).into_response(),
    }
}

async fn delete_session(State(server): State<Server>, Path(id): Path<Uuid>) -> Response {
    if !server.sessions().contains(&id) {
        return (StatusCode::NOT_FOUND, format!("session {id} not found\n")).into_response();
    }
    server.end_session(&id).await;
    StatusCode::NO_CONTENT.into_response()
}
