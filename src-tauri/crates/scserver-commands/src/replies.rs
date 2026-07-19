//! Typed parsers for the server-sent OSC replies documented in the SC
//! Server Command Reference.
//!
//! Usage:
//!
//! ```no_run
//! use scserver_commands::{KnownReply, ServerReply};
//! let bytes = [/* … from UDP socket … */];
//! match ServerReply::decode(&bytes).unwrap() {
//!     ServerReply::Known(KnownReply::Done { command, .. }) => println!("done: {command}"),
//!     ServerReply::Known(KnownReply::NGo(n)) => println!("node {} started", n.node_id),
//!     _ => {}
//! }
//! ```

use rosc::OscType;
use serde::{Deserialize, Serialize};
#[cfg(feature = "wasm")]
use tsify::Tsify;

use crate::args::{osc_args, OscArg};
use crate::commands::OtherMsg;
use crate::{CommandError, OscMessage};

/// Every catalogued server-to-client reply, one variant per address. Like
/// [`crate::commands::KnownMessage`], the serde representation is internally
/// tagged BY THE OSC ADDRESS — a decoded reply crosses the wasm boundary as
/// an adjacently tagged `{ "address": "/n_go", "args": { …fields } }` object,
/// so the address is the TypeScript discriminant and the payload rides in
/// `args`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(tag = "address", content = "args", rename_all_fields = "camelCase")]
pub enum KnownReply {
    /// Acknowledges an async command. (`command` is the first wire arg —
    /// the address of the ACKNOWLEDGED command; the reply's own address,
    /// `/done`, is the serde tag, hence the field rename.)
    #[serde(rename = "/done")]
    Done {
        /// Address of the command being acknowledged (e.g. `/notify`).
        command: String,
        /// Any additional args (e.g. the clientID a `/notify` ack echoes).
        extras: Vec<OscArg>,
    },
    #[serde(rename = "/fail")]
    Fail {
        /// Address of the command that failed.
        command: String,
        error: String,
        extras: Vec<OscArg>,
    },
    #[serde(rename = "/late")]
    Late {
        seconds: i32,
        fractions: i32,
        late_secs: i32,
        late_fracs: i32,
    },
    #[serde(rename = "/n_go")]
    NGo(NodeInfo),
    #[serde(rename = "/n_end")]
    NEnd(NodeInfo),
    #[serde(rename = "/n_on")]
    NOn(NodeInfo),
    #[serde(rename = "/n_off")]
    NOff(NodeInfo),
    #[serde(rename = "/n_move")]
    NMove(NodeInfo),
    #[serde(rename = "/n_info")]
    NInfo(NodeInfo),
    #[serde(rename = "/status.reply")]
    StatusReply(StatusReply),
    #[serde(rename = "/tr")]
    Tr {
        node_id: i32,
        trigger_id: i32,
        value: f32,
    },
    /// Samples read from a buffer in response to `/b_getn`.
    #[serde(rename = "/b_setn")]
    BSetn(BSetnReply),
    /// Response to a `/sync` command — carries the sync id supplied by
    /// the client so callers can correlate request ↔ reply.
    #[serde(rename = "/synced")]
    Synced { sync_id: i32 },
    /// sc-app bridge extension: one streamed scope chunk (`/scope/chunk`,
    /// emitted by the bridge in response to a `ScopeSubscribe`).
    #[serde(rename = "/scope/chunk")]
    ScopeChunk(ScopeChunkReply),
}

/// A reply in transit: catalogued, or the raw fallback for any address the
/// parser doesn't know (shares [`OtherMsg`] with the command side). Plain
/// enum — the wasm boundary serializes each arm itself, so no serde here.
#[derive(Debug, Clone, PartialEq)]
pub enum ServerReply {
    Known(KnownReply),
    Other(OtherMsg),
}

/// Shared arg layout for `/n_go`, `/n_end`, `/n_on`, `/n_off`, `/n_move`,
/// `/n_info`. The last two fields are only present when the node is a
/// group.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub struct NodeInfo {
    pub node_id: i32,
    pub parent_id: i32,
    pub prev_node: i32,
    pub next_node: i32,
    /// 1 if the node is a group, 0 if a synth.
    pub is_group: i32,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[cfg_attr(feature = "wasm", tsify(optional))]
    pub head_node: Option<i32>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    #[cfg_attr(feature = "wasm", tsify(optional))]
    pub tail_node: Option<i32>,
}

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub struct StatusReply {
    pub unused: i32,
    pub num_ugens: i32,
    pub num_synths: i32,
    pub num_groups: i32,
    pub num_synth_defs: i32,
    pub avg_cpu: f32,
    pub peak_cpu: f32,
    pub nominal_sample_rate: f64,
    pub actual_sample_rate: f64,
}

/// Payload of a `/b_setn` reply — samples read from a buffer.
///
/// The SC wire format is: `/b_setn bufnum startIndex N sample0 sample1 … sampleN-1`.
#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "camelCase")]
pub struct BSetnReply {
    pub bufnum: i32,
    pub start: i32,
    pub samples: Vec<f32>,
}

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

impl ServerReply {
    /// Decode raw OSC reply bytes into a typed variant.
    pub fn decode(bytes: &[u8]) -> Result<Self, CommandError> {
        Self::from_message(OscMessage::decode(bytes)?)
    }

    /// Dispatch an already-decoded message into the typed variant whose
    /// OSC address it matches. Unknown addresses become `Other(..)`.
    pub fn from_message(msg: OscMessage) -> Result<Self, CommandError> {
        let known = |k: KnownReply| Ok(Self::Known(k));
        match msg.address.as_str() {
            "/done" => known(KnownReply::Done {
                command: take_string(&msg, 0, "/done")?,
                extras: osc_args(&msg.args[1..]),
            }),
            "/fail" => known(KnownReply::Fail {
                command: take_string(&msg, 0, "/fail")?,
                error: take_string(&msg, 1, "/fail").unwrap_or_default(),
                extras: msg.args.get(2..).map(osc_args).unwrap_or_default(),
            }),
            "/late" => known(KnownReply::Late {
                seconds: take_int(&msg, 0, "/late")?,
                fractions: take_int(&msg, 1, "/late")?,
                late_secs: take_int(&msg, 2, "/late")?,
                late_fracs: take_int(&msg, 3, "/late")?,
            }),
            "/n_go" => known(KnownReply::NGo(parse_node_info(&msg)?)),
            "/n_end" => known(KnownReply::NEnd(parse_node_info(&msg)?)),
            "/n_on" => known(KnownReply::NOn(parse_node_info(&msg)?)),
            "/n_off" => known(KnownReply::NOff(parse_node_info(&msg)?)),
            "/n_move" => known(KnownReply::NMove(parse_node_info(&msg)?)),
            "/n_info" => known(KnownReply::NInfo(parse_node_info(&msg)?)),
            "/status.reply" => known(KnownReply::StatusReply(StatusReply {
                unused: take_int(&msg, 0, "/status.reply")?,
                num_ugens: take_int(&msg, 1, "/status.reply")?,
                num_synths: take_int(&msg, 2, "/status.reply")?,
                num_groups: take_int(&msg, 3, "/status.reply")?,
                num_synth_defs: take_int(&msg, 4, "/status.reply")?,
                avg_cpu: take_float(&msg, 5, "/status.reply")?,
                peak_cpu: take_float(&msg, 6, "/status.reply")?,
                nominal_sample_rate: take_double(&msg, 7, "/status.reply")?,
                actual_sample_rate: take_double(&msg, 8, "/status.reply")?,
            })),
            "/tr" => known(KnownReply::Tr {
                node_id: take_int(&msg, 0, "/tr")?,
                trigger_id: take_int(&msg, 1, "/tr")?,
                value: take_float(&msg, 2, "/tr")?,
            }),
            "/b_setn" => {
                // /b_setn bufnum startIndex N sample0 sample1 … sampleN-1
                let bufnum = take_int(&msg, 0, "/b_setn")?;
                let start = take_int(&msg, 1, "/b_setn")?;
                let count = take_int(&msg, 2, "/b_setn")? as usize;
                let mut samples = Vec::with_capacity(count);
                for i in 0..count {
                    samples.push(take_float(&msg, 3 + i, "/b_setn")?);
                }
                known(KnownReply::BSetn(BSetnReply {
                    bufnum,
                    start,
                    samples,
                }))
            }
            "/synced" => known(KnownReply::Synced {
                sync_id: take_int(&msg, 0, "/synced")?,
            }),
            SCOPE_CHUNK_ADDRESS => {
                let blob = take_blob(&msg, 4, SCOPE_CHUNK_ADDRESS)?;
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
                known(KnownReply::ScopeChunk(ScopeChunkReply {
                    sub_id: take_int(&msg, 0, SCOPE_CHUNK_ADDRESS)?,
                    tick_index: take_int(&msg, 1, SCOPE_CHUNK_ADDRESS)?,
                    is_gap: take_int(&msg, 2, SCOPE_CHUNK_ADDRESS)? != 0,
                    channels: take_int(&msg, 3, SCOPE_CHUNK_ADDRESS)?,
                    samples,
                }))
            }
            _ => Ok(Self::Other(OtherMsg {
                address: msg.address,
                args: osc_args(&msg.args),
            })),
        }
    }
}

fn parse_node_info(msg: &OscMessage) -> Result<NodeInfo, CommandError> {
    let addr = msg.address.clone();
    Ok(NodeInfo {
        node_id: take_int(msg, 0, &addr)?,
        parent_id: take_int(msg, 1, &addr)?,
        prev_node: take_int(msg, 2, &addr)?,
        next_node: take_int(msg, 3, &addr)?,
        is_group: take_int(msg, 4, &addr)?,
        head_node: msg.args.get(5).and_then(as_int),
        tail_node: msg.args.get(6).and_then(as_int),
    })
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

fn take_float(msg: &OscMessage, i: usize, addr: &str) -> Result<f32, CommandError> {
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

fn take_double(msg: &OscMessage, i: usize, addr: &str) -> Result<f64, CommandError> {
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

fn take_string(msg: &OscMessage, i: usize, addr: &str) -> Result<String, CommandError> {
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

fn take_blob<'a>(msg: &'a OscMessage, i: usize, addr: &str) -> Result<&'a [u8], CommandError> {
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

fn as_int(v: &OscType) -> Option<i32> {
    match v {
        OscType::Int(i) => Some(*i),
        _ => None,
    }
}

fn as_float(v: &OscType) -> Option<f32> {
    match v {
        OscType::Float(f) => Some(*f),
        _ => None,
    }
}

fn as_double(v: &OscType) -> Option<f64> {
    match v {
        OscType::Double(d) => Some(*d),
        _ => None,
    }
}

fn as_string(v: &OscType) -> Option<&str> {
    match v {
        OscType::String(s) => Some(s.as_str()),
        _ => None,
    }
}

fn as_blob(v: &OscType) -> Option<&[u8]> {
    match v {
        OscType::Blob(b) => Some(b.as_slice()),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn done_reply_roundtrip() {
        let m = OscMessage::new("/done").arg("/notify").arg(0i32);
        match ServerReply::from_message(m).unwrap() {
            ServerReply::Known(KnownReply::Done { command, extras }) => {
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
            ServerReply::Known(KnownReply::Synced { sync_id }) => assert_eq!(sync_id, 42),
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

        let r = KnownReply::Synced { sync_id: 7 };
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
