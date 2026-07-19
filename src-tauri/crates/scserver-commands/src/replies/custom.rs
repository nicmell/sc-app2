//! The hand-written half of the reply surface: the typed-value accessors
//! the generated dispatch parses with, plus the two replies whose layouts
//! are bespoke — `/scope/chunk` (bridge-emitted, big-endian float32 blob
//! with a native-endian encode fast path) and `/g_queryTree.reply` (a
//! variable, recursive node walk). Everything regular is generated into
//! the sibling `mod.rs` from the spec's `replies` section.

use rosc::OscType;
use serde::{Deserialize, Serialize};
#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::args::OscArg;
use crate::{CommandError, OscMessage};

/// sc-app bridge extension: payload of a `/scope/chunk` reply — one chunk
/// of a scope-slot stream.
///
/// Wire layout: `subId:i tickIndex:i isGap:i channels:i data:b`, where the
/// blob is `frames × channels` IEEE-754 float32 in **big-endian**, planar
/// (one frame run per channel — the SHM slot's own layout). The crate owns
/// the byte swap in both directions: `samples` is the decoded host-endian
/// `Vec<f32>` (crossing the wasm boundary as a `Float32Array` — the binding
/// layer builds that arm manually, see `wasm.rs`), and
/// [`ScopeChunkReply::encode`] writes it back big-endian. Unlike the
/// scsynth replies above, the bridge is the EMITTER of this one — hence
/// the encode half.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub struct ScopeChunkReply {
    /// The subscription id the chunk belongs to.
    pub sub_id: i32,
    /// The bridge's monotonic poll tick — consumers detect drops by gaps.
    pub tick_index: i32,
    /// True when the bridge skipped ticks since the previous chunk.
    pub is_gap: bool,
    pub channels: i32,
    /// Planar samples, `frames × channels` floats.
    #[cfg_attr(feature = "wasm", tsify(type = "Float32Array"))]
    pub samples: Vec<f32>,
}

/// OSC address the bridge streams scope chunks back on.
pub const SCOPE_CHUNK_ADDRESS: &str = "/scope/chunk";

impl ScopeChunkReply {
    /// Encode the typed fields into an OSC `OscMessage` (samples become
    /// the big-endian float32 blob).
    pub fn to_message(self) -> OscMessage {
        let mut blob = Vec::with_capacity(self.samples.len() * 4);
        for f in self.samples {
            blob.extend_from_slice(&f.to_be_bytes());
        }
        OscMessage::with_args(
            SCOPE_CHUNK_ADDRESS,
            vec![
                OscType::Int(self.sub_id),
                OscType::Int(self.tick_index),
                OscType::Int(self.is_gap as i32),
                OscType::Int(self.channels),
                OscType::Blob(blob),
            ],
        )
    }

    /// Shortcut: build + encode to OSC wire bytes.
    pub fn encode(self) -> Result<Vec<u8>, CommandError> {
        self.to_message().encode()
    }

    /// Encode a chunk straight from a slot's raw NATIVE-endian f32 bytes
    /// (as the sc-app bridge reads them out of scsynth's SHM): the ne→BE
    /// swap happens in the single blob-building pass — no intermediate
    /// `Vec<f32>` on the bridge's ~47 Hz per-scope hot path. Rejects a
    /// misaligned byte slice like the decode side does.
    pub fn encode_ne_samples(
        sub_id: i32,
        tick_index: i32,
        is_gap: bool,
        channels: i32,
        ne_samples: &[u8],
    ) -> Result<Vec<u8>, CommandError> {
        if !ne_samples.len().is_multiple_of(4) {
            return Err(CommandError::ArgType {
                address: SCOPE_CHUNK_ADDRESS.to_string(),
                pos: 4,
                expected: "float32 bytes (length % 4 == 0)",
                got: format!("{} bytes", ne_samples.len()),
            });
        }
        let mut blob = Vec::with_capacity(ne_samples.len());
        for chunk in ne_samples.chunks_exact(4) {
            let bits = u32::from_ne_bytes(chunk.try_into().expect("chunks_exact(4)"));
            blob.extend_from_slice(&bits.to_be_bytes());
        }
        OscMessage::with_args(
            SCOPE_CHUNK_ADDRESS,
            vec![
                OscType::Int(sub_id),
                OscType::Int(tick_index),
                OscType::Int(is_gap as i32),
                OscType::Int(channels),
                OscType::Blob(blob),
            ],
        )
        .encode()
    }
}

impl ScopeChunkReply {
    /// Parse a decoded `/scope/chunk` message (the generated dispatch in
    /// `mod.rs` routes here — the BE-blob layout is bespoke).
    pub(crate) fn parse(msg: &OscMessage) -> Result<Self, CommandError> {
        let blob = take_blob(msg, 4, SCOPE_CHUNK_ADDRESS)?;
        if !blob.len().is_multiple_of(4) {
            return Err(CommandError::ArgType {
                address: SCOPE_CHUNK_ADDRESS.to_string(),
                pos: 4,
                expected: "float32 blob (length % 4 == 0)",
                got: format!("blob of {} bytes", blob.len()),
            });
        }
        let samples = blob
            .chunks_exact(4)
            .map(|c| f32::from_be_bytes(c.try_into().expect("chunks_exact(4)")))
            .collect();
        Ok(Self {
            sub_id: take_int(msg, 0, SCOPE_CHUNK_ADDRESS)?,
            tick_index: take_int(msg, 1, SCOPE_CHUNK_ADDRESS)?,
            is_gap: take_int(msg, 2, SCOPE_CHUNK_ADDRESS)? != 0,
            channels: take_int(msg, 3, SCOPE_CHUNK_ADDRESS)?,
            samples,
        })
    }
}

// ── /g_queryTree.reply ──────────────────────────────────────────────────
//
// Layout: [flag, queriedGroupId, childCount, <node>…] where each <node> is:
//   nodeId, numChildren(-1 = synth)
//   if synth:            defName
//   if synth && flag:    numControls, then numControls × (name|index, value)
//   if group:            its numChildren nodes follow inline (depth-first).
// Variable and recursive — parsed by hand; the generated dispatch routes
// here.

/// Reply to `/g_queryTree`: the queried group's subtree, depth-first.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub struct QueryTreeReply {
    /// Whether per-synth control values were included (the query's flag).
    pub with_controls: bool,
    /// The group the query was rooted at.
    pub root_group: i32,
    pub children: Vec<QueryTreeNode>,
}

/// One node of a query-tree reply.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(
    tag = "kind",
    rename_all = "camelCase",
    rename_all_fields = "camelCase"
)]
pub enum QueryTreeNode {
    Group {
        id: i32,
        children: Vec<QueryTreeNode>,
    },
    Synth {
        id: i32,
        def: String,
        controls: Vec<QueryTreeControl>,
    },
}

/// One `(name, value)` control of a synth node — the name is the declared
/// control name, or the control INDEX rendered as a string.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub struct QueryTreeControl {
    pub name: String,
    pub value: OscArg,
}

/// OSC address of the query-tree reply.
pub const QUERY_TREE_ADDRESS: &str = "/g_queryTree.reply";

impl QueryTreeReply {
    /// Parse a decoded `/g_queryTree.reply` message. Defensive like the
    /// rest of the reply parsers: a malformed tail fails with a pointed
    /// `ArgType` error rather than panicking.
    pub(crate) fn parse(msg: &OscMessage) -> Result<Self, CommandError> {
        let with_controls = take_int(msg, 0, QUERY_TREE_ADDRESS)? == 1;
        let root_group = take_int(msg, 1, QUERY_TREE_ADDRESS)?;
        let child_count = take_int(msg, 2, QUERY_TREE_ADDRESS)?.max(0);
        let mut i = 3usize;
        let mut children = Vec::new();
        for _ in 0..child_count {
            children.push(Self::parse_node(msg, &mut i, with_controls)?);
        }
        Ok(Self {
            with_controls,
            root_group,
            children,
        })
    }

    fn parse_node(
        msg: &OscMessage,
        i: &mut usize,
        with_controls: bool,
    ) -> Result<QueryTreeNode, CommandError> {
        let id = take_int(msg, *i, QUERY_TREE_ADDRESS)?;
        *i += 1;
        let n_children = take_int(msg, *i, QUERY_TREE_ADDRESS)?;
        *i += 1;
        if n_children == -1 {
            // Synth.
            let def = take_string(msg, *i, QUERY_TREE_ADDRESS)?;
            *i += 1;
            let mut controls = Vec::new();
            if with_controls {
                let n = take_int(msg, *i, QUERY_TREE_ADDRESS)?.max(0);
                *i += 1;
                for _ in 0..n {
                    // The control key is a declared name or a plain index.
                    let name = match msg.args.get(*i) {
                        Some(OscType::String(s)) => s.clone(),
                        Some(OscType::Int(v)) => v.to_string(),
                        other => {
                            return Err(CommandError::ArgType {
                                address: QUERY_TREE_ADDRESS.to_string(),
                                pos: *i,
                                expected: "control name or index",
                                got: format!("{other:?}"),
                            })
                        }
                    };
                    *i += 1;
                    let value = msg.args.get(*i).map(OscArg::from).ok_or_else(|| {
                        CommandError::ArgType {
                            address: QUERY_TREE_ADDRESS.to_string(),
                            pos: *i,
                            expected: "control value",
                            got: "missing".into(),
                        }
                    })?;
                    *i += 1;
                    controls.push(QueryTreeControl { name, value });
                }
            }
            Ok(QueryTreeNode::Synth { id, def, controls })
        } else {
            let mut children = Vec::with_capacity(n_children.max(0) as usize);
            for _ in 0..n_children {
                children.push(Self::parse_node(msg, i, with_controls)?);
            }
            Ok(QueryTreeNode::Group { id, children })
        }
    }
}

pub(crate) fn take_int(msg: &OscMessage, i: usize, addr: &str) -> Result<i32, CommandError> {
    msg.args
        .get(i)
        .and_then(as_int)
        .ok_or_else(|| CommandError::ArgType {
            address: addr.to_string(),
            pos: i,
            expected: "int32",
            got: msg
                .args
                .get(i)
                .map(|a| format!("{a:?}"))
                .unwrap_or_else(|| "missing".into()),
        })
}

pub(crate) fn take_float(msg: &OscMessage, i: usize, addr: &str) -> Result<f32, CommandError> {
    msg.args
        .get(i)
        .and_then(as_float)
        .ok_or_else(|| CommandError::ArgType {
            address: addr.to_string(),
            pos: i,
            expected: "float32",
            got: msg
                .args
                .get(i)
                .map(|a| format!("{a:?}"))
                .unwrap_or_else(|| "missing".into()),
        })
}

pub(crate) fn take_double(msg: &OscMessage, i: usize, addr: &str) -> Result<f64, CommandError> {
    msg.args
        .get(i)
        .and_then(as_double)
        .ok_or_else(|| CommandError::ArgType {
            address: addr.to_string(),
            pos: i,
            expected: "float64",
            got: msg
                .args
                .get(i)
                .map(|a| format!("{a:?}"))
                .unwrap_or_else(|| "missing".into()),
        })
}

pub(crate) fn take_string(msg: &OscMessage, i: usize, addr: &str) -> Result<String, CommandError> {
    msg.args
        .get(i)
        .and_then(as_string)
        .map(|s| s.to_string())
        .ok_or_else(|| CommandError::ArgType {
            address: addr.to_string(),
            pos: i,
            expected: "string",
            got: msg
                .args
                .get(i)
                .map(|a| format!("{a:?}"))
                .unwrap_or_else(|| "missing".into()),
        })
}

pub(crate) fn take_blob<'a>(
    msg: &'a OscMessage,
    i: usize,
    addr: &str,
) -> Result<&'a [u8], CommandError> {
    msg.args
        .get(i)
        .and_then(as_blob)
        .ok_or_else(|| CommandError::ArgType {
            address: addr.to_string(),
            pos: i,
            expected: "blob",
            got: msg
                .args
                .get(i)
                .map(|a| format!("{a:?}"))
                .unwrap_or_else(|| "missing".into()),
        })
}

pub(crate) fn as_int(v: &OscType) -> Option<i32> {
    match v {
        OscType::Int(i) => Some(*i),
        _ => None,
    }
}

pub(crate) fn as_float(v: &OscType) -> Option<f32> {
    match v {
        OscType::Float(f) => Some(*f),
        _ => None,
    }
}

pub(crate) fn as_double(v: &OscType) -> Option<f64> {
    match v {
        OscType::Double(d) => Some(*d),
        _ => None,
    }
}

pub(crate) fn as_string(v: &OscType) -> Option<&str> {
    match v {
        OscType::String(s) => Some(s.as_str()),
        _ => None,
    }
}

pub(crate) fn as_blob(v: &OscType) -> Option<&[u8]> {
    match v {
        OscType::Blob(b) => Some(b.as_slice()),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::replies::{DoneReply, KnownReply, NodeInfo, ServerReply, SyncedReply};

    #[test]
    fn done_reply_roundtrip() {
        let m = OscMessage::new("/done").arg("/notify").arg(0i32);
        match ServerReply::from_message(m).unwrap() {
            ServerReply::Known(KnownReply::Done(DoneReply { command, extras })) => {
                assert_eq!(command, "/notify");
                assert_eq!(extras.len(), 1);
            }
            other => panic!("expected Done, got {:?}", other),
        }
    }

    #[test]
    fn status_reply_roundtrip() {
        let m = OscMessage::new("/status.reply")
            .arg(1i32) // unused
            .arg(10i32) // ugens
            .arg(2i32) // synths
            .arg(3i32) // groups
            .arg(5i32) // defs
            .arg(0.1f32) // avg cpu
            .arg(0.5f32) // peak cpu
            .arg(44100.0f64)
            .arg(44100.0f64);
        match ServerReply::from_message(m).unwrap() {
            ServerReply::Known(KnownReply::StatusReply(s)) => {
                assert_eq!(s.num_ugens, 10);
                assert_eq!(s.num_synths, 2);
                assert_eq!(s.nominal_sample_rate, 44100.0);
            }
            other => panic!("expected StatusReply, got {:?}", other),
        }
    }

    #[test]
    fn n_go_roundtrip() {
        let m = OscMessage::new("/n_go")
            .arg(1001i32) // node
            .arg(0i32) // parent
            .arg(-1i32) // prev
            .arg(-1i32) // next
            .arg(0i32); // not a group
        match ServerReply::from_message(m).unwrap() {
            ServerReply::Known(KnownReply::NGo(info)) => {
                assert_eq!(info.node_id, 1001);
                assert_eq!(info.parent_id, 0);
                assert_eq!(info.is_group, 0);
                assert_eq!(info.head_node, None);
            }
            other => panic!("expected NGo, got {:?}", other),
        }
    }

    #[test]
    fn unknown_address_becomes_other() {
        let m = OscMessage::new("/some/random/addr").arg(42i32);
        let reply = ServerReply::from_message(m).unwrap();
        assert!(matches!(reply, ServerReply::Other { .. }));
    }

    #[test]
    fn b_setn_reply_lifts_samples() {
        // /b_setn bufnum=7, start=16, count=4, values 0.1..0.4
        let m = OscMessage::new("/b_setn")
            .arg(7i32)
            .arg(16i32)
            .arg(4i32)
            .arg(0.1f32)
            .arg(0.2f32)
            .arg(0.3f32)
            .arg(0.4f32);
        match ServerReply::from_message(m).unwrap() {
            ServerReply::Known(KnownReply::BSetn(b)) => {
                assert_eq!(b.bufnum, 7);
                assert_eq!(b.start, 16);
                assert_eq!(b.samples, vec![0.1, 0.2, 0.3, 0.4]);
            }
            other => panic!("expected BSetn, got {:?}", other),
        }
    }

    #[test]
    fn synced_reply_carries_id() {
        let m = OscMessage::new("/synced").arg(42i32);
        match ServerReply::from_message(m).unwrap() {
            ServerReply::Known(KnownReply::Synced(SyncedReply { sync_id })) => {
                assert_eq!(sync_id, 42)
            }
            other => panic!("expected Synced, got {:?}", other),
        }
    }

    /// The serde shape IS the wasm-boundary contract: the OSC address is the
    /// discriminant, the camelCase payload rides nested under `args`.
    #[test]
    fn known_reply_serializes_with_the_address_as_the_tag() {
        let r = KnownReply::NGo(NodeInfo {
            node_id: 1001,
            parent_id: 1,
            prev_node: -1,
            next_node: -1,
            is_group: 0,
            head_node: None,
            tail_node: None,
        });
        let j = serde_json::to_value(&r).unwrap();
        assert_eq!(j["address"], "/n_go");
        assert_eq!(j["args"]["nodeId"], 1001);
        assert!(j["args"].get("headNode").is_none()); // absent options are omitted
        assert_eq!(serde_json::from_value::<KnownReply>(j).unwrap(), r);

        let r = KnownReply::Synced(SyncedReply { sync_id: 7 });
        let j = serde_json::to_value(&r).unwrap();
        assert_eq!(j["address"], "/synced");
        assert_eq!(j["args"]["syncId"], 7);
    }

    /// Pin the `/scope/chunk` wire format the TS worker decodes: 5 args
    /// (subId, tickIndex, isGap, channels, blob) and a **big-endian**
    /// float32 blob (`1.0` → `3F 80 00 00`) — the cross-language contract
    /// with `@sc-app/server-commands`.
    #[test]
    fn scope_chunk_encodes_be_blob_and_round_trips() {
        let chunk = ScopeChunkReply {
            sub_id: 7,
            tick_index: 3,
            is_gap: false,
            channels: 2,
            samples: vec![1.0, -1.0],
        };
        let msg = chunk.clone().to_message();
        assert_eq!(msg.address, SCOPE_CHUNK_ADDRESS);
        assert_eq!(msg.args.len(), 5);
        let OscType::Blob(blob) = &msg.args[4] else {
            panic!("expected a blob");
        };
        assert_eq!(&blob[0..4], &[0x3F, 0x80, 0x00, 0x00]); // 1.0 BE
        assert_eq!(&blob[4..8], &[0xBF, 0x80, 0x00, 0x00]); // -1.0 BE
        match ServerReply::decode(&chunk.clone().encode().unwrap()).unwrap() {
            ServerReply::Known(KnownReply::ScopeChunk(back)) => assert_eq!(back, chunk),
            other => panic!("expected ScopeChunk, got {:?}", other),
        }
    }

    /// The ne-bytes fast path must produce byte-identical wire output to the
    /// typed constructor.
    #[test]
    fn scope_chunk_ne_bytes_path_matches_typed_encode() {
        let samples = [1.0f32, -1.0f32];
        let ne: Vec<u8> = samples.iter().flat_map(|f| f.to_ne_bytes()).collect();
        let fast = ScopeChunkReply::encode_ne_samples(7, 3, false, 2, &ne).unwrap();
        let typed = ScopeChunkReply {
            sub_id: 7,
            tick_index: 3,
            is_gap: false,
            channels: 2,
            samples: samples.to_vec(),
        }
        .encode()
        .unwrap();
        assert_eq!(fast, typed);
        assert!(ScopeChunkReply::encode_ne_samples(7, 3, false, 2, &ne[..5]).is_err());
    }

    #[test]
    fn scope_chunk_decode_rejects_misaligned_blob() {
        let m = OscMessage::new(SCOPE_CHUNK_ADDRESS)
            .arg(1i32)
            .arg(0i32)
            .arg(0i32)
            .arg(1i32)
            .arg(vec![0u8; 5]);
        assert!(ServerReply::from_message(m).is_err());
    }

    #[test]
    fn scope_chunk_gap_flag_is_nonzero() {
        let m = OscMessage::new(SCOPE_CHUNK_ADDRESS)
            .arg(1i32)
            .arg(9i32)
            .arg(2i32) // any nonzero is a gap
            .arg(1i32)
            .arg(Vec::<u8>::new());
        match ServerReply::from_message(m).unwrap() {
            ServerReply::Known(KnownReply::ScopeChunk(c)) => assert!(c.is_gap),
            other => panic!("expected ScopeChunk, got {:?}", other),
        }
    }
}
