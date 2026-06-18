//! `serve` — the headless run mode: boot the engine
//! ([`core::start`](crate::core::start)) and serve the API + frontend on the
//! main thread until a shutdown signal. Errors (a failed bind, a serve-loop
//! failure) report through the dispatcher's `exit_cli` like any other
//! command's.

use std::path::PathBuf;
use std::sync::Arc;

use clap::Args;

use crate::core::router::assets::AssetResolver;
use crate::core::{self, router};

#[derive(Args)]
pub struct ServeArgs {
    /// Path to config.json. Defaults to the canonical app config dir.
    #[arg(long)]
    pub config: Option<PathBuf>,
    /// Directory for the rotated JSON log file. Overrides config `log_dir`.
    #[arg(long)]
    pub log_dir: Option<PathBuf>,
}

pub fn run(args: ServeArgs) -> Result<(), String> {
    let rt = tokio::runtime::Builder::new_multi_thread()
        .enable_all()
        .build()
        .map_err(|e| format!("runtime: {e}"))?;
    rt.block_on(async move {
        let assets = serve_assets();
        let (server, listener) = core::start(args.config, args.log_dir)
            .await
            .map_err(|e| format!("server bind: {e}"))?;
        router::serve(server, listener, assets)
            .await
            .map_err(|e| format!("server error: {e}"))
    })
}

/// The frontend resolver for headless serve. With `gui`, the bytes are
/// embedded in the Tauri context (the existing behavior); without it, they're
/// read from a `dist/` directory on disk — `None` (API-only) when neither is
/// available, which is the dev case (Vite serves the UI).
#[cfg(feature = "gui")]
fn serve_assets() -> Option<Arc<dyn AssetResolver>> {
    router::assets::from_context(super::context())
}

#[cfg(not(feature = "gui"))]
fn serve_assets() -> Option<Arc<dyn AssetResolver>> {
    router::assets::from_dir(PathBuf::from("dist"))
}
