//! The small XML node surface shared by native and future browser validators.

/// The minimal read surface validation needs from an XML element.
pub trait XmlNode {
    /// Element tag as authored, using its local name.
    fn tag(&self) -> &str;

    /// The element's namespace URI, if any (entries must place every element
    /// in the XHTML namespace).
    fn namespace(&self) -> Option<&str>;

    /// Attributes in document order as authored qualified names and values.
    fn attributes(&self) -> Vec<(String, String)>;

    /// Child elements in document order.
    fn children(&self) -> Vec<Self>
    where
        Self: Sized;

    /// Whether a direct text or CDATA child contains non-whitespace content.
    fn has_text(&self) -> bool;
}
