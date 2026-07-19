// The typed UGen builder surface over wasm: one function per builder × rate,
// delegating to the crate's typed builders. The generated macro invocation is
// committed in `wasm_gen.rs`; this file keeps the hand-written JS
// conversion helpers.

#![allow(warnings)]

use wasm_bindgen::prelude::*;

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

include!("wasm_gen.rs");
