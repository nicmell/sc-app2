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

    fn namespace(&self) -> Option<&str> {
        self.node.tag_name().namespace()
    }

    fn attributes(&self) -> Vec<(String, String)> {
        self.node
            .attributes()
            .map(|attribute| {
                // The qname range comes from roxmltree's own parse of this
                // source; .get keeps a hypothetical range bug a wrong NAME
                // instead of a panic on an untrusted upload.
                let name = self
                    .source
                    .get(attribute.range_qname())
                    .unwrap_or_else(|| attribute.name());
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
