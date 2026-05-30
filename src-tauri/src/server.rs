//! Headless HTTP server (the `serve` subcommand).
//!
//! Plain tokio + axum — no `tauri::Builder`, no webview. Binds to
//! localhost only. For now it exposes a single dummy endpoint
//! (`GET /api/hello`) so the frontend can prove it can talk to the
//! server. It does NOT serve the bundled frontend yet — run the UI
//! with `yarn dev` (Vite proxies `/api` here).

use axum::{routing::get, Json, Router};
use serde::Serialize;

#[derive(Serialize)]
struct HelloResponse {
    message: String,
}

/// Dummy endpoint. Returns a fixed greeting as JSON.
async fn hello() -> Json<HelloResponse> {
    Json(HelloResponse {
        message: "Hello from the headless sc-app2 server!".to_string(),
    })
}

/// Build the axum router. Kept separate so it's easy to extend with
/// new routes as features get ported over.
fn router() -> Router {
    Router::new().route("/api/hello", get(hello))
}

/// Run the server, blocking the calling thread until it exits.
pub fn run_blocking(port: u16) {
    let rt = tokio::runtime::Runtime::new().expect("failed to start tokio runtime");
    rt.block_on(async move {
        let addr = format!("127.0.0.1:{port}");
        let listener = tokio::net::TcpListener::bind(&addr)
            .await
            .unwrap_or_else(|e| panic!("failed to bind {addr}: {e}"));
        println!("sc-app2 server listening on http://{addr}");
        axum::serve(listener, router())
            .await
            .expect("server error");
    });
}
