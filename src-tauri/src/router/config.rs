//! The `/api/config` HTTP route: the app config for browser frontends.
//!
//! `AppConfig` also reaches the Tauri webview over IPC (the
//! [`get_config`](crate::config::get_config) command); this is the browser path,
//! serving the same struct as JSON. Thin transport over
//! [`Server::config`](crate::server::Server::config).

use axum::extract::State;
use axum::routing::get;
use axum::{Json, Router};

use crate::config::AppConfig;
use crate::server::Server;

/// The `/api/config` route.
pub fn routes() -> Router<Server> {
    Router::new().route("/api/config", get(get_config))
}

async fn get_config(State(server): State<Server>) -> Json<AppConfig> {
    Json(server.config().clone())
}
