//! App configuration: the contents of `config.json`, read from an explicit
//! path or the canonical app config dir (e.g. macOS
//! `~/Library/Application Support/com.nicmell.scapp/config.json`).
//!
//! Handed to the frontend two ways over one core ([`load`]): the
//! [`get_config`] Tauri command (GUI webview, over IPC) and the server's
//! `/config.json` route (browsers).

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

/// Bundle identifier — also the app config dir name (matches tauri.conf.json).
const IDENTIFIER: &str = "com.nicmell.scapp";
const DEFAULT_PORT: u16 = 3000;

/// Contents of `config.json`, shared with the frontend.
#[derive(Deserialize, Serialize, Clone)]
pub struct AppConfig {
    #[serde(default = "default_port")]
    pub port: u16,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self { port: DEFAULT_PORT }
    }
}

fn default_port() -> u16 {
    DEFAULT_PORT
}

/// `<app config dir>/config.json`.
fn canonical_path() -> Option<PathBuf> {
    dirs::config_dir().map(|d| d.join(IDENTIFIER).join("config.json"))
}

/// Load config from an explicit path (serve `--config`) or the canonical
/// location, tolerating a missing or malformed file (logs and defaults).
pub fn load(path: Option<PathBuf>) -> AppConfig {
    let Some(path) = path.or_else(canonical_path) else {
        return AppConfig::default();
    };
    match std::fs::read_to_string(&path) {
        Ok(s) => serde_json::from_str(&s).unwrap_or_else(|e| {
            eprintln!("[config] ignoring {}: {e}", path.display());
            AppConfig::default()
        }),
        Err(_) => AppConfig::default(),
    }
}

/// The app config, for the GUI webview (over IPC).
#[tauri::command]
pub fn get_config() -> AppConfig {
    load(None)
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmp(name: &str) -> PathBuf {
        std::env::temp_dir().join(format!("sc-app2-test-{name}.json"))
    }

    #[test]
    fn loads_port_from_file() {
        let path = tmp("valid");
        std::fs::write(&path, r#"{ "port": 1234 }"#).unwrap();
        assert_eq!(load(Some(path.clone())).port, 1234);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn empty_object_uses_default_port() {
        let path = tmp("empty");
        std::fs::write(&path, "{}").unwrap();
        assert_eq!(load(Some(path.clone())).port, DEFAULT_PORT);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn malformed_falls_back_to_default() {
        let path = tmp("malformed");
        std::fs::write(&path, "not json").unwrap();
        assert_eq!(load(Some(path.clone())).port, DEFAULT_PORT);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn missing_file_falls_back_to_default() {
        assert_eq!(load(Some(tmp("does-not-exist"))).port, DEFAULT_PORT);
    }
}
