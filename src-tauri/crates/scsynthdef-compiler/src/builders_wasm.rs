// The typed UGen builder surface over wasm: one function per builder ×
// rate, delegating to the crate's typed builders (registry defaults come
// from the builders' factory seeds) — emitted by build.rs from
// assets/specs/ugens.json through the `sc_ugens_wasm!` macro. Signatures
// are declared precisely in the generated typescript_custom_section
// (every function here is skip_typescript).

#![allow(warnings)]

use wasm_bindgen::prelude::*;

use crate::builders;
use crate::wasm::{input_from_js, input_to_js, WasmSynthDef};

fn opt(args: &JsValue, key: &str) -> Option<JsValue> {
    if args.is_undefined() || args.is_null() {
        return None;
    }
    let v = js_sys::Reflect::get(args, &JsValue::from_str(key)).ok()?;
    if v.is_undefined() {
        None
    } else {
        Some(v)
    }
}

fn inputs_from_js(v: &JsValue) -> Result<Vec<crate::UGenInput>, JsError> {
    js_sys::Array::from(v)
        .iter()
        .map(|x| input_from_js(&x))
        .collect()
}

include!(concat!(env!("OUT_DIR"), "/ugen_builders_wasm.rs"));
