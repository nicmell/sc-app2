//! The wasm-bindgen surface (feature `wasm`) — the browser build consumed by
//! `@sc-app/validate` (packages/validate). One export mirroring
//! [`crate::validate_entry`]: `Err` is the parse-failure text, `Ok` the
//! rendered violations (empty = valid). The JS wrapper turns both into the
//! canonical frontend error shapes and does the DOMParser step itself.

use wasm_bindgen::prelude::*;

/// Validate a plugin entry document. See [`crate::validate_entry`].
#[wasm_bindgen]
pub fn validate_entry(xml: &str) -> Result<Vec<String>, String> {
    crate::validate_entry(xml)
}
