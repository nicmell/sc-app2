//! The wasm-bindgen surface (feature `wasm`) — the browser build consumed by
//! `@sc-app/validate` (packages/validate). Two exports: `validate_entry`
//! mirrors [`crate::validate_entry`] (`Err` = parse-failure text, `Ok` =
//! rendered violations, empty = valid), and `element_specs` serializes the sc
//! elements' attribute contracts for the frontend's getProp/runtime-prop
//! machinery — the ONE spec copy, read out of the module the app already
//! loads. The JS wrapper turns both into the canonical frontend shapes.

use serde::ser::{SerializeMap, Serializer};
use serde::Serialize;
use wasm_bindgen::prelude::*;

use crate::spec::{specs, AttrDef, AttrType, Category, COMMON_ATTRS};

/// Validate a plugin entry document. See [`crate::validate_entry`].
#[wasm_bindgen]
pub fn validate_entry(xml: &str) -> Result<Vec<String>, String> {
    crate::validate_entry(xml)
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
