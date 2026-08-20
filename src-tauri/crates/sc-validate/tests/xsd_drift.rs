//! Drift guard: the committed sc-plugin-schema.xsd must equal the generator's
//! output. Fails if a spec (or the embedded preamble) changed without
//! re-running `yarn generate:xsd`, or if the schema was hand-edited.

#[test]
fn committed_schema_matches_the_generator() {
    let committed = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .join("../../src/core/plugin/xsd/sc-plugin-schema.xsd");
    let committed = std::fs::read_to_string(committed).expect("committed schema");
    assert_eq!(
        sc_validate::xsdgen::generate(),
        committed,
        "sc-plugin-schema.xsd is stale — run `yarn generate:xsd`"
    );
}
