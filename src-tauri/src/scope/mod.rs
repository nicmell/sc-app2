//! SHM scope streaming: `ScopeOut2` tap synths write scsynth's shared-memory
//! scope buffers; the WS task polls them on a timer and streams completed
//! slots to the browser as `/scope/chunk` OSC messages.
//!
//! This module owns ALL the scope semantics; the WS pump only routes frames
//! and ferries bytes (see [`crate::router::ws`]). [`shm`] is the byte-level
//! reader; [`ScopeSubscription`] is one slot's poll cursor; [`SessionScopes`]
//! is one session's whole scope state — the subId-keyed subscriptions, the
//! span-gated subscribe/unsubscribe frame handling, and the latest-only
//! staging of encoded chunks the pump drains when the socket is free. It is
//! OWNED by the session's WS task (a session lives exactly as long as its
//! socket), so none of this state needs locking.
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

use std::collections::HashMap;
use std::sync::Arc;
use std::time::Duration;

use rosc::{OscMessage, OscPacket, OscType};

use crate::core::osc::{decode_message, int_arg};
use crate::core::scsynth::SessionBlock;
use shm::{find_scope_buffer_array, shm_path, MmapRegion, ScopeBufferLayout, ScopeReadResult};

/// How often the WS task polls SHM for new scope slots. A `_stage`-only peek
/// per subscription each tick; the data copy happens only when a new frame is
/// ready (~chunkSize/sampleRate ≈ 47 Hz at 1024/48k), so over-polling is cheap.
pub const SCOPE_POLL: Duration = Duration::from_millis(5);

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

/// Parse a `/scope/unsubscribe subId` message into the subId to drop. (The
/// TS counterpart is `scopeUnsubscribe(subId)` in
/// `packages/server-commands/src/commands/scope.ts`.)
pub fn parse_unsubscribe(msg: &OscMessage) -> Option<i32> {
    int_arg(msg.args.first()?)
}

/// Encode a `/scope/chunk subId tickIndex isGap channels data:blob` message.
/// The blob is `frames × channels` IEEE-754 float32 in **big-endian**,
/// channel-interleaved (matched by the worker's `parseScopeChunkArgs`).
/// `ne_samples` is the slot's raw native-endian f32 bytes straight from SHM
/// — byte-swapped into the blob in this single pass (swapping the u32 bit
/// pattern swaps the f32 it encodes).
pub fn encode_scope_chunk(
    sub_id: u32,
    tick_index: u32,
    is_gap: bool,
    channels: u32,
    ne_samples: &[u8],
) -> Vec<u8> {
    let mut blob = Vec::with_capacity(ne_samples.len());
    for chunk in ne_samples.chunks_exact(4) {
        let bits = u32::from_ne_bytes(chunk.try_into().expect("chunks_exact(4)"));
        blob.extend_from_slice(&bits.to_be_bytes());
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
            Ok(ScopeReadResult::Data { samples, channels, stage, frames }) => {
                self.last_stage = stage as i32;
                self.tick = self.tick.wrapping_add(1);
                self.idle_polls = 0;
                // Ground-truth probe: is scsynth actually writing audio into the
                // SHM slot? Gated on SC_SCOPE_DEBUG, sampled ~1×/sec, logs the
                // slot's min/max so a flat-zero scope can be traced to the source.
                if self.debug && self.tick % 50 == 1 {
                    let (mut min, mut max) = (f32::INFINITY, f32::NEG_INFINITY);
                    for chunk in samples.chunks_exact(4) {
                        let f = f32::from_ne_bytes(chunk.try_into().expect("chunks_exact(4)"));
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
                    &samples,
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

/// One session's whole scope state, owned by its WS task: the subId-keyed
/// subscriptions (one per mounted `<sc-scope>`), the span gate, and the
/// latest-only staging of encoded chunks. The pump feeds it `/scope/*`
/// frames and its poll timer, and drains [`next_chunk`](Self::next_chunk)
/// only when no control traffic is waiting — chunks are DISPOSABLE (a fresh
/// one supersedes them ~chunk-cadence later), so a newer chunk replaces an
/// unsent older one and stream data never delays the control acks
/// (`/n_go`, `/synced`) the frontend's load pass gates on.
pub struct SessionScopes {
    /// The session's assigned slot span — the subscribe gate.
    block: SessionBlock,
    /// Subscriptions keyed by the frontend-minted subId.
    subs: HashMap<i32, ScopeSubscription>,
    /// Encoded chunks awaiting the socket, latest-only per subId.
    pending: HashMap<i32, Vec<u8>>,
}

impl SessionScopes {
    pub fn new(block: SessionBlock) -> Self {
        Self { block, subs: HashMap::new(), pending: HashMap::new() }
    }

    /// Whether the pump's poll timer should run at all.
    pub fn is_active(&self) -> bool {
        !self.subs.is_empty()
    }

    /// Whether a staged chunk is waiting for the socket.
    pub fn has_pending(&self) -> bool {
        !self.pending.is_empty()
    }

    /// Handle a `/scope/subscribe` frame: parse, gate the requested slot on
    /// the session's span (so concurrent sessions can't stomp each other's
    /// SHM scope buffers — the span is server-assigned; a violation means a
    /// frontend allocator bug, not user input), and install the
    /// subscription. Re-subscribing an existing subId replaces it (fresh
    /// SHM cursor). Malformed frames are ignored.
    pub fn subscribe(&mut self, bytes: &[u8], shm: Option<Arc<ScopeShm>>) {
        let Some((sub_id, scope_idx)) =
            decode_message(bytes).as_ref().and_then(parse_subscribe)
        else {
            tracing::debug!("malformed /scope/subscribe ignored");
            return;
        };
        if !self.block.owns_scope_index(scope_idx) {
            tracing::warn!(
                sub_id, scope_idx,
                base = self.block.scope_index_base, count = self.block.scope_index_count,
                "scope subscribe outside session block; ignored"
            );
            return;
        }
        tracing::debug!(sub_id, scope_idx, have_shm = shm.is_some(), "scope subscribe");
        self.subs.insert(sub_id, ScopeSubscription::new(sub_id, scope_idx, shm));
    }

    /// Handle a `/scope/unsubscribe subId` frame: drop that subscription and
    /// its staged chunk. Malformed or unknown subIds are ignored (logged) —
    /// an unsubscribe racing a socket close is normal, not an error.
    pub fn unsubscribe(&mut self, bytes: &[u8]) {
        let Some(sub_id) = decode_message(bytes).as_ref().and_then(parse_unsubscribe) else {
            tracing::debug!("malformed /scope/unsubscribe ignored");
            return;
        };
        if self.subs.remove(&sub_id).is_none() {
            tracing::debug!(sub_id, "unsubscribe for unknown scope subId");
            return;
        }
        self.pending.remove(&sub_id);
    }

    /// One poll tick: a cheap `_stage`-only peek per subscription; fresh
    /// slots are encoded and staged (no I/O here — the pump drains them).
    pub fn poll(&mut self) {
        for (&sub_id, sub) in self.subs.iter_mut() {
            if let Some(chunk) = sub.poll() {
                self.pending.insert(sub_id, chunk);
            }
        }
    }

    /// Take one staged chunk for sending.
    pub fn next_chunk(&mut self) -> Option<Vec<u8>> {
        let sub_id = *self.pending.keys().next()?;
        self.pending.remove(&sub_id)
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::core::scsynth::session_block;

    fn frame(addr: &str, args: Vec<OscType>) -> Vec<u8> {
        rosc::encoder::encode(&OscPacket::Message(OscMessage { addr: addr.into(), args }))
            .expect("encode frame")
    }

    fn subscribe_frame(sub_id: i32, scope: i32) -> Vec<u8> {
        frame(
            SCOPE_SUBSCRIBE,
            vec![OscType::Int(sub_id), OscType::Int(scope), OscType::Int(2), OscType::Int(1024)],
        )
    }

    #[test]
    fn parse_unsubscribe_extracts_sub_id() {
        let msg = |args: Vec<OscType>| OscMessage { addr: SCOPE_UNSUBSCRIBE.into(), args };
        assert_eq!(parse_unsubscribe(&msg(vec![OscType::Int(7)])), Some(7));
        assert_eq!(parse_unsubscribe(&msg(vec![])), None);
        assert_eq!(parse_unsubscribe(&msg(vec![OscType::String("7".into())])), None);
    }

    #[test]
    fn subscribe_gates_slots_on_the_session_span() {
        // Session 2: base = SCOPE_SPAN, so both span bounds are real.
        let block = session_block(1, 2);
        let mut scopes = SessionScopes::new(block);
        assert!(!scopes.is_active());

        // In-span slot installs; out-of-span and garbage are ignored.
        scopes.subscribe(&subscribe_frame(1, block.scope_index_base), None);
        assert!(scopes.is_active());
        scopes.subscribe(&subscribe_frame(2, block.scope_index_base - 1), None);
        scopes.subscribe(b"garbage", None);
        scopes.unsubscribe(&frame(SCOPE_UNSUBSCRIBE, vec![OscType::Int(2)]));
        assert!(scopes.is_active()); // subId 2 was never installed; 1 remains
    }

    #[test]
    fn unsubscribe_removes_only_the_named_sub() {
        let block = session_block(1, 1);
        let mut scopes = SessionScopes::new(block);
        scopes.subscribe(&subscribe_frame(7, block.scope_index_base), None);
        scopes.subscribe(&subscribe_frame(8, block.scope_index_base + 1), None);

        scopes.unsubscribe(&frame(SCOPE_UNSUBSCRIBE, vec![OscType::Int(7)]));
        assert!(scopes.is_active());

        // Garbage frames and unknown subIds leave the rest untouched.
        scopes.unsubscribe(b"garbage");
        scopes.unsubscribe(&frame(SCOPE_UNSUBSCRIBE, vec![OscType::Int(99)]));
        assert!(scopes.is_active());

        scopes.unsubscribe(&frame(SCOPE_UNSUBSCRIBE, vec![OscType::Int(8)]));
        assert!(!scopes.is_active());
        // Nothing staged without SHM; the drain seam is empty, not stuck.
        assert!(!scopes.has_pending());
        assert!(scopes.next_chunk().is_none());
    }

    /// Pin the `/scope/chunk` wire format the TS worker decodes: 5 args
    /// (subId, tickIndex, isGap, channels, blob) and a **big-endian** float32
    /// blob (`1.0` → `3F 80 00 00`), matched by `parseScopeChunkArgs` /
    /// `decodeBlobFloatsBE` in `packages/server-commands/src/commands/scope.ts`.
    /// The encoder's input is the slot's raw native-endian bytes, as
    /// read_scope_slot returns them.
    #[test]
    fn encode_scope_chunk_round_trips_with_be_blob() {
        let ne_samples: Vec<u8> = [1.0f32, -1.0f32]
            .iter()
            .flat_map(|f| f.to_ne_bytes())
            .collect();
        let bytes = encode_scope_chunk(7, 3, false, 2, &ne_samples);
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
