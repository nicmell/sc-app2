//! Per-client LIVE session store (the persisted dashboard layouts live in
//! [`crate::layouts`]): node-id sub-block allocation. A passive data
//! structure — the OSC group teardown a removal triggers lives in
//! [`crate::server`] (a session ends when its WebSocket closes, or at
//! shutdown when every live session is drained and freed one by one).
//!
//! Each session maps a [`Uuid`] to its [`SessionBlock`](super::blocks::SessionBlock)
//! (minted by the [`blocks`](super::blocks) id scheme). Indices are handed
//! out monotonically and recycled via a free list, so a session's node-id
//! block is reused after it's reclaimed.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use uuid::Uuid;

use super::blocks::SessionBlock;

/// Per-session bookkeeping.
struct SessionEntry {
    block: SessionBlock,
    /// Index within the client block — returned to the free list on removal.
    index: u32,
    /// Whether a WebSocket currently owns this session (at most one — see
    /// [`SessionStore::attach`]).
    attached: bool,
}

struct StoreState {
    sessions: HashMap<Uuid, SessionEntry>,
    /// Returned session indices, reused before extending `next_index`.
    free: Vec<u32>,
    /// Next fresh index. Starts at 1 — [`session_block`](super::blocks::session_block)
    /// indices are 1-based (index 0 would collide with the block base).
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
        let id = Uuid::new_v4();
        (id, self.create_with_id(id, make_block))
    }

    /// Same allocation as [`create`](Self::create) but under a caller-supplied
    /// id — the revive path, where a saved session keeps its identity across
    /// app runs (the block itself is freshly allocated). Idempotent: if the
    /// session is already live (e.g. two concurrent revives of the same
    /// stored id), the existing block is returned instead of overwriting the
    /// entry (which would leak its index).
    pub fn create_with_id(&self, id: Uuid, make_block: impl Fn(u32) -> SessionBlock) -> SessionBlock {
        let mut st = self.0.lock().unwrap();
        if let Some(existing) = st.sessions.get(&id) {
            return existing.block;
        }
        let index = st.free.pop().unwrap_or_else(|| {
            let i = st.next_index;
            st.next_index += 1;
            i
        });
        let block = make_block(index);
        st.sessions.insert(id, SessionEntry { block, index, attached: false });
        block
    }

    /// Whether `id` is a live session.
    pub fn contains(&self, id: &Uuid) -> bool {
        self.0.lock().unwrap().sessions.contains_key(id)
    }

    /// Claim the session for a WebSocket. At most one socket may own a
    /// session at a time: `Ok(true)` claimed, `Ok(false)` someone else holds
    /// it, `Err(())` no such session. Released by [`remove`](Self::remove) —
    /// a session dies with its socket, so there is no separate detach.
    pub fn attach(&self, id: &Uuid) -> Result<bool, ()> {
        let mut st = self.0.lock().unwrap();
        let entry = st.sessions.get_mut(id).ok_or(())?;
        if entry.attached {
            return Ok(false);
        }
        entry.attached = true;
        Ok(true)
    }

    /// A live session's block (for GET).
    pub fn block(&self, id: &Uuid) -> Option<SessionBlock> {
        self.0.lock().unwrap().sessions.get(id).map(|e| e.block)
    }

    /// Remove a session, returning its block (for the caller to free the group)
    /// and recycling its index.
    pub fn remove(&self, id: &Uuid) -> Option<SessionBlock> {
        let mut st = self.0.lock().unwrap();
        let entry = st.sessions.remove(id)?;
        st.free.push(entry.index);
        Some(entry.block)
    }

    /// Remove every session, recycling indices. Returns `(id, block)` for each
    /// so the caller can free the scsynth groups — the shutdown path.
    pub fn drain_all(&self) -> Vec<(Uuid, SessionBlock)> {
        let mut st = self.0.lock().unwrap();
        let drained: Vec<(Uuid, SessionEntry)> = st.sessions.drain().collect();
        let mut out = Vec::with_capacity(drained.len());
        for (id, entry) in drained {
            st.free.push(entry.index);
            out.push((id, entry.block));
        }
        out
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::blocks::session_block;

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
        assert_eq!(store.block(&a).map(|b| b.group_id), Some(ba.group_id));
        assert_eq!(store.remove(&a).map(|b| b.group_id), Some(ba.group_id));
        let (_c, bc) = store.create(block_of);
        assert_eq!(bc.group_id, ba.group_id);
    }

    #[test]
    fn drain_all_empties_the_store_and_recycles() {
        let store = SessionStore::default();
        let (a, _) = store.create(block_of);
        let (b, _) = store.create(block_of);
        let drained = store.drain_all();
        assert_eq!(drained.len(), 2);
        assert!(!store.contains(&a) && !store.contains(&b));
        // Indices were recycled: the next session reuses one of the freed blocks.
        let (_c, bc) = store.create(block_of);
        assert!(drained.iter().any(|(_, blk)| blk.group_id == bc.group_id));
    }
}
