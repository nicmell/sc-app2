//! No subcommand — the native GUI run mode: Tauri with the window built
//! programmatically (so the embedded server can bind first and its base URL
//! be injected as `window.HTTP_BASE_URL` via an initialization script — the
//! webview's origin is `tauri://localhost`, not the server), plus the HTTP
//! server for external clients, which serves the frontend through the
//! running app's asset resolver.

use tauri::Manager;

use crate::core::server::Server;
use crate::core::{self, router};

pub fn run(context: tauri::Context) {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            // Same boot as serve (core::start, canonical config location);
            // only the asset source differs.
            let assets = router::assets::from_app(app);
            let (server, listener) = tauri::async_runtime::block_on(core::start(None, None))
                .map_err(|e| format!("server bind: {e}"))?;
            // Keep a handle for the exit hook (tear down scsynth state on close).
            app.manage(server.clone());
            // The window is created here (not tauri.conf.json) so the injected
            // base URL can carry the just-bound server port. The script runs
            // before any frontend code, so `src/http` reads it synchronously.
            tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::default())
                .title("sc-app2")
                .inner_size(800.0, 600.0)
                .initialization_script(format!("window.HTTP_BASE_URL = \"http://127.0.0.1:{}\";", server.port()))
                .build()?;
            tauri::async_runtime::spawn(async move {
                if let Err(e) = router::serve(server, listener, assets).await {
                    tracing::error!(error = %e, "server error");
                }
            });
            Ok(())
        })
        .build(context)
        .expect("error while building tauri application");

    // On window close / app exit, free the root group + release our scsynth
    // client slot before the process goes away (the spawned `serve` task's
    // signal handler only fires on SIGINT/SIGTERM, not on a GUI window close).
    app.run(|app_handle, event| {
        if let tauri::RunEvent::ExitRequested { .. } = event {
            let server = app_handle.state::<Server>();
            tauri::async_runtime::block_on(server.unregister());
        }
    });
}
