//! Shared static XML validation for plugin entry documents.

mod lexical;
mod messages;
mod rules;
mod spec;
#[cfg(feature = "wasm")]
pub mod wasm;

pub use rules::{Violation, ViolationKind};

/// The classification of a document-level failure — the input never reached
/// (or survived) the XML parser, so there are no per-element violations.
#[derive(Debug, Clone, Copy, PartialEq, Eq, serde::Serialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
#[serde(rename_all = "kebab-case")]
pub enum ParseErrorCode {
    /// The XML itself failed to parse.
    NotWellFormed,
    /// The pre-parse nesting gate rejected the document.
    TooDeep,
}

/// A document-level failure with its 1-based source position. `Display` is
/// the parser's own message (callers wrap it in the canonical
/// "not valid XHTML" shape).
#[derive(Debug, Clone, PartialEq, Eq, serde::Serialize)]
#[cfg_attr(feature = "wasm", derive(tsify::Tsify))]
pub struct ParseError {
    pub code: ParseErrorCode,
    pub message: String,
    pub line: u32,
    pub column: u32,
}

impl std::fmt::Display for ParseError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        f.write_str(&self.message)
    }
}

/// The element-nesting ceiling. Entries never legitimately approach it;
/// without the pre-parse gate a ~500-deep document overflows the stack
/// INSIDE roxmltree's recursive parser (verified empirically) — a crash on
/// untrusted uploads natively and in the browser (where stacks are smaller).
pub const MAX_DEPTH: usize = 256;

/// Cheap pre-parse nesting scan: max start-tag depth, skipping comments,
/// CDATA, PIs, DOCTYPE, and quoted attribute values (a `>` inside quotes is
/// legal). Faithful on well-formed input — ill-formed input fails the real
/// parse right after, so miscounts there cannot admit a deep document.
/// Returns the byte offset of the offending start tag once `limit` is
/// exceeded.
fn nesting_depth_exceeds(xml: &str, limit: usize) -> Option<usize> {
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
            let tag_start = i;
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
                    return Some(tag_start);
                }
            }
        }
    }
    None
}

/// The 1-based (line, column) of a byte offset — for the pre-parse gate,
/// which has no parsed document to ask.
fn text_pos(xml: &str, offset: usize) -> (usize, usize) {
    let before = &xml.as_bytes()[..offset];
    let line = 1 + before.iter().filter(|&&byte| byte == b'\n').count();
    let column = 1 + before
        .iter()
        .rev()
        .take_while(|&&byte| byte != b'\n')
        .count();
    (line, column)
}

/// Parse and validate a plugin entry, returning structured violations in
/// document order (`Err` = the document itself failed to parse, classified
/// with its position). Callers render the canonical per-violation string via
/// [`Violation::render`].
pub fn validate_entry(xml: &str) -> Result<Vec<Violation>, ParseError> {
    if let Some(offset) = nesting_depth_exceeds(xml, MAX_DEPTH) {
        let (line, column) = text_pos(xml, offset);
        return Err(ParseError {
            code: ParseErrorCode::TooDeep,
            message: format!("document nested deeper than {MAX_DEPTH} levels at {line}:{column}"),
            line: line as u32,
            column: column as u32,
        });
    }
    let document = roxmltree::Document::parse(xml).map_err(|error| {
        let position = error.pos();
        ParseError {
            code: ParseErrorCode::NotWellFormed,
            message: error.to_string(),
            line: position.row,
            column: position.col,
        }
    })?;
    Ok(rules::validate_root(document.root_element(), xml))
}

#[cfg(test)]
mod edge_case_tests {
    use crate::{validate_entry, Violation};

    fn rendered(xml: &str) -> Vec<String> {
        validate_entry(xml)
            .expect("should parse")
            .iter()
            .map(Violation::render)
            .collect()
    }

    #[test]
    fn cdata_is_treated_as_text() {
        let xml = r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml" xmlns:bind="urn:sc-app:bind"><div><![CDATA[hello]]></div></sc-plugin>"#;
        assert_eq!(rendered(xml), Vec::<String>::new());
    }

    #[test]
    fn comment_is_ignored() {
        let xml = r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml" xmlns:bind="urn:sc-app:bind"><!-- comment --><div></div></sc-plugin>"#;
        assert_eq!(rendered(xml), Vec::<String>::new());
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
        let error = validate_entry(&xml).unwrap_err();
        assert_eq!(error.code, crate::ParseErrorCode::TooDeep);
        assert!(
            error
                .message
                .starts_with("document nested deeper than 256 levels at 1:"),
            "{}",
            error.message
        );
    }

    #[test]
    fn parse_failures_are_classified_with_their_position() {
        let error = validate_entry("<sc-plugin><div></sc-plugin>").unwrap_err();
        assert_eq!(error.code, crate::ParseErrorCode::NotWellFormed);
        assert!(error.line >= 1 && error.column >= 1);
        assert_eq!(
            serde_json::to_value(&error).expect("serializes")["code"],
            "not-well-formed"
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
        assert_eq!(rendered(&xml), Vec::<String>::new());
    }

    #[test]
    fn bom_and_unicode_values_pass() {
        let xml = "\u{feff}<?xml version=\"1.0\" encoding=\"UTF-8\"?>\
<sc-plugin xmlns=\"http://www.w3.org/1999/xhtml\">\
<sc-slider value=\"1\" label=\"héllo 🎛️\"/></sc-plugin>";
        assert_eq!(rendered(xml), Vec::<String>::new());
    }

    #[test]
    fn empty_default_namespace_is_flagged() {
        let xml = r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml"><div xmlns=""/></sc-plugin>"#;
        assert_eq!(
            rendered(xml),
            vec![
                r#"<div>: must be in the XHTML namespace (xmlns="http://www.w3.org/1999/xhtml") (1:49)"#
            ]
        );
    }

    #[test]
    fn text_in_element_only_content_fails() {
        let xml = r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml" xmlns:bind="urn:sc-app:bind"><ul> text </ul></sc-plugin>"#;
        // Text in a non-mixed model, and the list's required li is missing.
        assert_eq!(
            rendered(xml),
            vec![
                "<ul>: unexpected text content (1:82)",
                "<ul>: must contain at least one <li> (1:78)",
            ]
        );
    }
}
