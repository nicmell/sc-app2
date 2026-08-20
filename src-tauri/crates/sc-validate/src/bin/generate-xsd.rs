//! CLI: `yarn generate:xsd` (= `cargo run -p sc-validate --bin generate-xsd`)
//! writes the schema next to the backend's embedded copy, cwd-independent.

use std::path::Path;

fn main() {
    let out = Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../src/core/plugin/xsd/sc-plugin-schema.xsd");
    std::fs::write(&out, sc_validate::xsdgen::generate()).expect("write schema");
    println!("wrote {}", out.display());
}
