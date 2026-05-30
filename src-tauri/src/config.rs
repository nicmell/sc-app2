//! Startup resolution — the things needed to build the [`Server`], all
//! resolved **without** a Tauri `AppHandle` so headless `serve` and GUI
//! mode share one path:
//!
//! * [`resolve_port`] — port from flag / env / `config.json` (the latter
//!   read from the app data dir, e.g. macOS
//!   `~/Library/Application Support/com.nicmell.scapp/config.json`).
//! * [`frontend_dir`] — the bundled `dist/` to serve (production), via
//!   Tauri's platform resource-dir logic; `None` in dev (Vite serves it).
//!
//! [`Server`]: crate::server::Server

use std::path::PathBuf;

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

/// Directory to serve the frontend from: the bundled `dist/` in
/// production (via Tauri's platform resource-dir logic — no `AppHandle`,
/// so both run modes share it), or `None` in dev where Vite serves the UI.
pub fn frontend_dir() -> Option<PathBuf> {
    if cfg!(dev) {
        None
    } else {
        let pkg = tauri::utils::PackageInfo {
            name: env!("CARGO_PKG_NAME").into(),
            version: env!("CARGO_PKG_VERSION").parse().expect("valid semver"),
            authors: env!("CARGO_PKG_AUTHORS"),
            description: env!("CARGO_PKG_DESCRIPTION"),
            crate_name: env!("CARGO_PKG_NAME"),
        };
        tauri::utils::platform::resource_dir(&pkg, &tauri::Env::default())
            .ok()
            .map(|d| d.join("dist"))
    }
}
