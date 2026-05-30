//! `config.json` loading from the app data dir.
//!
//! Resolved with the `dirs` crate + the bundle identifier rather than a
//! Tauri `AppHandle`, so headless `serve` and GUI mode read the exact
//! same file (e.g. macOS
//! `~/Library/Application Support/com.nicmell.scapp/config.json`).

use serde::Deserialize;

/// Bundle identifier — also the app data dir name (matches tauri.conf.json).
const IDENTIFIER: &str = "com.nicmell.scapp";
const DEFAULT_PORT: u16 = 3000;

/// Subset of `config.json` we currently read.
#[derive(Deserialize, Default)]
struct Config {
    port: Option<u16>,
}

/// Load `config.json` from the app data dir, tolerating a missing or
/// malformed file (falls back to defaults; a parse error is logged).
fn load() -> Config {
    let Some(dir) = dirs::data_dir() else {
        return Config::default();
    };
    let path = dir.join(IDENTIFIER).join("config.json");
    match std::fs::read_to_string(&path) {
        Ok(s) => serde_json::from_str(&s).unwrap_or_else(|e| {
            eprintln!("[config] ignoring {}: {e}", path.display());
            Config::default()
        }),
        Err(_) => Config::default(),
    }
}

/// Resolve the port: explicit flag > `SC_PORT` env > config.json > default.
pub fn resolve_port(flag: Option<u16>) -> u16 {
    flag.or_else(|| std::env::var("SC_PORT").ok().and_then(|s| s.parse().ok()))
        .or_else(|| load().port)
        .unwrap_or(DEFAULT_PORT)
}
