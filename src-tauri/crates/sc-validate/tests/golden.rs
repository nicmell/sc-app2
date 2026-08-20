use std::fs;
use std::path::{Path, PathBuf};

use sc_validate::validate_entry;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
struct Metadata {
    entry: String,
}

fn plugin_dirs() -> Vec<PathBuf> {
    let examples = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../examples");
    let mut plugins = Vec::new();

    let mut categories: Vec<PathBuf> = fs::read_dir(&examples)
        .expect("examples directory must exist")
        .map(|entry| {
            entry
                .expect("example category entry must be readable")
                .path()
        })
        .filter(|path| path.is_dir())
        .collect();
    categories.sort();

    for category in categories {
        let mut entries: Vec<PathBuf> = fs::read_dir(category)
            .expect("example category must be readable")
            .map(|entry| entry.expect("plugin entry must be readable").path())
            .filter(|path| path.is_dir())
            .collect();
        entries.sort();
        plugins.extend(entries);
    }

    plugins
}

fn entry_for(plugin: &Path) -> String {
    let metadata: Metadata = serde_json::from_str(
        &fs::read_to_string(plugin.join("metadata.json")).expect("metadata must be readable"),
    )
    .expect("metadata entry must be valid JSON");
    fs::read_to_string(plugin.join(metadata.entry)).expect("entry must be readable")
}

#[test]
fn examples_match_static_validation_contract() {
    let mut seen = Vec::new();

    for plugin in plugin_dirs() {
        let relative = plugin
            .strip_prefix(Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../examples"))
            .expect("plugin should be under examples")
            .to_string_lossy()
            .replace('\\', "/");
        let result = validate_entry(&entry_for(&plugin));
        seen.push((relative, result));
    }

    let bad_name = seen
        .iter()
        .find(|(path, _)| path == "invalid/bad-name-syntax")
        .expect("bad-name-syntax fixture should be present");
    assert_eq!(
        bad_name.1,
        Ok(vec![
            r#"<sc-var>: "name" attribute must be a plain identifier — letters, digits, "_", "-" (got "s1.freq")"#.to_string()
        ])
    );

    let runtime_conflict = seen
        .iter()
        .find(|(path, _)| path == "invalid/bad-runtime-conflict")
        .expect("bad-runtime-conflict fixture should be present");
    assert_eq!(
        runtime_conflict.1,
        Ok(vec![
            r#"<sc-var>: "value" and "bind:value" are mutually exclusive"#.to_string()
        ])
    );

    let schema = seen
        .iter()
        .find(|(path, _)| path == "invalid/bad-entry-schema")
        .expect("bad-entry-schema fixture should be present");
    assert_eq!(
        schema.1,
        Ok(vec![r#"<sc-plugin>: unexpected child <script>"#.to_string()])
    );

    let malformed = seen
        .iter()
        .find(|(path, _)| path == "invalid/bad-entry-xhtml")
        .expect("bad-entry-xhtml fixture should be present");
    assert!(malformed.1.is_err(), "malformed XML must be rejected");

    for (path, result) in seen {
        if path == "invalid/bad-name-syntax"
            || path == "invalid/bad-runtime-conflict"
            || path == "invalid/bad-entry-schema"
            || path == "invalid/bad-entry-xhtml"
        {
            continue;
        }
        assert_eq!(
            result,
            Ok(Vec::new()),
            "unexpected static violations in {path}"
        );
    }
}
