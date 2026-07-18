//! The wasm binding layer (feature `wasm`): wasm-bindgen exports over the
//! address-tagged serde model, built by `yarn generate:server-commands`
//! (wasm-pack) into `packages/server-commands/pkg`.
//!
//! One deliberate asymmetry: the boundary discriminates known-vs-other
//! ITSELF (try [`KnownMessage`], fall back to [`OtherMsg`]) instead of
//! leaning on an untagged serde wrapper — and the `/scope/chunk` reply arm
//! is serialized by hand so its samples cross as ONE `Float32Array` memcpy
//! rather than a boxed `number[]` (the ~47 Hz streaming hot path).

use js_sys::{Array, Float32Array, Reflect, Uint8Array};
use wasm_bindgen::prelude::*;

use crate::args::OscTimetag;
use crate::commands::{KnownMessage, OtherMsg};
use crate::replies::{KnownReply, ScopeChunkReply};
use crate::{ntp_from_unix_ms, ServerMessage, ServerReply};

fn parse_message(msg: &JsValue) -> Result<ServerMessage, JsError> {
    if let Ok(known) = serde_wasm_bindgen::from_value::<KnownMessage>(msg.clone()) {
        return Ok(ServerMessage::Known(known));
    }
    serde_wasm_bindgen::from_value::<OtherMsg>(msg.clone())
        .map(ServerMessage::Other)
        .map_err(|e| JsError::new(&format!("not a valid server message: {e}")))
}

fn reply_to_js(reply: ServerReply) -> Result<JsValue, JsError> {
    let to_js = |v: JsValue| Ok(v);
    match reply {
        // The hot-path arm: header via serde, samples as a real Float32Array.
        ServerReply::Known(KnownReply::ScopeChunk(chunk)) => {
            let ScopeChunkReply { samples, .. } = &chunk;
            let data = Float32Array::from(samples.as_slice());
            let header = ScopeChunkReply {
                samples: Vec::new(),
                ..chunk
            };
            let obj = serde_wasm_bindgen::to_value(&KnownReply::ScopeChunk(header))
                .map_err(|e| JsError::new(&e.to_string()))?;
            Reflect::set(&obj, &JsValue::from_str("samples"), &data)
                .map_err(|_| JsError::new("scope chunk: samples assignment failed"))?;
            to_js(obj)
        }
        ServerReply::Known(k) => {
            to_js(serde_wasm_bindgen::to_value(&k).map_err(|e| JsError::new(&e.to_string()))?)
        }
        ServerReply::Other(o) => {
            to_js(serde_wasm_bindgen::to_value(&o).map_err(|e| JsError::new(&e.to_string()))?)
        }
    }
}

// The unions tsify cannot see: the wrapper enums are plain Rust (the
// boundary discriminates itself), so their TS spellings live here, next to
// the functions typed against them.
#[wasm_bindgen(typescript_custom_section)]
const TS_APPEND: &'static str = r#"
export type ServerMessage = KnownMessage | OtherMsg;
export type ServerReply = KnownReply | OtherMsg;

export function encode(msg: ServerMessage): Uint8Array;
export function encode_bundle(time: OscTimetag, msgs: ServerMessage[]): Uint8Array;
export function decode_reply(bytes: Uint8Array): ServerReply;
export function decode_reply_packet(bytes: Uint8Array): ServerReply[];
"#;

/// Serialise one typed command to OSC wire bytes.
#[wasm_bindgen(skip_typescript)]
pub fn encode(msg: JsValue) -> Result<Uint8Array, JsError> {
    let bytes = parse_message(&msg)?
        .encode()
        .map_err(|e| JsError::new(&e.to_string()))?;
    Ok(Uint8Array::from(bytes.as_slice()))
}

/// Serialise many commands into one standard OSC bundle — scsynth applies
/// the whole bundle atomically at the timetag.
#[wasm_bindgen(skip_typescript)]
pub fn encode_bundle(time: JsValue, msgs: Array) -> Result<Uint8Array, JsError> {
    let time: OscTimetag =
        serde_wasm_bindgen::from_value(time).map_err(|e| JsError::new(&e.to_string()))?;
    let content = msgs
        .iter()
        .map(|m| parse_message(&m).map(|msg| rosc::OscPacket::Message(msg.to_osc_message().into())))
        .collect::<Result<Vec<_>, _>>()?;
    let bundle = rosc::OscBundle {
        timetag: time.into(),
        content,
    };
    let bytes = rosc::encoder::encode(&rosc::OscPacket::Bundle(bundle))
        .map_err(|e| JsError::new(&format!("{e:?}")))?;
    Ok(Uint8Array::from(bytes.as_slice()))
}

/// Classify one OSC reply message into its typed variant.
#[wasm_bindgen(skip_typescript)]
pub fn decode_reply(bytes: &[u8]) -> Result<JsValue, JsError> {
    reply_to_js(ServerReply::decode(bytes).map_err(|e| JsError::new(&e.to_string()))?)
}

/// Decode a raw inbound packet — a bare message or a `#bundle` — into typed
/// replies, one per contained message. Nested bundles are rejected (scsynth
/// never sends them).
#[wasm_bindgen(skip_typescript)]
pub fn decode_reply_packet(bytes: &[u8]) -> Result<Array, JsError> {
    let out = Array::new();
    if bytes.first() == Some(&b'#') {
        let packet = rosc::decoder::decode_udp(bytes)
            .map_err(|e| JsError::new(&format!("{e:?}")))?
            .1;
        let rosc::OscPacket::Bundle(bundle) = packet else {
            return Err(JsError::new("expected OSC bundle, got a bare message"));
        };
        for elem in bundle.content {
            match elem {
                rosc::OscPacket::Message(m) => {
                    let reply = ServerReply::from_message(crate::OscMessage::from(m))
                        .map_err(|e| JsError::new(&e.to_string()))?;
                    out.push(&reply_to_js(reply)?);
                }
                rosc::OscPacket::Bundle(_) => {
                    return Err(JsError::new("nested bundles are not supported"));
                }
            }
        }
    } else {
        out.push(&decode_reply(bytes)?);
    }
    Ok(out)
}

/// Wall-clock helper: convert a Unix timestamp in milliseconds (what
/// `Date.now()` yields) into the NTP timetag a bundle carries. Negative or
/// non-finite input yields the OSC "immediate" tag `(0, 1)`.
#[wasm_bindgen]
pub fn at_unix_ms(ms: f64) -> OscTimetag {
    ntp_from_unix_ms(ms).into()
}
