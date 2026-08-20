//! Cross-check: the fixed HTML vocabulary tables in spec.rs must agree with
//! the hand-authored declarations and groups in the embedded preamble.xml
//! (the successor of the retired html-preamble vitest).

use sc_validate::spec::{
    HtmlKind, COMMON_ATTRS, HTML_ELEMENTS, HTML_ELEMENTS_GROUP, INLINE_CONTENT,
};

const PREAMBLE: &str = include_str!("../preamble.xml");

fn schema<'a>(doc: &'a roxmltree::Document) -> roxmltree::Node<'a, 'a> {
    doc.root_element()
}

#[test]
fn element_declarations_match_the_table() {
    let doc = roxmltree::Document::parse(PREAMBLE).expect("preamble parses");
    let declared: Vec<(String, HtmlKind)> = schema(&doc)
        .children()
        .filter(|n| n.is_element() && n.tag_name().name() == "element")
        .map(|n| {
            let tag = n.attribute("name").expect("element name").to_string();
            let kind = match n.attribute("type") {
                None => HtmlKind::Empty,
                Some("blockType") => HtmlKind::Block,
                Some("inlineType") => HtmlKind::Inline,
                Some("listType") => HtmlKind::List,
                Some(other) => panic!("unexpected HTML declaration type {other}"),
            };
            (tag, kind)
        })
        .collect();
    let table: Vec<(String, HtmlKind)> = HTML_ELEMENTS
        .iter()
        .map(|&(tag, kind)| (tag.to_string(), kind))
        .collect();
    assert_eq!(declared, table);
}

fn group_refs(doc: &roxmltree::Document, name: &str) -> Vec<String> {
    schema(doc)
        .children()
        .filter(|n| n.is_element() && n.tag_name().name() == "group")
        .find(|n| n.attribute("name") == Some(name))
        .unwrap_or_else(|| panic!("missing preamble group {name}"))
        .descendants()
        .filter(|n| n.is_element() && n.tag_name().name() == "element")
        .map(|n| n.attribute("ref").expect("group ref").to_string())
        .collect()
}

#[test]
fn groups_match_the_tables() {
    let doc = roxmltree::Document::parse(PREAMBLE).expect("preamble parses");
    assert_eq!(group_refs(&doc, "htmlElements"), HTML_ELEMENTS_GROUP);
    assert_eq!(group_refs(&doc, "inlineContent"), INLINE_CONTENT);
}

#[test]
fn common_attrs_match_the_attribute_group() {
    let doc = roxmltree::Document::parse(PREAMBLE).expect("preamble parses");
    let names: Vec<String> = schema(&doc)
        .children()
        .filter(|n| n.is_element() && n.tag_name().name() == "attributeGroup")
        .find(|n| n.attribute("name") == Some("commonAttrs"))
        .expect("commonAttrs group")
        .children()
        .filter(|n| n.is_element() && n.tag_name().name() == "attribute")
        .map(|n| n.attribute("name").expect("attribute name").to_string())
        .collect();
    assert_eq!(names, COMMON_ATTRS);
}
