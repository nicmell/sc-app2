//! `roxmltree` adapter for the validator's generic XML node surface.

use roxmltree::{Document, Node};

use crate::node::XmlNode;

/// A validator node backed by a `roxmltree` node and its source document.
pub struct RoXmlNode<'a, 'input: 'a> {
    node: Node<'a, 'input>,
    source: &'input str,
}

impl<'a, 'input: 'a> RoXmlNode<'a, 'input> {
    /// Wrap a node while retaining the source needed to recover authored qnames.
    pub fn new(node: Node<'a, 'input>, source: &'input str) -> Self {
        Self { node, source }
    }
}

impl<'a, 'input: 'a> XmlNode for RoXmlNode<'a, 'input> {
    fn tag(&self) -> &str {
        self.node.tag_name().name()
    }

    fn attributes(&self) -> Vec<(String, String)> {
        self.node
            .attributes()
            .map(|attribute| {
                let range = attribute.range_qname();
                let name = &self.source[range];
                (name.to_string(), attribute.value().to_string())
            })
            .collect()
    }

    fn children(&self) -> Vec<Self> {
        self.node
            .children()
            .filter(|child| child.is_element())
            .map(|child| Self::new(child, self.source))
            .collect()
    }

    fn has_text(&self) -> bool {
        self.node
            .children()
            .filter(|child| child.is_text())
            .filter_map(|child| child.text())
            .any(|text| !text.trim().is_empty())
    }
}

/// Parse XML with `roxmltree`'s default parser options.
pub fn parse(xml: &str) -> Result<Document<'_>, String> {
    Document::parse(xml).map_err(|error| error.to_string())
}
