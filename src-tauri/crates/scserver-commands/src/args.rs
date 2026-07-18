//! The crate-owned variadic-argument type: what `Other` messages, reply
//! extras, and the variadic commands (`/b_gen`, `/cmd`, `/u_cmd`) carry
//! instead of raw `rosc::OscType` (rosc has no serde support, and the wasm
//! boundary needs serde + TypeScript shapes). Externally tagged — one-key
//! objects like `{ "int32": 5 }` / `{ "blob": Uint8Array }` on the JS side.

use rosc::OscType;
use serde::{Deserialize, Serialize};
#[cfg(feature = "wasm")]
use tsify::Tsify;

#[derive(Debug, Clone, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[serde(rename_all = "lowercase")]
pub enum OscArg {
    Int32(i32),
    Float32(f32),
    Float64(f64),
    String(String),
    Blob(
        #[serde(with = "serde_bytes")]
        #[cfg_attr(feature = "wasm", tsify(type = "Uint8Array"))]
        Vec<u8>,
    ),
}

impl From<OscArg> for OscType {
    fn from(a: OscArg) -> Self {
        match a {
            OscArg::Int32(v) => OscType::Int(v),
            OscArg::Float32(v) => OscType::Float(v),
            OscArg::Float64(v) => OscType::Double(v),
            OscArg::String(s) => OscType::String(s),
            OscArg::Blob(b) => OscType::Blob(b),
        }
    }
}

impl From<&OscType> for OscArg {
    /// Non-SC rosc types (Time, Midi, …) fall back to an empty blob — the
    /// scsynth protocol never emits them.
    fn from(t: &OscType) -> Self {
        match t {
            OscType::Int(v) => OscArg::Int32(*v),
            OscType::Float(v) => OscArg::Float32(*v),
            OscType::Double(v) => OscArg::Float64(*v),
            OscType::String(s) => OscArg::String(s.clone()),
            OscType::Blob(b) => OscArg::Blob(b.clone()),
            _ => OscArg::Blob(Vec::new()),
        }
    }
}

impl OscArg {
    /// The arg as an `i32`, when it is one.
    pub fn as_int(&self) -> Option<i32> {
        match self {
            OscArg::Int32(v) => Some(*v),
            _ => None,
        }
    }
}

pub(crate) fn osc_args(args: &[OscType]) -> Vec<OscArg> {
    args.iter().map(OscArg::from).collect()
}

/// An NTP timetag as the wasm boundary carries it (mirrors `rosc::OscTime`,
/// which has no serde support).
#[derive(Debug, Clone, Copy, PartialEq, Serialize, Deserialize)]
#[cfg_attr(feature = "wasm", derive(Tsify))]
#[cfg_attr(feature = "wasm", tsify(into_wasm_abi, from_wasm_abi))]
#[serde(rename_all = "camelCase")]
pub struct OscTimetag {
    pub seconds: u32,
    pub fractional: u32,
}

impl From<rosc::OscTime> for OscTimetag {
    fn from(t: rosc::OscTime) -> Self {
        Self {
            seconds: t.seconds,
            fractional: t.fractional,
        }
    }
}

impl From<OscTimetag> for rosc::OscTime {
    fn from(t: OscTimetag) -> Self {
        Self {
            seconds: t.seconds,
            fractional: t.fractional,
        }
    }
}
