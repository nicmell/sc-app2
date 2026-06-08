//! The `/api/config` HTTP route: the full app config for frontends (the footer's
//! scsynth address comes from here). The GUI webview only needs the server port,
//! which it gets via the `get_env` command instead. Thin transport over
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
