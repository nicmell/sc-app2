//! Plugin system: validated zip bundles of XHTML + `sc-*` elements, stored on
//! disk and served over HTTP. [`manager`] owns validation + storage; the HTTP
//! routes live in [`crate::router::plugin`].

pub mod manager;
