//! `serve` — the headless run mode: boot the engine
//! ([`core::start`](crate::core::start)) and serve the API + frontend on the
//! main thread until a shutdown signal. Errors (a failed bind, a serve-loop
//! failure) report through the dispatcher's `exit_cli` like any other
//! command's.

use super::Overrides;
use crate::core::{self, router};

pub fn run(overrides: Overrides, context: tauri::Context) -> Result<(), String> {
    tauri::async_runtime::block_on(async move {
        let assets = router::assets::from_context(context);
        let (server, listener) = core::start(overrides.config, overrides.log_dir)
            .await
            .map_err(|e| format!("server bind: {e}"))?;
        router::serve(server, listener, assets)
            .await
            .map_err(|e| format!("server error: {e}"))
    })
}
