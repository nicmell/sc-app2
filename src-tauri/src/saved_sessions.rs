//! Saved-session storage: the dashboard layout each session periodically PUTs,
//! persisted in the app data dir next to the plugins — `sessions/<id>.json`
//! holds the layout (opaque JSON; the server never interprets it) and
//! `sessions.json` is the registry, mirroring the plugin one
//! ([`crate::plugin::manager`]). Stateless fs functions, consumed by the
//! `/api/session` router: a stored frontend id is revived from here at boot.
//!
//! TODO: saved sessions grow without bound — a browser that clears its
//! localStorage orphans its `<id>.json` + registry row forever. Prune by
//! `saved_at` age (or cap the count) at boot.

use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::time::{SystemTime, UNIX_EPOCH};
use uuid::Uuid;

use crate::config;

/// One registry entry: a session with a saved layout.
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SavedSessionInfo {
    pub id: Uuid,
    /// Last save time, unix ms.
    pub saved_at: u64,
}

fn layout_path(id: &Uuid) -> PathBuf {
    config::sessions_dir().join(format!("{id}.json"))
}

fn now_ms() -> u64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as u64)
        .unwrap_or(0)
}

// ── registry (sessions.json) ──────────────────────────────────────

fn read_registry() -> Result<Vec<SavedSessionInfo>, String> {
    let path = config::sessions_registry_path();
    match std::fs::read_to_string(&path) {
        Ok(s) => serde_json::from_str(&s).map_err(|e| format!("sessions.json is corrupt: {e}")),
        Err(_) => Ok(Vec::new()),
    }
}

fn write_registry(sessions: &[SavedSessionInfo]) -> Result<(), String> {
    let path = config::sessions_registry_path();
    if let Some(dir) = path.parent() {
        std::fs::create_dir_all(dir).map_err(|e| e.to_string())?;
    }
    let json = serde_json::to_string_pretty(sessions).map_err(|e| e.to_string())?;
    std::fs::write(&path, json).map_err(|e| e.to_string())
}

// ── layouts (sessions/<id>.json) ──────────────────────────────────

/// Write the session's layout file and upsert its registry entry.
pub fn save_layout(id: &Uuid, layout: &serde_json::Value) -> Result<(), String> {
    std::fs::create_dir_all(config::sessions_dir()).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(layout).map_err(|e| e.to_string())?;
    std::fs::write(layout_path(id), json).map_err(|e| e.to_string())?;
    let mut registry = read_registry()?;
    registry.retain(|s| s.id != *id);
    registry.push(SavedSessionInfo { id: *id, saved_at: now_ms() });
    write_registry(&registry)
}

/// The saved layout for `id`, if it's in the registry and its file parses.
pub fn load_layout(id: &Uuid) -> Option<serde_json::Value> {
    if !read_registry().ok()?.iter().any(|s| s.id == *id) {
        return None;
    }
    let raw = std::fs::read_to_string(layout_path(id)).ok()?;
    serde_json::from_str(&raw).ok()
}
