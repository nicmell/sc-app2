//! The `scope_buffer` memory layout and its discovery in the SHM segment.
//!
//! Layout (from SuperCollider's `common/scope_buffer.hpp`):
//! ```cpp
//! class scope_buffer {
//!     atomic<int> _status;        // 4B @ 0   (free=0, initialized=1)
//!     unsigned int _size;         // 4B @ 4   (max frames per slot)
//!     unsigned int _channels;     // 4B @ 8
//!     offset_ptr<float> _data;    // 8B @ 16
//!     atomic<int> _stage;         // 4B @ 24  (slot 0|1|2, most-recent-complete)
//!     int _in;                    // 4B @ 28
//!     int _out;                   // 4B @ 32
//!     struct data_desc {          // _state[3] @ 40, stride 16
//!         offset_ptr<float> data; // 8B @ +0
//!         unsigned int frames;    // 4B @ +8
//!         atomic<bool> changed;   // 1B @ +12 (+pad)
//!     } _state[3];
//! };
//! ```
//! The 128 `scope_buffer` instances are scattered by Boost's allocator; the
//! `bi::vector<offset_ptr<scope_buffer>>` is the index → offset map, located
//! heuristically by [`find_scope_buffer_array`] (the structures self-identify:
//! the constructors initialize `_status`/`_stage`/`_in`/`_out` to recognizable
//! values at boot, before any tap runs).

use super::mmap::MmapRegion;

/// Byte offset of `_stage` (atomic<int>) within scope_buffer.
pub(super) const SB_OFF_STAGE: usize = 24;
/// Byte offset of the `_state[3]` array within scope_buffer.
pub(super) const SB_OFF_STATE_ARRAY: usize = 40;
/// Size of one `data_desc` entry in `_state`.
pub(super) const SB_DATA_DESC_SIZE: usize = 16;
/// Within a `data_desc`: byte offset of the `data` offset_ptr.
pub(super) const DD_OFF_DATA: usize = 0;
/// Within a `data_desc`: byte offset of the `frames` field.
pub(super) const DD_OFF_FRAMES: usize = 8;
/// scsynth allocates this many scope_buffers at boot (`num_scope_buffers`).
const EXPECTED_SCOPE_BUFFER_COUNT: usize = 128;
/// Boost.Interprocess `offset_ptr<T>` "null" sentinel (offset of 1 = null).
pub(super) const OFFSET_PTR_NULL: i64 = 1;

/// Location of the scope_buffer pointer-vector in the SHM segment: the
/// `bi::vector<offset_ptr<scope_buffer>>` resolved to absolute byte offsets.
#[derive(Debug, Clone)]
pub struct ScopeBufferLayout {
    /// Number of offset_ptrs in the vector (should be 128).
    pub count: usize,
    /// Resolved byte offset of each scope_buffer, indexed by vector position.
    pub scope_offsets: Vec<usize>,
}

/// Locate the `bi::vector<offset_ptr<scope_buffer>>` data array in the SHM
/// segment. Finds every scope_buffer-shaped structure, then the longest run of
/// consecutive 8-byte offset_ptrs that each resolve to one — that run is the
/// vector, and it is the index → offset map.
pub fn find_scope_buffer_array(region: &MmapRegion) -> Result<ScopeBufferLayout, String> {
    let bytes = region.as_slice();

    let scope_buffer_offsets = find_scope_buffer_candidates(bytes);
    if scope_buffer_offsets.is_empty() {
        return Err("no scope_buffer-shaped structures found".to_string());
    }

    use std::collections::HashSet;
    let scope_set: HashSet<usize> = scope_buffer_offsets.iter().copied().collect();

    // Mark each 8-byte slot as a valid offset_ptr resolving to a scope_buffer.
    let n_slots = bytes.len() / 8;
    let mut valid: Vec<bool> = vec![false; n_slots];
    for slot in 0..n_slots {
        let off = slot * 8;
        let raw = i64::from_ne_bytes(bytes[off..off + 8].try_into().unwrap_or([0; 8]));
        // offset_ptr semantics: target = field_offset + raw (raw 0/1 = useless).
        if raw == 0 || raw == OFFSET_PTR_NULL {
            continue;
        }
        let Some(target) = (off as i64).checked_add(raw) else {
            continue;
        };
        if target < 0 || (target as usize) >= bytes.len() {
            continue;
        }
        if scope_set.contains(&(target as usize)) {
            valid[slot] = true;
        }
    }

    // Longest run of consecutive valid slots.
    let mut best_run_start: Option<usize> = None;
    let mut best_run_len: usize = 0;
    let mut current_start: usize = 0;
    let mut current_len: usize = 0;
    for (i, &v) in valid.iter().enumerate() {
        if v {
            if current_len == 0 {
                current_start = i;
            }
            current_len += 1;
        } else if current_len > 0 {
            if current_len > best_run_len {
                best_run_len = current_len;
                best_run_start = Some(current_start);
            }
            current_len = 0;
        }
    }
    if current_len > best_run_len {
        best_run_len = current_len;
        best_run_start = Some(current_start);
    }

    let run_slot = best_run_start.ok_or_else(|| "no run of valid offset_ptrs found".to_string())?;
    if best_run_len < EXPECTED_SCOPE_BUFFER_COUNT {
        return Err(format!(
            "longest offset_ptr run was {} (expected ≥{}); found {} scope_buffer candidates",
            best_run_len,
            EXPECTED_SCOPE_BUFFER_COUNT,
            scope_buffer_offsets.len()
        ));
    }

    let vector_data_offset = run_slot * 8;
    let mut scope_offsets = Vec::with_capacity(EXPECTED_SCOPE_BUFFER_COUNT);
    for i in 0..EXPECTED_SCOPE_BUFFER_COUNT {
        let off = vector_data_offset + i * 8;
        let raw = i64::from_ne_bytes(bytes[off..off + 8].try_into().unwrap());
        let target = (off as i64 + raw) as usize;
        scope_offsets.push(target);
    }

    Ok(ScopeBufferLayout {
        count: EXPECTED_SCOPE_BUFFER_COUNT,
        scope_offsets,
    })
}

/// Find every scope_buffer-shaped structure: `_status` ∈ {0,1} and the
/// `(_stage,_in,_out)` triple at +24/+28/+32 a permutation of {0,1,2}.
fn find_scope_buffer_candidates(bytes: &[u8]) -> Vec<usize> {
    let mut out = Vec::new();
    if bytes.len() < SB_OFF_STAGE + 12 {
        return out;
    }
    let max = bytes.len() - 12;
    let mut i = 0;
    while i <= max && i.checked_add(SB_OFF_STAGE + 12).map_or(false, |e| e <= bytes.len()) {
        let status = i32::from_ne_bytes(bytes[i..i + 4].try_into().unwrap());
        if status != 0 && status != 1 {
            i += 4;
            continue;
        }
        let stage =
            i32::from_ne_bytes(bytes[i + SB_OFF_STAGE..i + SB_OFF_STAGE + 4].try_into().unwrap());
        let in_ = i32::from_ne_bytes(
            bytes[i + SB_OFF_STAGE + 4..i + SB_OFF_STAGE + 8].try_into().unwrap(),
        );
        let out_ = i32::from_ne_bytes(
            bytes[i + SB_OFF_STAGE + 8..i + SB_OFF_STAGE + 12].try_into().unwrap(),
        );
        if (0..=2).contains(&stage)
            && (0..=2).contains(&in_)
            && (0..=2).contains(&out_)
            && stage != in_
            && in_ != out_
            && stage != out_
        {
            out.push(i);
        }
        i += 4;
    }
    out
}
