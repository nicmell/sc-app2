//! The slot reader: a non-mutating, read-only protocol over the triple
//! buffer. This reader cannot take the buffer's reader role (no `_out` swap,
//! no `changed` handshake — the mapping is PROT_READ), so freshness is
//! `_stage` equality against the caller's last read, and torn reads are
//! DETECTED rather than prevented: `_stage` is re-checked after the copy and
//! the data discarded when it moved (the next poll picks up the new slot).

use super::layout::{
    ScopeBufferLayout, DD_OFF_DATA, DD_OFF_FRAMES, OFFSET_PTR_NULL, SB_DATA_DESC_SIZE,
    SB_OFF_STAGE, SB_OFF_STATE_ARRAY,
};
use super::mmap::MmapRegion;

/// Result of [`read_scope_slot`].
#[derive(Debug)]
pub enum ScopeReadResult {
    /// `_status` is free or header fields are zero — ScopeOut2 hasn't run yet.
    NotInitialized,
    /// Initialized but no slot pushed yet (data offset_ptr is null), or a
    /// push landed mid-copy (torn read — the next poll picks up the new slot).
    NoData,
    /// A completed slot.
    Data {
        /// The slot's raw samples: `frames × channels` **native-endian** f32
        /// bytes, channel-interleaved — a straight memcpy of the SHM region;
        /// the wire encoder byte-swaps them in its single pass.
        samples: Vec<u8>,
        channels: usize,
        /// Frame count for this slot. Kept for completeness; the chunk encoder
        /// derives length from `samples`, so callers may ignore it.
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
    region.read_i32_acquire(buf_offset + SB_OFF_STAGE)
}

/// Read the most-recently-completed slot of `scope_buffer[scope_idx]`: sample
/// `_stage`, resolve `_state[stage].data` by offset_ptr math, copy the bytes
/// out, and re-check `_stage` (torn-read detection).
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

    // Acquire: orders the header fields (`_size`, `_channels`) written
    // before the writer flipped `_status` to initialized.
    let status = region
        .read_i32_acquire(buf_offset)
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

    // Acquire: orders the staged slot's samples (written before the push
    // published this `_stage` value) ahead of the copy below.
    let stage = region
        .read_i32_acquire(buf_offset + SB_OFF_STAGE)
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
    let end = data_byte_offset
        .checked_add(total_bytes)
        .filter(|&end| end <= region.size())
        .ok_or_else(|| {
            format!(
                "scope_buffer[{}] slot data OOB: offset {} + {} bytes > segment {}",
                scope_idx,
                data_byte_offset,
                total_bytes,
                region.size()
            )
        })?;

    // One bounds check, then a straight memcpy of the slot's bytes.
    let samples = region.as_slice()[data_byte_offset..end].to_vec();

    // Re-check `_stage` after the copy: this reader is a non-participant in
    // the triple buffer (read-only mmap — it can't take the `_out` role), and
    // a push swaps `_in` ↔ `_stage`, making the slot we just copied the
    // writer's NEXT target. If a push landed mid-copy the data may be torn —
    // drop it; the next poll emits the freshly completed slot instead.
    let stage_after = region
        .read_i32_acquire(buf_offset + SB_OFF_STAGE)
        .ok_or_else(|| "scope_buffer _stage field OOB".to_string())?;
    if stage_after != stage as i32 {
        return Ok(ScopeReadResult::NoData);
    }

    Ok(ScopeReadResult::Data {
        samples,
        channels,
        frames,
        stage,
    })
}
