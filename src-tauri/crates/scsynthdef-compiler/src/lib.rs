//! SuperCollider SynthDef (SCgf v2) compiler.
//!
//! Library-only crate that writes and reads the [SynthDef File Format v2]
//! binary, matching the byte-for-byte output of `sclang`'s built-in
//! SynthDef encoder. See [`SynthDef`] for the programmatic builder.
//!
//! [SynthDef File Format v2]: https://doc.sccode.org/Reference/Synth-Definition-File-Format.html

// Vendored from nicmell/sc-crates: keep upstream style — the app's
// clippy -D warnings gate would fail on stylistic lints here.
#![allow(clippy::all)]

#[macro_use]
mod ugens_macro;
mod envs;
mod error;
mod operators;
mod rate;
mod synthdef;
pub mod ugens;

#[cfg(feature = "wasm")]
mod wasm;

pub use envs::spec::{curve_type, curve_value, encode_env, Curve, Curves, EnvSpec};
pub use envs::{build_env, lookup_env, BuildOpts, EnvArg, EnvArgValue, EnvShapeEntry, ENV_SHAPES};
pub use error::CompileError;
pub use operators::{binary_op_index, unary_op_index};
pub use rate::Rate;
pub use synthdef::{
    parse_scgf, InputSpec, OutputSpec, ParamName, Parameters, SynthDef, SynthDefJson, UGenInput,
    UGenJson,
};
