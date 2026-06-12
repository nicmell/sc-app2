//! The HTTP layer: route assembly, listener binding, serving, and the
//! per-WebSocket pump. Pure transport — all app logic lives on
//! [`Server`](crate::core::server::Server), which this layer holds as axum `State`
//! and drives through its public API (`router → server → core`).
//!
//! Routes are assembled in [`router`] from per-feature sub-routers
//! ([`session`], [`ws`], [`plugin`]), so adding a new feature is a new `mod` +
//! a `.merge(its::routes())`.

pub mod assets;
mod diag;
mod plugin;
mod session;
mod ws;

use std::net::SocketAddr;
use std::sync::Arc;

use axum::extract::Request;
use axum::Router;
use tokio::net::TcpListener;
use tower_http::cors::CorsLayer;

use crate::core::server::Server;
use assets::AssetResolver;

/// Bind a localhost listener on the server's configured port and log its
/// address. Separate from [`serve`] so GUI mode can bind synchronously then
/// serve on a spawned task.
pub async fn listen(server: &Server) -> std::io::Result<(TcpListener, SocketAddr)> {
    let listener = TcpListener::bind(("127.0.0.1", server.port())).await?;
    let addr = listener.local_addr()?;
    tracing::info!(%addr, "sc-app2 server listening");
    Ok((listener, addr))
}

/// Serve on a bound listener until a shutdown signal (SIGINT/SIGTERM), then
/// free the root group + unregister from scsynth so we don't leak server state.
pub async fn serve(
    server: Server,
    listener: TcpListener,
    assets: Option<Arc<dyn AssetResolver>>,
) -> std::io::Result<()> {
    axum::serve(listener, router(server.clone(), assets))
        .with_graceful_shutdown(shutdown_signal())
        .await?;
    tracing::info!("shutdown signal received; tearing down scsynth state");
    server.unregister().await;
    Ok(())
}

/// Assemble the app router from the per-feature `/api` sub-routers (session,
/// ws, plugins), plus the static-asset fallback when a resolver is installed
/// (production); API-only otherwise (dev — Vite serves the UI).
pub fn router(server: Server, assets: Option<Arc<dyn AssetResolver>>) -> Router {
    let mut app = Router::new()
        .merge(session::routes())
        .merge(ws::routes())
        .merge(plugin::routes())
        .merge(diag::routes())
        .with_state(server)
        // The GUI webview is ALWAYS cross-origin to this server
        // (`tauri://localhost` in prod, the Vite devUrl in dev — only a
        // plain browser via the Vite proxy is same-origin), so without CORS
        // every fetch from the webview is blocked. Permissive is fine here:
        // the listener binds 127.0.0.1 only and the API uses no
        // cookies/credentials.
        .layer(CorsLayer::permissive());
    if let Some(assets) = assets {
        app = app.fallback(move |req: Request| assets::serve_static(req, assets.clone()));
    }
    app
}

/// Resolve when the process receives SIGINT (Ctrl-C) or, on unix, SIGTERM —
/// the signal that drives graceful shutdown + scsynth teardown.
async fn shutdown_signal() {
    let ctrl_c = async {
        let _ = tokio::signal::ctrl_c().await;
    };
    #[cfg(unix)]
    let terminate = async {
        match tokio::signal::unix::signal(tokio::signal::unix::SignalKind::terminate()) {
            Ok(mut sig) => {
                sig.recv().await;
            }
            Err(e) => {
                tracing::warn!(error = %e, "SIGTERM handler unavailable");
                std::future::pending::<()>().await;
            }
        }
    };
    #[cfg(not(unix))]
    let terminate = std::future::pending::<()>();

    tokio::select! {
        _ = ctrl_c => {}
        _ = terminate => {}
    }
}
