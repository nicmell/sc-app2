//! Frontend asset resolution + static serving.
//!
//! One [`AssetResolver`] trait, two implementations kept in lockstep so the
//! server serves the frontend the same way regardless of where the bytes come
//! from:
//! - [`from_context`] (serve): assets embedded in the `tauri::Context`.
//! - [`from_app`] (GUI): the same bytes via the running app's resolver.
//!
//! Both return `None` in dev, where Vite serves the UI and the server stays
//! API-only. [`serve_static`] is the axum fallback that uses a resolver.

use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use axum::body::Bytes;
use axum::extract::Request;
use axum::http::{header, StatusCode};
use axum::response::{IntoResponse, Response};

/// Resolves a frontend path (`index.html`, `assets/app.js`) to its bytes.
pub trait AssetResolver: Send + Sync + 'static {
    fn get(&self, path: &str) -> Option<Bytes>;
}

/// Memoizes a resolver's hits: the underlying resolvers copy the embedded
/// bytes on every lookup, so without this each page load memcpy's the whole
/// JS bundle. Assets are immutable for the process lifetime; `Bytes` clones
/// are refcounted. Misses pass through (SPA routes miss on purpose).
struct CachedAssets<R> {
    inner: R,
    cache: Mutex<HashMap<String, Bytes>>,
}

impl<R: AssetResolver> CachedAssets<R> {
    /// Wrap `inner` and warm the cache from the Vite build manifest
    /// (`manifest.json`, emitted by `yarn build`): `index.html`, the manifest
    /// itself, and every chunk's `file`/`css`/`assets` output are resolved
    /// once at boot, so no request ever pays the embedded-asset copy. Files
    /// outside the manifest (public/ files like favicons) stay lazily cached;
    /// a missing manifest just falls back to all-lazy.
    fn preloaded(inner: R) -> Self {
        let cached = Self { inner, cache: Mutex::new(HashMap::new()) };
        let warmed = cached
            .manifest_paths()
            .iter()
            .filter(|path| cached.get(path).is_some())
            .count();
        tracing::debug!(warmed, "frontend asset cache preloaded");
        cached
    }

    /// Every build output named by the Vite manifest (plus `index.html` and
    /// the manifest itself, which this lookup caches as a side effect).
    fn manifest_paths(&self) -> Vec<String> {
        let mut paths = vec!["index.html".to_string()];
        let Some(manifest) = self
            .get("manifest.json")
            .and_then(|bytes| serde_json::from_slice::<serde_json::Value>(&bytes).ok())
        else {
            return paths;
        };
        let Some(entries) = manifest.as_object() else {
            return paths;
        };
        for entry in entries.values() {
            if let Some(file) = entry.get("file").and_then(|v| v.as_str()) {
                paths.push(file.to_string());
            }
            for list in ["css", "assets"] {
                if let Some(items) = entry.get(list).and_then(|v| v.as_array()) {
                    paths.extend(items.iter().filter_map(|v| v.as_str().map(str::to_string)));
                }
            }
        }
        paths
    }
}

impl<R: AssetResolver> AssetResolver for CachedAssets<R> {
    fn get(&self, path: &str) -> Option<Bytes> {
        if let Some(bytes) = self.cache.lock().unwrap().get(path) {
            return Some(bytes.clone());
        }
        let bytes = self.inner.get(path)?;
        self.cache.lock().unwrap().insert(path.to_string(), bytes.clone());
        Some(bytes)
    }
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

/// Resolver over the embedded context (headless serve). `None` in dev.
pub fn from_context(context: tauri::Context) -> Option<Arc<dyn AssetResolver>> {
    (!cfg!(dev))
        .then(move || Arc::new(CachedAssets::preloaded(ContextAssets(context))) as Arc<dyn AssetResolver>)
}

/// Resolver over the running app (GUI, for external clients). `None` in dev.
pub fn from_app(app: &tauri::App) -> Option<Arc<dyn AssetResolver>> {
    (!cfg!(dev))
        .then(|| Arc::new(CachedAssets::preloaded(AppAssets(app.asset_resolver()))) as Arc<dyn AssetResolver>)
}

/// Serve an asset, falling back to `index.html` for client-side routes.
/// Asset-shaped paths that miss get a loud 404 (so a stale build reference
/// doesn't masquerade as HTML).
pub async fn serve_static(req: Request, assets: Arc<dyn AssetResolver>) -> Response {
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

    /// Counts how often the underlying resolver is hit, so the cache's
    /// "one inner lookup per asset, ever" contract is pinned.
    struct CountingAssets {
        inner: MapAssets,
        hits: std::sync::atomic::AtomicUsize,
    }

    impl AssetResolver for &'static CountingAssets {
        fn get(&self, path: &str) -> Option<Bytes> {
            self.hits.fetch_add(1, std::sync::atomic::Ordering::SeqCst);
            self.inner.get(path)
        }
    }

    #[tokio::test]
    async fn preload_warms_manifest_assets_so_requests_skip_the_resolver() {
        let manifest = br#"{
            "index.html": { "file": "assets/app.js", "css": ["assets/app.css"] }
        }"#;
        let counting: &'static CountingAssets = Box::leak(Box::new(CountingAssets {
            inner: MapAssets(HashMap::from([
                ("index.html".to_string(), Bytes::from_static(b"<html>root</html>")),
                ("manifest.json".to_string(), Bytes::from_static(manifest)),
                ("assets/app.js".to_string(), Bytes::from_static(b"console.log(1)")),
                ("assets/app.css".to_string(), Bytes::from_static(b"body{}")),
            ])),
            hits: std::sync::atomic::AtomicUsize::new(0),
        }));

        let cached = CachedAssets::preloaded(counting);
        let after_boot = counting.hits.load(std::sync::atomic::Ordering::SeqCst);

        // Every manifest-named asset is already cached: repeated requests
        // never reach the underlying resolver again.
        for path in ["index.html", "manifest.json", "assets/app.js", "assets/app.css"] {
            assert!(cached.get(path).is_some(), "missing {path}");
            assert!(cached.get(path).is_some());
        }
        assert_eq!(counting.hits.load(std::sync::atomic::Ordering::SeqCst), after_boot);
    }
}
