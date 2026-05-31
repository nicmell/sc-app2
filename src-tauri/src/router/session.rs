//! Sessions — a UUID per connected client (tab).
//!
//! `POST /api/session` mints an id, the WS upgrade (`/ws?session=<uuid>`)
//! validates it, and `DELETE` drops it. That's all a session is here: an
//! identity that gates the bridge. The reference allocates scsynth groups /
//! node-id slots per session; for the StrudelDirt-only bridge none of that
//! is needed, so this is just a set of live ids (no TTL reaper, no cleanup).

use std::collections::HashSet;
use std::sync::{Arc, Mutex};

use uuid::Uuid;

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
