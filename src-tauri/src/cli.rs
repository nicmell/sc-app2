//! CLI parsing and dispatch.
//!
//! Two modes:
//! * No subcommand → [`gui::run`] launches the native Tauri GUI.
//! * `serve` subcommand → [`server::run_blocking`] runs the HTTP
//!   server standalone (no Tauri runtime, no webview), bound to
//!   localhost. For now it does NOT serve the bundled frontend —
//!   start the frontend separately with `yarn dev`.

use clap::{Parser, Subcommand};

use crate::{gui, server};

const DEFAULT_PORT: u16 = 3000;

#[derive(Parser)]
#[command(name = "sc-app2", version, about = "SCSynth controller")]
struct Cli {
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Subcommand)]
enum Command {
    /// Run the HTTP server headlessly on localhost (no GUI).
    ///
    /// The frontend is NOT served from here yet — run `yarn dev`
    /// separately; Vite proxies `/api` to this server.
    Serve {
        /// HTTP port to bind on 127.0.0.1. Falls back to the
        /// `SC_PORT` env var, then 3000.
        #[arg(short, long)]
        port: Option<u16>,
    },
}

pub fn run() {
    match Cli::parse().command {
        None => gui::run(),
        Some(Command::Serve { port }) => {
            let port = port
                .or_else(|| std::env::var("SC_PORT").ok().and_then(|s| s.parse().ok()))
                .unwrap_or(DEFAULT_PORT);
            server::run_blocking(port);
        }
    }
}
