//! The wasm binding layer (feature `wasm`): wasm-bindgen exports over the
//! address-tagged serde model, built by `yarn generate:server-commands`
//! (wasm-pack) into `packages/server-commands/pkg`.
//!
//! One deliberate asymmetry: the boundary discriminates known-vs-other
//! ITSELF (on the escape hatch's `args` marker field) instead of leaning on
//! an untagged serde wrapper — and the `/scope/chunk` reply arm is
//! serialized by hand so its samples cross as ONE `Float32Array` memcpy
//! rather than a boxed `number[]` (the ~47 Hz streaming hot path).

use js_sys::{Array, Float32Array, Reflect, Uint8Array};
use wasm_bindgen::prelude::*;

use crate::args::OscTimetag;
use crate::commands::{KnownMessage, OtherMsg};
use crate::replies::{KnownReply, ScopeChunkReply};
use crate::{ntp_from_unix_ms, ServerMessage, ServerReply};

fn parse_message(msg: &JsValue) -> Result<ServerMessage, JsError> {
    // Both shapes carry `args` now — a catalogued command's payload OBJECT
    // vs the escape hatch's `OscArg[]` ARRAY. Dispatching on Array.isArray
    // (rather than try-known-first) keeps a raw message with a catalogued
    // address from silently dropping args to serde's unknown-field
    // tolerance.
    let args = Reflect::get(msg, &JsValue::from_str("args")).unwrap_or(JsValue::UNDEFINED);
    if js_sys::Array::is_array(&args) {
        return serde_wasm_bindgen::from_value::<OtherMsg>(msg.clone())
            .map(ServerMessage::Other)
            .map_err(|e| JsError::new(&format!("not a valid raw message: {e}")));
    }
    serde_wasm_bindgen::from_value::<KnownMessage>(msg.clone())
        .map(ServerMessage::Known)
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
            // The payload rides nested under `args` (adjacent tagging) —
            // inject the Float32Array there, not on the envelope.
            let args = Reflect::get(&obj, &JsValue::from_str("args"))
                .map_err(|_| JsError::new("scope chunk: missing args object"))?;
            Reflect::set(&args, &JsValue::from_str("samples"), &data)
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
export function message_to_osc(msg: ServerMessage): OtherMsg;
export function decode_raw_packet(bytes: Uint8Array): OtherMsg[];
export function raw_message(address: string, args: Array<number | string | Uint8Array>): OtherMsg;
"#;

fn osc_to_flat(msg: crate::OscMessage) -> Result<JsValue, JsError> {
    let flat = OtherMsg {
        address: msg.address,
        args: crate::args::osc_args(&msg.args),
    };
    serde_wasm_bindgen::to_value(&flat).map_err(|e| JsError::new(&e.to_string()))
}

/// Lower one typed command to its raw wire view (`{ address, args }` with
/// the args in wire ORDER) via `to_osc_message()` — the console's tx log
/// rendering, definitionally in sync with the encoder.
#[wasm_bindgen(skip_typescript)]
pub fn message_to_osc(msg: JsValue) -> Result<JsValue, JsError> {
    osc_to_flat(parse_message(&msg)?.to_osc_message())
}

/// Decode an inbound packet — a bare message or a `#bundle` — into raw
/// `{ address, args }` views with NO typed mapping: the rx log rendering
/// and the tests' wire-truth view.
#[wasm_bindgen(skip_typescript)]
pub fn decode_raw_packet(bytes: &[u8]) -> Result<Array, JsError> {
    let out = Array::new();
    let mut push = |m: rosc::OscMessage| -> Result<(), JsError> {
        out.push(&osc_to_flat(crate::OscMessage::from(m))?);
        Ok(())
    };
    if bytes.first() == Some(&b'#') {
        let packet = rosc::decoder::decode_udp(bytes)
            .map_err(|e| JsError::new(&format!("{e:?}")))?
            .1;
        let rosc::OscPacket::Bundle(bundle) = packet else {
            return Err(JsError::new("expected OSC bundle, got a bare message"));
        };
        for elem in bundle.content {
            match elem {
                rosc::OscPacket::Message(m) => push(m)?,
                rosc::OscPacket::Bundle(_) => {
                    return Err(JsError::new("nested bundles are not supported"));
                }
            }
        }
    } else {
        let packet = rosc::decoder::decode_udp(bytes)
            .map_err(|e| JsError::new(&format!("{e:?}")))?
            .1;
        let rosc::OscPacket::Message(m) = packet else {
            return Err(JsError::new("expected a bare OSC message"));
        };
        push(m)?;
    }
    Ok(out)
}

/// The escape hatch: a raw address + leniently-coerced args, outside the
/// command catalogue.
#[wasm_bindgen(skip_typescript)]
pub fn raw_message(address: String, args: Array) -> Result<JsValue, JsError> {
    let args = args
        .iter()
        .map(|v| crate::commands::wasm::js_osc_arg(&v, "raw"))
        .collect::<Result<Vec<_>, _>>()?;
    let msg = OtherMsg { address, args };
    serde_wasm_bindgen::to_value(&msg).map_err(|e| JsError::new(&e.to_string()))
}

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
