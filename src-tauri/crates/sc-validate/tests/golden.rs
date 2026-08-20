//! Golden gate over the repo's example plugins: the static fixtures pin their
//! EXACT violation vectors (the same strings the frontend joins per line);
//! `bad-entry-xhtml` pins the parse failure; every other example entry —
//! functional plugins AND the resolution/upload-side fixtures — must
//! statically validate clean.

use std::path::{Path, PathBuf};

use serde::Deserialize;

#[derive(Deserialize)]
struct Metadata {
    entry: String,
}

/// What the static gate must say about a fixture.
enum Expect {
    /// The XML itself must fail to parse.
    Malformed,
    /// Exactly these rendered violations, in document order.
    Violations(&'static [&'static str]),
}

/// The fixtures with non-empty expectations; everything else must be clean.
const EXPECTED: &[(&str, Expect)] = &[
    ("invalid/bad-entry-xhtml", Expect::Malformed),
    (
        "invalid/bad-entry-schema",
        Expect::Violations(&[r#"<sc-plugin>: unexpected child <script>"#]),
    ),
    (
        "invalid/bad-name-syntax",
        Expect::Violations(&[
            r#"<sc-var>: "name" attribute must be a plain identifier — letters, digits, "_", "-" (got "s1.freq")"#,
        ]),
    ),
    (
        "invalid/bad-runtime-conflict",
        Expect::Violations(&[r#"<sc-var>: "value" and "bind:value" are mutually exclusive"#]),
    ),
    (
        "invalid/bad-attr-multierror",
        Expect::Violations(&[
            r#"<sc-slider>: missing required "value" attribute"#,
            r#"<sc-knob>: "min" attribute must be a decimal number"#,
            r#"<sc-scope>: "frames" attribute must be an integer"#,
            r#"<sc-switch>: "disabled" attribute must be one of true|false|1|0 (got "yes")"#,
            r#"<sc-flex>: "gap" attribute must be one of none|xs|sm|md|lg (got "huge")"#,
            r#"<sc-scope>: "channels" attribute must be ≥ 1 (got "0")"#,
            r#"<sc-scope>: "frames" attribute must be ≤ 16384 (got "99999")"#,
            r#"<sc-scope>: "gain" attribute must be > 0 (got "0")"#,
            r#"<sc-control>: "value" attribute must be a number or a comma-list of numbers (got "foo bar")"#,
            r#"<sc-display>: unknown attribute "foo""#,
            r#"<div>: unknown attribute namespace prefix "data:" (use "bind:")"#,
            r#"<sc-keyboard>: unknown runtime attribute "bind:octaves""#,
        ]),
    ),
    (
        "invalid/bad-content-multierror",
        Expect::Violations(&[
            r#"<sc-plugin>: unexpected child <sc-option>"#,
            r#"<sc-slider>: unexpected child <div>"#,
            r#"<sc-display>: unexpected text content"#,
            r#"<ul>: must contain at least one <li>"#,
        ]),
    ),
    (
        "invalid/bad-namespace",
        Expect::Violations(&[
            r#"<sc-plugin>: must be in the XHTML namespace (xmlns="http://www.w3.org/1999/xhtml")"#,
            r#"<div>: must be in the XHTML namespace (xmlns="http://www.w3.org/1999/xhtml")"#,
        ]),
    ),
];

fn plugin_dirs() -> Vec<PathBuf> {
    let examples = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../examples");
    let mut categories: Vec<PathBuf> = std::fs::read_dir(&examples)
        .expect("examples directory")
        .filter_map(|entry| entry.ok().map(|e| e.path()))
        .filter(|path| path.is_dir())
        .collect();
    categories.sort();
    let mut plugins = Vec::new();
    for category in categories {
        let mut dirs: Vec<PathBuf> = std::fs::read_dir(&category)
            .expect("category directory")
            .filter_map(|entry| entry.ok().map(|e| e.path()))
            .filter(|path| path.is_dir())
            .collect();
        dirs.sort();
        plugins.extend(dirs);
    }
    plugins
}

fn entry_for(plugin: &Path) -> String {
    let metadata: Metadata = serde_json::from_str(
        &std::fs::read_to_string(plugin.join("metadata.json")).expect("metadata.json"),
    )
    .expect("valid metadata.json");
    std::fs::read_to_string(plugin.join(&metadata.entry)).expect("entry file")
}

#[test]
fn examples_match_static_validation_contract() {
    let examples = Path::new(env!("CARGO_MANIFEST_DIR")).join("../../../examples");
    let mut matched: Vec<&str> = Vec::new();
    for plugin in plugin_dirs() {
        let relative = plugin
            .strip_prefix(&examples)
            .expect("inside examples")
            .to_string_lossy()
            .replace('\\', "/");
        let result = sc_validate::validate_entry(&entry_for(&plugin));
        match EXPECTED.iter().find(|(path, _)| *path == relative) {
            Some((path, Expect::Malformed)) => {
                matched.push(path);
                assert!(result.is_err(), "{relative}: expected a parse failure");
            }
            Some((path, Expect::Violations(expected))) => {
                matched.push(path);
                let expected: Vec<String> = expected.iter().map(|s| s.to_string()).collect();
                assert_eq!(result, Ok(expected), "{relative}: violation mismatch");
            }
            None => {
                assert_eq!(
                    result,
                    Ok(Vec::new()),
                    "unexpected static violations in {relative}"
                );
            }
        }
    }
    // Every expectation must have found its fixture (catches renames/moves).
    assert_eq!(matched.len(), EXPECTED.len(), "stale EXPECTED entries");
}
