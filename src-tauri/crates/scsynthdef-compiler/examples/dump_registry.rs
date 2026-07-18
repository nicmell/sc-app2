//! Dump the crate's UGen registry as JSON, grouped by category — consumed by
//! scripts/scdoc/registry-parity.ts to diff against the TS registry.

fn main() {
    let grouped: Vec<(String, Vec<&scsynthdef_compiler::UGenRegistryEntry>)> =
        scsynthdef_compiler::ugens_by_category()
            .iter()
            .map(|(cat, slice)| (cat.to_string(), slice.iter().collect()))
            .collect();
    println!(
        "{}",
        serde_json::to_string(&grouped).expect("registry JSON")
    );
}
