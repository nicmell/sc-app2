//! CLI: `yarn generate:xsd` (= `cargo run -p sc-validate --bin generate-xsd`)
//! writes the schema next to the backend's embedded copy, cwd-independent.

#[cfg(not(feature = "wasm"))]
fn main() {
    let out = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../src/core/plugin/xsd/sc-plugin-schema.xsd");
    std::fs::write(&out, sc_validate::xsdgen::generate()).expect("write schema");
    println!("wrote {}", out.display());
}

// xsdgen is native-only; the wasm feature build compiles this bin to a no-op.
#[cfg(feature = "wasm")]
fn main() {}
