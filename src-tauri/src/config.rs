//! App configuration: the contents of `config.json`, read from an explicit
//! path or the canonical app config dir (e.g. macOS
//! `~/Library/Application Support/com.nicmell.scapp/config.json`).
//!
//! `AppConfig` is server-side only: the listen `port` (which the GUI webview
//! learns through the injected `window.HTTP_BASE_URL`), the `peers` the bridge
//! connects to at startup, and an optional `log_dir`.

use std::path::PathBuf;

use serde::Deserialize;

/// Bundle identifier — also the app config dir name (matches tauri.conf.json).
const IDENTIFIER: &str = "com.nicmell.scapp";
const DEFAULT_PORT: u16 = 3000;

/// A peer the bridge connects to at startup. `pattern` is the OSC-address regex
/// that routes outbound messages to this peer; `name` identifies it in logs.
#[derive(Deserialize, Clone)]
pub struct PeerConfig {
    pub name: String,
    pub pattern: String,
    pub target: String,
}

/// Contents of `config.json`: the listen `port`, the UDP `peers`, and file
/// logging via `log_dir`.
#[derive(Deserialize, Clone)]
pub struct AppConfig {
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_peers")]
    pub peers: Vec<PeerConfig>,
    #[serde(default)]
    pub log_dir: Option<PathBuf>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            port: DEFAULT_PORT,
            peers: default_peers(),
            log_dir: None,
        }
    }
}

fn default_port() -> u16 {
    DEFAULT_PORT
}

/// Starter peers, seeded when `config.json` declares none: scsynth (its command
/// surface) and strudel/SuperDirt (dirt/clock/scope).
fn default_peers() -> Vec<PeerConfig> {
    vec![
        PeerConfig {
            name: "scsynth".into(),
            pattern: r"^/([sngbcdpu]_|notify|status|sync|cmd|dumpOSC|clearSched|error|quit|version)"
                .into(),
            target: "127.0.0.1:57110".into(),
        },
        PeerConfig {
            name: "strudel".into(),
            // `/scope/*` is bridge-internal (intercepted in the WS pump for the
            // SHM scope), so it's deliberately not routed to a peer here.
            pattern: r"^/(dirt|clock)(/|$)".into(),
            target: "127.0.0.1:57120".into(),
        },
    ]
}

/// `<app config dir>/config.json`.
fn canonical_path() -> Option<PathBuf> {
    dirs::config_dir().map(|d| d.join(IDENTIFIER).join("config.json"))
}

/// The app's data directory (`<config dir>/com.nicmell.scapp`), where the
/// plugin registry + zip bundles live. Falls back to `./<identifier>` if the
/// platform config dir can't be resolved (headless/CI).
pub fn data_dir() -> PathBuf {
    dirs::config_dir()
        .map(|d| d.join(IDENTIFIER))
        .unwrap_or_else(|| PathBuf::from(IDENTIFIER))
}

/// Directory holding installed plugin zip bundles.
pub fn plugins_dir() -> PathBuf {
    data_dir().join("plugins")
}

/// The plugin registry file (`PluginInfo[]` as JSON), kept separate from the
/// typed `config.json` so the plugin system owns its own persistence.
pub fn plugins_registry_path() -> PathBuf {
    data_dir().join("plugins.json")
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
    // Seed starter peers when missing or explicitly empty.
    if config.peers.is_empty() {
        config.peers = default_peers();
    }
    config
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
    fn loads_peers_from_file() {
        let path = tmp("peers");
        std::fs::write(
            &path,
            r#"{ "peers": [{ "name": "a", "pattern": "^/x", "target": "127.0.0.1:1" }] }"#,
        )
        .unwrap();
        let cfg = load(Some(path.clone()));
        assert_eq!(cfg.peers.len(), 1);
        assert_eq!(cfg.peers[0].name, "a");
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn missing_peers_seeds_defaults() {
        let path = tmp("no-peers");
        std::fs::write(&path, "{}").unwrap();
        let names: Vec<_> = load(Some(path.clone()))
            .peers
            .iter()
            .map(|p| p.name.clone())
            .collect();
        assert_eq!(names, vec!["scsynth", "strudel"]);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn empty_peers_seeds_defaults() {
        let path = tmp("empty-peers");
        std::fs::write(&path, r#"{ "peers": [] }"#).unwrap();
        assert_eq!(load(Some(path.clone())).peers.len(), 2);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn default_peers_are_valid() {
        for p in default_peers() {
            assert!(regex::Regex::new(&p.pattern).is_ok(), "bad regex: {}", p.pattern);
            assert!(
                p.target.parse::<std::net::SocketAddr>().is_ok(),
                "bad target: {}",
                p.target
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
