//! sc-app2 entry point.
//!
//! * `serve [--config <path>]` → headless HTTP server (API + frontend).
//! * no subcommand → native GUI (stock Tauri: `tauri://` assets + IPC),
//!   which also runs the HTTP server (API + frontend) for external clients.
//!
//! `run_serve`/`run_gui` are the composition root: they connect the OSC
//! [`core::bridge::Bridge`], start the [`core::scsynth::Scsynth`] supervisor on
//! top of it, and hand both to the web-layer [`router::Server`]. The frontend
//! gets its config via the [`config::get_config`] command (GUI webview, over
//! IPC) or the server's `/api/config` route (browsers).

mod config;
mod core;
mod logger;
mod router;

use std::path::PathBuf;

use clap::{Parser, Subcommand};
use tauri::Manager;

use crate::config::AppConfig;
use crate::core::bridge::Bridge;
use crate::core::scsynth::Scsynth;
use crate::router::Server;

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

    match command {
        Some(Command::Serve { .. }) => run_serve(config, context, log_dir),
        None => run_gui(config, context, log_dir),
    }
}

/// Headless mode: connect the bridge + scsynth supervisor, then bind and serve
/// on the main thread until a shutdown signal.
fn run_serve(config: AppConfig, context: tauri::Context, log_dir: Option<PathBuf>) {
    let logger = logger::Logger::init(log_dir.as_deref());
    tauri::async_runtime::block_on(async move {
        let assets = router::assets::from_context(context);
        let bridge = Bridge::connect(&config.routes).await;
        let scsynth = Scsynth::supervise(bridge.clone());
        let server = Server::new(config, bridge, scsynth, assets, logger);
        let (listener, _addr) = server.listen().await.expect("failed to bind server");
        if let Err(e) = server.serve(listener).await {
            tracing::error!(error = %e, "server error");
        }
    });
}

/// Native GUI: stock Tauri (window from tauri.conf.json, `tauri://` assets,
/// `get_config` over IPC) plus the HTTP server for external clients, which
/// serves the frontend through the running app's asset resolver.
fn run_gui(config: AppConfig, context: tauri::Context, log_dir: Option<PathBuf>) {
    let logger = logger::Logger::init(log_dir.as_deref());
    let app = tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![config::get_config])
        .setup(move |app| {
            // Connect the bridge + supervisor + bind in one async step (Server
            // owns the logger, keeping the log guard alive for the app's life).
            let (server, listener) = tauri::async_runtime::block_on(async {
                let assets = router::assets::from_app(app);
                let bridge = Bridge::connect(&config.routes).await;
                let scsynth = Scsynth::supervise(bridge.clone());
                let server = Server::new(config, bridge, scsynth, assets, logger);
                let (listener, _addr) = server.listen().await?;
                Ok::<_, std::io::Error>((server, listener))
            })
            .map_err(|e| format!("server bind: {e}"))?;
            // Keep a handle for the exit hook (unregister from scsynth on close).
            app.manage(server.clone());
            tauri::async_runtime::spawn(async move {
                if let Err(e) = server.serve(listener).await {
                    tracing::error!(error = %e, "server error");
                }
            });
            Ok(())
        })
        .build(context)
        .expect("error while building tauri application");

    // On window close / app exit, release our scsynth client slot before the
    // process goes away (the spawned `serve` task's signal handler only fires
    // on SIGINT/SIGTERM, not on a GUI window close).
    app.run(|app_handle, event| {
        if let tauri::RunEvent::ExitRequested { .. } = event {
            let server = app_handle.state::<Server>();
            tauri::async_runtime::block_on(server.unregister_scsynth());
        }
    });
}
