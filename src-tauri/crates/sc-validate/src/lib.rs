//! Shared static XML validation for plugin entry documents.

pub mod lexical;
pub mod messages;
pub mod node;
pub mod roxml;
pub mod rules;
pub mod spec;
#[cfg(feature = "wasm")]
pub mod wasm;

pub use rules::{validate_root, Violation};

/// Parse and validate a plugin entry, returning rendered violations in order.
pub fn validate_entry(xml: &str) -> Result<Vec<String>, String> {
    let document = roxml::parse(xml)?;
    let root = roxml::RoXmlNode::new(document.root_element(), xml);
    Ok(validate_root(&root)
        .into_iter()
        .map(|violation| violation.render())
        .collect())
}

#[cfg(test)]
mod edge_case_tests {
    use crate::validate_entry;

    #[test]
    fn cdata_is_treated_as_text() {
        let xml = r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml" xmlns:bind="urn:sc-app:bind"><div><![CDATA[hello]]></div></sc-plugin>"#;
        let result = validate_entry(xml).expect("should parse");
        let empty: Vec<String> = vec![];
        assert_eq!(result, empty);
    }

    #[test]
    fn comment_is_ignored() {
        let xml = r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml" xmlns:bind="urn:sc-app:bind"><!-- comment --><div></div></sc-plugin>"#;
        let result = validate_entry(xml).expect("should parse");
        let empty: Vec<String> = vec![];
        assert_eq!(result, empty);
    }

    #[test]
    fn text_in_element_only_content_fails() {
        let xml = r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml" xmlns:bind="urn:sc-app:bind"><ul> text </ul></sc-plugin>"#;
        let result = validate_entry(xml).expect("should parse");
        // Text in a non-mixed model, and the list's required li is missing.
        assert_eq!(
            result,
            vec![
                "<ul>: unexpected text content",
                "<ul>: must contain at least one <li>",
            ]
        );
    }
}
