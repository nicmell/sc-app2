//! Deserialization and lookup for the generated static element specification.

use std::collections::BTreeMap;
use std::sync::OnceLock;

use serde::Deserialize;
use serde_json::{Number, Value};

/// The generated specification consumed by the validator and tooling.
#[derive(Debug, Deserialize)]
pub struct Specs {
    /// Artifact schema version.
    pub version: u32,
    /// Attribute names permitted on every known element.
    #[serde(rename = "commonAttrs")]
    pub common_attrs: Vec<String>,
    /// Generated element groups retained for downstream tooling.
    pub groups: BTreeMap<String, Vec<String>>,
    /// Element definitions in generated artifact order.
    pub elements: Vec<ElementDef>,
}

/// The generated definition for one element tag.
#[derive(Debug, Deserialize)]
pub struct ElementDef {
    /// The element's local tag name.
    pub tag: String,
    /// Attributes in the order used by static validation.
    pub attrs: Vec<AttrDef>,
    /// The element content model, or `None` for a relaxed content gate.
    pub content: Option<ContentDef>,
}

/// The direct-child and text policy for an element.
#[derive(Debug, Deserialize)]
pub struct ContentDef {
    /// Whether non-whitespace direct text is allowed.
    pub mixed: bool,
    /// Allowed direct child element tags in artifact order.
    pub children: Vec<String>,
}

/// An attribute definition from the generated artifact.
#[derive(Debug, Deserialize)]
pub struct AttrDef {
    /// The unqualified authored attribute name.
    pub name: String,
    /// The lexical type used by static validation.
    #[serde(rename = "type")]
    pub r#type: AttrType,
    /// Whether the static form is required.
    pub required: bool,
    /// Whether a `bind:` form is accepted and can satisfy `required`.
    pub runtime: bool,
    /// The generated default value, retained for tooling.
    pub default: Option<Value>,
    /// Inclusive lower bound for numeric attributes.
    pub min: Option<Number>,
    /// Upper bound for numeric attributes.
    pub max: Option<Number>,
    /// Exclusive lower bound for numeric attributes.
    #[serde(rename = "exclusiveMin")]
    pub exclusive_min: Option<Number>,
    /// Whether vector values must be numerically coercible.
    #[serde(default)]
    pub numeric: bool,
    /// Allowed values for enum attributes.
    pub values: Option<Vec<String>>,
}

/// The lexical attribute types emitted by the spec generator.
#[derive(Debug, Clone, Copy, Deserialize, PartialEq, Eq)]
#[serde(rename_all = "lowercase")]
pub enum AttrType {
    /// An unconstrained string.
    String,
    /// A plain bind-path name segment.
    Name,
    /// An XSD decimal lexical value.
    Decimal,
    /// An XSD integer lexical value.
    Integer,
    /// An XSD boolean lexical value.
    Boolean,
    /// A scalar value whose runtime meaning is intentionally relaxed here.
    Scalar,
    /// A vector value, optionally subject to a numeric gate.
    Vector,
    /// A value selected from the generated `values` list.
    Enum,
}

/// Return the generated specification, parsed once for the process.
pub fn specs() -> &'static Specs {
    static SPECS: OnceLock<Specs> = OnceLock::new();

    SPECS.get_or_init(|| {
        serde_json::from_str(include_str!("../specs.json"))
            .expect("generated sc-validate specs.json must be valid")
    })
}

/// Look up a generated element definition by local tag name.
pub fn element(tag: &str) -> Option<&'static ElementDef> {
    static ELEMENTS: OnceLock<BTreeMap<String, &'static ElementDef>> = OnceLock::new();

    ELEMENTS
        .get_or_init(|| {
            specs()
                .elements
                .iter()
                .map(|definition| (definition.tag.clone(), definition))
                .collect()
        })
        .get(tag)
        .copied()
}
