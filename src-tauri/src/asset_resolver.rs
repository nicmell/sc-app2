//! Frontend asset resolution.
//!
//! One [`AssetResolver`] trait, two implementations kept in lockstep so the
//! server serves the frontend the same way regardless of where the bytes
//! come from:
//!
//! - [`from_context`] (serve): assets embedded in the `tauri::Context`.
//! - [`from_app`] (GUI): the same bytes via the running app's resolver (the
//!   context having been moved into the Tauri builder).
//!
//! Both return `None` in dev, where Vite serves the UI and the server stays
//! API-only.

use std::sync::Arc;

use axum::body::Bytes;

/// Resolves a frontend path (`index.html`, `assets/app.js`) to its bytes.
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

/// Resolver over the embedded context (headless serve). `None` in dev.
pub fn from_context(context: tauri::Context) -> Option<Arc<dyn AssetResolver>> {
    (!cfg!(dev)).then(move || Arc::new(ContextAssets(context)) as Arc<dyn AssetResolver>)
}

/// Resolver over the running app (GUI, for external clients). `None` in dev.
pub fn from_app(app: &tauri::App) -> Option<Arc<dyn AssetResolver>> {
    (!cfg!(dev)).then(|| Arc::new(AppAssets(app.asset_resolver())) as Arc<dyn AssetResolver>)
}
