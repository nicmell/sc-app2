//! App configuration: the contents of `config.json`, read from an explicit
//! path or the canonical app config dir (e.g. macOS
//! `~/Library/Application Support/com.nicmell.scapp/config.json`).
//!
//! `AppConfig` is server-side only: the listen `port` (which the GUI webview
//! learns through the injected `window.HTTP_BASE_URL`), the `peers` the bridge
//! connects to at startup, and an optional `log_dir`.

use std::path::PathBuf;

use serde::{Deserialize, Serialize};

/// Bundle identifier — also the app config dir name (matches tauri.conf.json).
const IDENTIFIER: &str = "com.nicmell.scapp";
const DEFAULT_PORT: u16 = 3000;

/// A peer the bridge connects to at startup. `pattern` is the OSC-address regex
/// that routes outbound messages to this peer; `name` identifies it in logs.
#[derive(Serialize, Deserialize, Clone)]
pub struct PeerConfig {
    pub name: String,
    pub pattern: String,
    pub target: String,
}

/// Contents of `config.json`: the listen `port`, the UDP `peers`, a startup
/// `connect_timeout`, and file logging via `log_dir`.
#[derive(Serialize, Deserialize, Clone)]
pub struct AppConfig {
    #[serde(default = "default_port")]
    pub port: u16,
    #[serde(default = "default_peers")]
    pub peers: Vec<PeerConfig>,
    /// Seconds to wait at startup before attempting the peer connections
    /// (e.g. to give scsynth time to boot). 0 connects immediately.
    #[serde(default)]
    pub connect_timeout: u64,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub log_dir: Option<PathBuf>,
}

impl Default for AppConfig {
    fn default() -> Self {
        Self {
            port: DEFAULT_PORT,
            peers: default_peers(),
            connect_timeout: 0,
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
            pattern:
                r"^/([sngbcdpu]_|notify|status|sync|cmd|dumpOSC|clearSched|error|quit|version)"
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

/// Directory holding saved-session layout files (`<session id>.json`).
pub fn sessions_dir() -> PathBuf {
    data_dir().join("sessions")
}

/// The saved-session registry file (`SavedSessionInfo[]` as JSON) — the
/// session counterpart of the plugin registry.
pub fn sessions_registry_path() -> PathBuf {
    data_dir().join("sessions.json")
}

/// Parse config JSON strictly — the shared core of [`load`] (which tolerates
/// failures by falling back to defaults) and `config validate` (which reports
/// them). Seeds the starter peers when missing or explicitly empty.
pub fn parse(text: &str) -> Result<AppConfig, serde_json::Error> {
    let mut config: AppConfig = serde_json::from_str(text)?;
    if config.peers.is_empty() {
        config.peers = default_peers();
    }
    Ok(config)
}

/// Write the default config (pretty JSON) to `path`, creating parent
/// directories. Shared by the first-run seeding in [`load`] and the
/// `config write` CLI subcommand.
pub fn write_default(path: &std::path::Path) -> Result<(), String> {
    if let Some(dir) = path.parent().filter(|d| !d.as_os_str().is_empty()) {
        std::fs::create_dir_all(dir)
            .map_err(|e| format!("Error creating \"{}\": {e}", dir.display()))?;
    }
    let json = serde_json::to_string_pretty(&AppConfig::default()).map_err(|e| e.to_string())?;
    std::fs::write(path, json + "\n")
        .map_err(|e| format!("Error writing \"{}\": {e}", path.display()))
}

/// Load config from an explicit path (serve `--config`) or the canonical
/// location, tolerating a missing or malformed file (logs and defaults).
/// A missing CANONICAL file is seeded with the defaults (first run), so
/// users have a config.json to find and edit; an explicit `--config` path is
/// the user's own and is never created here (`config write` does that).
pub fn load(path: Option<PathBuf>) -> AppConfig {
    match path {
        Some(path) => read(&path, false),
        None => match canonical_path() {
            Some(path) => read(&path, true),
            None => AppConfig::default(),
        },
    }
}

fn read(path: &std::path::Path, seed_when_missing: bool) -> AppConfig {
    match std::fs::read_to_string(path) {
        Ok(s) => parse(&s).unwrap_or_else(|e| {
            // Pre-tracing: `load` runs before the logger is initialized
            // (we need `log_dir` from here), so this stays an eprintln!.
            eprintln!("[config] ignoring {}: {e}", path.display());
            AppConfig::default()
        }),
        Err(_) => {
            if seed_when_missing {
                match write_default(path) {
                    Ok(()) => eprintln!("[config] wrote default config to {}", path.display()),
                    Err(e) => eprintln!("[config] could not seed {}: {e}", path.display()),
                }
            }
            AppConfig::default()
        }
    }
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
        let path = tmp("does-not-exist");
        assert_eq!(load(Some(path.clone())).port, DEFAULT_PORT);
        // An explicit --config path is never created by load.
        assert!(!path.exists());
    }

    #[test]
    fn seeding_writes_the_default_and_round_trips() {
        let path = std::env::temp_dir()
            .join("sc-app2-test-seed")
            .join("config.json");
        std::fs::remove_file(&path).ok();
        // The canonical-path behavior: a missing file is seeded…
        let config = read(&path, true);
        assert_eq!(config.port, DEFAULT_PORT);
        assert!(path.exists());
        // …and the seeded file parses back to the same defaults.
        let reread = read(&path, false);
        assert_eq!(reread.port, DEFAULT_PORT);
        assert_eq!(reread.peers.len(), 2);
        std::fs::remove_file(&path).ok();
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
            assert!(
                regex::Regex::new(&p.pattern).is_ok(),
                "bad regex: {}",
                p.pattern
            );
            assert!(
                p.target.parse::<std::net::SocketAddr>().is_ok(),
                "bad target: {}",
                p.target
            );
        }
    }

    #[test]
    fn loads_connect_timeout() {
        let path = tmp("connect-timeout");
        std::fs::write(&path, r#"{ "connect_timeout": 5 }"#).unwrap();
        assert_eq!(load(Some(path.clone())).connect_timeout, 5);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn missing_connect_timeout_defaults_to_zero() {
        let path = tmp("no-connect-timeout");
        std::fs::write(&path, "{}").unwrap();
        assert_eq!(load(Some(path.clone())).connect_timeout, 0);
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn loads_log_dir() {
        let path = tmp("logdir");
        std::fs::write(&path, r#"{ "log_dir": "/tmp/x" }"#).unwrap();
        assert_eq!(
            load(Some(path.clone())).log_dir,
            Some(PathBuf::from("/tmp/x"))
        );
        std::fs::remove_file(path).ok();
    }
}
