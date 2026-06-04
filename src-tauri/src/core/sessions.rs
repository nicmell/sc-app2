//! Per-client session store: node-id sub-block allocation + liveness
//! bookkeeping. A passive data structure — the reaper that drives eviction
//! (and the OSC group teardown it triggers) lives in [`crate::server`].
//!
//! Each session maps a [`Uuid`] to its [`SessionBlock`](super::scsynth::SessionBlock)
//! (minted by the [`scsynth`](super::scsynth) id scheme) plus a live-WebSocket
//! refcount and a last-active timestamp. Indices are handed out monotonically
//! and recycled via a free list, so a session's node-id block is reused after
//! it's reclaimed.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{Duration, Instant};

use uuid::Uuid;

use super::scsynth::SessionBlock;

/// Per-session bookkeeping.
struct SessionEntry {
    block: SessionBlock,
    /// Index within the client block — returned to the free list on removal.
    index: u32,
    /// Number of live WebSocket connections (never evicted while any are open).
    conns: u32,
    /// Last time a WS attached/detached or a GET touched the session.
    last_active: Instant,
}

struct StoreState {
    sessions: HashMap<Uuid, SessionEntry>,
    /// Returned session indices, reused before extending `next_index`.
    free: Vec<u32>,
    /// Next fresh index. Starts at 1 — index 0 is reserved (the root group sits
    /// at `base + 1`, below the first sub-block at `base + SPAN`).
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
    /// Mint a session: allocate a sub-block index, build its [`SessionBlock`]
    /// via `make_block` (the id scheme lives on [`scsynth`](super::scsynth)), and
    /// store the entry.
    pub fn create(&self, make_block: impl Fn(u32) -> SessionBlock) -> (Uuid, SessionBlock) {
        let mut st = self.0.lock().unwrap();
        let index = st.free.pop().unwrap_or_else(|| {
            let i = st.next_index;
            st.next_index += 1;
            i
        });
        let block = make_block(index);
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

    /// Remove every session with no live connection whose last activity is older
    /// than `grace`, recycling indices. Returns `(id, block)` for each so the
    /// caller can free the scsynth group.
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
    use crate::core::scsynth::session_block;

    /// Build a block the way `create_session` does (the id scheme is scsynth's).
    fn block_of(index: u32) -> SessionBlock {
        session_block(1, index)
    }

    #[test]
    fn create_assigns_distinct_blocks_and_recycles_indices() {
        let store = SessionStore::default();
        let (a, ba) = store.create(block_of);
        let (_b, bb) = store.create(block_of);
        assert_ne!(ba.group_id, bb.group_id);
        assert!(store.contains(&a));
        assert_eq!(store.remove(&a).map(|b| b.group_id), Some(ba.group_id));
        let (_c, bc) = store.create(block_of);
        assert_eq!(bc.group_id, ba.group_id);
    }

    #[test]
    fn evict_skips_connected_and_fresh() {
        let store = SessionStore::default();
        let (connected, _) = store.create(block_of);
        store.attach(&connected);
        let (idle, _) = store.create(block_of);
        assert!(store.evict_idle(Duration::from_secs(3600)).is_empty());
        let evicted = store.evict_idle(Duration::ZERO);
        assert_eq!(evicted.len(), 1);
        assert_eq!(evicted[0].0, idle);
        assert!(store.contains(&connected));
    }

    #[test]
    fn detach_makes_a_session_evictable() {
        let store = SessionStore::default();
        let (id, _) = store.create(block_of);
        store.attach(&id);
        assert!(store.evict_idle(Duration::ZERO).is_empty());
        store.detach(&id);
        assert_eq!(store.evict_idle(Duration::ZERO).len(), 1);
    }
}
