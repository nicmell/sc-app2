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

pub mod builders;
mod env;
mod env_registry;
mod error;
mod operators;
mod rate;
mod registry;
mod specs;
mod synthdef;

#[cfg(feature = "wasm")]
mod wasm;

#[cfg(feature = "component")]
mod component;

pub use env::{curve_type, curve_value, encode_env, Curve, Curves, EnvSpec};
pub use env_registry::{
    build_env, lookup_env, BuildOpts, EnvArg, EnvArgValue, EnvShapeEntry, ENV_SHAPES,
};
pub use error::CompileError;
pub use operators::{binary_op_index, unary_op_index};
pub use rate::Rate;
pub use registry::{lookup_ugen, ugens_by_category, UGenRegistryEntry};
pub use synthdef::{
    parse_scgf, InputSpec, OutputSpec, ParamName, Parameters, SynthDef, SynthDefJson, UGenInput,
    UGenJson,
};
