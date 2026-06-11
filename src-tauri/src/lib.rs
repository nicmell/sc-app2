//! sc-app2 entry point.
//!
//! * `serve [--config <path>]` → headless HTTP server (API + frontend).
//! * no subcommand → native GUI (stock Tauri: `tauri://` assets + IPC),
//!   which also runs the HTTP server (API + frontend) for external clients.
//!
//! [`run`] does the work common to both modes (parse CLI, load config,
//! initialize logging), then dispatches. [`start`] is the shared composition
//! root: it connects the OSC [`core::bridge::Bridge`], starts the
//! [`core::scsynth::Scsynth`] supervisor on top of it, builds the web-layer
//! [`router::Server`], and binds its listener. The two run modes differ only in
//! where the frontend assets come from and how/when they serve. The GUI webview
//! learns the server's base URL through an injected `window.HTTP_BASE_URL`
//! (its window is built after the listener binds, with an initialization
//! script); browsers are same-origin.

mod config;
mod core;
mod logger;
mod plugin;
mod router;
mod saved_sessions;
mod scope;
mod server;

use std::path::PathBuf;
use std::sync::Arc;

use clap::{Parser, Subcommand};
use tauri::Manager;
use tokio::net::TcpListener;

use crate::config::AppConfig;
use crate::core::bridge::Bridge;
use crate::core::scsynth::Scsynth;
use crate::logger::Logger;
use crate::server::Server;

#[derive(Parser)]
#[command(name = "sc-app2", version, about = "SCSynth controller")]
struct Cli {
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Subcommand)]
enum Command {
    /// Run the HTTP server headlessly on localhost (no GUI).
    Serve {
        /// Path to config.json. Defaults to the canonical app config dir.
        #[arg(long)]
        config: Option<PathBuf>,
        /// Directory for the rotated JSON log file. Overrides config `log_dir`.
        #[arg(long)]
        log_dir: Option<PathBuf>,
    },
}

pub fn run() {
    let command = Cli::parse().command;
    // serve reads --config / --log-dir; GUI uses the canonical config location.
    let (config_path, cli_log_dir) = match &command {
        Some(Command::Serve { config, log_dir }) => (config.clone(), log_dir.clone()),
        None => (None, None),
    };
    let config = config::load(config_path);
    let context = tauri::generate_context!();
    // Effective log dir: --log-dir flag (serve only) > config `log_dir`.
    let log_dir = cli_log_dir.or_else(|| config.log_dir.clone());
    // Initialize logging once, up front, so both run modes log identically.
    let logger = logger::Logger::init(log_dir.as_deref());

    match command {
        Some(Command::Serve { .. }) => run_serve(config, context, logger),
        None => run_gui(config, context, logger),
    }
}

/// Connect the OSC bridge, build the [`Server`] over a fresh scsynth supervisor,
/// wire the root-group registration hook, start supervision + the reaper, and
/// bind the listener. The composition root for both run modes — `assets` (the
/// per-mode input) is handed to [`router::serve`] by the caller, not stored here.
async fn start(config: AppConfig, logger: Arc<Logger>) -> std::io::Result<(Server, TcpListener)> {
    let bridge = Bridge::connect(
        &config.peers,
        std::time::Duration::from_secs(config.connect_timeout),
    )
    .await;
    // The supervisor owns the scsynth side — it (re)creates its per-client root
    // group on every registration itself.
    let scsynth = Scsynth::supervise(bridge.clone());
    // Gate the HTTP server on the first successful scsynth registration, so
    // clients never reach it before scsynth is up; later outages stay with
    // the supervisor's reconnect loop.
    tracing::info!("waiting for scsynth registration before starting the HTTP server");
    scsynth.await_registration().await;
    let server = Server::new(config, bridge, scsynth, logger);
    let (listener, _addr) = router::listen(&server).await?;
    Ok((server, listener))
}

/// Headless mode: build everything and serve on the main thread until a
/// shutdown signal.
fn run_serve(config: AppConfig, context: tauri::Context, logger: Arc<Logger>) {
    tauri::async_runtime::block_on(async move {
        let assets = router::assets::from_context(context);
        let (server, listener) = start(config, logger).await.expect("failed to bind server");
        if let Err(e) = router::serve(server, listener, assets).await {
            tracing::error!(error = %e, "server error");
        }
    });
}

/// Native GUI: Tauri with the window built programmatically (so the embedded
/// server can bind first and its base URL be injected as `window.HTTP_BASE_URL`
/// via an initialization script — the webview's origin is `tauri://localhost`,
/// not the server), plus the HTTP server for external clients, which serves the
/// frontend through the running app's asset resolver.
fn run_gui(config: AppConfig, context: tauri::Context, logger: Arc<Logger>) {
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            // Same build+bind as serve; only the asset source differs.
            let assets = router::assets::from_app(app);
            let (server, listener) = tauri::async_runtime::block_on(start(config, logger))
                .map_err(|e| format!("server bind: {e}"))?;
            // Keep a handle for the exit hook (tear down scsynth state on close).
            app.manage(server.clone());
            // The window is created here (not tauri.conf.json) so the injected
            // base URL can carry the just-bound server port. The script runs
            // before any frontend code, so `src/http` reads it synchronously.
            tauri::WebviewWindowBuilder::new(app, "main", tauri::WebviewUrl::default())
                .title("sc-app2")
                .inner_size(800.0, 600.0)
                .initialization_script(format!(
                    "window.HTTP_BASE_URL = \"http://127.0.0.1:{}\";",
                    server.port()
                ))
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
