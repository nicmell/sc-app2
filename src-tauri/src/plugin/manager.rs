//! Plugin validation + storage. A plugin is a zip bundle containing a
//! `metadata.json`, an entry XHTML file (validated against the embedded XSD
//! schema), and optional png/jpeg assets. Validated bundles are stored under
//! [`config::plugins_dir`] and tracked in a [`config::plugins_registry_path`]
//! JSON registry. Ported from upstream sc-app, adapted to our config paths +
//! a dedicated registry file (rather than mixing into the typed `config.json`).

use std::io::Read;
use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::config;

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
    pub author: String,
    pub version: String,
    pub entry: String,
    pub assets: Vec<AssetInfo>,
}

const XSD_SCHEMA: &str = include_str!("xsd/sc-plugin-schema.xsd");
const SUPPORTED_ASSET_TYPES: &[&str] = &["png", "jpeg"];

fn is_valid_name(s: &str) -> bool {
    !s.is_empty() && s.chars().all(|c| c.is_ascii_alphanumeric() || c == '-' || c == '_')
}

fn is_valid_version(s: &str) -> bool {
    let parts: Vec<&str> = s.split('.').collect();
    parts.len() == 3 && parts.iter().all(|p| !p.is_empty() && p.chars().all(|c| c.is_ascii_digit()))
}

/// A relative path with no `..`/absolute components (zip path-traversal guard).
pub fn is_safe_path(name: &str) -> bool {
    let path = std::path::Path::new(name);
    path.components().all(|c| matches!(c, std::path::Component::Normal(_)))
}

pub fn asset_type_to_mime(t: &str) -> &'static str {
    match t {
        "png" => "image/png",
        "jpeg" => "image/jpeg",
        _ => "application/octet-stream",
    }
}

fn validate_metadata(raw: &serde_json::Value) -> Result<PluginInfo, String> {
    let obj = raw.as_object().ok_or("metadata.json must be a JSON object")?;

    let get_str = |key: &str| -> Result<String, String> {
        obj.get(key)
            .and_then(|v| v.as_str())
            .map(|s| s.trim().to_string())
            .filter(|s| !s.is_empty())
            .ok_or_else(|| format!("metadata.json: \"{key}\" must be a non-empty string"))
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
                    .ok_or_else(|| format!("metadata.json: assets[{i}].path must be a non-empty string"))?;
                if !is_safe_path(&path) {
                    return Err(format!("metadata.json: assets[{i}].path must be a valid relative path"));
                }
                let mime_type = asset_obj
                    .get("type")
                    .and_then(|v| v.as_str())
                    .map(|s| s.trim().to_string())
                    .filter(|s| !s.is_empty())
                    .ok_or_else(|| format!("metadata.json: assets[{i}].type must be a non-empty string"))?;
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
        author: get_str("author")?,
        version,
        entry,
        assets,
    })
}

/// Validate the entry XHTML against the embedded XSD schema.
fn validate_entry_xhtml(entry_content: &str) -> Result<(), String> {
    let ctx = fastxml::create_xml_schema_validation_context_from_buffer(XSD_SCHEMA.as_bytes())
        .map_err(|e| format!("failed to parse XSD schema: {e}"))?;
    let doc = fastxml::parse(entry_content)
        .map_err(|e| format!("entry file is not valid XHTML: {e}"))?;
    let errors = fastxml::validate_document_by_schema_context(&doc, &ctx)
        .map_err(|e| format!("entry file validation failed: {e}"))?;
    if !errors.is_empty() {
        let msgs: Vec<String> = errors.iter().map(|e| e.to_string()).collect();
        return Err(format!(
            "entry file does not conform to the sc-plugin schema:\n{}",
            msgs.join("\n")
        ));
    }
    Ok(())
}

fn validate_asset_image(data: &[u8], declared_type: &str) -> Result<(), String> {
    let format = image::guess_format(data).map_err(|e| format!("failed to detect image format: {e}"))?;
    let detected = match format {
        image::ImageFormat::Png => "png",
        image::ImageFormat::Jpeg => "jpeg",
        _ => return Err(format!("unsupported image format detected: {format:?}")),
    };
    if detected != declared_type {
        return Err(format!("image content is {detected} but declared type is \"{declared_type}\""));
    }
    Ok(())
}

/// Validate a plugin zip end to end: metadata, entry XSD, and asset formats.
pub fn validate_plugin(data: &[u8]) -> Result<PluginInfo, String> {
    let mut archive = zip::ZipArchive::new(std::io::Cursor::new(data))
        .map_err(|_| "file is not a valid zip archive".to_string())?;

    let metadata_text = {
        let mut file = archive
            .by_name("metadata.json")
            .map_err(|_| "zip must contain a metadata.json at its root".to_string())?;
        let mut text = String::new();
        file.read_to_string(&mut text).map_err(|e| format!("failed to read metadata.json: {e}"))?;
        text
    };
    let meta_value: serde_json::Value =
        serde_json::from_str(&metadata_text).map_err(|_| "metadata.json is not valid JSON".to_string())?;
    let info = validate_metadata(&meta_value)?;

    let entry_content = {
        let mut entry_file = archive
            .by_name(&info.entry)
            .map_err(|_| format!("entry file \"{}\" not found in zip", info.entry))?;
        let mut content = String::new();
        entry_file
            .read_to_string(&mut content)
            .map_err(|e| format!("failed to read entry file \"{}\": {e}", info.entry))?;
        content
    };
    validate_entry_xhtml(&entry_content)?;

    for asset in &info.assets {
        let mut asset_file = archive
            .by_name(&asset.path)
            .map_err(|_| format!("asset file \"{}\" not found in zip", asset.path))?;
        let mut bytes = Vec::new();
        asset_file
            .read_to_end(&mut bytes)
            .map_err(|e| format!("failed to read asset \"{}\": {e}", asset.path))?;
        validate_asset_image(&bytes, &asset.mime_type).map_err(|e| format!("asset \"{}\": {e}", asset.path))?;
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
pub fn add_plugin(data: &[u8]) -> Result<PluginInfo, String> {
    let mut info = validate_plugin(data)?;
    info.id = uuid::Uuid::new_v4().simple().to_string();

    let plugins_dir = config::plugins_dir();
    std::fs::create_dir_all(&plugins_dir).map_err(|e| e.to_string())?;
    std::fs::write(zip_filename(&info), data).map_err(|e| e.to_string())?;

    let mut registry = read_registry()?;
    // Drop any prior copy of the same name+version (and its zip).
    registry.retain(|p| {
        let same = p.name == info.name && p.version == info.version;
        if same {
            let _ = std::fs::remove_file(zip_filename(p));
        }
        !same
    });
    registry.push(info.clone());
    write_registry(&registry)?;

    Ok(info)
}

/// Remove a plugin (registry entry + its zip) by id.
pub fn remove_plugin(id: &str) -> Result<(), String> {
    let mut registry = read_registry()?;
    let idx = registry
        .iter()
        .position(|p| p.id == id)
        .ok_or_else(|| format!("plugin with id \"{id}\" not found"))?;
    let info = registry.remove(idx);
    write_registry(&registry)?;
    let _ = std::fs::remove_file(zip_filename(&info));
    Ok(())
}

pub fn list_plugins() -> Result<Vec<PluginInfo>, String> {
    read_registry()
}

/// Read a file (the entry or a declared asset) out of a plugin's zip, returning
/// its bytes + content type. Rejects undeclared files and unsafe paths.
pub fn read_plugin_file(id: &str, file_path: &str) -> Result<(String, Vec<u8>), String> {
    if !is_safe_path(file_path) {
        return Err("forbidden path".to_string());
    }
    let info = read_registry()?
        .into_iter()
        .find(|p| p.id == id)
        .ok_or_else(|| "plugin not found".to_string())?;

    // Only the entry file and declared assets are served.
    let content_type = if file_path == info.entry {
        "application/xhtml+xml".to_string()
    } else {
        match info.assets.iter().find(|a| a.path == file_path) {
            Some(a) => asset_type_to_mime(&a.mime_type).to_string(),
            None => return Err("file not declared in plugin metadata".to_string()),
        }
    };

    let data = std::fs::read(zip_filename(&info)).map_err(|_| "plugin archive missing".to_string())?;
    let mut archive =
        zip::ZipArchive::new(std::io::Cursor::new(data)).map_err(|_| "failed to read plugin archive".to_string())?;
    let mut file = archive
        .by_name(file_path)
        .map_err(|_| "file not found in plugin".to_string())?;
    let mut bytes = Vec::new();
    file.read_to_end(&mut bytes).map_err(|e| e.to_string())?;
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
    fn safe_path_rejects_traversal() {
        assert!(is_safe_path("entry.html"));
        assert!(is_safe_path("assets/logo.png"));
        assert!(!is_safe_path("../secret"));
        assert!(!is_safe_path("/etc/passwd"));
    }

    #[test]
    fn entry_xsd_accepts_minimal_plugin_and_rejects_unknown_element() {
        let ok = r#"<html><head><title>t</title></head><body><sc-scope></sc-scope></body></html>"#;
        assert!(validate_entry_xhtml(ok).is_ok());
        let bad = r#"<html><head><title>t</title></head><body><sc-bogus></sc-bogus></body></html>"#;
        assert!(validate_entry_xhtml(bad).is_err());
    }
}
