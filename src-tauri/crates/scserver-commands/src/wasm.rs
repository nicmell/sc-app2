//! The wasm binding layer (feature `wasm`): wasm-bindgen exports over the
//! address-tagged serde model, built by `yarn generate:server-commands`
//! (wasm-pack) into `packages/server-commands/pkg`.
//!
//! Commands never cross as JS values: the generated builders (see
//! `commands/wasm_gen.rs`) return wire BYTES directly, and `encode_bundle`
//! frames pre-encoded elements without decoding. Only replies cross as
//! typed values — with the `/scope/chunk` arm serialized by hand so its
//! samples land as ONE `Float32Array` memcpy (the ~47 Hz streaming path).

use js_sys::{Array, Float32Array, Reflect, Uint8Array};
use wasm_bindgen::prelude::*;

use crate::args::OscTimetag;
use crate::commands::OtherMsg;
use crate::replies::{KnownReply, ScopeChunkReply};
use crate::{ntp_from_unix_ms, ServerMessage, ServerReply};

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

export function encode_bundle(time: OscTimetag, elements: Uint8Array[]): Uint8Array;
export function decode_reply(bytes: Uint8Array): ServerReply;
export function decode_reply_packet(bytes: Uint8Array): ServerReply[];
export function decode_raw_packet(bytes: Uint8Array): OtherMsg[];
export function raw_bytes(address: string, args: Array<number | string | Uint8Array>): Uint8Array;
"#;

fn osc_to_flat(msg: crate::OscMessage) -> Result<JsValue, JsError> {
    let flat = OtherMsg {
        address: msg.address,
        args: crate::args::osc_args(&msg.args),
    };
    serde_wasm_bindgen::to_value(&flat).map_err(|e| JsError::new(&e.to_string()))
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

/// The escape hatch: a raw address + leniently-coerced args, encoded
/// straight to wire bytes like every generated builder.
#[wasm_bindgen(skip_typescript)]
pub fn raw_bytes(address: String, args: Array) -> Result<Uint8Array, JsError> {
    let args = args
        .iter()
        .map(|v| crate::commands::wasm::js_osc_arg(&v, "raw"))
        .collect::<Result<Vec<_>, _>>()?;
    let msg = OtherMsg { address, args };
    let bytes = ServerMessage::Other(msg)
        .encode()
        .map_err(|e| JsError::new(&e.to_string()))?;
    Ok(Uint8Array::from(bytes.as_slice()))
}

/// Serialise many commands into one standard OSC bundle — scsynth applies
/// the whole bundle atomically at the timetag.
#[wasm_bindgen(skip_typescript)]
pub fn encode_bundle(time: JsValue, elements: Array) -> Result<Uint8Array, JsError> {
    let time: OscTimetag =
        serde_wasm_bindgen::from_value(time).map_err(|e| JsError::new(&e.to_string()))?;
    let rosc::OscTime {
        seconds,
        fractional,
    } = time.into();
    // Pure framing: "#bundle\0" + NTP timetag + per element (i32 BE size +
    // the element's already-encoded bytes). No decode, no re-encode.
    let mut out: Vec<u8> = Vec::with_capacity(16);
    out.extend_from_slice(b"#bundle\0");
    out.extend_from_slice(&seconds.to_be_bytes());
    out.extend_from_slice(&fractional.to_be_bytes());
    for element in elements.iter() {
        if !element.is_instance_of::<Uint8Array>() {
            return Err(JsError::new("encode_bundle: elements must be Uint8Array"));
        }
        let bytes = Uint8Array::from(element).to_vec();
        out.extend_from_slice(&(bytes.len() as i32).to_be_bytes());
        out.extend_from_slice(&bytes);
    }
    Ok(Uint8Array::from(out.as_slice()))
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
