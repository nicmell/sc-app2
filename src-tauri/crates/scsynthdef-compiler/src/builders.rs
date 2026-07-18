//! Typed UGen builders, one struct per bundled UGen — emitted by build.rs
//! from `assets/specs/ugens.json` (repo root) through the `sc_ugens!`
//! macro (`src/ugens_macro.rs`): rate factories seed the registry
//! defaults, per-arg setters take `impl Into<UGenInput>`, and `build()`
//! materialises the node in the spec's wire input order. Edit the spec,
//! never the expansion.

#![allow(
    non_camel_case_types,
    unused_mut,
    unused_variables,
    clippy::useless_conversion,
    clippy::needless_update
)]

use crate::{Rate, SynthDef, UGenInput};

include!(concat!(env!("OUT_DIR"), "/ugen_builders.rs"));
