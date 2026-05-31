//! Minimal SHM scope: a fixed tap on scsynth's master out, polled from the WS
//! task on a timer and streamed to the browser as `/scope/chunk` OSC messages.
//!
//! This is the SHM-only, single-scope slice of upstream sc-app's scope system:
//! no OSC `/b_getn` fallback, no per-bus ref-counting, no scope-buffer
//! allocator, and no `/clock/tick` dependency — the WS task polls SHM directly
//! (see [`crate::router::ws`]). [`shm`] is the byte-level reader; this module
//! adds the mmap handle, the `/scope/*` wire helpers, and the address constants.

pub mod shm;

use rosc::{OscMessage, OscPacket, OscType};

use crate::core::osc::int_arg;
use shm::{find_scope_buffer_array, shm_path, MmapRegion, ScopeBufferLayout};

/// OSC address the frontend sends to (de)register the master-out scope.
pub const SCOPE_SUBSCRIBE: &str = "/scope/subscribe";
pub const SCOPE_UNSUBSCRIBE: &str = "/scope/unsubscribe";
/// OSC address the bridge streams chunks back on.
pub const SCOPE_CHUNK: &str = "/scope/chunk";

/// A mmap of scsynth's SHM segment plus the resolved scope_buffer index map.
/// Opened once per server (lazily, on first subscribe) and shared across WS.
pub struct ScopeShm {
    pub region: MmapRegion,
    pub layout: ScopeBufferLayout,
}

impl ScopeShm {
    /// mmap the segment for `scsynth_port` and locate its scope-buffer vector.
    pub fn open(scsynth_port: u16) -> Result<Self, String> {
        let path = shm_path(scsynth_port);
        let path_str = path.to_string_lossy().into_owned();
        let region = MmapRegion::open(&path_str)?;
        let layout = find_scope_buffer_array(&region)?;
        tracing::info!(path = %path_str, count = layout.count, "scope SHM mapped");
        Ok(ScopeShm { region, layout })
    }
}

/// Parse a `/scope/subscribe subId scope channels chunkSize` message into the
/// fields the poller needs: `(sub_id, scope_idx)`. (channels/chunkSize are
/// informational — the SHM header carries the real channel + frame counts.)
pub fn parse_subscribe(msg: &OscMessage) -> Option<(i32, usize)> {
    let sub_id = int_arg(msg.args.first()?)?;
    let scope = int_arg(msg.args.get(1)?)?;
    if scope < 0 {
        return None;
    }
    Some((sub_id, scope as usize))
}

/// Encode a `/scope/chunk subId tickIndex isGap channels data:blob` message.
/// The blob is `frames × channels` IEEE-754 float32 in **big-endian**,
/// channel-interleaved (matched by the worker's `parseScopeChunkArgs`).
pub fn encode_scope_chunk(
    sub_id: u32,
    tick_index: u32,
    is_gap: bool,
    channels: u32,
    interleaved_floats: &[f32],
) -> Vec<u8> {
    let mut blob = Vec::with_capacity(interleaved_floats.len() * 4);
    for &f in interleaved_floats {
        blob.extend_from_slice(&f.to_be_bytes());
    }
    let msg = OscMessage {
        addr: SCOPE_CHUNK.into(),
        args: vec![
            OscType::Int(sub_id as i32),
            OscType::Int(tick_index as i32),
            OscType::Int(if is_gap { 1 } else { 0 }),
            OscType::Int(channels as i32),
            OscType::Blob(blob),
        ],
    };
    rosc::encoder::encode(&OscPacket::Message(msg)).expect("encode /scope/chunk")
}
