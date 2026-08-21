//! Ordered static validation rules, walked directly over the `roxmltree` DOM
//! (the crate's one parser — native and wasm builds both go through it).

use roxmltree::Node;
use serde::Serialize;

use crate::lexical;
use crate::messages;
use crate::spec::{element, AttrDef, AttrType, ContentDef, ElementDef, COMMON_ATTRS, XHTML_NS};

/// One static validation failure attached to the element that produced it,
/// with the 1-based source position — the attribute's own qname for
/// attribute rules, the element start otherwise.
#[derive(Debug, Clone, PartialEq, Eq, Serialize)]
pub struct Violation {
    /// The authored local tag of the offending element.
    pub tag: String,
    /// The canonical message without the `<tag>:` prefix.
    pub message: String,
    /// 1-based source line.
    pub line: u32,
    /// 1-based source column.
    pub column: u32,
}

impl Violation {
    /// Render the canonical frontend-compatible error shape.
    pub fn render(&self) -> String {
        format!(
            "<{}>: {} ({}:{})",
            self.tag, self.message, self.line, self.column
        )
    }
}

/// Validate a document element using the generated specification. `source` is
/// the document text the node was parsed from — needed to recover AUTHORED
/// attribute qnames (`bind:min`), matching DOM getAttribute semantics.
pub(crate) fn validate_root(root: Node, source: &str) -> Vec<Violation> {
    let tag = root.tag_name().name();
    if tag != "sc-plugin" {
        let mut violations = Vec::new();
        push_violation(
            tag,
            messages::wrong_root(tag),
            pos_at(root, root.range().start),
            &mut violations,
        );
        return violations;
    }

    let mut violations = Vec::new();
    validate_element(root, source, &mut violations);
    violations
}

/// The 1-based (line, column) of a byte offset in the node's source document.
/// Called only on the error path — `text_pos_at` scans the source per call.
fn pos_at(node: Node, offset: usize) -> (u32, u32) {
    let position = node.document().text_pos_at(offset);
    (position.row, position.col)
}

fn validate_element(node: Node, source: &str, violations: &mut Vec<Violation>) {
    let tag = node.tag_name().name();

    // Namespace first: every element (known or not) must live in XHTML —
    // the old schema's targetNamespace, now checked directly.
    if node.tag_name().namespace() != Some(XHTML_NS) {
        push_violation(
            tag,
            messages::xhtml_namespace(),
            pos_at(node, node.range().start),
            violations,
        );
    }

    // Authored qnames + values, borrowed straight from the source (the qname
    // range comes from roxmltree's own parse of this source; .get keeps a
    // hypothetical range bug a wrong NAME instead of a panic on an untrusted
    // upload), plus each attribute's qname start for violation positions.
    let authored_attributes: Vec<(&str, &str, usize)> = node
        .attributes()
        .map(|attribute| {
            let range = attribute.range_qname();
            let name = source
                .get(range.clone())
                .unwrap_or_else(|| attribute.name());
            (name, attribute.value(), range.start)
        })
        .collect();

    if let Some(definition) = element(tag) {
        validate_spec_attributes(node, definition, &authored_attributes, violations);
        validate_attribute_hygiene(node, definition, &authored_attributes, violations);
        validate_content(node, &definition.content, violations);
    }

    // Unknown elements deliberately still recurse: their parent membership
    // gate reports the unknown child, while known descendants can report
    // their own independent static failures.
    for child in node.children().filter(Node::is_element) {
        validate_element(child, source, violations);
    }
}

fn validate_spec_attributes(
    node: Node,
    definition: &ElementDef,
    authored_attributes: &[(&str, &str, usize)],
    violations: &mut Vec<Violation>,
) {
    let tag = node.tag_name().name();
    for attribute in &definition.attrs {
        let static_value = authored_value(authored_attributes, &attribute.name);
        let dynamic_value = if attribute.runtime {
            authored_bind_value(authored_attributes, &attribute.name)
        } else {
            None
        };

        if let (Some((_, offset)), Some(_)) = (static_value, dynamic_value) {
            push_violation(
                tag,
                messages::mutually_exclusive(&attribute.name),
                pos_at(node, offset),
                violations,
            );
            continue;
        }

        let Some((raw, offset)) = static_value else {
            if attribute.required && dynamic_value.is_none() {
                push_violation(
                    tag,
                    messages::missing_required(&attribute.name),
                    pos_at(node, node.range().start),
                    violations,
                );
            }
            continue;
        };

        if let Some(message) = validate_static_attribute(attribute, raw) {
            push_violation(tag, message, pos_at(node, offset), violations);
        }
    }
}

fn validate_static_attribute(attribute: &AttrDef, raw: &str) -> Option<String> {
    match attribute.r#type {
        AttrType::Decimal if !lexical::xsd_decimal(raw) => {
            return Some(messages::decimal(&attribute.name));
        }
        AttrType::Integer if !lexical::xsd_integer(raw) => {
            return Some(messages::integer(&attribute.name));
        }
        AttrType::Boolean if !lexical::xsd_boolean(raw) => {
            return Some(messages::boolean(&attribute.name, raw));
        }
        AttrType::Enum => {
            let values = attribute.values.as_deref().unwrap_or(&[]);
            if !values.iter().any(|value| value == raw) {
                return Some(messages::enum_value(&attribute.name, values, raw));
            }
        }
        AttrType::Name if raw.is_empty() => {
            // This mirrors the frontend's old requireProp behavior.
            return Some(messages::missing_required(&attribute.name));
        }
        AttrType::Name if !lexical::name_segment(raw) => {
            return Some(messages::name_syntax(&attribute.name, raw));
        }
        _ => {}
    }

    if matches!(attribute.r#type, AttrType::Decimal | AttrType::Integer) {
        let number = raw.parse::<f64>().unwrap_or(f64::NAN);
        if let Some(min) = &attribute.min {
            if number < number_value(min) {
                return Some(messages::minimum(&attribute.name, min, raw));
            }
        }
        if let Some(min) = &attribute.exclusive_min {
            if number <= number_value(min) {
                return Some(messages::exclusive_minimum(&attribute.name, min, raw));
            }
        }
        if let Some(max) = &attribute.max {
            if number > number_value(max) {
                return Some(messages::maximum(&attribute.name, max, raw));
            }
        }
    }

    if matches!(attribute.r#type, AttrType::Vector)
        && attribute.numeric
        && !numeric_vector_passes(raw)
    {
        return Some(messages::numeric_vector(&attribute.name, raw));
    }

    None
}

fn numeric_vector_passes(raw: &str) -> bool {
    if lexical::call_shaped(raw) {
        return true;
    }

    let tokens: Vec<&str> = raw.split(',').map(str::trim).collect();
    if tokens.len() >= 2
        && tokens
            .iter()
            .all(|token| !token.is_empty() && lexical::js_number(token).is_some())
    {
        return true;
    }

    lexical::js_number(raw.trim()).is_some()
}

fn validate_attribute_hygiene(
    node: Node,
    definition: &ElementDef,
    authored_attributes: &[(&str, &str, usize)],
    violations: &mut Vec<Violation>,
) {
    let tag = node.tag_name().name();
    for &(name, _, offset) in authored_attributes {
        if name == "xmlns" {
            continue;
        }

        let Some(colon) = name.find(':') else {
            let known_spec_attribute = definition
                .attrs
                .iter()
                .any(|attribute| attribute.name == name);
            let common_attribute = COMMON_ATTRS.contains(&name);
            if !known_spec_attribute && !common_attribute {
                push_violation(
                    tag,
                    messages::unknown_attribute(name),
                    pos_at(node, offset),
                    violations,
                );
            }
            continue;
        };

        let prefix = &name[..colon];
        if prefix == "xmlns" {
            continue;
        }
        if prefix != "bind" {
            push_violation(
                tag,
                messages::unknown_namespace_prefix(prefix),
                pos_at(node, offset),
                violations,
            );
            continue;
        }

        let base = &name[colon + 1..];
        let runtime_attribute = definition
            .attrs
            .iter()
            .find(|attribute| attribute.name == base)
            .is_some_and(|attribute| attribute.runtime);
        if !runtime_attribute {
            push_violation(
                tag,
                messages::unknown_runtime_attribute(name),
                pos_at(node, offset),
                violations,
            );
        }
    }
}

fn validate_content(node: Node, content: &ContentDef, violations: &mut Vec<Violation>) {
    let tag = node.tag_name().name();
    // Membership over the flattened children — an EMPTY list is the strict
    // empty model (content-absent specs, hr/br): every child is unexpected.
    // Positions point at the offender: the child / the text run; only the
    // missing-li rule falls back to the element itself.
    let mut child_count = 0usize;
    for child in node.children().filter(Node::is_element) {
        child_count += 1;
        let child_tag = child.tag_name().name();
        if !content.children.iter().any(|allowed| allowed == child_tag) {
            push_violation(
                tag,
                messages::unexpected_child(child_tag),
                pos_at(child, child.range().start),
                violations,
            );
        }
    }
    if !content.mixed {
        if let Some(text_child) = first_text_child(node) {
            push_violation(
                tag,
                messages::unexpected_text(),
                pos_at(text_child, text_child.range().start),
                violations,
            );
        }
    }
    if content.require_child && child_count == 0 {
        if let Some(required) = content.children.first() {
            push_violation(
                tag,
                messages::missing_required_child(required),
                pos_at(node, node.range().start),
                violations,
            );
        }
    }
}

/// The first direct text/CDATA child with non-whitespace content, if any.
fn first_text_child<'a, 'input>(node: Node<'a, 'input>) -> Option<Node<'a, 'input>> {
    node.children()
        .find(|child| child.is_text() && child.text().is_some_and(|text| !text.trim().is_empty()))
}

fn authored_value<'a>(
    attributes: &[(&'a str, &'a str, usize)],
    name: &str,
) -> Option<(&'a str, usize)> {
    attributes
        .iter()
        .find(|(attribute_name, _, _)| *attribute_name == name)
        .map(|&(_, value, offset)| (value, offset))
}

/// The `bind:`-prefixed sibling's value, matched without allocating the
/// qualified name.
fn authored_bind_value<'a>(
    attributes: &[(&'a str, &'a str, usize)],
    base: &str,
) -> Option<(&'a str, usize)> {
    attributes
        .iter()
        .find(|(attribute_name, _, _)| {
            attribute_name
                .strip_prefix("bind:")
                .is_some_and(|attribute_base| attribute_base == base)
        })
        .map(|&(_, value, offset)| (value, offset))
}

fn number_value(number: &serde_json::Number) -> f64 {
    number
        .as_f64()
        .unwrap_or_else(|| number.to_string().parse().unwrap_or(f64::NAN))
}

fn push_violation(
    tag: &str,
    message: String,
    (line, column): (u32, u32),
    violations: &mut Vec<Violation>,
) {
    violations.push(Violation {
        tag: tag.to_string(),
        message,
        line,
        column,
    });
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::Number;

    fn document(body: &str) -> String {
        format!(
            r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml" xmlns:bind="urn:sc-app:bind">{body}</sc-plugin>"#
        )
    }

    fn rendered(xml: &str) -> Vec<String> {
        crate::validate_entry(xml)
            .expect("test XML should parse")
            .iter()
            .map(Violation::render)
            .collect()
    }

    fn messages(body: &str) -> Vec<String> {
        crate::validate_entry(&document(body))
            .expect("test XML should parse")
            .iter()
            .map(Violation::render)
            .collect()
    }

    #[test]
    fn lexical_failure_precedes_facets_and_reports_once() {
        assert_eq!(
            messages(r#"<sc-scope frames="not-a-number"/>"#),
            vec![r#"<sc-scope>: "frames" attribute must be an integer (1:88)"#]
        );
    }

    #[test]
    fn mutual_exclusion_precedes_other_attribute_rules() {
        assert_eq!(
            messages(r#"<sc-slider value="1" bind:value="x"/>"#),
            vec![r#"<sc-slider>: "value" and "bind:value" are mutually exclusive (1:89)"#]
        );
    }

    #[test]
    fn empty_name_uses_missing_required_message() {
        assert_eq!(
            messages(r#"<sc-var name="" value="1"/>"#),
            vec![r#"<sc-var>: missing required "name" attribute (1:86)"#]
        );
    }

    #[test]
    fn facet_echo_preserves_json_number_display() {
        let min_half = AttrDef {
            name: "value".to_string(),
            comment: None,
            r#type: AttrType::Decimal,
            required: false,
            runtime: false,
            default: None,
            min: Some(Number::from_f64(0.5).expect("finite number")),
            max: None,
            exclusive_min: None,
            numeric: false,
            values: None,
        };
        assert_eq!(
            validate_static_attribute(&min_half, "0"),
            Some(r#""value" attribute must be ≥ 0.5 (got "0")"#.to_string())
        );

        let min_two = AttrDef {
            min: Some(Number::from(2)),
            ..min_half
        };
        assert_eq!(
            validate_static_attribute(&min_two, "1"),
            Some(r#""value" attribute must be ≥ 2 (got "1")"#.to_string())
        );
        assert_eq!(
            messages(r#"<sc-envelope value="x" minbreakpoints="1"/>"#),
            vec![r#"<sc-envelope>: "minbreakpoints" attribute must be ≥ 2 (got "1") (1:101)"#]
        );
        assert_eq!(
            messages(r#"<sc-scope frames="16385"/>"#),
            vec![r#"<sc-scope>: "frames" attribute must be ≤ 16384 (got "16385") (1:88)"#]
        );
        assert_eq!(
            messages(r#"<sc-scope gain="0"/>"#),
            vec![r#"<sc-scope>: "gain" attribute must be > 0 (got "0") (1:88)"#]
        );
    }

    #[test]
    fn call_shape_relaxes_numeric_vector_gate() {
        assert!(messages(r#"<sc-control name="x" value="adsr(0.01)"/>"#).is_empty());
        assert_eq!(
            messages(r#"<sc-control name="x" value="foo bar"/>"#),
            vec![
                r#"<sc-control>: "value" attribute must be a number or a comma-list of numbers (got "foo bar") (1:99)"#
            ]
        );
    }

    #[test]
    fn enum_and_hygiene_messages_are_canonical() {
        assert_eq!(
            messages(r#"<sc-slider value="1" size="xl"/>"#),
            vec![r#"<sc-slider>: "size" attribute must be one of sm|md|lg (got "xl") (1:99)"#]
        );
        assert_eq!(
            messages(r#"<div foo="x"/>"#),
            vec![r#"<div>: unknown attribute "foo" (1:83)"#]
        );
        assert_eq!(
            messages(r#"<div xmlns:foreign="urn:foreign" foreign:x="1"/>"#),
            vec![r#"<div>: unknown attribute namespace prefix "foreign:" (use "bind:") (1:111)"#]
        );
        assert_eq!(
            messages(r#"<sc-envelope value="x" minbreakpoints="2" bind:minbreakpoints="3"/>"#),
            vec![r#"<sc-envelope>: unknown runtime attribute "bind:minbreakpoints" (1:120)"#]
        );
    }

    #[test]
    fn content_and_root_gates_are_walked_in_order() {
        assert_eq!(
            messages(r#"<script>alert("x")</script>"#),
            vec![r#"<sc-plugin>: unexpected child <script> (1:78)"#]
        );
        assert_eq!(
            messages(r#"<ul>hello<li/></ul>"#),
            vec![r#"<ul>: unexpected text content (1:82)"#]
        );
        assert_eq!(
            messages(r#"<sc-control name="x"><sc-unknown/></sc-control>"#),
            vec![r#"<sc-control>: unexpected child <sc-unknown> (1:99)"#]
        );
        // Strict empty bites non-sc content in leaves too (the old XSD's
        // empty complex types): children AND text.
        assert_eq!(
            messages(r#"<sc-slider value="1"><div/></sc-slider>"#),
            vec![r#"<sc-slider>: unexpected child <div> (1:99)"#]
        );
        assert_eq!(
            messages(r#"<sc-display value="1">boo</sc-display>"#),
            vec![r#"<sc-display>: unexpected text content (1:100)"#]
        );
        // Lists keep the XSD sequence semantics: at least one li.
        assert_eq!(
            messages(r#"<ul></ul>"#),
            vec![r#"<ul>: must contain at least one <li> (1:78)"#]
        );
        assert!(messages(r#"<ul><li/></ul>"#).is_empty());

        let root = r#"<div xmlns="http://www.w3.org/1999/xhtml" xmlns:bind="urn:sc-app:bind"/>"#;
        assert_eq!(
            rendered(root),
            vec![r#"<div>: plugin entry root must be <sc-plugin> (got <div>) (1:1)"#]
        );
    }

    #[test]
    fn empty_attribute_values_hit_their_lexical_gates() {
        // Empty strings: fine for string types, rejected by the numeric,
        // boolean, and enum gates.
        assert!(messages(r#"<sc-slider value="1" label=""/>"#).is_empty());
        assert_eq!(
            messages(r#"<sc-slider value=""/>"#),
            vec![r#"<sc-slider>: "value" attribute must be a decimal number (1:89)"#]
        );
        assert_eq!(
            messages(r#"<sc-scope frames=""/>"#),
            vec![r#"<sc-scope>: "frames" attribute must be an integer (1:88)"#]
        );
        assert_eq!(
            messages(r#"<sc-slider value="1" disabled=""/>"#),
            vec![
                r#"<sc-slider>: "disabled" attribute must be one of true|false|1|0 (got "") (1:99)"#
            ]
        );
        assert_eq!(
            messages(r#"<sc-slider value="1" size=""/>"#),
            vec![r#"<sc-slider>: "size" attribute must be one of sm|md|lg (got "") (1:99)"#]
        );
        assert_eq!(
            messages(r#"<sc-control name="x" value=""/>"#),
            vec![
                r#"<sc-control>: "value" attribute must be a number or a comma-list of numbers (got "") (1:99)"#
            ]
        );
    }

    #[test]
    fn every_element_must_be_in_the_xhtml_namespace() {
        // The old schema's targetNamespace, enforced directly: a root without
        // xmlns flags every element, the walk continues (multi-error).
        let xml = r#"<sc-plugin><div/></sc-plugin>"#;
        assert_eq!(
            rendered(xml),
            vec![
                r#"<sc-plugin>: must be in the XHTML namespace (xmlns="http://www.w3.org/1999/xhtml") (1:1)"#,
                r#"<div>: must be in the XHTML namespace (xmlns="http://www.w3.org/1999/xhtml") (1:12)"#,
            ]
        );
        // A foreign-namespace element reports the namespace FIRST, then its
        // other violations (intra-element order: namespace, attrs, hygiene,
        // content).
        assert_eq!(
            messages(r#"<x:div xmlns:x="urn:x" foo="1"/>"#),
            vec![
                r#"<div>: must be in the XHTML namespace (xmlns="http://www.w3.org/1999/xhtml") (1:78)"#,
                r#"<div>: unknown attribute "foo" (1:101)"#,
            ]
        );
    }

    #[test]
    fn duplicate_static_and_bind_forms_are_both_seen() {
        assert_eq!(
            messages(r#"<sc-var name="x" value="1" bind:value="2"/>"#),
            vec![r#"<sc-var>: "value" and "bind:value" are mutually exclusive (1:95)"#]
        );
    }

    #[test]
    fn multiple_errors_keep_document_order() {
        assert_eq!(
            messages(
                r#"<sc-slider value="bad" foo="x"/><sc-control name="x" value="foo bar"/><ul>text<li/></ul>"#
            ),
            vec![
                r#"<sc-slider>: "value" attribute must be a decimal number (1:89)"#,
                r#"<sc-slider>: unknown attribute "foo" (1:101)"#,
                r#"<sc-control>: "value" attribute must be a number or a comma-list of numbers (got "foo bar") (1:131)"#,
                r#"<ul>: unexpected text content (1:152)"#,
            ]
        );
    }
}
