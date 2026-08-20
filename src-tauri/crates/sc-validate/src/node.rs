//! The small XML node surface shared by native and future browser validators.

/// The minimal read surface validation needs from an XML element.
pub trait XmlNode {
    /// Element tag as authored, using its local name.
    fn tag(&self) -> &str;

    /// Attributes in document order as authored qualified names and values.
    fn attributes(&self) -> Vec<(String, String)>;

    /// Child elements in document order.
    fn children(&self) -> Vec<Self>
    where
        Self: Sized;

    /// Whether a direct text or CDATA child contains non-whitespace content.
    fn has_text(&self) -> bool;

    /// Whether any descendant at any depth has an `sc-`-prefixed local tag.
    fn has_sc_descendant(&self) -> bool
    where
        Self: Sized,
    {
        self.children()
            .into_iter()
            .any(|child| child.tag().starts_with("sc-") || child.has_sc_descendant())
    }
}
