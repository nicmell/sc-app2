//! sc-app2 entry point.
//!
//! * `serve [--config <path>]` → headless HTTP server on localhost.
//! * no subcommand → native GUI (stock Tauri: `tauri://` assets + IPC),
//!   which also runs the HTTP server for any external clients.
//!
//! One [`Server`] is built from the config + embedded context (assets
//! snapshotted by reference, so the context still drives the GUI builder)
//! and handed to whichever mode runs. The frontend gets its config via
//! the [`config::get_config`] command (GUI webview, IPC) or the server's
//! `/config.json` route (browsers).

mod config;
mod server;

use std::path::PathBuf;

use clap::{Parser, Subcommand};

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
    },
}

pub fn run() {
    let command = Cli::parse().command;
    // serve reads --config; GUI uses the canonical location.
    let config_path = match &command {
        Some(Command::Serve { config }) => config.clone(),
        None => None,
    };
    let config = config::load(config_path);
    let context = tauri::generate_context!();
    // Built by reference, so `context` remains available for the GUI builder.
    let server = Server::new(config, &context);

    match command {
        Some(Command::Serve { .. }) => run_serve(server),
        None => run_gui(server, context),
    }
}

/// Headless mode: bind and serve on the main thread until the process exits.
fn run_serve(server: Server) {
    tauri::async_runtime::block_on(async move {
        let (listener, _addr) = server.listen().await.expect("failed to bind server");
        if let Err(e) = server.serve(listener).await {
            eprintln!("server error: {e}");
        }
    });
}

/// Native GUI: stock Tauri (window from tauri.conf.json, `tauri://` assets,
/// `get_config` over IPC) plus the HTTP server running for external clients.
fn run_gui(server: Server, context: tauri::Context) {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![config::get_config])
        .setup(move |_app| {
            let (listener, _addr) = tauri::async_runtime::block_on(server.listen())
                .map_err(|e| format!("server bind: {e}"))?;
            tauri::async_runtime::spawn(async move {
                if let Err(e) = server.serve(listener).await {
                    eprintln!("server error: {e}");
                }
            });
            Ok(())
        })
        .run(context)
        .expect("error while running tauri application");
}
