//! Minimal SHM scope: a fixed tap on scsynth's master out, polled from the WS
//! task on a timer and streamed to the browser as `/scope/chunk` OSC messages.
//!
//! This is the SHM-only, single-scope slice of upstream sc-app's scope system:
//! no OSC `/b_getn` fallback, no per-bus ref-counting, no scope-buffer
//! allocator, and no `/clock/tick` dependency — the WS pump just polls a
//! [`ScopeSubscription`] on a timer (see [`crate::router::ws`]). [`shm`] is the
//! byte-level reader; this module owns the subscription, the `/scope/*` wire
//! helpers, and the address constants.
//!
//! ## Wire contract (must match the TS worker)
//!
//! These addresses + the `/scope/chunk` arg layout are the cross-language
//! contract. The TypeScript side is `packages/server-commands/src/commands/
//! scope.ts` (`SCOPE_*_ADDRESS`, `scopeSubscribe`, `parseScopeChunkArgs`,
//! `decodeBlobFloatsBE`). Keep the two in sync; the `encode_scope_chunk` golden
//! test below pins the wire bytes (subId/tickIndex/isGap/channels + a
//! big-endian float32 blob) against drift.

pub mod shm;

use std::sync::Arc;

use rosc::{OscMessage, OscPacket, OscType};

use crate::core::osc::int_arg;
use shm::{find_scope_buffer_array, shm_path, MmapRegion, ScopeBufferLayout, ScopeReadResult};

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

/// One WebSocket's master-out scope subscription: the SHM mapping + the
/// triple-buffer cursor. The WS pump polls [`poll`](Self::poll) on a timer and
/// forwards whatever bytes it returns.
pub struct ScopeSubscription {
    sub_id: i32,
    scope_idx: usize,
    /// `_stage` of the last slot we emitted; `-1` until the first frame.
    last_stage: i32,
    /// Monotonic chunk counter, echoed to the worker for ordering/diagnostics.
    tick: u32,
    /// The shared SHM mmap (cached at subscribe; `None` if unavailable).
    shm: Option<Arc<ScopeShm>>,
    /// Consecutive polls where the slot had no fresh data (diagnostics only).
    idle_polls: u32,
    /// Whether `SC_SCOPE_DEBUG` is set (read once at subscribe).
    debug: bool,
}

impl ScopeSubscription {
    pub fn new(sub_id: i32, scope_idx: usize, shm: Option<Arc<ScopeShm>>) -> Self {
        Self {
            sub_id,
            scope_idx,
            last_stage: -1,
            tick: 0,
            shm,
            idle_polls: 0,
            debug: std::env::var_os("SC_SCOPE_DEBUG").is_some(),
        }
    }

    /// If a new SHM slot is ready, encode the `/scope/chunk` frame to send.
    /// `None` when there's no SHM or no fresh slot since the last poll (the
    /// common case — a cheap `_stage` peek before any data copy).
    pub fn poll(&mut self) -> Option<Vec<u8>> {
        let shm = self.shm.as_ref()?;
        let stage = shm::read_scope_stage(&shm.region, &shm.layout, self.scope_idx)?;
        if stage == self.last_stage {
            return None;
        }
        match shm::read_scope_slot(&shm.region, &shm.layout, self.scope_idx) {
            Ok(ScopeReadResult::Data { floats, channels, stage, frames }) => {
                self.last_stage = stage as i32;
                self.tick = self.tick.wrapping_add(1);
                self.idle_polls = 0;
                // Ground-truth probe: is scsynth actually writing audio into the
                // SHM slot? Gated on SC_SCOPE_DEBUG, sampled ~1×/sec, logs the
                // slot's min/max so a flat-zero scope can be traced to the source.
                if self.debug && self.tick % 50 == 1 {
                    let (mut min, mut max) = (f32::INFINITY, f32::NEG_INFINITY);
                    for &f in &floats {
                        min = min.min(f);
                        max = max.max(f);
                    }
                    tracing::info!(
                        scope = self.scope_idx,
                        tick = self.tick,
                        channels,
                        frames,
                        stage,
                        min,
                        max,
                        "scope SHM slot"
                    );
                }
                Some(encode_scope_chunk(
                    self.sub_id as u32,
                    self.tick,
                    false,
                    channels as u32,
                    &floats,
                ))
            }
            // NotInitialized / NoData: leave `last_stage` so we retry next poll.
            // Under SC_SCOPE_DEBUG, surface the stuck state ~1×/sec so "no chunks
            // at all" (tap not writing / buffer never initialized) is visible.
            Ok(result) => {
                self.idle_polls = self.idle_polls.wrapping_add(1);
                if self.debug && self.idle_polls % 200 == 1 {
                    let state = match result {
                        ScopeReadResult::NotInitialized => "not-initialized (ScopeOut2 hasn't run)",
                        ScopeReadResult::NoData => "no-data (no slot pushed yet)",
                        ScopeReadResult::Data { .. } => "data",
                    };
                    tracing::info!(
                        scope = self.scope_idx,
                        idle_polls = self.idle_polls,
                        state,
                        "scope slot has no fresh data"
                    );
                }
                None
            }
            Err(e) => {
                tracing::debug!(error = %e, "scope slot read failed");
                None
            }
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Pin the `/scope/chunk` wire format the TS worker decodes: 5 args
    /// (subId, tickIndex, isGap, channels, blob) and a **big-endian** float32
    /// blob (`1.0` → `3F 80 00 00`), matched by `parseScopeChunkArgs` /
    /// `decodeBlobFloatsBE` in `packages/server-commands/src/commands/scope.ts`.
    #[test]
    fn encode_scope_chunk_round_trips_with_be_blob() {
        let bytes = encode_scope_chunk(7, 3, false, 2, &[1.0, -1.0]);
        let (_, packet) = rosc::decoder::decode_udp(&bytes).expect("decode");
        let OscPacket::Message(msg) = packet else {
            panic!("expected a message");
        };
        assert_eq!(msg.addr, SCOPE_CHUNK);
        assert_eq!(int_arg(&msg.args[0]), Some(7)); // subId
        assert_eq!(int_arg(&msg.args[1]), Some(3)); // tickIndex
        assert_eq!(int_arg(&msg.args[2]), Some(0)); // isGap
        assert_eq!(int_arg(&msg.args[3]), Some(2)); // channels
        let OscType::Blob(blob) = &msg.args[4] else {
            panic!("expected a blob");
        };
        // 2 floats × 4 bytes, big-endian.
        assert_eq!(blob.len(), 8);
        assert_eq!(&blob[0..4], &[0x3F, 0x80, 0x00, 0x00]); // 1.0 BE
        assert_eq!(&blob[4..8], &[0xBF, 0x80, 0x00, 0x00]); // -1.0 BE
    }
}
