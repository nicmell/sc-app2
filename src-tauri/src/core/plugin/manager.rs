//! Plugin validation + storage. A plugin is a zip bundle containing a
//! `metadata.json`, an entry XHTML file (validated by the shared sc-validate
//! static gate), and optional png/jpeg assets. Validated bundles are stored under
//! [`config::plugins_dir`] and tracked in a [`config::plugins_registry_path`]
//! JSON registry. Ported from upstream sc-app, adapted to our config paths +
//! a dedicated registry file (rather than mixing into the typed `config.json`).

use std::io::Read;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::core::config;

#[derive(Serialize, Deserialize, Clone)]
pub struct AssetInfo {
    pub path: String,
    #[serde(rename = "type")]
    pub mime_type: String,
}

#[derive(Serialize, Deserialize, Clone)]
pub struct PluginInfo {
    pub id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub title: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub description: Option<String>,
    pub author: String,
    pub version: String,
    pub entry: String,
    pub assets: Vec<AssetInfo>,
}

/// Manager failures, typed for the HTTP envelope (the router maps variants to
/// status + code) while `Display` keeps the CLI's exact plain-text output.
#[derive(Debug)]
pub enum PluginError {
    /// The entry violates the sc-plugin spec — the STRUCTURED violations
    /// (the router ships them as the ApiError `violations` payload).
    Spec(Vec<sc_validate::Violation>),
    /// A validation failure in the bundle (zip shape, metadata, entry parse,
    /// asset content) — a 400.
    Invalid(String),
    /// A plugin id / declared file that does not exist — a 404.
    NotFound(String),
    /// A path-traversal attempt on the file endpoint — a 403.
    Forbidden,
    /// Registry / filesystem trouble — a 500.
    Io(String),
}

impl std::fmt::Display for PluginError {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            PluginError::Spec(violations) => write!(
                f,
                "entry file does not conform to the sc-plugin spec:\n{}",
                violations
                    .iter()
                    .map(sc_validate::Violation::render)
                    .collect::<Vec<_>>()
                    .join("\n")
            ),
            PluginError::Invalid(message)
            | PluginError::NotFound(message)
            | PluginError::Io(message) => f.write_str(message),
            PluginError::Forbidden => f.write_str("forbidden path"),
        }
    }
}

/// The CLI consumes manager errors as plain strings (`?` into
/// `Result<_, String>`) — Display keeps that output byte-identical.
impl From<PluginError> for String {
    fn from(error: PluginError) -> Self {
        error.to_string()
    }
}

const SUPPORTED_ASSET_TYPES: &[&str] = &["png", "jpeg"];

fn is_valid_name(s: &str) -> bool {
    !s.is_empty()
        && s.chars()
            .all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

fn is_valid_version(s: &str) -> bool {
    let parts: Vec<&str> = s.split('.').collect();
    parts.len() == 3
        && parts
            .iter()
            .all(|p| !p.is_empty() && p.chars().all(|c| c.is_ascii_digit()))
}

/// A relative path with no `..`/absolute components (zip path-traversal guard).
pub fn is_safe_path(name: &str) -> bool {
    let path = std::path::Path::new(name);
    path.components()
        .all(|c| matches!(c, std::path::Component::Normal(_)))
}

pub fn asset_type_to_mime(t: &str) -> &'static str {
    match t {
        "png" => "image/png",
        "jpeg" => "image/jpeg",
        _ => "application/octet-stream",
    }
}

fn validate_metadata(raw: &serde_json::Value) -> Result<PluginInfo, String> {
    let obj = raw
        .as_object()
        .ok_or("metadata.json must be a JSON object")?;

    let get_str = |key: &str| -> Result<String, String> {
        obj.get(key)
            .and_then(|v| v.as_str())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .ok_or_else(|| format!("metadata.json: \"{key}\" must be a non-empty string"))
    };
    let get_optional_str = |key: &str| -> Result<Option<String>, String> {
        match obj.get(key) {
            None => Ok(None),
            Some(value) => value
                .as_str()
                .map(|s| s.trim().to_string())
                .filter(|s| !s.is_empty())
                .map(Some)
                .ok_or_else(|| format!("metadata.json: \"{key}\" must be a non-empty string")),
        }
    };

    let name = get_str("name")?;
    if !is_valid_name(&name) {
        return Err("metadata.json: \"name\" must only contain A-Z a-z 0-9 - _".to_string());
    }

    let version = get_str("version")?;
    if !is_valid_version(&version) {
        return Err("metadata.json: \"version\" must be in the form major.minor.patch".to_string());
    }

    let entry = get_str("entry")?;
    if !is_safe_path(&entry) {
        return Err("metadata.json: \"entry\" must be a valid relative path".to_string());
    }

    let assets = match obj.get("assets") {
        Some(serde_json::Value::Array(arr)) => {
            let mut result = Vec::with_capacity(arr.len());
            for (i, item) in arr.iter().enumerate() {
                let asset_obj = item
                    .as_object()
                    .ok_or_else(|| format!("metadata.json: assets[{i}] must be an object"))?;
                let path = asset_obj
                    .get("path")
                    .and_then(|v| v.as_str())
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| {
                        format!("metadata.json: assets[{i}].path must be a non-empty string")
                    })?;
                if !is_safe_path(&path) {
                    return Err(format!(
                        "metadata.json: assets[{i}].path must be a valid relative path"
                    ));
                }
                let mime_type = asset_obj
                    .get("type")
                    .and_then(|v| v.as_str())
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| {
                        format!("metadata.json: assets[{i}].type must be a non-empty string")
                    })?;
                if !SUPPORTED_ASSET_TYPES.contains(&mime_type.as_str()) {
                    return Err(format!(
                        "metadata.json: assets[{i}].type \"{mime_type}\" is not supported (expected one of: {SUPPORTED_ASSET_TYPES:?})"
                    ));
                }
                result.push(AssetInfo { path, mime_type });
            }
            result
        }
        Some(_) => return Err("metadata.json: \"assets\" must be an array".to_string()),
        None => Vec::new(),
    };

    Ok(PluginInfo {
        // Minted at install time (add_plugin) — validation is pure.
        id: String::new(),
        name,
        title: get_optional_str("title")?,
        description: get_optional_str("description")?,
        author: get_str("author")?,
        version,
        entry,
        assets,
    })
}

/// Validate the entry against the element specs (the sc-validate crate): the
/// whole static gate — well-formedness, XHTML namespace, attributes, and
/// content-model membership. Multi-error: every violation is kept STRUCTURED
/// ([`PluginError::Spec`]); Display renders them one per line.
fn validate_entry_spec(entry_content: &str) -> Result<(), PluginError> {
    let violations = sc_validate::validate_entry(entry_content)
        .map_err(|e| PluginError::Invalid(format!("entry file is not valid XHTML: {e}")))?;
    if !violations.is_empty() {
        return Err(PluginError::Spec(violations));
    }
    Ok(())
}

fn validate_asset_image(data: &[u8], declared_type: &str) -> Result<(), String> {
    let format =
        image::guess_format(data).map_err(|e| format!("failed to detect image format: {e}"))?;
    let detected = match format {
        image::ImageFormat::Png => "png",
        image::ImageFormat::Jpeg => "jpeg",
        _ => return Err(format!("unsupported image format detected: {format:?}")),
    };
    if detected != declared_type {
        return Err(format!(
            "image content is {detected} but declared type is \"{declared_type}\""
        ));
    }
    Ok(())
}

/// Validate a plugin zip end to end: metadata, entry spec, and asset formats.
pub fn validate_plugin(data: &[u8]) -> Result<PluginInfo, PluginError> {
    let invalid = PluginError::Invalid;
    let mut archive = zip::ZipArchive::new(std::io::Cursor::new(data))
        .map_err(|_| invalid("file is not a valid zip archive".to_string()))?;

    let metadata_text = {
        let mut file = archive
            .by_name("metadata.json")
            .map_err(|_| invalid("zip must contain a metadata.json at its root".to_string()))?;
        let mut text = String::new();
        file.read_to_string(&mut text)
            .map_err(|e| invalid(format!("failed to read metadata.json: {e}")))?;
        text
    };
    let meta_value: serde_json::Value = serde_json::from_str(&metadata_text)
        .map_err(|_| invalid("metadata.json is not valid JSON".to_string()))?;
    let info = validate_metadata(&meta_value).map_err(invalid)?;

    let entry_content = {
        let mut entry_file = archive
            .by_name(&info.entry)
            .map_err(|_| invalid(format!("entry file \"{}\" not found in zip", info.entry)))?;
        let mut content = String::new();
        entry_file
            .read_to_string(&mut content)
            .map_err(|e| invalid(format!("failed to read entry file \"{}\": {e}", info.entry)))?;
        content
    };
    validate_entry_spec(&entry_content)?;

    for asset in &info.assets {
        let mut asset_file = archive
            .by_name(&asset.path)
            .map_err(|_| invalid(format!("asset file \"{}\" not found in zip", asset.path)))?;
        let mut bytes = Vec::new();
        asset_file
            .read_to_end(&mut bytes)
            .map_err(|e| invalid(format!("failed to read asset \"{}\": {e}", asset.path)))?;
        validate_asset_image(&bytes, &asset.mime_type)
            .map_err(|e| invalid(format!("asset \"{}\": {e}", asset.path)))?;
    }

    Ok(info)
}

// ── registry (plugins.json) ──────────────────────────────────────

fn read_registry() -> Result<Vec<PluginInfo>, String> {
    let path = config::plugins_registry_path();
    match std::fs::read_to_string(&path) {
        Ok(s) => serde_json::from_str(&s).map_err(|e| format!("plugins.json is corrupt: {e}")),
        Err(_) => Ok(Vec::new()),
    }
}

fn write_registry(plugins: &[PluginInfo]) -> Result<(), String> {
    let path = config::plugins_registry_path();
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(plugins).map_err(|e| e.to_string())?;
    std::fs::write(&path, json).map_err(|e| e.to_string())
}

fn zip_filename(info: &PluginInfo) -> PathBuf {
    config::plugins_dir().join(format!("{}-{}.{}.zip", info.name, info.version, info.id))
}

/// Validate + store a plugin bundle, replacing any existing entry with the same
/// name+version. Mints the registry id here (validation stays pure) and
/// returns the stored [`PluginInfo`].
pub fn add_plugin(data: &[u8]) -> Result<PluginInfo, PluginError> {
    let mut info = validate_plugin(data)?;
    info.id = uuid::Uuid::new_v4().simple().to_string();

    let plugins_dir = config::plugins_dir();
    std::fs::create_dir_all(&plugins_dir).map_err(|e| PluginError::Io(e.to_string()))?;
    std::fs::write(zip_filename(&info), data).map_err(|e| PluginError::Io(e.to_string()))?;

    let mut registry = read_registry().map_err(PluginError::Io)?;
    // Drop any prior copy of the same name+version (and its zip).
    registry.retain(|p| {
        let same = p.name == info.name && p.version == info.version;
        if same {
            let _ = std::fs::remove_file(zip_filename(p));
        }
        !same
    });
    registry.push(info.clone());
    write_registry(&registry).map_err(PluginError::Io)?;

    Ok(info)
}

/// Remove a plugin (registry entry + its zip) by id.
pub fn remove_plugin(id: &str) -> Result<(), PluginError> {
    let mut registry = read_registry().map_err(PluginError::Io)?;
    let idx = registry
        .iter()
        .position(|p| p.id == id)
        .ok_or_else(|| PluginError::NotFound(format!("plugin with id \"{id}\" not found")))?;
    let info = registry.remove(idx);
    write_registry(&registry).map_err(PluginError::Io)?;
    let _ = std::fs::remove_file(zip_filename(&info));
    Ok(())
}

pub fn list_plugins() -> Result<Vec<PluginInfo>, PluginError> {
    read_registry().map_err(PluginError::Io)
}

/// Read a file (the entry or a declared asset) out of a plugin's zip, returning
/// its bytes + content type. Rejects undeclared files and unsafe paths.
pub fn read_plugin_file(id: &str, file_path: &str) -> Result<(String, Vec<u8>), PluginError> {
    if !is_safe_path(file_path) {
        return Err(PluginError::Forbidden);
    }
    let info = read_registry()
        .map_err(PluginError::Io)?
        .into_iter()
        .find(|p| p.id == id)
        .ok_or_else(|| PluginError::NotFound("plugin not found".to_string()))?;

    // Only the entry file and declared assets are served.
    let content_type = if file_path == info.entry {
        "application/xhtml+xml".to_string()
    } else {
        match info.assets.iter().find(|a| a.path == file_path) {
            Some(a) => asset_type_to_mime(&a.mime_type).to_string(),
            None => {
                return Err(PluginError::NotFound(
                    "file not declared in plugin metadata".to_string(),
                ))
            }
        }
    };

    let data = std::fs::read(zip_filename(&info))
        .map_err(|_| PluginError::Io("plugin archive missing".to_string()))?;
    let mut archive = zip::ZipArchive::new(std::io::Cursor::new(data))
        .map_err(|_| PluginError::Io("failed to read plugin archive".to_string()))?;
    let mut file = archive
        .by_name(file_path)
        .map_err(|_| PluginError::NotFound("file not found in plugin".to_string()))?;
    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes)
        .map_err(|e| PluginError::Io(e.to_string()))?;
    Ok((content_type, bytes))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn rejects_non_zip() {
        assert!(validate_plugin(b"not a zip").is_err());
    }

    #[test]
    fn name_and_version_rules() {
        assert!(is_valid_name("my-plugin_1"));
        assert!(!is_valid_name("bad name"));
        assert!(is_valid_version("1.2.3"));
        assert!(!is_valid_version("1.2"));
        assert!(!is_valid_version("1.2.x"));
    }

    #[test]
    fn optional_display_metadata_must_be_non_empty_strings() {
        let base = serde_json::json!({
            "name": "plugin",
            "author": "author",
            "version": "1.2.3",
            "entry": "index.html"
        });
        let without_display_metadata = validate_metadata(&base).unwrap();
        assert_eq!(without_display_metadata.title, None);
        assert_eq!(without_display_metadata.description, None);

        let mut with_display_metadata = base.clone();
        with_display_metadata["title"] = serde_json::json!(" Plugin title ");
        with_display_metadata["description"] = serde_json::json!(" Plugin description ");
        let info = validate_metadata(&with_display_metadata).unwrap();
        assert_eq!(info.title.as_deref(), Some("Plugin title"));
        assert_eq!(info.description.as_deref(), Some("Plugin description"));

        let mut invalid = base;
        invalid["title"] = serde_json::json!("  ");
        assert_eq!(
            validate_metadata(&invalid).err().unwrap(),
            "metadata.json: \"title\" must be a non-empty string"
        );
    }

    #[test]
    fn safe_path_rejects_traversal() {
        assert!(is_safe_path("entry.html"));
        assert!(is_safe_path("assets/logo.png"));
        assert!(!is_safe_path("../secret"));
        assert!(!is_safe_path("/etc/passwd"));
    }

    #[test]
    fn registry_lifecycle_round_trips_on_the_test_root() {
        crate::core::config::install_test_root();
        // A minimal valid bundle, built in memory.
        let mut zip = zip::ZipWriter::new(std::io::Cursor::new(Vec::new()));
        let options = zip::write::SimpleFileOptions::default()
            .compression_method(zip::CompressionMethod::Stored);
        zip.start_file("metadata.json", options).unwrap();
        zip.write_all(
            br#"{"name":"lifecycle","author":"t","version":"0.0.1","entry":"index.html"}"#,
        )
        .unwrap();
        zip.start_file("index.html", options).unwrap();
        zip.write_all(
            br#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml"><sc-scope/></sc-plugin>"#,
        )
        .unwrap();
        let bundle = zip.finish().unwrap().into_inner();

        use std::io::Write;
        let info = add_plugin(&bundle).expect("adds");
        assert!(!info.id.is_empty());
        assert!(list_plugins()
            .expect("lists")
            .iter()
            .any(|p| p.id == info.id));
        let (content_type, bytes) = read_plugin_file(&info.id, "index.html").expect("serves");
        assert_eq!(content_type, "application/xhtml+xml");
        assert!(bytes.starts_with(b"<sc-plugin"));
        remove_plugin(&info.id).expect("removes");
        assert!(!list_plugins()
            .expect("lists")
            .iter()
            .any(|p| p.id == info.id));
        assert!(matches!(
            read_plugin_file(&info.id, "index.html"),
            Err(PluginError::NotFound(_))
        ));
    }

    #[test]
    fn entry_spec_gate_reports_every_violation_one_per_line() {
        let ok = r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml"><sc-scope/></sc-plugin>"#;
        assert!(validate_entry_spec(ok).is_ok());
        // Two independent violations — both reported, newline-joined.
        let bad = r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml"><sc-var name="a.b" value="1"/><div foo="x"/></sc-plugin>"#;
        // The variant carries the STRUCTURED violations; Display keeps the
        // exact CLI/native text (the newline-joined blob).
        let error = validate_entry_spec(bad).err().unwrap();
        assert!(matches!(&error, PluginError::Spec(v) if v.len() == 2));
        assert_eq!(
            error.to_string(),
            "entry file does not conform to the sc-plugin spec:\n\
             <sc-var>: \"name\" attribute must be a plain identifier — letters, digits, \"_\", \"-\" (got \"a.b\") (1:57)\n\
             <div>: unknown attribute \"foo\" (1:84)"
        );
        let malformed = "<sc-plugin><div></sc-plugin>";
        assert!(validate_entry_spec(malformed)
            .err()
            .unwrap()
            .to_string()
            .starts_with("entry file is not valid XHTML:"));
    }

    #[test]
    fn entry_spec_accepts_minimal_plugin_and_rejects_unknown_element() {
        let ok =
            r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml"><sc-scope></sc-scope></sc-plugin>"#;
        assert!(validate_entry_spec(ok).is_ok());
        let bad =
            r#"<sc-plugin xmlns="http://www.w3.org/1999/xhtml"><sc-bogus></sc-bogus></sc-plugin>"#;
        assert!(validate_entry_spec(bad).is_err());
    }
}
