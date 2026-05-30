//! sc-app2 entry point.
//!
//! * `serve [--config <path>]` → headless HTTP server (API + frontend).
//! * no subcommand → native GUI (stock Tauri: `tauri://` assets + IPC),
//!   which also runs the HTTP server (API + frontend) for external clients.
//!
//! Both modes serve the frontend through an
//! [`asset_resolver::AssetResolver`], built per mode
//! ([`asset_resolver::from_context`] for serve, [`asset_resolver::from_app`]
//! for the GUI). The frontend gets its config via the
//! [`config::get_config`] command (GUI webview, over IPC) or the server's
//! `/api/config` route (browsers).

mod asset_resolver;
mod config;
mod logger;
mod peer;
mod server;
mod session;

use std::path::PathBuf;

use clap::{Parser, Subcommand};

use config::AppConfig;
use server::Server;

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

/// Headless mode: init logging, connect peers, bind and serve on the main
/// thread until the process exits.
fn run_serve(config: AppConfig, context: tauri::Context, log_dir: Option<PathBuf>) {
    let logger = logger::Logger::init(log_dir.as_deref());
    tauri::async_runtime::block_on(async move {
        let server = Server::new(config, asset_resolver::from_context(context), logger).await;
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
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![config::get_config])
        .setup(move |app| {
            // Connect peers + bind in one async step (Server owns the logger,
            // keeping the log guard alive for the app's lifetime).
            let (server, listener) = tauri::async_runtime::block_on(async {
                let server = Server::new(config, asset_resolver::from_app(app), logger).await;
                let (listener, _addr) = server.listen().await?;
                Ok::<_, std::io::Error>((server, listener))
            })
            .map_err(|e| format!("server bind: {e}"))?;
            tauri::async_runtime::spawn(async move {
                if let Err(e) = server.serve(listener).await {
                    tracing::error!(error = %e, "server error");
                }
            });
            Ok(())
        })
        .run(context)
        .expect("error while running tauri application");
}
