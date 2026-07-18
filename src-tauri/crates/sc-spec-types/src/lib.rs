//! Serde types for the spec JSON files committed under `assets/specs/`.
//!
//! These specs are the single source of truth for the UGen registry, the
//! server-command catalog, and the envelope-shape table. The sc-crates'
//! `build.rs` scripts deserialize them through this crate (every struct is
//! `deny_unknown_fields`, so a typo'd spec fails the build with a pointed
//! serde error) and emit thin macro-invocation registries into `OUT_DIR`.

use std::fmt::Display;
use std::path::Path;

use serde::Deserialize;

fn load<T: for<'de> Deserialize<'de>>(path: &Path) -> Result<T, String> {
    let text = std::fs::read_to_string(path)
        .map_err(|e| format!("{}: {e}", path.display()))?;
    serde_json::from_str(&text).map_err(|e| format!("{}: {e}", path.display()))
}

// ── ugens.json ──────────────────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct UgensSpec {
    pub categories: Vec<UgenCategory>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct UgenCategory {
    pub name: String,
    pub ugens: Vec<UgenSpec>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct UgenSpec {
    pub name: String,
    pub rates: Vec<RateSpec>,
    /// `null` = the default single output; a number = fixed count
    /// (0 for pure sinks like `Out`); `{"fromArg": "numChannels"}` = the
    /// count comes from a `u32` builder arg.
    #[serde(default)]
    pub num_outputs: Option<NumOutputs>,
    #[serde(default)]
    pub summary: Option<String>,
    #[serde(default)]
    pub doc: Option<String>,
    #[serde(default)]
    pub signal_range: Option<String>,
    #[serde(default)]
    pub extends: Option<String>,
    /// Registry-only entries (BinaryOpUGen/UnaryOpUGen/… — built through
    /// `operators.rs`, not a typed builder struct).
    #[serde(default)]
    pub no_builder: bool,
    /// Wire input order for the builder's `build()`, when it differs from
    /// the `args` order (which stays the registry/sclang signature order —
    /// e.g. `BufWr` documents `inputArray` first but scsynth wants it
    /// last). Names of the pushed args (`input`/`inputArray` kinds) only.
    #[serde(default)]
    pub build_order: Option<Vec<String>>,
    pub args: Vec<UgenArg>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum RateSpec {
    Ar,
    Kr,
    Ir,
}

impl RateSpec {
    /// The `Rate` enum variant name (`Audio`/`Control`/`Scalar`).
    pub fn rate_variant(self) -> &'static str {
        match self {
            RateSpec::Ar => "Audio",
            RateSpec::Kr => "Control",
            RateSpec::Ir => "Scalar",
        }
    }

    /// The factory-method suffix (`ar`/`kr`/`ir`).
    pub fn suffix(self) -> &'static str {
        match self {
            RateSpec::Ar => "ar",
            RateSpec::Kr => "kr",
            RateSpec::Ir => "ir",
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", untagged, deny_unknown_fields)]
pub enum NumOutputs {
    Fixed(u32),
    #[serde(rename_all = "camelCase")]
    FromArg {
        from_arg: String,
    },
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct UgenArg {
    pub name: String,
    #[serde(default)]
    pub kind: UgenArgKind,
    #[serde(default)]
    pub default: Option<f64>,
    #[serde(default)]
    pub doc: Option<String>,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Default, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum UgenArgKind {
    /// A `UGenInput` builder field (the default).
    #[default]
    Input,
    /// A `Vec<UGenInput>` variadic field (`.extend`ed into the inputs).
    InputArray,
    /// A plain `u32` builder field (never an input; feeds `numOutputs`).
    U32,
}

pub fn load_ugens(path: &Path) -> Result<UgensSpec, String> {
    load(path)
}

// ── server-commands.json ────────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CommandsSpec {
    pub commands: Vec<CommandSpec>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CommandSpec {
    pub address: String,
    #[serde(rename = "struct")]
    pub struct_name: String,
    #[serde(default)]
    pub doc: Option<String>,
    /// Empty = a unit command (no payload struct fields, unit
    /// `KnownMessage` arm).
    pub fields: Vec<CommandField>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct CommandField {
    pub name: String,
    pub form: FieldForm,
    #[serde(default)]
    pub doc: Option<String>,
}

/// The OSC-encoding form of one command field. Externally tagged, so unit
/// variants read as plain strings (`"completion"`) and payload variants as
/// one-key objects (`{"scalar": "i32"}`).
#[derive(Debug, Clone, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum FieldForm {
    /// Required scalar, pushed unconditionally.
    Scalar(ScalarTy),
    /// Trailing optional scalar (`if let Some`).
    OptionScalar(OptionScalarTy),
    /// `completion_msg: Option<Vec<u8>>` — serde_bytes triplet, always
    /// last, excluded from `new()`.
    Completion,
    /// Required `Vec<u8>` blob (`/d_recv`).
    Blob,
    /// Repeated `Vec<T>`, one OSC arg per element.
    List(ListTy),
    /// `Vec<OscArg>` free-form tail (`.extend`).
    Variadic,
    /// Repeated fixed-shape tuple groups `Vec<(..)>`.
    Tail(Vec<TupleTy>),
    /// The setn family: `Vec<(head, Vec<value>)>` with a `len() as i32`
    /// prefix between head and values.
    SetnTail { head: TupleTy, values: TupleTy },
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ScalarTy {
    I32,
    F32,
    String,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum OptionScalarTy {
    I32,
    F32,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum ListTy {
    I32,
    String,
    ControlId,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum TupleTy {
    I32,
    F32,
    ControlId,
    NumericValue,
    ControlValue,
}

pub fn load_commands(path: &Path) -> Result<CommandsSpec, String> {
    load(path)
}

// ── envs.json ───────────────────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EnvsSpec {
    pub shapes: Vec<EnvShapeSpec>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EnvShapeSpec {
    pub name: String,
    #[serde(default)]
    pub release_node: Option<i32>,
    #[serde(default)]
    pub loop_node: Option<i32>,
    #[serde(default)]
    pub doc: Option<String>,
    pub args: Vec<EnvArgSpec>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(rename_all = "camelCase", deny_unknown_fields)]
pub struct EnvArgSpec {
    pub name: String,
    pub default: f64,
    #[serde(default)]
    pub array: bool,
    #[serde(default)]
    pub modulatable: bool,
    #[serde(default)]
    pub doc: Option<String>,
}

pub fn load_envs(path: &Path) -> Result<EnvsSpec, String> {
    load(path)
}

/// Format an f64 default as a Rust f32 literal (always with a decimal
/// point or exponent, so the emitted token is unambiguously a float).
pub fn f32_literal(v: f64) -> String {
    let s = format!("{v}");
    if s.contains('.') || s.contains('e') || s.contains("inf") || s.contains("NaN") {
        s
    } else {
        format!("{s}.0")
    }
}

impl Display for RateSpec {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.write_str(self.suffix())
    }
}
