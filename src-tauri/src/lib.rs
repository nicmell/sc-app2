//! sc-app2 entry point.
//!
//! * `serve` subcommand → headless HTTP server on localhost.
//! * no subcommand → native GUI whose webview is just an HTTP client
//!   of that same server (Vite in dev, the bundled frontend in
//!   production).
//!
//! One [`Server`] is built here (with the resolved frontend `dist/`
//! path) and handed to whichever mode runs. The only remaining
//! difference: headless blocks on the server, while the GUI spawns it
//! and continues to open the window.

mod config;
mod server;

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
    /// Run the HTTP server headlessly on localhost (no GUI). In dev,
    /// run `yarn dev` for the UI; production serves the bundled frontend.
    Serve {
        /// Port to bind on 127.0.0.1. Falls back to `SC_PORT`, then
        /// config.json, then 3000.
        #[arg(short, long)]
        port: Option<u16>,
    },
}

pub fn run() {
    let command = Cli::parse().command;
    let port_flag = match &command {
        Some(Command::Serve { port }) => *port,
        None => None,
    };
    let server = Server::new(config::resolve_port(port_flag), config::frontend_dir());

    match command {
        Some(Command::Serve { .. }) => run_serve(server),
        None => run_gui(server),
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

/// Native GUI: runs the server in-process and points the webview at it.
fn run_gui(server: Server) {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(move |app| {
            // Bind synchronously so the webview URL is valid before it
            // loads, then serve in the background.
            let (listener, addr) = tauri::async_runtime::block_on(server.listen())
                .map_err(|e| format!("server bind: {e}"))?;
            tauri::async_runtime::spawn(async move {
                if let Err(e) = server.serve(listener).await {
                    eprintln!("server error: {e}");
                }
            });

            // Dev: load Vite's devUrl (it serves the assets). Production:
            // load our server, which serves the bundled frontend.
            let url = if cfg!(dev) {
                tauri::WebviewUrl::default()
            } else {
                tauri::WebviewUrl::External(format!("http://{addr}/").parse().unwrap())
            };
            tauri::WebviewWindowBuilder::new(app, "main", url)
                .title("sc-app2")
                .inner_size(800.0, 600.0)
                .build()?;
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
