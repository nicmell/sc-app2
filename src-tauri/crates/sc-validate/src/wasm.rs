//! The wasm-bindgen surface (feature `wasm`) — the browser build consumed by
//! `@sc-app/validate` (packages/validate). Exports: `validate_entry` mirrors
//! [`crate::validate_entry`] (`Ok` = STRUCTURED violations as JSON, `Err` =
//! the classified parse failure as JSON — both shapes feed editor
//! diagnostics; the display lines are pre-rendered crate-side), and
//! `element_specs` serializes the sc elements' attribute contracts for the
//! frontend's getProp/runtime-prop machinery — the ONE spec copy, read out
//! of the module the app already loads.

use serde::ser::{SerializeMap, Serializer};
use serde::Serialize;
use tsify::{Ts, Tsify};
use wasm_bindgen::prelude::*;

use crate::spec::{specs, AttrDef, AttrType, Category, COMMON_ATTRS};
use crate::{ParseError, Violation, ViolationKind};

/// The wire shape of one violation: the crate's Violation (tag, the typed
/// `kind` with its `code` + payload — attr/value/allowed/… — and position)
/// plus the pre-rendered display line, so the JS side never duplicates
/// format logic. The TypeScript definition is GENERATED from this type
/// (tsify) into the pkg d.ts — the one type source. `kind` is NESTED, not
/// serde-flattened: tsify renders a flattened union as
/// `interface … extends <union>` — invalid TS that skipLibCheck silently
/// degrades into a type without the union members.
#[derive(Serialize, Tsify)]
pub struct ValidationViolation {
    /// The authored local tag of the offending element.
    pub tag: String,
    /// The typed classification: `{code, …payload}`.
    pub kind: ViolationKind,
    /// 1-based source line.
    pub line: u32,
    /// 1-based source column.
    pub column: u32,
    /// The canonical display line: `<tag>: message (line:col)`.
    pub message: String,
}

impl From<Violation> for ValidationViolation {
    fn from(violation: Violation) -> Self {
        let message = violation.render();
        Self {
            tag: violation.tag,
            kind: violation.kind,
            line: violation.line,
            column: violation.column,
            message,
        }
    }
}

/// Validate a plugin entry document. See [`crate::validate_entry`]. `Ok` is
/// the typed violation list; `Err` (thrown) is the classified parse failure
/// `{code, message, line, column}` — both cross the boundary as the
/// tsify-generated shapes.
#[wasm_bindgen]
pub fn validate_entry(xml: &str) -> Result<Vec<Ts<ValidationViolation>>, Ts<ParseError>> {
    // from_rust serializes INSIDE the function (the Ts design: the ABI
    // boundary itself stays infallible); our own valid data can't fail it.
    match crate::validate_entry(xml) {
        Ok(violations) => Ok(violations
            .into_iter()
            .map(|violation| {
                Ts::from_rust(&ValidationViolation::from(violation))
                    .expect("sc-validate: violation serialize")
            })
            .collect()),
        Err(parse_error) => {
            Err(Ts::from_rust(&parse_error).expect("sc-validate: parse error serialize"))
        }
    }
}

/// The attributes every element accepts without declaring them, as a JSON
/// array — exported so the frontend's hand copy (internal/spec.ts) can be
/// PINNED against the crate (a drift would silently change contentHash ids).
#[wasm_bindgen]
pub fn common_attrs() -> String {
    serde_json::to_string(&COMMON_ATTRS).expect("sc-validate: common attrs serialize")
}

/// The sc elements' spec map as JSON: `tag → { attrs: { name → def } }`.
/// Serialized by hand-rolled impls because attr ORDER is contractual (the
/// frontend's runtime-prop resolution iterates it) and serde_json's default
/// map would alphabetize. Only what the frontend actually consumes: per attr
/// `type`/`runtime`/`default`/`values` — the required flag and numeric
/// facets are static-gate-only and stay crate-side.
#[wasm_bindgen]
pub fn element_specs() -> String {
    serde_json::to_string(&SpecsExport).expect("sc-validate: specs serialize")
}

struct SpecsExport;

impl Serialize for SpecsExport {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let elements: Vec<_> = specs()
            .elements
            .iter()
            .filter(|e| e.category != Category::Html)
            .collect();
        let mut map = serializer.serialize_map(Some(elements.len()))?;
        for element in elements {
            map.serialize_entry(&element.tag, &ElementExport(&element.attrs))?;
        }
        map.end()
    }
}

struct ElementExport<'a>(&'a [AttrDef]);

impl Serialize for ElementExport<'_> {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut map = serializer.serialize_map(Some(1))?;
        map.serialize_entry("attrs", &AttrsExport(self.0))?;
        map.end()
    }
}

struct AttrsExport<'a>(&'a [AttrDef]);

impl Serialize for AttrsExport<'_> {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let mut map = serializer.serialize_map(Some(self.0.len()))?;
        for attr in self.0 {
            map.serialize_entry(&attr.name, &AttrExport(attr))?;
        }
        map.end()
    }
}

struct AttrExport<'a>(&'a AttrDef);

impl Serialize for AttrExport<'_> {
    fn serialize<S: Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        let attr = self.0;
        let type_name = match attr.r#type {
            AttrType::String => "string",
            AttrType::Name => "name",
            AttrType::Decimal => "decimal",
            AttrType::Integer => "integer",
            AttrType::Boolean => "boolean",
            AttrType::Scalar => "scalar",
            AttrType::Vector => "vector",
            AttrType::Enum => "enum",
        };
        let mut map = serializer.serialize_map(None)?;
        map.serialize_entry("type", type_name)?;
        map.serialize_entry("runtime", &attr.runtime)?;
        if let Some(default) = &attr.default {
            map.serialize_entry("default", default)?;
        }
        if let Some(values) = &attr.values {
            map.serialize_entry("values", values)?;
        }
        map.end()
    }
}
