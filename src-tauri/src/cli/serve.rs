//! `serve` — the headless run mode: boot the engine
//! ([`core::start`](crate::core::start)) and serve the API + frontend on the
//! main thread until a shutdown signal. Errors (a failed bind, a serve-loop
//! failure) report through the dispatcher's `exit_cli` like any other
//! command's.

use std::path::PathBuf;

use clap::Args;

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

pub fn run(args: ServeArgs, context: tauri::Context) -> Result<(), String> {
    tauri::async_runtime::block_on(async move {
        let assets = router::assets::from_context(context);
        let (server, listener) = core::start(args.config, args.log_dir)
            .await
            .map_err(|e| format!("server bind: {e}"))?;
        router::serve(server, listener, assets)
            .await
            .map_err(|e| format!("server error: {e}"))
    })
}
