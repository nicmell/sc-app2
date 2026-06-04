//! Node-ID partitioning, mirroring scsynth's own allocator.
//!
//! scsynth partitions the node-ID space by client: client `cid` owns the block
//! `[cid << 26, (cid+1) << 26)`. We carve our slice of that block into a
//! per-client root group plus fixed-size per-session sub-blocks, so every synth
//! a session creates has a server-assigned ID that can't collide with another
//! session, another scsynth client (e.g. sclang/SuperDirt at clientID 0), or
//! the default groups.

/// Bits a client's node-ID block occupies — matches SuperCollider's allocator.
pub const ID_SHIFT: u32 = 26;
/// Node IDs reserved per session (group id + this many synth ids). 2^16 →
/// 1024 sessions per client within the 2^26 block.
pub const SESSION_SPAN: i32 = 1 << 16;

/// Base of client `cid`'s node-ID block.
fn client_block_base(cid: i32) -> i32 {
    cid << ID_SHIFT
}

/// The per-client root group id: the bridge creates this under scsynth's root
/// group at registration and frees it on shutdown. Reserved at `base + 1` (low
/// in the block, clear of the session sub-blocks which start at `base + SPAN`).
pub fn root_group_id(cid: i32) -> i32 {
    client_block_base(cid) + 1
}

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
}

/// Compute the [`SessionBlock`] for session `index` (1-based) of client `cid`.
/// Index 0 is skipped so sub-blocks start at `base + SPAN`, clear of the root
/// group at `base + 1`.
pub fn session_block(cid: i32, index: u32) -> SessionBlock {
    let group_id = client_block_base(cid) + (index as i32) * SESSION_SPAN;
    SessionBlock {
        group_id,
        node_base: group_id + 1,
        node_count: SESSION_SPAN - 1,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn root_group_sits_just_above_the_block_base() {
        assert_eq!(root_group_id(1), (1 << 26) + 1);
        assert_eq!(root_group_id(0), 1);
    }

    #[test]
    fn session_blocks_are_disjoint_and_clear_of_root() {
        let root = root_group_id(1);
        let a = session_block(1, 1);
        let b = session_block(1, 2);
        assert!(a.group_id > root);
        // a's range ends before b's group id.
        assert!(a.node_base + a.node_count <= b.group_id);
        assert_eq!(b.group_id - a.group_id, SESSION_SPAN);
    }

    #[test]
    fn different_clients_never_overlap() {
        // Highest session of client 0 stays below client 1's base.
        let last0 = session_block(0, 1023);
        assert!(last0.node_base + last0.node_count <= (1 << 26));
    }
}
