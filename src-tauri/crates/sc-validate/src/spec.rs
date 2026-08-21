//! The element-spec registry: one authored `specs/<tag>.spec.json` per sc
//! element (ELEMENTS order — the `SPEC_SOURCES` list IS the canonical order),
//! plus the fixed HTML vocabulary as a plain table mirroring the hand-authored
//! XSD preamble. Files keep the AUTHORED shape (attrs record in declared
//! order, unflattened content choices with group refs); this module parses
//! them once behind a `OnceLock`, resolves the content-model groups, and
//! panics loudly on any malformed spec — every gate (native upload, wasm,
//! cargo tests) hits the panic on first access.

use std::collections::BTreeMap;
use std::fmt;
use std::sync::OnceLock;

use serde::de::{MapAccess, Visitor};
use serde::{Deserialize, Deserializer};
use serde_json::{Number, Value};

/// The sc element sources, in the frontend ELEMENTS order (canonical for the
/// per-category content groups). Adding an element = add the file + one line
/// here (the same registration gesture as ELEMENTS/REGISTRY).
static SPEC_SOURCES: &[&str] = &[
    include_str!("../specs/sc-plugin.spec.json"),
    include_str!("../specs/sc-group.spec.json"),
    include_str!("../specs/sc-synthdef.spec.json"),
    include_str!("../specs/sc-ugen.spec.json"),
    include_str!("../specs/sc-control.spec.json"),
    include_str!("../specs/sc-var.spec.json"),
    include_str!("../specs/sc-synth.spec.json"),
    include_str!("../specs/sc-slider.spec.json"),
    include_str!("../specs/sc-envelope.spec.json"),
    include_str!("../specs/sc-knob.spec.json"),
    include_str!("../specs/sc-button.spec.json"),
    include_str!("../specs/sc-checkbox.spec.json"),
    include_str!("../specs/sc-switch.spec.json"),
    include_str!("../specs/sc-display.spec.json"),
    include_str!("../specs/sc-if.spec.json"),
    include_str!("../specs/sc-text.spec.json"),
    include_str!("../specs/sc-flex.spec.json"),
    include_str!("../specs/sc-row.spec.json"),
    include_str!("../specs/sc-col.spec.json"),
    include_str!("../specs/sc-select.spec.json"),
    include_str!("../specs/sc-option.spec.json"),
    include_str!("../specs/sc-radio-group.spec.json"),
    include_str!("../specs/sc-radio.spec.json"),
    include_str!("../specs/sc-console.spec.json"),
    include_str!("../specs/sc-scope.spec.json"),
    include_str!("../specs/sc-strudel.spec.json"),
    include_str!("../specs/sc-keyboard.spec.json"),
];

/// The attributes every element accepts without declaring them (the XSD's
/// `commonAttrs` attributeGroup).
pub const COMMON_ATTRS: [&str; 4] = ["id", "class", "title", "style"];

/// The namespace every entry element must live in.
pub const XHTML_NS: &str = "http://www.w3.org/1999/xhtml";

/// The fixed HTML vocabulary (the old XSD preamble's declarations, now the
/// source of truth), in declaration order. `kind`: Block/Inline are mixed
/// containers, List is li-only (at least one), Empty is strictly empty
/// (hr/br).
pub const HTML_ELEMENTS: [(&str, HtmlKind); 17] = [
    ("div", HtmlKind::Block),
    ("p", HtmlKind::Inline),
    ("label", HtmlKind::Block),
    ("span", HtmlKind::Inline),
    ("strong", HtmlKind::Inline),
    ("em", HtmlKind::Inline),
    ("h1", HtmlKind::Inline),
    ("h2", HtmlKind::Inline),
    ("h3", HtmlKind::Inline),
    ("h4", HtmlKind::Inline),
    ("h5", HtmlKind::Inline),
    ("h6", HtmlKind::Inline),
    ("ul", HtmlKind::List),
    ("ol", HtmlKind::List),
    ("li", HtmlKind::Block),
    ("hr", HtmlKind::Empty),
    ("br", HtmlKind::Empty),
];

/// The `inlineContent` members, in composition order.
pub const INLINE_CONTENT: [&str; 7] = [
    "span",
    "strong",
    "em",
    "br",
    "sc-display",
    "sc-if",
    "sc-text",
];

/// The categories `blockContent` composes (after the html vocabulary), in
/// composition order. `root`/`ugen`/`option` elements are reached only
/// through explicit placement.
pub const BLOCK_CATEGORIES: [Category; 6] = [
    Category::Input,
    Category::Visual,
    Category::Widget,
    Category::State,
    Category::Node,
    Category::Synthdef,
];

/// The content kind of a fixed HTML element.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum HtmlKind {
    /// Mixed block content (`blockType`).
    Block,
    /// Mixed inline content (`inlineType`).
    Inline,
    /// `li` children only, no text (`listType`).
    List,
    /// Strictly empty (`hr`/`br` — untyped in the preamble).
    Empty,
}

/// An element's placement class. Categories in [`BLOCK_CATEGORIES`] are the
/// members `blockContent` resolves to; `html` marks the fixed vocabulary.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Category {
    Root,
    Input,
    Visual,
    Widget,
    State,
    Node,
    Synthdef,
    Ugen,
    Option,
    Html,
}

/// The assembled specification the validator consumes.
#[derive(Debug)]
pub struct Specs {
    /// Element definitions: the 17 html elements (declaration order), then
    /// the sc elements in `SPEC_SOURCES` (= ELEMENTS) order.
    pub elements: Vec<ElementDef>,
}

/// The definition for one element tag.
#[derive(Debug)]
pub struct ElementDef {
    /// The element's local tag name.
    pub tag: String,
    /// The element's placement class (read by the wasm export's sc-only
    /// filter; native validation resolves categories at build time).
    #[cfg_attr(not(feature = "wasm"), allow(dead_code))]
    pub category: Category,
    /// Attributes in authored order (the validation cascade order).
    pub attrs: Vec<AttrDef>,
    /// The FLATTENED content model (strictly empty when the spec authored
    /// none).
    pub content: ContentDef,
}

/// The direct-child and text policy for an element. Every element HAS one:
/// an authored spec without `content` is STRICTLY EMPTY (no children, no
/// non-whitespace text — the old XSD's empty complex types).
#[derive(Debug)]
pub struct ContentDef {
    /// Whether non-whitespace direct text is allowed.
    pub mixed: bool,
    /// Allowed direct child element tags (groups resolved), possibly empty
    /// (strictly-empty content).
    pub children: Vec<String>,
    /// Whether at least one child is required (listType's sequence — ul/ol
    /// need an li).
    pub require_child: bool,
}

/// One attribute definition — deserialized directly from the authored body
/// (the record KEY becomes `name` via the `attr_record` visitor).
#[derive(Debug, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct AttrDef {
    /// The unqualified authored attribute name (the record key; never in the
    /// body).
    #[serde(skip)]
    pub name: String,
    /// Authored doc line(s) — parsed so malformed comments fail loudly, then
    /// never read.
    #[serde(rename = "$comment", default)]
    #[allow(dead_code)]
    pub(crate) comment: Option<Comment>,
    /// The lexical type used by static validation.
    #[serde(rename = "type")]
    pub r#type: AttrType,
    /// Whether the static form is required (a runtime attr satisfies it with
    /// either form).
    #[serde(default)]
    pub required: bool,
    /// Whether a `bind:` form is accepted and can satisfy `required`. Absent
    /// means BINDABLE — a bare #[serde(default)] (false) would silently flip
    /// every attribute non-bindable.
    #[serde(default = "default_true")]
    pub runtime: bool,
    /// The declared default value (applied by the frontend's getProp).
    #[serde(default)]
    pub default: Option<Value>,
    /// Inclusive lower bound for numeric attributes.
    #[serde(default)]
    pub min: Option<Number>,
    /// Inclusive upper bound for numeric attributes.
    #[serde(default)]
    pub max: Option<Number>,
    /// Exclusive lower bound for numeric attributes.
    #[serde(rename = "exclusiveMin", default)]
    pub exclusive_min: Option<Number>,
    /// Whether vector values must be numerically coercible.
    #[serde(default)]
    pub numeric: bool,
    /// Allowed values for enum attributes.
    #[serde(default)]
    pub values: Option<Vec<String>>,
}

/// The lexical attribute types.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Deserialize)]
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
    /// A value selected from the declared `values` list.
    Enum,
}

// ── authored-file shapes (private) ───────────────────────────────

/// A `$comment` — a string or an array of lines. Parsed for shape (the one
/// authoring gate on doc comments) and discarded.
#[derive(Debug, Deserialize)]
#[serde(untagged)]
#[allow(dead_code)]
pub(crate) enum Comment {
    Line(String),
    Block(Vec<String>),
}

fn default_true() -> bool {
    true
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct SpecFile {
    #[serde(rename = "$comment", default)]
    _comment: Option<Comment>,
    tag: String,
    category: Category,
    #[serde(default, deserialize_with = "attr_record")]
    attrs: Vec<AttrDef>,
    #[serde(default)]
    content: Option<FileContent>,
}

#[derive(Deserialize)]
#[serde(deny_unknown_fields)]
struct FileContent {
    #[serde(rename = "$comment", default)]
    _comment: Option<Comment>,
    #[serde(default)]
    choice: Vec<String>,
    #[serde(default)]
    mixed: bool,
}

/// Deserialize the authored attrs RECORD into a Vec preserving authored order.
/// A plain serde map would silently keep only the LAST duplicate key — this
/// visitor rejects duplicates instead (and a stray `$comment` key, which
/// belongs on the attribute body).
fn attr_record<'de, D: Deserializer<'de>>(deserializer: D) -> Result<Vec<AttrDef>, D::Error> {
    struct AttrsVisitor;

    impl<'de> Visitor<'de> for AttrsVisitor {
        type Value = Vec<AttrDef>;

        fn expecting(&self, f: &mut fmt::Formatter) -> fmt::Result {
            f.write_str("a record of attribute definitions")
        }

        fn visit_map<A: MapAccess<'de>>(self, mut map: A) -> Result<Self::Value, A::Error> {
            let mut attrs: Vec<AttrDef> = Vec::new();
            while let Some(name) = map.next_key::<String>()? {
                if name == "$comment" {
                    return Err(serde::de::Error::custom(
                        "\"$comment\" is not an attribute — put it on the attribute body",
                    ));
                }
                if attrs.iter().any(|a| a.name == name) {
                    return Err(serde::de::Error::custom(format!(
                        "duplicate attribute \"{name}\""
                    )));
                }
                let mut attr: AttrDef = map.next_value()?;
                attr.name = name;
                attrs.push(attr);
            }
            Ok(attrs)
        }
    }

    deserializer.deserialize_map(AttrsVisitor)
}

// ── assembly ─────────────────────────────────────────────────────

fn html_content(kind: HtmlKind) -> (Vec<String>, bool, bool) {
    match kind {
        HtmlKind::Block => (vec!["blockContent".to_string()], true, false),
        HtmlKind::Inline => (vec!["inlineContent".to_string()], true, false),
        // listType's XSD sequence requires at least one li.
        HtmlKind::List => (vec!["li".to_string()], false, true),
        HtmlKind::Empty => (Vec::new(), false, false),
    }
}

fn check_attr(tag: &str, attr: &AttrDef) {
    let is_enum = attr.r#type == AttrType::Enum;
    if is_enum && attr.values.as_ref().is_none_or(|v| v.is_empty()) {
        panic!(
            "sc-validate: <{tag}> \"{}\" is an enum without values",
            attr.name
        );
    }
    if !is_enum && attr.values.is_some() {
        panic!(
            "sc-validate: <{tag}> \"{}\" declares values but is not an enum",
            attr.name
        );
    }
    if attr.numeric && attr.r#type != AttrType::Vector {
        panic!(
            "sc-validate: <{tag}> \"{}\" declares numeric but is not a vector",
            attr.name
        );
    }
    if attr.required && attr.default.is_some() {
        panic!(
            "sc-validate: <{tag}> \"{}\" cannot declare a default because it is required",
            attr.name
        );
    }
}

fn build() -> Specs {
    // Parse the authored sc files (unflattened) and seed the html vocabulary.
    struct Raw {
        tag: String,
        category: Category,
        attrs: Vec<AttrDef>,
        content: (Vec<String>, bool, bool),
    }
    let mut raw: Vec<Raw> = HTML_ELEMENTS
        .iter()
        .map(|&(tag, kind)| Raw {
            tag: tag.to_string(),
            category: Category::Html,
            attrs: Vec::new(),
            content: html_content(kind),
        })
        .collect();
    for source in SPEC_SOURCES {
        let file: SpecFile = serde_json::from_str(source)
            .unwrap_or_else(|e| panic!("sc-validate: malformed spec file: {e}"));
        if file.category == Category::Html {
            panic!(
                "sc-validate: <{}> declares the reserved html category",
                file.tag
            );
        }
        if raw.iter().any(|r| r.tag == file.tag) {
            panic!("sc-validate: duplicate spec for <{}>", file.tag);
        }
        for attr in &file.attrs {
            check_attr(&file.tag, attr);
        }
        raw.push(Raw {
            tag: file.tag,
            category: file.category,
            attrs: file.attrs,
            // ABSENT content means STRICTLY EMPTY (the XSD's empty complex
            // types): no element children, no non-whitespace text.
            content: file.content.map(|c| (c.choice, c.mixed, false)).unwrap_or((
                Vec::new(),
                false,
                false,
            )),
        });
    }

    // The two composite references the authored specs (and the html table)
    // use: `blockContent` = every html element (li is child-only) plus the
    // members of the block categories; `inlineContent` = the fixed inline
    // list. Anything else in a choice is a direct tag.
    let mut block_content: Vec<String> = HTML_ELEMENTS
        .iter()
        .filter(|&&(tag, _)| tag != "li")
        .map(|&(tag, _)| tag.to_string())
        .collect();
    for category in BLOCK_CATEGORIES {
        block_content.extend(
            raw.iter()
                .filter(|r| r.category == category)
                .map(|r| r.tag.clone()),
        );
    }

    // Flatten each element's choice (composite refs → member tags, in place).
    let elements = raw
        .into_iter()
        .map(|r| {
            let (choice, mixed, require_child) = r.content;
            let mut children: Vec<String> = Vec::new();
            for reference in &choice {
                match reference.as_str() {
                    "blockContent" => children.extend(block_content.iter().cloned()),
                    "inlineContent" => {
                        children.extend(INLINE_CONTENT.iter().map(|t| t.to_string()));
                    }
                    tag => children.push(tag.to_string()),
                }
            }
            let mut seen = std::collections::BTreeSet::new();
            for child in &children {
                if !seen.insert(child.clone()) {
                    panic!(
                        "sc-validate: duplicate content member \"{child}\" in <{}>",
                        r.tag
                    );
                }
            }
            ElementDef {
                tag: r.tag,
                category: r.category,
                attrs: r.attrs,
                content: ContentDef {
                    mixed,
                    children,
                    require_child,
                },
            }
        })
        .collect::<Vec<_>>();

    // Every non-group content member must name a known element.
    let tags: std::collections::BTreeSet<&str> = elements.iter().map(|e| e.tag.as_str()).collect();
    for element in &elements {
        for child in &element.content.children {
            if !tags.contains(child.as_str()) {
                panic!(
                    "sc-validate: <{}> content references unknown element <{child}>",
                    element.tag
                );
            }
        }
    }

    Specs { elements }
}

/// Return the assembled specification, built once for the process.
pub fn specs() -> &'static Specs {
    static SPECS: OnceLock<Specs> = OnceLock::new();
    SPECS.get_or_init(build)
}

/// Look up an element definition by local tag name.
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn registry_assembles_all_elements() {
        let specs = specs();
        assert_eq!(specs.elements.len(), 17 + 27);
        // html first (preamble order), sc after (ELEMENTS order).
        assert_eq!(specs.elements[0].tag, "div");
        assert_eq!(specs.elements[17].tag, "sc-plugin");
        assert_eq!(specs.elements.last().unwrap().tag, "sc-keyboard");
        // Content-absent specs are STRICTLY EMPTY, like hr's explicit form.
        assert!(element("hr").unwrap().content.children.is_empty());
        let control = &element("sc-control").unwrap().content;
        assert!(control.children.is_empty() && !control.mixed && !control.require_child);
        // Lists require a child (the old listType sequence).
        assert!(element("ul").unwrap().content.require_child);
        // Group flattening: sc-plugin's blockContent covers html + categories.
        let plugin = element("sc-plugin").unwrap();
        let children = &plugin.content.children;
        assert!(children.iter().any(|t| t == "div"));
        assert!(children.iter().any(|t| t == "sc-slider"));
        assert!(!children.iter().any(|t| t == "sc-option")); // child-only category
    }

    #[test]
    fn authored_order_and_defaults_survive() {
        let scope = element("sc-scope").unwrap();
        let names: Vec<&str> = scope.attrs.iter().map(|a| a.name.as_str()).collect();
        assert_eq!(
            names,
            ["bus", "channels", "frames", "trigger", "slope", "level", "gain", "layout", "range"]
        );
        let frames = &scope.attrs[2];
        assert!(!frames.runtime); // explicit runtime: false
        assert_eq!(frames.default.as_ref().unwrap().as_u64(), Some(1024));
        // Absent runtime means bindable.
        assert!(
            scope
                .attrs
                .iter()
                .find(|a| a.name == "trigger")
                .unwrap()
                .runtime
        );
    }

    #[test]
    fn file_shape_gates() {
        // Duplicate attribute keys are rejected (a plain serde map would
        // silently keep the last).
        let dup = r#"{"tag":"x","category":"widget","attrs":{"a":{"type":"string"},"a":{"type":"string"}}}"#;
        let err = serde_json::from_str::<SpecFile>(dup)
            .map(|_| ())
            .unwrap_err()
            .to_string();
        assert!(err.contains("duplicate attribute \"a\""), "{err}");
        // Unknown fields are rejected.
        let unknown =
            r#"{"tag":"x","category":"widget","attrs":{"a":{"type":"string","requird":true}}}"#;
        assert!(serde_json::from_str::<SpecFile>(unknown).is_err());
        // $comment is legal on file and attr bodies, not as an attr name.
        let comments = r#"{"$comment":["a","b"],"tag":"x","category":"widget","attrs":{"a":{"$comment":"c","type":"string"}}}"#;
        let parsed: SpecFile = serde_json::from_str(comments).unwrap();
        assert!(parsed.attrs[0].runtime); // absent runtime defaults TRUE
        let stray = r#"{"tag":"x","category":"widget","attrs":{"$comment":"nope"}}"#;
        assert!(serde_json::from_str::<SpecFile>(stray).is_err());
    }
}
