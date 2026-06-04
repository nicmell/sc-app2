//! Sessions — a UUID per connected client (tab), plus the scsynth group and
//! node-id block the server assigns it.
//!
//! `POST /api/session` mints an id, allocates a node-id sub-block from the
//! bridge's client block, and `/g_new`s a per-session group under the bridge
//! root group. The WS upgrade (`/ws?session=<uuid>`) validates the id and
//! refcounts the live connection. `DELETE` frees the group explicitly; the
//! [reaper](super::Server::spawn_session_reaper) frees groups for sessions whose
//! WebSocket has been gone past the grace TTL. Group ids + node ranges come from
//! [`crate::core::ids`].
//!
//! [`routes`] is the `/api/session` sub-router, merged into the app in
//! [`Server::router`](super::Server).

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use axum::extract::{Path, State};
use axum::http::StatusCode;
use axum::response::{IntoResponse, Response};
use axum::routing::{get, post};
use axum::{Json, Router};
use serde::Serialize;
use uuid::Uuid;

use super::Server;
use crate::core::ids::{root_group_id, session_block, SessionBlock};
use crate::core::osc::{self, OscType};

/// `/g_new` add-action: tail of the target group.
const ADD_TO_TAIL: i32 = 1;
/// How long to wait for scsynth registration (clientID) before failing a POST.
const CLIENT_ID_WAIT: Duration = Duration::from_secs(5);

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
}

impl SessionInfo {
    fn new(id: Uuid, block: SessionBlock) -> Self {
        Self {
            session_id: id,
            session_group_id: block.group_id,
            node_id_base: block.node_base,
            node_id_count: block.node_count,
        }
    }
}

async fn post_session(State(server): State<Server>) -> Response {
    let Some(cid) = await_client_id(&server).await else {
        return (
            StatusCode::SERVICE_UNAVAILABLE,
            "scsynth not registered yet; retry\n",
        )
            .into_response();
    };
    let (id, block) = server.inner.sessions.create(cid);
    // Create the session group at the tail of the bridge root group.
    server
        .inner
        .bridge
        .dispatch_command(&osc::encode(
            "/g_new",
            vec![
                OscType::Int(block.group_id),
                OscType::Int(ADD_TO_TAIL),
                OscType::Int(root_group_id(cid)),
            ],
        ))
        .await;
    tracing::info!(session = %id, group = block.group_id, "session created");
    (StatusCode::CREATED, Json(SessionInfo::new(id, block))).into_response()
}

async fn get_session(State(server): State<Server>, Path(id): Path<Uuid>) -> Response {
    // Touch keeps a reloading tab's session fresh; return its existing block so
    // the reload reuses the same group + node range (the group still exists).
    match server.inner.sessions.touch_and_block(&id) {
        Some(block) => Json(SessionInfo::new(id, block)).into_response(),
        None => (StatusCode::NOT_FOUND, format!("session {id} not found\n")).into_response(),
    }
}

async fn delete_session(State(server): State<Server>, Path(id): Path<Uuid>) -> Response {
    match server.inner.sessions.remove(&id) {
        Some(block) => {
            server.free_session_group(block.group_id).await;
            StatusCode::NO_CONTENT.into_response()
        }
        None => (StatusCode::NOT_FOUND, format!("session {id} not found\n")).into_response(),
    }
}

/// Poll scsynth for its clientID until it's registered or [`CLIENT_ID_WAIT`]
/// elapses (a session created right after boot may arrive before `/notify`).
async fn await_client_id(server: &Server) -> Option<i32> {
    tokio::time::timeout(CLIENT_ID_WAIT, async {
        loop {
            if let Some(cid) = server.inner.scsynth.client_id() {
                return cid;
            }
            tokio::time::sleep(Duration::from_millis(50)).await;
        }
    })
    .await
    .ok()
}

/// Per-session bookkeeping.
struct SessionEntry {
    block: SessionBlock,
    /// Index within the client block — returned to the free list on removal.
    index: u32,
    /// Number of live WebSocket connections (a session is never evicted while
    /// any are open).
    conns: u32,
    /// Last time a WS attached/detached or a GET touched the session.
    last_active: Instant,
}

struct StoreState {
    sessions: HashMap<Uuid, SessionEntry>,
    /// Returned session indices, reused before extending `next_index`.
    free: Vec<u32>,
    /// Next fresh index. Starts at 1 — index 0 is reserved (the root group
    /// sits at `base + 1`, below the first sub-block at `base + SPAN`).
    next_index: u32,
}

/// Live sessions + the per-client node-id sub-block allocator. Cheap to clone
/// (shared inner), so it lives in the server's shared state.
#[derive(Clone)]
pub struct SessionStore(Arc<Mutex<StoreState>>);

impl Default for SessionStore {
    fn default() -> Self {
        SessionStore(Arc::new(Mutex::new(StoreState {
            sessions: HashMap::new(),
            free: Vec::new(),
            next_index: 1,
        })))
    }
}

impl SessionStore {
    /// Mint a session: allocate a sub-block index for client `cid`, compute its
    /// [`SessionBlock`], and store the entry (0 connections, fresh timestamp).
    pub fn create(&self, cid: i32) -> (Uuid, SessionBlock) {
        let mut st = self.0.lock().unwrap();
        let index = st.free.pop().unwrap_or_else(|| {
            let i = st.next_index;
            st.next_index += 1;
            i
        });
        let block = session_block(cid, index);
        let id = Uuid::new_v4();
        st.sessions.insert(
            id,
            SessionEntry {
                block,
                index,
                conns: 0,
                last_active: Instant::now(),
            },
        );
        (id, block)
    }

    /// Whether `id` is a live session.
    pub fn contains(&self, id: &Uuid) -> bool {
        self.0.lock().unwrap().sessions.contains_key(id)
    }

    /// Stamp `last_active` and return the session's block (for GET / reload).
    pub fn touch_and_block(&self, id: &Uuid) -> Option<SessionBlock> {
        let mut st = self.0.lock().unwrap();
        let entry = st.sessions.get_mut(id)?;
        entry.last_active = Instant::now();
        Some(entry.block)
    }

    /// A WS attached: bump the connection count (and freshness).
    pub fn attach(&self, id: &Uuid) {
        if let Some(entry) = self.0.lock().unwrap().sessions.get_mut(id) {
            entry.conns += 1;
            entry.last_active = Instant::now();
        }
    }

    /// A WS detached: drop the connection count and stamp `last_active` so the
    /// grace window starts counting from the disconnect.
    pub fn detach(&self, id: &Uuid) {
        if let Some(entry) = self.0.lock().unwrap().sessions.get_mut(id) {
            entry.conns = entry.conns.saturating_sub(1);
            entry.last_active = Instant::now();
        }
    }

    /// Remove a session, returning its block (for the caller to free the group)
    /// and recycling its index.
    pub fn remove(&self, id: &Uuid) -> Option<SessionBlock> {
        let mut st = self.0.lock().unwrap();
        let entry = st.sessions.remove(id)?;
        st.free.push(entry.index);
        Some(entry.block)
    }

    /// Remove every session with no live connection whose last activity is
    /// older than `grace`, recycling indices. Returns `(id, block)` for each so
    /// the caller can free the scsynth group.
    pub fn evict_idle(&self, grace: Duration) -> Vec<(Uuid, SessionBlock)> {
        let mut st = self.0.lock().unwrap();
        let now = Instant::now();
        let stale: Vec<Uuid> = st
            .sessions
            .iter()
            .filter(|(_, e)| e.conns == 0 && now.duration_since(e.last_active) > grace)
            .map(|(id, _)| *id)
            .collect();
        let mut out = Vec::with_capacity(stale.len());
        for id in stale {
            if let Some(entry) = st.sessions.remove(&id) {
                st.free.push(entry.index);
                out.push((id, entry.block));
            }
        }
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn create_assigns_distinct_blocks_and_recycles_indices() {
        let store = SessionStore::default();
        let (a, ba) = store.create(1);
        let (_b, bb) = store.create(1);
        assert_ne!(ba.group_id, bb.group_id);
        assert!(store.contains(&a));
        // Removing recycles the index so the next create reuses it.
        assert_eq!(store.remove(&a).map(|b| b.group_id), Some(ba.group_id));
        let (_c, bc) = store.create(1);
        assert_eq!(bc.group_id, ba.group_id);
    }

    #[test]
    fn evict_skips_connected_and_fresh() {
        let store = SessionStore::default();
        let (connected, _) = store.create(1);
        store.attach(&connected);
        let (idle, _) = store.create(1);
        // Nothing is past a 1h grace yet.
        assert!(store.evict_idle(Duration::from_secs(3600)).is_empty());
        // With zero grace, the idle (0-conn) session evicts but the connected
        // one stays.
        let evicted = store.evict_idle(Duration::ZERO);
        assert_eq!(evicted.len(), 1);
        assert_eq!(evicted[0].0, idle);
        assert!(store.contains(&connected));
    }

    #[test]
    fn detach_makes_a_session_evictable() {
        let store = SessionStore::default();
        let (id, _) = store.create(1);
        store.attach(&id);
        assert!(store.evict_idle(Duration::ZERO).is_empty());
        store.detach(&id);
        assert_eq!(store.evict_idle(Duration::ZERO).len(), 1);
    }
}
