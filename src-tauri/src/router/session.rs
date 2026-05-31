//! Sessions — a UUID per connected client (tab).
//!
//! `POST /api/session` mints an id, the WS upgrade (`/ws?session=<uuid>`)
//! validates it, and `DELETE` drops it. That's all a session is here: an
//! identity that gates the bridge. The reference allocates scsynth groups /
//! node-id slots per session; for the StrudelDirt-only bridge none of that
//! is needed, so this is just a set of live ids (no TTL reaper, no cleanup).
//!
//! [`routes`] is the `/api/session` sub-router, merged into the app in
//! [`Server::router`](super::Server) — the template for future REST features.

use std::collections::HashSet;
use std::sync::{Arc, Mutex};

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Serialize;
use uuid::Uuid;

use super::Server;

/// The `/api/session` routes (mint / fetch / drop).
pub fn routes() -> Router<Server> {
    Router::new()
        .route("/api/session", post(post_session))
        .route("/api/session/{id}", get(get_session).delete(delete_session))
}

/// What the session endpoints return. The store-side fields (peers, log_dir)
/// stay server-side.
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

/// Live session ids. Cheap to clone (shared inner set), so it lives in the
/// server's shared state.
#[derive(Clone, Default)]
pub struct SessionStore {
    inner: Arc<Mutex<HashSet<Uuid>>>,
}

impl SessionStore {
    /// Mint and store a fresh session id.
    pub fn create(&self) -> Uuid {
        let id = Uuid::new_v4();
        self.inner.lock().unwrap().insert(id);
        id
    }

    /// Whether `id` is a live session.
    pub fn contains(&self, id: &Uuid) -> bool {
        self.inner.lock().unwrap().contains(id)
    }

    /// Drop a session; returns whether it existed.
    pub fn remove(&self, id: &Uuid) -> bool {
        self.inner.lock().unwrap().remove(id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_then_contains_then_remove() {
        let store = SessionStore::default();
        let id = store.create();
        assert!(store.contains(&id));
        assert!(store.remove(&id));
        assert!(!store.contains(&id));
        // Removing again is a no-op false.
        assert!(!store.remove(&id));
    }

    #[test]
    fn unknown_id_is_absent() {
        let store = SessionStore::default();
        assert!(!store.contains(&Uuid::new_v4()));
    }
}
