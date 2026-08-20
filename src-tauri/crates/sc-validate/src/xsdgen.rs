//! The XSD generator — a byte-identical port of the retired
//! scripts/generate-xsd.ts, emitting sc-plugin-schema.xsd from the spec
//! registry + the hand-authored preamble (embedded). Run via
//! `yarn generate:xsd` (the `generate-xsd` bin); the xsd_drift integration
//! test pins the committed schema against this output. Not compiled into the
//! wasm build (lib.rs cfg-gates the module) — the browser only validates.

use serde_json::Value;

use crate::spec::{specs, AttrDef, AttrType, Category, ElementDef, BIND_NS, BLOCK_GROUPS};

const PREAMBLE: &str = include_str!("../preamble.xml");

/// XML Schema's equivalent of the runtime name grammar
/// /^[A-Za-z_]\w*(?:-[A-Za-z_]\w*)*$/.
const NAME_PATTERN: &str = "[A-Za-z_][A-Za-z0-9_]*(-[A-Za-z_][A-Za-z0-9_]*)*";

/// `sc-radio-group` → `scRadioGroupType`.
fn type_name(tag: &str) -> String {
    let parts = tag.strip_prefix("sc-").unwrap_or(tag).split('-');
    let mut name = String::from("sc");
    for part in parts {
        let mut chars = part.chars();
        if let Some(first) = chars.next() {
            name.extend(first.to_uppercase());
            name.push_str(chars.as_str());
        }
    }
    name.push_str("Type");
    name
}

fn xml_attribute_value(value: &str) -> String {
    let mut out = String::with_capacity(value.len());
    for c in value.chars() {
        match c {
            '&' => out.push_str("&amp;"),
            '"' => out.push_str("&quot;"),
            '<' => out.push_str("&lt;"),
            '>' => out.push_str("&gt;"),
            _ => out.push(c),
        }
    }
    out
}

/// JS `String(default)`: strings raw (NOT JSON-quoted), numbers/bools via
/// their JSON lexical form.
fn default_text(value: &Value) -> String {
    match value {
        Value::String(s) => s.clone(),
        other => other.to_string(),
    }
}

fn attribute(attr: &AttrDef) -> Vec<String> {
    // required+default is rejected at registry build (spec.rs check_attr).
    // A runtime attr (the default) is satisfied by EITHER its static form or
    // its `bind:` sibling, which XSD 1.0 can't express — it emits optional;
    // the runtime gate owns required and the mutual exclusion (XSD 1.1
    // asserts are the future upgrade). Only opted-out attrs keep
    // use="required".
    let name = &attr.name;
    let use_part = if attr.required && !attr.runtime {
        " use=\"required\""
    } else {
        ""
    };
    let default_part = match &attr.default {
        None => String::new(),
        Some(value) => format!(" default=\"{}\"", xml_attribute_value(&default_text(value))),
    };
    if attr.r#type == AttrType::Enum {
        let mut lines = vec![
            format!("    <xs:attribute name=\"{name}\"{default_part}{use_part}>"),
            "      <xs:simpleType>".to_string(),
            "        <xs:restriction base=\"xs:string\">".to_string(),
        ];
        for value in attr.values.as_deref().unwrap_or(&[]) {
            lines.push(format!("          <xs:enumeration value=\"{value}\"/>"));
        }
        lines.push("        </xs:restriction>".to_string());
        lines.push("      </xs:simpleType>".to_string());
        lines.push("    </xs:attribute>".to_string());
        return lines;
    }
    // Bug-compatible with the TS generator: only scalar/name collapse to
    // string — `vector` passes through verbatim as the (invalid, but
    // fastxml-unchecked) `xs:vector`.
    let base = match attr.r#type {
        AttrType::Scalar | AttrType::Name => "string",
        AttrType::String => "string",
        AttrType::Decimal => "decimal",
        AttrType::Integer => "integer",
        AttrType::Boolean => "boolean",
        AttrType::Vector => "vector",
        AttrType::Enum => unreachable!(),
    };
    let mut facets: Vec<String> = Vec::new();
    if attr.r#type == AttrType::Name {
        facets.push(format!("          <xs:pattern value=\"{NAME_PATTERN}\"/>"));
    }
    if let Some(min) = &attr.min {
        facets.push(format!("          <xs:minInclusive value=\"{min}\"/>"));
    }
    if let Some(max) = &attr.max {
        facets.push(format!("          <xs:maxInclusive value=\"{max}\"/>"));
    }
    if let Some(exclusive_min) = &attr.exclusive_min {
        facets.push(format!(
            "          <xs:minExclusive value=\"{exclusive_min}\"/>"
        ));
    }
    if !facets.is_empty() {
        let mut lines = vec![
            format!("    <xs:attribute name=\"{name}\"{default_part}{use_part}>"),
            "      <xs:simpleType>".to_string(),
            format!("        <xs:restriction base=\"xs:{base}\">"),
        ];
        lines.extend(facets);
        lines.push("        </xs:restriction>".to_string());
        lines.push("      </xs:simpleType>".to_string());
        lines.push("    </xs:attribute>".to_string());
        return lines;
    }
    vec![format!(
        "    <xs:attribute name=\"{name}\" type=\"xs:{base}\"{default_part}{use_part}/>"
    )]
}

fn complex_type(element: &ElementDef) -> Vec<String> {
    let specs = specs();
    let mixed = if element.content.as_ref().is_some_and(|c| c.mixed) {
        " mixed=\"true\""
    } else {
        ""
    };
    let mut lines = vec![format!(
        "  <xs:complexType name=\"{}\"{mixed}>",
        type_name(&element.tag)
    )];
    let choice = element.content.as_ref().map(|c| c.choice.as_slice());
    if let Some(choice) = choice.filter(|c| !c.is_empty()) {
        // fastxml 0.8.0 ignores minOccurs="0" on a bare choice (an empty
        // element fails "requires one of") — an optional SEQUENCE wrapper
        // carries the emptiness instead, with the same content semantics.
        lines.push("    <xs:sequence minOccurs=\"0\">".to_string());
        lines.push("      <xs:choice maxOccurs=\"unbounded\">".to_string());
        for reference in choice {
            lines.push(if specs.groups.contains_key(reference) {
                format!("        <xs:group ref=\"{reference}\"/>")
            } else {
                format!("        <xs:element ref=\"{reference}\"/>")
            });
        }
        lines.push("      </xs:choice>".to_string());
        lines.push("    </xs:sequence>".to_string());
    }
    for attr in &element.attrs {
        if !specs.common_attrs.iter().any(|a| a == &attr.name) {
            lines.extend(attribute(attr));
        }
    }
    lines.push("    <xs:attributeGroup ref=\"commonAttrs\"/>".to_string());
    // Any runtime attr admits its whole `bind:` namespace here (fastxml
    // doesn't validate attributes; libxml2/CI enforces the namespace
    // boundary) — WHICH bind:* names are legal is the shared static
    // validator's job.
    if element.attrs.iter().any(|a| a.runtime) {
        lines.push(format!(
            "    <xs:anyAttribute namespace=\"{BIND_NS}\" processContents=\"skip\"/>"
        ));
    }
    lines.push("  </xs:complexType>".to_string());
    lines
}

fn group(name: &str, refs: &[String], kind: &str) -> Vec<String> {
    let mut lines = vec![
        format!("  <xs:group name=\"{name}\">"),
        "    <xs:choice>".to_string(),
    ];
    for reference in refs {
        lines.push(format!("      <xs:{kind} ref=\"{reference}\"/>"));
    }
    lines.push("    </xs:choice>".to_string());
    lines.push("  </xs:group>".to_string());
    lines
}

/// Replace `[ \t]*<marker>` (first occurrence) with the replacement text —
/// the TS generator's regex splice.
fn splice(source: &str, marker: &str, replacement: &str) -> String {
    let at = source
        .find(marker)
        .unwrap_or_else(|| panic!("preamble marker {marker} missing"));
    let mut start = at;
    let bytes = source.as_bytes();
    while start > 0 && (bytes[start - 1] == b' ' || bytes[start - 1] == b'\t') {
        start -= 1;
    }
    format!(
        "{}{replacement}{}",
        &source[..start],
        &source[at + marker.len()..]
    )
}

/// Generate the full schema text (the committed sc-plugin-schema.xsd).
pub fn generate() -> String {
    let specs = specs();
    let sc_elements: Vec<&ElementDef> = specs
        .elements
        .iter()
        .filter(|e| e.category != Category::Html)
        .collect();

    let elements: Vec<String> = sc_elements
        .iter()
        .map(|e| {
            format!(
                "  <xs:element name=\"{}\" type=\"{}\"/>",
                e.tag,
                type_name(&e.tag)
            )
        })
        .collect();

    let mut groups: Vec<String> = Vec::new();
    for (_, group_name) in BLOCK_GROUPS {
        groups.extend(group(group_name, &specs.groups[group_name], "element"));
        groups.push(String::new());
    }
    let block_refs: Vec<String> = std::iter::once("htmlElements".to_string())
        .chain(BLOCK_GROUPS.iter().map(|(_, g)| g.to_string()))
        .collect();
    groups.extend(group("blockContent", &block_refs, "group"));

    let mut complex_types: Vec<String> = Vec::new();
    for (i, element) in sc_elements.iter().enumerate() {
        if i > 0 {
            complex_types.push(String::new());
        }
        complex_types.extend(complex_type(element));
    }

    let out = splice(
        PREAMBLE,
        "<!-- @generated:elements -->",
        &elements.join("\n"),
    );
    let out = splice(&out, "<!-- @generated:groups -->", &groups.join("\n"));
    splice(
        &out,
        "<!-- @generated:complexTypes -->",
        &complex_types.join("\n"),
    )
}
