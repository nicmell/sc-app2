//! The HTTP server.
//!
//! A [`Server`] owns HTTP routing and backend resources. It always serves
//! `/api/config`; when an [`AssetResolver`] is supplied it also serves the
//! frontend. The two run modes fetch assets from different places but
//! through the same trait, so the serving logic is identical:
//!
//! - **serve** → [`from_context`]: reads the assets embedded in the
//!   `tauri::Context`.
//! - **GUI** → [`from_app`]: reads the same bytes through the running app's
//!   resolver (the context having been moved into the Tauri builder), so
//!   external HTTP clients get the UI too.
//!
//! In dev neither resolver is installed (Vite serves the UI) and the
//! server is API-only. No request is cross-origin, so there's no CORS.

use std::net::SocketAddr;
use std::sync::Arc;

use axum::body::Bytes;
use axum::extract::Request;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::{routing::get, Json, Router};
use tokio::net::TcpListener;

use crate::config::AppConfig;

/// Resolves a frontend path (`index.html`, `assets/app.js`) to its bytes.
/// One trait, two implementations kept in lockstep — so the server serves
/// assets the same way regardless of where they come from.
pub trait AssetResolver: Send + Sync + 'static {
    fn get(&self, path: &str) -> Option<Bytes>;
}

/// serve: assets embedded in the `tauri::Context`.
struct ContextAssets(tauri::Context);

impl AssetResolver for ContextAssets {
    fn get(&self, path: &str) -> Option<Bytes> {
        self.0
            .assets()
            .get(&path.into())
            .map(|b| Bytes::from(b.into_owned()))
    }
}

/// GUI: the same embedded assets, reached through the running app.
struct AppAssets(tauri::AssetResolver<tauri::Wry>);

impl AssetResolver for AppAssets {
    fn get(&self, path: &str) -> Option<Bytes> {
        self.0.get(path.to_string()).map(|a| Bytes::from(a.bytes))
    }
}

/// Asset resolver backed by the embedded context (headless serve).
pub fn from_context(context: tauri::Context) -> Arc<dyn AssetResolver> {
    Arc::new(ContextAssets(context))
}

/// Asset resolver backed by the running app (GUI, for external clients).
pub fn from_app(app: &tauri::App) -> Arc<dyn AssetResolver> {
    Arc::new(AppAssets(app.asset_resolver()))
}

/// Owns HTTP routing and backend resources. Passed to both run modes.
pub struct Server {
    config: AppConfig,
    assets: Option<Arc<dyn AssetResolver>>,
}

impl Server {
    pub fn new(config: AppConfig, assets: Option<Arc<dyn AssetResolver>>) -> Self {
        Self { config, assets }
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
        // Serve the frontend when a resolver is installed (production);
        // stay API-only otherwise (dev — Vite serves the UI).
        if let Some(assets) = self.assets.clone() {
            app = app.fallback(move |req: Request| serve_static(req, assets.clone()));
        }
        app
    }
}

/// Serve an asset, falling back to `index.html` for client-side routes.
/// Asset-shaped paths that miss get a loud 404 (so a stale build reference
/// doesn't masquerade as HTML).
async fn serve_static(req: Request, assets: Arc<dyn AssetResolver>) -> Response {
    let path = req.uri().path().trim_start_matches('/');
    let key = if path.is_empty() { "index.html" } else { path };

    if let Some(bytes) = assets.get(key) {
        return asset(key, bytes);
    }
    let asset_shaped =
        key.starts_with("assets/") || key.rsplit('/').next().is_some_and(|s| s.contains('.'));
    if asset_shaped {
        return (StatusCode::NOT_FOUND, format!("not found: /{key}\n")).into_response();
    }
    match assets.get("index.html") {
        Some(bytes) => asset("index.html", bytes),
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
    use std::collections::HashMap;

    use axum::body::Body;

    /// A third [`AssetResolver`] impl, map-backed, for testing the serving
    /// logic without a Tauri context or app.
    struct MapAssets(HashMap<String, Bytes>);

    impl AssetResolver for MapAssets {
        fn get(&self, path: &str) -> Option<Bytes> {
            self.0.get(path).cloned()
        }
    }

    fn assets() -> Arc<dyn AssetResolver> {
        Arc::new(MapAssets(HashMap::from([
            ("index.html".to_string(), Bytes::from_static(b"<html>root</html>")),
            ("assets/app.js".to_string(), Bytes::from_static(b"console.log(1)")),
        ])))
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
