//! Shared static XML validation for plugin entry documents.

mod lexical;
mod messages;
mod rules;
mod spec;
#[cfg(feature = "wasm")]
pub mod wasm;

/// The element-nesting ceiling. Entries never legitimately approach it;
/// without the pre-parse gate a ~500-deep document overflows the stack
/// INSIDE roxmltree's recursive parser (verified empirically) — a crash on
/// untrusted uploads natively and in the browser (where stacks are smaller).
pub const MAX_DEPTH: usize = 256;

/// Cheap pre-parse nesting scan: max start-tag depth, skipping comments,
/// CDATA, PIs, DOCTYPE, and quoted attribute values (a `>` inside quotes is
/// legal). Faithful on well-formed input — ill-formed input fails the real
/// parse right after, so miscounts there cannot admit a deep document.
/// Returns early once `limit` is exceeded.
fn nesting_depth_exceeds(xml: &str, limit: usize) -> bool {
    let bytes = xml.as_bytes();
    let mut i = 0;
    let mut depth: usize = 0;
    let skip_past = |i: usize, needle: &[u8]| -> usize {
        bytes[i..]
            .windows(needle.len())
            .position(|w| w == needle)
            .map(|p| i + p + needle.len())
            .unwrap_or(bytes.len())
    };
    while i < bytes.len() {
        if bytes[i] != b'<' {
            i += 1;
            continue;
        }
        if bytes[i..].starts_with(b"<!--") {
            i = skip_past(i + 4, b"-->");
        } else if bytes[i..].starts_with(b"<![CDATA[") {
            i = skip_past(i + 9, b"]]>");
        } else if bytes[i..].starts_with(b"<!") || bytes[i..].starts_with(b"<?") {
            i = skip_past(i + 2, b">");
        } else if bytes[i..].starts_with(b"</") {
            depth = depth.saturating_sub(1);
            i = skip_past(i + 2, b">");
        } else {
            // A start tag: find its '>' outside quoted attribute values, and
            // whether it self-closes.
            i += 1;
            let mut quote: Option<u8> = None;
            let mut self_closing = false;
            while i < bytes.len() {
                let byte = bytes[i];
                match quote {
                    Some(q) if byte == q => quote = None,
                    Some(_) => {}
                    None if byte == b'"' || byte == b'\'' => quote = Some(byte),
                    None if byte == b'>' => {
                        self_closing = i > 0 && bytes[i - 1] == b'/';
                        i += 1;
                        break;
                    }
                    None => {}
                }
                i += 1;
            }
            if !self_closing {
                depth += 1;
                if depth > limit {
                    return true;
                }
            }
        }
    }
    false
}

/// Parse and validate a plugin entry, returning rendered violations in order.
pub fn validate_entry(xml: &str) -> Result<Vec<String>, String> {
    if nesting_depth_exceeds(xml, MAX_DEPTH) {
        return Err(format!("document nested deeper than {MAX_DEPTH} levels"));
    }
    let document = roxmltree::Document::parse(xml).map_err(|error| error.to_string())?;
    Ok(rules::validate_root(document.root_element(), xml)
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
    fn deep_documents_are_rejected_before_the_parser() {
        // roxmltree's parser recurses — without the pre-parse gate a ~500-deep
        // document overflows the stack on an untrusted upload.
        let mut xml = String::from(r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml">"#);
        for _ in 0..20_000 {
            xml.push_str("<div>");
        }
        for _ in 0..20_000 {
            xml.push_str("</div>");
        }
        xml.push_str("</sc-plugin>");
        assert_eq!(
            validate_entry(&xml).unwrap_err(),
            "document nested deeper than 256 levels"
        );
    }

    #[test]
    fn nesting_scan_is_not_fooled_by_lookalikes() {
        // Markup-looking text in comments/CDATA and a quoted '>' in an
        // attribute must not count as nesting; self-closing tags neither.
        let mut fakes = String::new();
        for _ in 0..300 {
            fakes.push_str("<!-- <div> --><![CDATA[<div>]]><hr/>");
        }
        let xml = format!(
            r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml"><div title="a>b">{fakes}</div></sc-plugin>"#
        );
        assert_eq!(
            validate_entry(&xml).expect("should parse"),
            Vec::<String>::new()
        );
    }

    #[test]
    fn bom_and_unicode_values_pass() {
        let xml = "\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\
<sc-plugin xmlns=\"http://www.w3.org/1999/xhtml\">\
<sc-slider value=\"1\" label=\"héllo 🎛️\"/></sc-plugin>";
        assert_eq!(
            validate_entry(xml).expect("should parse"),
            Vec::<String>::new()
        );
    }

    #[test]
    fn empty_default_namespace_is_flagged() {
        let xml = r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml"><div xmlns=""/></sc-plugin>"#;
        assert_eq!(
            validate_entry(xml).expect("should parse"),
            vec![r#"<div>: must be in the XHTML namespace (xmlns="http://www.w3.org/1999/xhtml")"#]
        );
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
