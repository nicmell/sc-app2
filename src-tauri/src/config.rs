//! App configuration: the contents of `config.json`, read from an explicit
//! path or the canonical app config dir (e.g. macOS
//! `~/Library/Application Support/com.nicmell.scapp/config.json`).
//!
//! `AppConfig` is handed to the frontend two ways over one core ([`load`]):
//! the [`get_config`] Tauri command (GUI webview, over IPC) and the
//! server's `/api/config` route (browsers). It also carries the `routes`
//! (peers the server connects to at startup) and an optional `log_dir`.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

/// Bundle identifier — also the app config dir name (matches tauri.conf.json).
const IDENTIFIER: &str = "com.nicmell.scapp";
const DEFAULT_PORT: u16 = 3000;

/// A peer the server connects to at startup. `pattern` is the OSC-address
/// regex used to route messages to this peer (validated at boot; not yet
/// used for forwarding); `name` identifies it in logs.
#[derive(Deserialize, Serialize, Clone)]
pub struct Route {
    pub name: String,
    pub pattern: String,
    pub target: String,
}

/// Contents of `config.json`. `port` is shared with the frontend; `routes`
/// and `log_dir` drive the server (peers + file logging).
#[derive(Deserialize, Serialize, Clone)]
pub struct AppConfig {
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_routes")]
    pub routes: Vec<Route>,
    #[serde(default)]
    pub log_dir: Option<PathBuf>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            port: DEFAULT_PORT,
            routes: default_routes(),
            log_dir: None,
        }
    }
}

fn default_port() -> u16 {
    DEFAULT_PORT
}

/// Starter peers, seeded when `config.json` declares no routes: scsynth
/// (its command surface) and strudel/SuperDirt (dirt/clock/scope).
fn default_routes() -> Vec<Route> {
    vec![
        Route {
            name: "scsynth".into(),
            pattern: r"^/([sngbcdpu]_|notify|status|sync|cmd|dumpOSC|clearSched|error|quit|version)"
                .into(),
            target: "127.0.0.1:57110".into(),
        },
        Route {
            name: "strudel".into(),
            pattern: r"^/(dirt|clock|scope)(/|$)".into(),
            target: "127.0.0.1:57120".into(),
        },
    ]
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
    let mut config = match std::fs::read_to_string(&path) {
        Ok(s) => serde_json::from_str(&s).unwrap_or_else(|e| {
            // Pre-tracing: `load` runs before the logger is initialized
            // (we need `log_dir` from here), so this stays an eprintln!.
            eprintln!("[config] ignoring {}: {e}", path.display());
            AppConfig::default()
        }),
        Err(_) => AppConfig::default(),
    };
    // Seed starter peers when routes are missing or explicitly empty.
    if config.routes.is_empty() {
        config.routes = default_routes();
    }
    config
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

    #[test]
    fn loads_routes_from_file() {
        let path = tmp("routes");
        std::fs::write(
            &path,
            r#"{ "routes": [{ "name": "a", "pattern": "^/x", "target": "127.0.0.1:1" }] }"#,
        )
        .unwrap();
        let cfg = load(Some(path.clone()));
        assert_eq!(cfg.routes.len(), 1);
        assert_eq!(cfg.routes[0].name, "a");
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn missing_routes_seeds_defaults() {
        let path = tmp("no-routes");
        std::fs::write(&path, "{}").unwrap();
        let names: Vec<_> = load(Some(path.clone()))
            .routes
            .iter()
            .map(|r| r.name.clone())
            .collect();
        assert_eq!(names, vec!["scsynth", "strudel"]);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn empty_routes_seeds_defaults() {
        let path = tmp("empty-routes");
        std::fs::write(&path, r#"{ "routes": [] }"#).unwrap();
        assert_eq!(load(Some(path.clone())).routes.len(), 2);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn default_routes_are_valid() {
        for r in default_routes() {
            assert!(regex::Regex::new(&r.pattern).is_ok(), "bad regex: {}", r.pattern);
            assert!(
                r.target.parse::<std::net::SocketAddr>().is_ok(),
                "bad target: {}",
                r.target
            );
        }
    }

    #[test]
    fn loads_log_dir() {
        let path = tmp("logdir");
        std::fs::write(&path, r#"{ "log_dir": "/tmp/x" }"#).unwrap();
        assert_eq!(load(Some(path.clone())).log_dir, Some(PathBuf::from("/tmp/x")));
        std::fs::remove_file(path).ok();
    }
}
