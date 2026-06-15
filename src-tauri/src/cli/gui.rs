//! No subcommand — the native GUI run mode: Tauri with the window built
//! programmatically (so the embedded server can bind first and its base URL
//! be injected via [`initialization_script`] — the webview's origin is
//! `tauri://localhost`, not the server), plus the HTTP server for external
//! clients, which serves the frontend through the running app's asset
//! resolver. The window's static shape (label, title, size) is data, not
//! code: it lives in `tauri.conf.json` under `app.windows` with
//! `create: false`, so Tauri doesn't auto-create it and [`run`] can build it
//! from that config at the right moment.
//!
//! The window uses the native `titleBarStyle: "Visible"` bar — but
//! tauri-runtime-wry force-adds `NSWindowStyleMask::FullSizeContentView` for
//! that (default) style on macOS as its workaround for tauri#10225, which
//! puts the whole webview — the app header, the boot overlay — UNDER the
//! title bar. [`run`] undoes it natively right after building the window
//! (the official window-customization guide's `ns_window` pattern, via
//! `objc2-app-kit`): clear the mask, then re-assert the configured inner
//! size (the mask change re-layouts the content view). Known trade-off
//! inherited from #10225: without the full-size mask, opening the docked
//! devtools can push the content view around — reopen the window if it
//! ever bites.

use tauri::Manager;

use crate::core::server::Server;
use crate::core::{self, router};

/// The injected base-URL bootstrap. It runs before any frontend code, so
/// `src/http` reads the global synchronously.
fn initialization_script(port: u16) -> String {
    format!("window.HTTP_BASE_URL = \"http://127.0.0.1:{port}\";")
}

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
            // The window is built here — not auto-created from the config —
            // so the initialization script can carry the just-bound server
            // port; its shape comes from tauri.conf.json.
            let window = app
                .config()
                .app
                .windows
                .first()
                .ok_or("no window declared in tauri.conf.json")?;
            let webview_window = tauri::WebviewWindowBuilder::from_config(app.handle(), window)?
                .initialization_script(initialization_script(server.port()))
                .build()?;
            // The runtime force-adds the full-size-content-view mask for the
            // Visible title-bar style (its tauri#10225 workaround), putting
            // the webview under the bar. Clear it so the content view sits
            // below the bar, and re-assert the configured inner size (the
            // mask change re-layouts the content view).
            #[cfg(target_os = "macos")]
            {
                use objc2_app_kit::{NSWindow, NSWindowStyleMask};
                let ns_window = webview_window.ns_window()? as *const NSWindow;
                // Safety: setup runs on the main thread and the pointer comes
                // from the just-built window.
                unsafe {
                    let ns_window = &*ns_window;
                    ns_window.setStyleMask(
                        ns_window.styleMask() & !NSWindowStyleMask::FullSizeContentView,
                    );
                }
                webview_window.set_size(tauri::LogicalSize::new(window.width, window.height))?;
            }
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
