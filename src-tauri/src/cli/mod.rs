//! The command-line surface: the clap definitions plus one file per command
//! — [`plugin`] and [`config`] are the no-server subcommand groups (plain
//! filesystem operations over the same managers the HTTP routes use),
//! [`serve`] and [`gui`] are the run modes, both booting the engine through
//! [`core::start`](crate::core::start) (the composition root — config,
//! logging, bridge, supervisor, server, listener).

pub mod config;
pub mod gui;
pub mod plugin;
pub mod serve;

use clap::{Parser, Subcommand};

#[derive(Parser)]
#[command(name = "sc-app2", version, about = "SCSynth controller")]
struct Cli {
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Subcommand)]
pub enum Command {
    /// Run the HTTP server headlessly on localhost (no GUI).
    Serve(serve::ServeArgs),
    /// Manage plugin bundles (validate / add / remove / list).
    #[command(subcommand)]
    Plugin(plugin::PluginCommand),
    /// Manage config.json (write the default / validate one).
    #[command(subcommand)]
    Config(config::ConfigCommand),
}

/// Parse argv and run the chosen command — every command's behavior lives in
/// its own file; this is the single exhaustive dispatch. Every command but
/// the GUI reports through [`exit_cli`] (the GUI owns the process until its
/// window closes).
pub fn run() {
    match Cli::parse().command {
        Some(Command::Plugin(cmd)) => exit_cli(plugin::run(cmd)),
        Some(Command::Config(cmd)) => exit_cli(config::run(cmd)),
        Some(Command::Serve(args)) => exit_cli(serve::run(args, context())),
        None => gui::run(context()),
    }
}

/// The embedded tauri context. ONE `generate_context!` invocation for the
/// whole crate — the macro embeds the frontend assets into the binary, so a
/// second textual invocation would duplicate them.
fn context() -> tauri::Context {
    tauri::generate_context!()
}

/// Report a CLI command's outcome and exit (0 on success, 1 with the error
/// on stderr otherwise).
fn exit_cli(result: Result<(), String>) -> ! {
    match result {
        Ok(()) => std::process::exit(0),
        Err(e) => {
            eprintln!("Error: {e}");
            std::process::exit(1);
        }
    }
}
