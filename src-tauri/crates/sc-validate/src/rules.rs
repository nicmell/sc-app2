//! Ordered static validation rules over the generic XML node abstraction.

use crate::lexical;
use crate::messages;
use crate::node::XmlNode;
use crate::spec::{element, specs, AttrDef, AttrType, ContentDef, ElementDef};

/// One static validation failure attached to the element that produced it.
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct Violation {
    /// The authored local tag of the offending element.
    pub tag: String,
    /// The canonical message without the `<tag>:` prefix.
    pub message: String,
}

impl Violation {
    /// Render the canonical frontend-compatible error shape.
    pub fn render(&self) -> String {
        format!("<{}>: {}", self.tag, self.message)
    }
}

/// Validate a document element using the generated specification.
pub fn validate_root<N: XmlNode>(root: &N) -> Vec<Violation> {
    if root.tag() != "sc-plugin" {
        return vec![Violation {
            tag: root.tag().to_string(),
            message: messages::wrong_root(root.tag()),
        }];
    }

    let mut violations = Vec::new();
    validate_element(root, &mut violations);
    violations
}

fn validate_element<N: XmlNode>(node: &N, violations: &mut Vec<Violation>) {
    let authored_attributes = node.attributes();
    let definition = element(node.tag());

    if let Some(definition) = definition {
        validate_spec_attributes(node.tag(), definition, &authored_attributes, violations);
        validate_attribute_hygiene(node.tag(), definition, &authored_attributes, violations);
    }

    let children = node.children();
    if let Some(definition) = definition {
        validate_content(node, definition.content.as_ref(), &children, violations);
    }

    // Unknown elements deliberately still recurse: their parent membership
    // gate reports the unknown child, while known descendants can report
    // their own independent static failures.
    for child in &children {
        validate_element(child, violations);
    }
}

fn validate_spec_attributes(
    tag: &str,
    definition: &ElementDef,
    authored_attributes: &[(String, String)],
    violations: &mut Vec<Violation>,
) {
    for attribute in &definition.attrs {
        let static_value = authored_value(authored_attributes, &attribute.name);
        let dynamic_name = format!("bind:{}", attribute.name);
        let dynamic_value = if attribute.runtime {
            authored_value(authored_attributes, &dynamic_name)
        } else {
            None
        };

        if static_value.is_some() && dynamic_value.is_some() {
            push_violation(
                tag,
                messages::mutually_exclusive(&attribute.name),
                violations,
            );
            continue;
        }

        if static_value.is_none() {
            if attribute.required && dynamic_value.is_none() {
                push_violation(tag, messages::missing_required(&attribute.name), violations);
            }
            continue;
        }

        let raw = static_value.expect("checked above");
        if let Some(message) = validate_static_attribute(attribute, raw) {
            push_violation(tag, message, violations);
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
    tag: &str,
    definition: &ElementDef,
    authored_attributes: &[(String, String)],
    violations: &mut Vec<Violation>,
) {
    for (name, _) in authored_attributes {
        if name == "xmlns" {
            continue;
        }

        let Some(colon) = name.find(':') else {
            let known_spec_attribute = definition
                .attrs
                .iter()
                .any(|attribute| attribute.name.as_str() == name);
            let common_attribute = specs().common_attrs.iter().any(|common| common == name);
            if !known_spec_attribute && !common_attribute {
                push_violation(tag, messages::unknown_attribute(name), violations);
            }
            continue;
        };

        let prefix = &name[..colon];
        if prefix == "xmlns" {
            continue;
        }
        if prefix != "bind" {
            push_violation(tag, messages::unknown_namespace_prefix(prefix), violations);
            continue;
        }

        let base = &name[colon + 1..];
        let runtime_attribute = definition
            .attrs
            .iter()
            .find(|attribute| attribute.name == base)
            .is_some_and(|attribute| attribute.runtime);
        if !runtime_attribute {
            push_violation(tag, messages::unknown_runtime_attribute(name), violations);
        }
    }
}

fn validate_content<N: XmlNode>(
    node: &N,
    content: Option<&ContentDef>,
    children: &[N],
    violations: &mut Vec<Violation>,
) {
    match content {
        None => {
            if node.has_sc_descendant() {
                push_violation(
                    node.tag(),
                    messages::must_not_contain_sc_elements(),
                    violations,
                );
            }
        }
        Some(content) => {
            for child in children {
                if !content.children.iter().any(|tag| tag == child.tag()) {
                    push_violation(
                        node.tag(),
                        messages::unexpected_child(child.tag()),
                        violations,
                    );
                }
            }
            if !content.mixed && node.has_text() {
                push_violation(node.tag(), messages::unexpected_text(), violations);
            }
        }
    }
}

fn authored_value<'a>(attributes: &'a [(String, String)], name: &str) -> Option<&'a str> {
    attributes
        .iter()
        .find(|(attribute_name, _)| attribute_name == name)
        .map(|(_, value)| value.as_str())
}

fn number_value(number: &serde_json::Number) -> f64 {
    number
        .as_f64()
        .unwrap_or_else(|| number.to_string().parse().unwrap_or(f64::NAN))
}

fn push_violation(tag: &str, message: String, violations: &mut Vec<Violation>) {
    violations.push(Violation {
        tag: tag.to_string(),
        message,
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

    fn messages(body: &str) -> Vec<String> {
        crate::validate_entry(&document(body)).expect("test XML should parse")
    }

    #[test]
    fn lexical_failure_precedes_facets_and_reports_once() {
        assert_eq!(
            messages(r#"<sc-scope frames="not-a-number"/>"#),
            vec![r#"<sc-scope>: "frames" attribute must be an integer"#]
        );
    }

    #[test]
    fn mutual_exclusion_precedes_other_attribute_rules() {
        assert_eq!(
            messages(r#"<sc-slider value="1" bind:value="x"/>"#),
            vec![r#"<sc-slider>: "value" and "bind:value" are mutually exclusive"#]
        );
    }

    #[test]
    fn empty_name_uses_missing_required_message() {
        assert_eq!(
            messages(r#"<sc-var name="" value="1"/>"#),
            vec![r#"<sc-var>: missing required "name" attribute"#]
        );
    }

    #[test]
    fn facet_echo_preserves_json_number_display() {
        let min_half = AttrDef {
            name: "value".to_string(),
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
            vec![r#"<sc-envelope>: "minbreakpoints" attribute must be ≥ 2 (got "1")"#]
        );
        assert_eq!(
            messages(r#"<sc-scope frames="16385"/>"#),
            vec![r#"<sc-scope>: "frames" attribute must be ≤ 16384 (got "16385")"#]
        );
        assert_eq!(
            messages(r#"<sc-scope gain="0"/>"#),
            vec![r#"<sc-scope>: "gain" attribute must be > 0 (got "0")"#]
        );
    }

    #[test]
    fn call_shape_relaxes_numeric_vector_gate() {
        assert!(messages(r#"<sc-control name="x" value="adsr(0.01)"/>"#).is_empty());
        assert_eq!(
            messages(r#"<sc-control name="x" value="foo bar"/>"#),
            vec![
                r#"<sc-control>: "value" attribute must be a number or a comma-list of numbers (got "foo bar")"#
            ]
        );
    }

    #[test]
    fn enum_and_hygiene_messages_are_canonical() {
        assert_eq!(
            messages(r#"<sc-slider value="1" size="xl"/>"#),
            vec![r#"<sc-slider>: "size" attribute must be one of sm|md|lg (got "xl")"#]
        );
        assert_eq!(
            messages(r#"<div foo="x"/>"#),
            vec![r#"<div>: unknown attribute "foo""#]
        );
        assert_eq!(
            messages(r#"<div xmlns:foreign="urn:foreign" foreign:x="1"/>"#),
            vec![r#"<div>: unknown attribute namespace prefix "foreign:" (use "bind:")"#]
        );
        assert_eq!(
            messages(r#"<sc-envelope value="x" minbreakpoints="2" bind:minbreakpoints="3"/>"#),
            vec![r#"<sc-envelope>: unknown runtime attribute "bind:minbreakpoints""#]
        );
    }

    #[test]
    fn content_and_root_gates_are_walked_in_order() {
        assert_eq!(
            messages(r#"<script>alert("x")</script>"#),
            vec![r#"<sc-plugin>: unexpected child <script>"#]
        );
        assert_eq!(
            messages(r#"<ul>hello<li/></ul>"#),
            vec![r#"<ul>: unexpected text content"#]
        );
        assert_eq!(
            messages(r#"<sc-control name="x"><sc-unknown/></sc-control>"#),
            vec![r#"<sc-control>: must not contain sc-* elements"#]
        );

        let root = r#"<div xmlns="http://www.w3.org/1999/xhtml" xmlns:bind="urn:sc-app:bind"/>"#;
        assert_eq!(
            crate::validate_entry(root).expect("root XML should parse"),
            vec![r#"<div>: plugin entry root must be <sc-plugin> (got <div>)"#]
        );
    }

    #[test]
    fn duplicate_static_and_bind_forms_are_both_seen() {
        assert_eq!(
            messages(r#"<sc-var name="x" value="1" bind:value="2"/>"#),
            vec![r#"<sc-var>: "value" and "bind:value" are mutually exclusive"#]
        );
    }

    #[test]
    fn multiple_errors_keep_document_order() {
        assert_eq!(
            messages(
                r#"<sc-slider value="bad" foo="x"/><sc-control name="x" value="foo bar"/><ul>text<li/></ul>"#
            ),
            vec![
                r#"<sc-slider>: "value" attribute must be a decimal number"#,
                r#"<sc-slider>: unknown attribute "foo""#,
                r#"<sc-control>: "value" attribute must be a number or a comma-list of numbers (got "foo bar")"#,
                r#"<ul>: unexpected text content"#,
            ]
        );
    }
}
