//! Canonical validation messages shared by native and wasm callers.

/// Message for a static and runtime form appearing together.
pub fn mutually_exclusive(name: &str) -> String {
    format!("\"{name}\" and \"bind:{name}\" are mutually exclusive")
}

/// Message for a required attribute that has no usable form.
pub fn missing_required(name: &str) -> String {
    format!("missing required \"{name}\" attribute")
}

/// Message for a decimal lexical failure.
pub fn decimal(name: &str) -> String {
    format!("\"{name}\" attribute must be a decimal number")
}

/// Message for an integer lexical failure.
pub fn integer(name: &str) -> String {
    format!("\"{name}\" attribute must be an integer")
}

/// Message for a boolean lexical failure.
pub fn boolean(name: &str, raw: &str) -> String {
    format!("\"{name}\" attribute must be one of true|false|1|0 (got \"{raw}\")")
}

/// Message for an enum membership failure.
pub fn enum_value(name: &str, values: &[String], raw: &str) -> String {
    format!(
        "\"{name}\" attribute must be one of {} (got \"{raw}\")",
        values.join("|")
    )
}

/// Message for a name grammar failure.
pub fn name_syntax(name: &str, raw: &str) -> String {
    format!(
        "\"{name}\" attribute must be a plain identifier — letters, digits, \"_\", \"-\" (got \"{raw}\")"
    )
}

/// Message for an inclusive lower-bound failure.
pub fn minimum(name: &str, min: &serde_json::Number, raw: &str) -> String {
    format!("\"{name}\" attribute must be ≥ {min} (got \"{raw}\")")
}

/// Message for an exclusive lower-bound failure.
pub fn exclusive_minimum(name: &str, min: &serde_json::Number, raw: &str) -> String {
    format!("\"{name}\" attribute must be > {min} (got \"{raw}\")")
}

/// Message for an upper-bound failure.
pub fn maximum(name: &str, max: &serde_json::Number, raw: &str) -> String {
    format!("\"{name}\" attribute must be ≤ {max} (got \"{raw}\")")
}

/// Message for a strict numeric vector failure.
pub fn numeric_vector(name: &str, raw: &str) -> String {
    format!("\"{name}\" attribute must be a number or a comma-list of numbers (got \"{raw}\")")
}

/// Message for an unrecognized unqualified attribute.
pub fn unknown_attribute(name: &str) -> String {
    format!("unknown attribute \"{name}\"")
}

/// Message for an attribute using a non-canonical namespace prefix.
pub fn unknown_namespace_prefix(prefix: &str) -> String {
    format!("unknown attribute namespace prefix \"{prefix}:\" (use \"bind:\")")
}

/// Message for an unsupported or non-runtime `bind:` attribute.
pub fn unknown_runtime_attribute(name: &str) -> String {
    format!("unknown runtime attribute \"{name}\"")
}

/// Message for an element outside the XHTML namespace.
pub fn xhtml_namespace() -> String {
    "must be in the XHTML namespace (xmlns=\"http://www.w3.org/1999/xhtml\")".to_string()
}

/// Message for a content model requiring at least one child (listType's
/// sequence semantics — `<ul>`/`<ol>` need an `<li>`).
pub fn missing_required_child(tag: &str) -> String {
    format!("must contain at least one <{tag}>")
}

/// Message for a direct child excluded by a content model.
pub fn unexpected_child(tag: &str) -> String {
    format!("unexpected child <{tag}>")
}

/// Message for non-whitespace text in an element-only content model.
pub fn unexpected_text() -> String {
    "unexpected text content".to_string()
}

/// Message for an element past the nesting ceiling (its subtree is skipped).
pub fn too_deep(limit: usize) -> String {
    format!("nested deeper than {limit} levels")
}

/// Message for an entry whose document element is not `sc-plugin`.
pub fn wrong_root(tag: &str) -> String {
    format!("plugin entry root must be <sc-plugin> (got <{tag}>)")
}
