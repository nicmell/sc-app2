// The typed command-builder surface over wasm: one exported function per
// command, returning the WIRE BYTES directly — construction and OSC
// encoding fused into a single boundary crossing (no intermediate JS
// value to serialize out and re-parse). The generated functions are committed in
// `wasm_gen.rs`; this file keeps the hand-written JS coercion helpers —
// every coercer is LENIENT the way the old TS builders were: plain numbers
// and strings coerce into the polymorphic OSC arg shapes, and pair tails
// also accept a `{ key: value }` object.

#![allow(unused)]

use js_sys::{Reflect, Uint8Array};
use wasm_bindgen::prelude::*;

// The command structs + KnownMessage live on the parent module.
use super::*;
use crate::args::OscArg;

pub(crate) fn cerr(what: &str, expected: &str) -> JsError {
    JsError::new(&format!("{what}: expected {expected}"))
}

pub(crate) fn encode_msg(msg: KnownMessage) -> Result<Uint8Array, JsError> {
    let bytes = msg.encode().map_err(|e| JsError::new(&e.to_string()))?;
    Ok(Uint8Array::from(bytes.as_slice()))
}

// ── primitives ──────────────────────────────────────────────────────────

pub(crate) fn js_i32(v: &JsValue, what: &str) -> Result<i32, JsError> {
    v.as_f64()
        .map(|n| n as i32)
        .ok_or_else(|| cerr(what, "a number"))
}

pub(crate) fn js_f32(v: &JsValue, what: &str) -> Result<f32, JsError> {
    v.as_f64()
        .map(|n| n as f32)
        .ok_or_else(|| cerr(what, "a number"))
}

pub(crate) fn js_string(v: &JsValue, what: &str) -> Result<String, JsError> {
    v.as_string().ok_or_else(|| cerr(what, "a string"))
}

pub(crate) fn js_blob(v: &JsValue, what: &str) -> Result<Vec<u8>, JsError> {
    if v.is_instance_of::<Uint8Array>() {
        Ok(Uint8Array::from(v.clone()).to_vec())
    } else {
        Err(cerr(what, "a Uint8Array"))
    }
}

/// One key off an options object (absent/undefined → None).
pub(crate) fn opt_key(opts: &JsValue, key: &str) -> Option<JsValue> {
    if opts.is_undefined() || opts.is_null() {
        return None;
    }
    let v = Reflect::get(opts, &JsValue::from_str(key)).ok()?;
    if v.is_undefined() {
        None
    } else {
        Some(v)
    }
}

// ── the polymorphic OSC arg shapes (numeric-typing rule: integer → int,
//    else float — what the wire has always carried) ─────────────────────

fn is_int(n: f64) -> bool {
    n.fract() == 0.0 && n.is_finite()
}

pub(crate) fn js_control_id(v: &JsValue, what: &str) -> Result<ControlId, JsError> {
    if let Some(s) = v.as_string() {
        return Ok(ControlId::Name(s));
    }
    if let Some(n) = v.as_f64() {
        return Ok(ControlId::Index(n as i32));
    }
    serde_wasm_bindgen::from_value(v.clone()).map_err(|_| cerr(what, "a control name or index"))
}

pub(crate) fn js_numeric_value(v: &JsValue, what: &str) -> Result<NumericValue, JsError> {
    if let Some(n) = v.as_f64() {
        return Ok(if is_int(n) {
            NumericValue::Int(n as i32)
        } else {
            NumericValue::Float(n as f32)
        });
    }
    serde_wasm_bindgen::from_value(v.clone()).map_err(|_| cerr(what, "a number"))
}

pub(crate) fn js_control_value(v: &JsValue, what: &str) -> Result<ControlValue, JsError> {
    if let Some(s) = v.as_string() {
        return Ok(ControlValue::Bus(s));
    }
    if let Some(n) = v.as_f64() {
        return Ok(if is_int(n) {
            ControlValue::Int(n as i32)
        } else {
            ControlValue::Float(n as f32)
        });
    }
    serde_wasm_bindgen::from_value(v.clone())
        .map_err(|_| cerr(what, "a number or a c/a bus-mapping string"))
}

pub(crate) fn js_osc_arg(v: &JsValue, what: &str) -> Result<OscArg, JsError> {
    if let Some(s) = v.as_string() {
        return Ok(OscArg::String(s));
    }
    if let Some(n) = v.as_f64() {
        return Ok(if is_int(n) {
            OscArg::Int32(n as i32)
        } else {
            OscArg::Float32(n as f32)
        });
    }
    if v.is_instance_of::<Uint8Array>() {
        return Ok(OscArg::Blob(Uint8Array::from(v.clone()).to_vec()));
    }
    serde_wasm_bindgen::from_value(v.clone())
        .map_err(|_| cerr(what, "a number, string or Uint8Array"))
}

// ── containers ──────────────────────────────────────────────────────────

fn js_array(v: &JsValue, what: &str) -> Result<js_sys::Array, JsError> {
    if js_sys::Array::is_array(v) {
        Ok(js_sys::Array::from(v))
    } else {
        Err(cerr(what, "an array"))
    }
}

/// A repeated single-value field (absent → empty).
pub(crate) fn js_list<T>(
    v: &JsValue,
    what: &str,
    f: impl Fn(&JsValue, &str) -> Result<T, JsError>,
) -> Result<Vec<T>, JsError> {
    if v.is_undefined() || v.is_null() {
        return Ok(Vec::new());
    }
    js_array(v, what)?.iter().map(|x| f(&x, what)).collect()
}

fn tuple(v: &JsValue, arity: usize, what: &str) -> Result<js_sys::Array, JsError> {
    let a = js_array(v, what)?;
    if a.length() as usize != arity {
        return Err(cerr(what, &format!("{arity}-element tuples")));
    }
    Ok(a)
}

/// A pair tail. Accepts an array of `[a, b]` tuples, or — when the pairs
/// are keyed by name — a plain `{ key: value }` object (the `nSet`/
/// `dirtPlay` sugar). Absent → empty.
pub(crate) fn js_pairs<A, B>(
    v: &JsValue,
    what: &str,
    fa: impl Fn(&JsValue, &str) -> Result<A, JsError>,
    fb: impl Fn(&JsValue, &str) -> Result<B, JsError>,
) -> Result<Vec<(A, B)>, JsError> {
    if v.is_undefined() || v.is_null() {
        return Ok(Vec::new());
    }
    if !js_sys::Array::is_array(v) && v.is_object() {
        return js_sys::Object::entries(&js_sys::Object::from(v.clone()))
            .iter()
            .map(|entry| {
                let e = js_sys::Array::from(&entry);
                Ok((fa(&e.get(0), what)?, fb(&e.get(1), what)?))
            })
            .collect();
    }
    js_array(v, what)?
        .iter()
        .map(|t| {
            let t = tuple(&t, 2, what)?;
            Ok((fa(&t.get(0), what)?, fb(&t.get(1), what)?))
        })
        .collect()
}

/// A triple tail (absent → empty).
pub(crate) fn js_triples<A, B, C>(
    v: &JsValue,
    what: &str,
    fa: impl Fn(&JsValue, &str) -> Result<A, JsError>,
    fb: impl Fn(&JsValue, &str) -> Result<B, JsError>,
    fc: impl Fn(&JsValue, &str) -> Result<C, JsError>,
) -> Result<Vec<(A, B, C)>, JsError> {
    if v.is_undefined() || v.is_null() {
        return Ok(Vec::new());
    }
    js_array(v, what)?
        .iter()
        .map(|t| {
            let t = tuple(&t, 3, what)?;
            Ok((
                fa(&t.get(0), what)?,
                fb(&t.get(1), what)?,
                fc(&t.get(2), what)?,
            ))
        })
        .collect()
}

/// A setn tail: `[head, values[]]` groups (absent → empty).
pub(crate) fn js_setn<H, V>(
    v: &JsValue,
    what: &str,
    fh: impl Fn(&JsValue, &str) -> Result<H, JsError>,
    fv: impl Fn(&JsValue, &str) -> Result<V, JsError> + Copy,
) -> Result<Vec<(H, Vec<V>)>, JsError> {
    if v.is_undefined() || v.is_null() {
        return Ok(Vec::new());
    }
    js_array(v, what)?
        .iter()
        .map(|t| {
            let t = tuple(&t, 2, what)?;
            Ok((fh(&t.get(0), what)?, js_list(&t.get(1), what, fv)?))
        })
        .collect()
}

include!("wasm_gen.rs");
