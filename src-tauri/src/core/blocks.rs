//! The per-session id-partitioning scheme — pure math, no I/O.
//!
//! scsynth partitions the node-ID space by client: client `cid` owns
//! `[cid << 26, (cid+1) << 26)`. We carve our slice into fixed-size
//! per-session sub-blocks (`base + index*SPAN`), so every synth a session
//! creates has a server-assigned id that can't collide with another session,
//! another scsynth client (sclang/SuperDirt at clientID 0), or the default
//! groups. The scope-buffer pool is partitioned the same way: each session
//! owns an aligned span of [`SCOPE_SPAN`] SHM slots out of scsynth's
//! [`SCOPE_BUFFER_COUNT`].
//!
//! The app layer ([`crate::core::server`]) allocates the per-session `index` (via
//! [`sessions`](super::sessions)); the consumers are the session payload
//! ([`crate::router::session`]) and the scope subscribe gate
//! ([`crate::core::scope`]). The session *group* (`/g_new` at the tail of scsynth's
//! root group 0) is created by the frontend once its WebSocket is open — the
//! bridge only frees groups (session end / shutdown).

/// Bits a client's node-ID block occupies — matches SuperCollider's allocator.
const ID_SHIFT: u32 = 26;
/// Node IDs reserved per session (group id + this many synth ids). 2^16 →
/// 1024 sessions per client within the 2^26 block.
const SESSION_SPAN: i32 = 1 << 16;

/// scsynth allocates this many scope buffers at boot — the per-session scope
/// span wraps within this range (mirrors the SHM reader's expectation).
pub const SCOPE_BUFFER_COUNT: u32 = 128;
/// Scope-buffer slots reserved per session (one per mounted `<sc-scope>`).
/// 128 / 8 = 16 live sessions before spans wrap onto each other — the same
/// collision model as the node-id wrap, sessions are per-browser-tab.
pub const SCOPE_SPAN: u32 = 8;
// Spans must tile the pool exactly, or a wrapped span would straddle the
// boundary and leak into another session's slots.
const _: () = assert!(SCOPE_BUFFER_COUNT % SCOPE_SPAN == 0, "spans must tile the scope pool");

/// A session's allocated slice: its group id and the contiguous synth-id range
/// the frontend allocates from.
#[derive(Debug, Clone, Copy)]
pub struct SessionBlock {
    /// Group id for this session (also the start of its sub-block).
    pub group_id: i32,
    /// First synth node id the frontend may allocate.
    pub node_base: i32,
    /// How many synth node ids the frontend may allocate.
    pub node_count: i32,
    /// First scsynth scope-buffer index this session's scope taps may write
    /// to. The frontend allocates one slot per `<sc-scope>` from
    /// `[scope_index_base, scope_index_base + scope_index_count)` — mirroring
    /// the node-id sub-block design, so concurrent sessions don't stomp each
    /// other's SHM scope buffers; see [`SCOPE_BUFFER_COUNT`] / [`SCOPE_SPAN`].
    pub scope_index_base: i32,
    /// How many scope-buffer slots the session owns.
    pub scope_index_count: i32,
}

impl SessionBlock {
    /// Whether `idx` falls inside this session's assigned scope-slot span —
    /// the subscribe gate that keeps sessions off each other's SHM slots.
    pub fn owns_scope_index(&self, idx: usize) -> bool {
        (self.scope_index_base as usize
            ..(self.scope_index_base + self.scope_index_count) as usize)
            .contains(&idx)
    }
}

/// The [`SessionBlock`] for session `index` (1-based) of client `cid`.
pub fn session_block(cid: i32, index: u32) -> SessionBlock {
    let group_id = (cid << ID_SHIFT) + (index as i32) * SESSION_SPAN;
    SessionBlock {
        group_id,
        node_base: group_id + 1,
        node_count: SESSION_SPAN - 1,
        // 1-based index → 0-based span of SCOPE_SPAN scope buffers, wrapped
        // into scsynth's pool (aligned: SCOPE_SPAN divides SCOPE_BUFFER_COUNT).
        scope_index_base: ((index.saturating_sub(1) * SCOPE_SPAN) % SCOPE_BUFFER_COUNT) as i32,
        scope_index_count: SCOPE_SPAN as i32,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn session_blocks_are_disjoint() {
        let a = session_block(1, 1);
        let b = session_block(1, 2);
        assert!(a.node_base + a.node_count <= b.group_id);
        assert_eq!(b.group_id - a.group_id, SESSION_SPAN);
    }

    #[test]
    fn different_clients_never_overlap() {
        let last0 = session_block(0, 1023);
        assert!(last0.node_base + last0.node_count <= (1 << 26));
    }

    #[test]
    fn scope_spans_are_disjoint_within_wrap_window() {
        // The wrap window: SCOPE_BUFFER_COUNT / SCOPE_SPAN sessions fit before
        // spans wrap onto each other (the accepted collision model).
        let window = SCOPE_BUFFER_COUNT / SCOPE_SPAN;
        let spans: Vec<(i32, i32)> = (1..=window)
            .map(|i| {
                let b = session_block(1, i);
                (b.scope_index_base, b.scope_index_base + b.scope_index_count)
            })
            .collect();
        for (i, &(a_start, a_end)) in spans.iter().enumerate() {
            assert!(a_start >= 0 && a_end as u32 <= SCOPE_BUFFER_COUNT);
            for &(b_start, b_end) in &spans[i + 1..] {
                assert!(a_end <= b_start || b_end <= a_start, "spans overlap");
            }
        }
        // Session window+1 wraps back onto session 1's span.
        assert_eq!(
            session_block(1, window + 1).scope_index_base,
            session_block(1, 1).scope_index_base,
        );
    }

    #[test]
    fn owns_scope_index_gates_the_span() {
        // Session 2: base = SCOPE_SPAN, so the lower bound is real.
        let block = session_block(1, 2);
        let base = block.scope_index_base as usize;
        let count = block.scope_index_count as usize;
        assert!(block.owns_scope_index(base));
        assert!(block.owns_scope_index(base + count - 1));
        assert!(!block.owns_scope_index(base - 1));
        assert!(!block.owns_scope_index(base + count));
    }
}
