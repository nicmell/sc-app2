//! The HTTP server.
//!
//! A [`Server`] owns HTTP routing and backend resources, used by both run
//! modes. It serves `/api/config` (and future API endpoints) plus the
//! frontend. The frontend assets are **snapshotted from the embedded
//! `tauri::Context`** at construction (decompressed into an owned map) so
//! the context stays free for the GUI's Tauri builder. In dev the
//! snapshot is empty (Vite serves the UI) and the server is API-only.
//!
//! The server never makes cross-origin calls and the GUI webview reaches
//! the backend over IPC, so no CORS is involved.

use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;

use axum::body::Bytes;
use axum::extract::Request;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::{routing::get, Json, Router};
use tokio::net::TcpListener;

use crate::config::AppConfig;

/// Frontend assets keyed by relative path (`index.html`, `assets/app.js`).
/// `Bytes` so handing a copy to each response is a cheap refcount bump.
type Assets = Arc<HashMap<String, Bytes>>;

/// Owns HTTP routing and backend resources. Passed to both run modes.
pub struct Server {
    config: AppConfig,
    assets: Assets,
}

impl Server {
    /// Build a server. Snapshots the frontend assets embedded in `context`
    /// (empty in dev, where Vite serves the UI) into an owned map, taking
    /// `context` by reference so it remains usable by the GUI builder.
    pub fn new(config: AppConfig, context: &tauri::Context) -> Self {
        Self {
            config,
            assets: Arc::new(snapshot_assets(context)),
        }
    }

    /// Bind a localhost listener and log its address. Separate from
    /// [`serve`](Self::serve) so GUI mode can bind synchronously then
    /// serve on a spawned task.
    pub async fn listen(&self) -> std::io::Result<(TcpListener, SocketAddr)> {
        let listener = TcpListener::bind(("127.0.0.1", self.config.port)).await?;
        let addr = listener.local_addr()?;
        println!("sc-app2 server listening on http://{addr}");
        Ok((listener, addr))
    }

    /// Serve on a bound listener until the process exits.
    pub async fn serve(self, listener: TcpListener) -> std::io::Result<()> {
        axum::serve(listener, self.router()).await
    }

    fn router(&self) -> Router {
        let config = self.config.clone();
        let mut app =
            Router::new().route("/api/config", get(move || async move { Json(config.clone()) }));
        // Serve the frontend when assets are present (production); stay
        // API-only otherwise (dev — Vite serves the UI).
        if !self.assets.is_empty() {
            let assets = self.assets.clone();
            app = app.fallback(move |req: Request| serve_static(req, assets.clone()));
        }
        app
    }
}

/// Snapshot the embedded frontend into an owned map. `iter` yields raw
/// (brotli-compressed) bytes, so each entry is re-fetched via `get`, which
/// decompresses. Keys are normalised to be relative (no leading `/`).
/// Empty in dev, where nothing is embedded.
fn snapshot_assets(context: &tauri::Context) -> HashMap<String, Bytes> {
    let assets = context.assets();
    assets
        .iter()
        .filter_map(|(key, _)| {
            let key = key.trim_start_matches('/').to_string();
            assets
                .get(&key.as_str().into())
                .map(|b| (key, Bytes::from(b.into_owned())))
        })
        .collect()
}

/// Serve an asset, falling back to `index.html` for client-side routes.
/// Asset-shaped paths that miss get a loud 404 (so a stale build reference
/// doesn't masquerade as HTML).
async fn serve_static(req: Request, assets: Assets) -> Response {
    let path = req.uri().path().trim_start_matches('/');
    let key = if path.is_empty() { "index.html" } else { path };

    if let Some(bytes) = assets.get(key) {
        return asset(key, bytes.clone());
    }
    let asset_shaped =
        key.starts_with("assets/") || key.rsplit('/').next().is_some_and(|s| s.contains('.'));
    if asset_shaped {
        return (StatusCode::NOT_FOUND, format!("not found: /{key}\n")).into_response();
    }
    match assets.get("index.html") {
        Some(bytes) => asset("index.html", bytes.clone()),
        None => (StatusCode::NOT_FOUND, "index.html missing\n").into_response(),
    }
}

/// Wrap asset bytes in a response with a content type guessed from the key.
fn asset(key: &str, bytes: Bytes) -> Response {
    let mime = mime_guess::from_path(key).first_or_octet_stream();
    ([(header::CONTENT_TYPE, mime.as_ref())], bytes).into_response()
}

#[cfg(test)]
mod tests {
    use super::*;
    use axum::body::Body;

    fn assets() -> Assets {
        Arc::new(HashMap::from([
            ("index.html".to_string(), Bytes::from_static(b"<html>root</html>")),
            ("assets/app.js".to_string(), Bytes::from_static(b"console.log(1)")),
        ]))
    }

    fn req(path: &str) -> Request {
        Request::builder().uri(path).body(Body::empty()).unwrap()
    }

    fn content_type(res: &Response) -> String {
        res.headers()
            .get(header::CONTENT_TYPE)
            .and_then(|v| v.to_str().ok())
            .unwrap_or_default()
            .to_string()
    }

    #[tokio::test]
    async fn root_serves_index_html() {
        let res = serve_static(req("/"), assets()).await;
        assert_eq!(res.status(), StatusCode::OK);
        assert!(content_type(&res).contains("text/html"));
    }

    #[tokio::test]
    async fn known_asset_served_with_its_mime() {
        let res = serve_static(req("/assets/app.js"), assets()).await;
        assert_eq!(res.status(), StatusCode::OK);
        assert!(content_type(&res).contains("javascript"));
    }

    #[tokio::test]
    async fn missing_asset_is_404_not_html() {
        let res = serve_static(req("/assets/missing.js"), assets()).await;
        assert_eq!(res.status(), StatusCode::NOT_FOUND);
        assert!(!content_type(&res).contains("text/html"));
    }

    #[tokio::test]
    async fn client_route_falls_back_to_index() {
        let res = serve_static(req("/some/client/route"), assets()).await;
        assert_eq!(res.status(), StatusCode::OK);
        assert!(content_type(&res).contains("text/html"));
    }
}
