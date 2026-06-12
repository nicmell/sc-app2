//! The `/scope/*` wire protocol — the cross-language contract.
//!
//! These addresses + the `/scope/chunk` arg layout must match the TypeScript
//! side: `packages/server-commands/src/commands/scope.ts` (`SCOPE_*_ADDRESS`,
//! `scopeSubscribe`, `scopeUnsubscribe`, `parseScopeChunkArgs`,
//! `decodeBlobFloatsBE`). Keep the two in sync; the `encode_scope_chunk`
//! golden test below pins the wire bytes (subId/tickIndex/isGap/channels + a
//! big-endian float32 blob) against drift.

use rosc::{OscMessage, OscPacket, OscType};

use crate::core::osc::int_arg;

/// OSC addresses the frontend sends to (de)register a scope-slot stream.
pub const SCOPE_SUBSCRIBE: &str = "/scope/subscribe";
pub const SCOPE_UNSUBSCRIBE: &str = "/scope/unsubscribe";
/// OSC address the bridge streams chunks back on.
pub const SCOPE_CHUNK: &str = "/scope/chunk";

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
/// planar — one frame run per channel, the SHM slot's own layout (matched
/// by the worker's `parseScopeChunkArgs`).
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parse_unsubscribe_extracts_sub_id() {
        let msg = |args: Vec<OscType>| OscMessage { addr: SCOPE_UNSUBSCRIBE.into(), args };
        assert_eq!(parse_unsubscribe(&msg(vec![OscType::Int(7)])), Some(7));
        assert_eq!(parse_unsubscribe(&msg(vec![])), None);
        assert_eq!(parse_unsubscribe(&msg(vec![OscType::String("7".into())])), None);
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
