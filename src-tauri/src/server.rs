//! The HTTP server.
//!
//! A [`Server`] owns HTTP routing. It always serves `/api/config`; when an
//! [`AssetResolver`] is supplied it also serves the frontend. See
//! [`crate::asset_resolver`] for how each run mode obtains one (`None` in
//! dev, where Vite serves the UI and the server is API-only). No request is
//! cross-origin, so there's no CORS.

use std::net::SocketAddr;
use std::sync::Arc;

use axum::body::Bytes;
use axum::extract::Request;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};
use axum::{routing::get, Json, Router};
use tokio::net::TcpListener;

use crate::asset_resolver::AssetResolver;
use crate::config::AppConfig;
use crate::logger::Logger;
use crate::peer::Peer;

/// Owns HTTP routing and backend resources. Passed to both run modes.
pub struct Server {
    config: AppConfig,
    assets: Option<Arc<dyn AssetResolver>>,
    /// Connected audio-backend peers (scsynth, strudel, …); read via
    /// [`peers`](Self::peers) once routing/forwarding lands.
    #[allow(dead_code)]
    peers: Vec<Arc<Peer>>,
    /// Owns the logging guard (keeping the file appender alive); exposed via
    /// [`logger`](Self::logger) for future handlers.
    #[allow(dead_code)]
    logger: Arc<Logger>,
}

impl Server {
    /// Connect the configured peers, then build the server. Async because
    /// peer connection binds UDP sockets and resolves targets. Holding the
    /// `Logger` keeps the file-appender guard alive for the server's life.
    pub async fn new(
        config: AppConfig,
        assets: Option<Arc<dyn AssetResolver>>,
        logger: Arc<Logger>,
    ) -> Self {
        let peers = crate::peer::connect_all(&config.routes).await;
        Self {
            config,
            assets,
            peers,
            logger,
        }
    }

    /// The connected peers (for future routing/forwarding).
    #[allow(dead_code)]
    pub fn peers(&self) -> &[Arc<Peer>] {
        &self.peers
    }

    /// The logger handle (for future handlers).
    #[allow(dead_code)]
    pub fn logger(&self) -> &Arc<Logger> {
        &self.logger
    }

    /// Bind a localhost listener and log its address. Separate from
    /// [`serve`](Self::serve) so GUI mode can bind synchronously then
    /// serve on a spawned task.
    pub async fn listen(&self) -> std::io::Result<(TcpListener, SocketAddr)> {
        let listener = TcpListener::bind(("127.0.0.1", self.config.port)).await?;
        let addr = listener.local_addr()?;
        tracing::info!(%addr, "sc-app2 server listening");
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
    // Misses that should 404 rather than render the SPA shell: API routes
    // and real files (under assets/, or anything with an extension).
    let not_a_route = key.starts_with("api/")
        || key.starts_with("assets/")
        || key.rsplit('/').next().is_some_and(|s| s.contains('.'));
    if not_a_route {
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

    /// A map-backed [`AssetResolver`] for testing the serving logic without
    /// a Tauri context or app.
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

    #[tokio::test]
    async fn unknown_api_route_is_404_not_html() {
        let res = serve_static(req("/api/nope"), assets()).await;
        assert_eq!(res.status(), StatusCode::NOT_FOUND);
        assert!(!content_type(&res).contains("text/html"));
    }
}
