//! SHM scope-buffer reader (SHM-only port from upstream sc-app).
//!
//! scsynth allocates a Boost.Interprocess shared-memory segment at startup and
//! writes scope-buffer audio into it via the `ScopeOut2` UGen. We mmap that
//! segment and read the most-recently-completed slot directly — no `/b_getn`
//! OSC round-trip.
//!
//! - **macOS**: `/tmp/boost_interprocess/SuperColliderServer_<port>` (a regular
//!   file Boost mmaps).
//! - **Linux**: `/dev/shm/SuperColliderServer_<port>` (POSIX `shm_open`).
//!
//! `scope_buffer` layout (from SuperCollider's `common/scope_buffer.hpp`):
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
//! `bi::vector<offset_ptr<scope_buffer>>` is the index → offset map, located by
//! [`find_scope_buffer_array`].

use std::fs::File;
use std::os::unix::io::AsRawFd;
use std::path::PathBuf;
use std::ptr;

/// RAII wrapper for an mmap'd file region. Opens read-only, shared (so writes by
/// scsynth are visible). Drops `munmap` on scope exit.
pub struct MmapRegion {
    ptr: *mut u8,
    size: usize,
}

// The mmap'd region is read-only and lives for the struct's lifetime; safe to
// share across threads.
unsafe impl Send for MmapRegion {}
unsafe impl Sync for MmapRegion {}

impl MmapRegion {
    /// Open the file at `path` and mmap its full length read-only.
    pub fn open(path: &str) -> Result<Self, String> {
        let file = File::open(path).map_err(|e| format!("open('{}') failed: {}", path, e))?;
        let size = file
            .metadata()
            .map_err(|e| format!("stat('{}') failed: {}", path, e))?
            .len() as usize;
        if size == 0 {
            return Err(format!("SHM file '{}' is empty", path));
        }

        // Safety: file is open, fd valid, size from metadata. PROT_READ +
        // MAP_SHARED means scsynth's writes are visible but we can't modify.
        unsafe {
            let ptr = libc::mmap(
                ptr::null_mut(),
                size,
                libc::PROT_READ,
                libc::MAP_SHARED,
                file.as_raw_fd(),
                0,
            );
            if ptr == libc::MAP_FAILED {
                return Err(format!(
                    "mmap('{}') failed: {}",
                    path,
                    std::io::Error::last_os_error()
                ));
            }
            Ok(MmapRegion {
                ptr: ptr as *mut u8,
                size,
            })
        }
    }

    /// Total mapped size in bytes.
    pub fn size(&self) -> usize {
        self.size
    }

    /// Read-only view of the entire region as bytes.
    pub fn as_slice(&self) -> &[u8] {
        // Safety: ptr + size came from mmap, valid for self's lifetime, read-only.
        unsafe { std::slice::from_raw_parts(self.ptr, self.size) }
    }

    /// Read a native-endian f32 at byte offset. Bounds-checked.
    pub fn read_f32_ne(&self, offset: usize) -> Option<f32> {
        if offset + 4 > self.size {
            return None;
        }
        let bytes: [u8; 4] = self.as_slice()[offset..offset + 4].try_into().ok()?;
        Some(f32::from_ne_bytes(bytes))
    }

    /// Read a native-endian i32 at byte offset. Bounds-checked.
    pub fn read_i32_ne(&self, offset: usize) -> Option<i32> {
        if offset + 4 > self.size {
            return None;
        }
        let bytes: [u8; 4] = self.as_slice()[offset..offset + 4].try_into().ok()?;
        Some(i32::from_ne_bytes(bytes))
    }

    /// Read a native-endian u32 at byte offset. Bounds-checked.
    pub fn read_u32_ne(&self, offset: usize) -> Option<u32> {
        if offset + 4 > self.size {
            return None;
        }
        let bytes: [u8; 4] = self.as_slice()[offset..offset + 4].try_into().ok()?;
        Some(u32::from_ne_bytes(bytes))
    }

    /// Read a native-endian i64 at byte offset. Bounds-checked. Used for
    /// `offset_ptr<T>` reads (Boost stores these as one intptr-sized offset).
    pub fn read_i64_ne(&self, offset: usize) -> Option<i64> {
        if offset + 8 > self.size {
            return None;
        }
        let bytes: [u8; 8] = self.as_slice()[offset..offset + 8].try_into().ok()?;
        Some(i64::from_ne_bytes(bytes))
    }
}

impl Drop for MmapRegion {
    fn drop(&mut self) {
        // Safety: ptr + size came from mmap, no longer accessed after this.
        unsafe {
            libc::munmap(self.ptr as *mut libc::c_void, self.size);
        }
    }
}

/// Platform-appropriate SHM file path for a given scsynth UDP port. Returns the
/// path even if the file doesn't exist — caller `open`s to test availability.
pub fn shm_path(port: u16) -> PathBuf {
    let name = format!("SuperColliderServer_{}", port);
    if cfg!(target_os = "macos") {
        PathBuf::from("/tmp/boost_interprocess").join(name)
    } else if cfg!(target_os = "linux") {
        PathBuf::from("/dev/shm").join(name)
    } else {
        PathBuf::from("/tmp/boost_interprocess").join(name)
    }
}

// ── scope_buffer layout constants ────────────────────────────────

/// Byte offset of `_stage` (atomic<int>) within scope_buffer.
const SB_OFF_STAGE: usize = 24;
/// Byte offset of the `_state[3]` array within scope_buffer.
const SB_OFF_STATE_ARRAY: usize = 40;
/// Size of one `data_desc` entry in `_state`.
const SB_DATA_DESC_SIZE: usize = 16;
/// Within a `data_desc`: byte offset of the `data` offset_ptr.
const DD_OFF_DATA: usize = 0;
/// Within a `data_desc`: byte offset of the `frames` field.
const DD_OFF_FRAMES: usize = 8;
/// scsynth allocates this many scope_buffers at boot (`num_scope_buffers`).
const EXPECTED_SCOPE_BUFFER_COUNT: usize = 128;
/// Boost.Interprocess `offset_ptr<T>` "null" sentinel (offset of 1 = null).
const OFFSET_PTR_NULL: i64 = 1;

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

/// Result of [`read_scope_slot`].
#[derive(Debug)]
pub enum ScopeReadResult {
    /// `_status` is free or header fields are zero — ScopeOut2 hasn't run yet.
    NotInitialized,
    /// Initialized but no slot pushed yet (data offset_ptr is null).
    NoData,
    /// A completed slot.
    Data {
        /// Interleaved samples: `frames × channels`.
        floats: Vec<f32>,
        channels: usize,
        /// Frame count for this slot. Kept for completeness; the chunk encoder
        /// derives length from `floats`, so callers may ignore it.
        #[allow(dead_code)]
        frames: usize,
        /// The `_stage` value at read time — compare against the previous read
        /// to detect "no new slot since last poll".
        stage: usize,
    },
}

/// Cheaply read just `_stage` for `scope_idx` (no data copy). Lets the poller
/// skip the full read when nothing advanced. `None` on OOB / bad index.
pub fn read_scope_stage(
    region: &MmapRegion,
    layout: &ScopeBufferLayout,
    scope_idx: usize,
) -> Option<i32> {
    let buf_offset = *layout.scope_offsets.get(scope_idx)?;
    region.read_i32_ne(buf_offset + SB_OFF_STAGE)
}

/// Read the most-recently-completed slot of `scope_buffer[scope_idx]` via a
/// non-mutating, read-only protocol: sample `_stage`, resolve
/// `_state[stage].data` by offset_ptr math, copy the floats out.
pub fn read_scope_slot(
    region: &MmapRegion,
    layout: &ScopeBufferLayout,
    scope_idx: usize,
) -> Result<ScopeReadResult, String> {
    if scope_idx >= layout.count {
        return Err(format!(
            "scope_idx {} out of range (count {})",
            scope_idx, layout.count
        ));
    }
    let buf_offset = layout.scope_offsets[scope_idx];

    let status = region
        .read_i32_ne(buf_offset)
        .ok_or_else(|| "scope_buffer status field OOB".to_string())?;
    if status != 1 {
        return Ok(ScopeReadResult::NotInitialized);
    }
    let size = region
        .read_u32_ne(buf_offset + 4)
        .ok_or_else(|| "scope_buffer size field OOB".to_string())? as usize;
    let channels = region
        .read_u32_ne(buf_offset + 8)
        .ok_or_else(|| "scope_buffer channels field OOB".to_string())? as usize;
    if channels == 0 || size == 0 {
        return Ok(ScopeReadResult::NotInitialized);
    }

    let stage = region
        .read_i32_ne(buf_offset + SB_OFF_STAGE)
        .ok_or_else(|| "scope_buffer _stage field OOB".to_string())?;
    if !(0..=2).contains(&stage) {
        return Err(format!(
            "scope_buffer[{}] _stage out of range: {}",
            scope_idx, stage
        ));
    }
    let stage = stage as usize;

    let state_offset = buf_offset + SB_OFF_STATE_ARRAY + stage * SB_DATA_DESC_SIZE;
    let data_field_offset = state_offset + DD_OFF_DATA;
    let raw_offset_ptr = region
        .read_i64_ne(data_field_offset)
        .ok_or_else(|| "scope_buffer _state[stage].data field OOB".to_string())?;
    if raw_offset_ptr == OFFSET_PTR_NULL || raw_offset_ptr == 0 {
        return Ok(ScopeReadResult::NoData);
    }
    let data_byte_offset = (data_field_offset as i64 + raw_offset_ptr) as usize;

    let frames = region
        .read_u32_ne(state_offset + DD_OFF_FRAMES)
        .ok_or_else(|| "scope_buffer _state[stage].frames field OOB".to_string())?
        as usize;
    if frames == 0 || frames > size {
        return Ok(ScopeReadResult::NoData);
    }

    let total_floats = frames
        .checked_mul(channels)
        .ok_or_else(|| format!("scope_buffer[{}] frames*channels overflow", scope_idx))?;
    let total_bytes = total_floats
        .checked_mul(4)
        .ok_or_else(|| "scope_buffer total byte count overflow".to_string())?;
    if data_byte_offset + total_bytes > region.size() {
        return Err(format!(
            "scope_buffer[{}] slot data OOB: offset {} + {} bytes > segment {}",
            scope_idx,
            data_byte_offset,
            total_bytes,
            region.size()
        ));
    }

    let mut floats = Vec::with_capacity(total_floats);
    for i in 0..total_floats {
        let f = region
            .read_f32_ne(data_byte_offset + i * 4)
            .ok_or_else(|| "scope_buffer slot data read OOB".to_string())?;
        floats.push(f);
    }

    Ok(ScopeReadResult::Data {
        floats,
        channels,
        frames,
        stage,
    })
}
