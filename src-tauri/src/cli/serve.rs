//! `serve` — the headless run mode: build the stack ([`crate::core::start`])
//! and serve the API + frontend on the main thread until a shutdown signal.

use std::path::PathBuf;
use std::sync::Arc;

use clap::Args;

use crate::core::logger::Logger;
use crate::core::{self, config::AppConfig, router};

#[derive(Args)]
pub struct ServeArgs {
    /// Path to config.json. Defaults to the canonical app config dir.
    #[arg(long)]
    pub config: Option<PathBuf>,
    /// Directory for the rotated JSON log file. Overrides config `log_dir`.
    #[arg(long)]
    pub log_dir: Option<PathBuf>,
}

pub fn run(config: AppConfig, context: tauri::Context, logger: Arc<Logger>) {
    tauri::async_runtime::block_on(async move {
        let assets = router::assets::from_context(context);
        let (server, listener) = core::start(config, logger).await.expect("failed to bind server");
        if let Err(e) = router::serve(server, listener, assets).await {
            tracing::error!(error = %e, "server error");
        }
    });
}
