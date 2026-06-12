//! The command-line surface: the clap definitions plus one file per command
//! — [`plugin`] and [`config`] are the no-server subcommand groups (plain
//! filesystem operations over the same managers the HTTP routes use; they
//! run and exit before anything boots), [`serve`] and [`gui`] are the run
//! modes, sharing the [`boot`] prelude and [`core::start`](crate::core::start)
//! (the composition root).

pub mod config;
pub mod gui;
pub mod plugin;
pub mod serve;

use std::sync::Arc;

use clap::{Parser, Subcommand};

use crate::core::config::AppConfig;
use crate::core::logger::Logger;

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
/// its own file; this is the single exhaustive dispatch.
pub fn run() {
    match Cli::parse().command {
        Some(Command::Plugin(cmd)) => exit_cli(plugin::run(cmd)),
        Some(Command::Config(cmd)) => exit_cli(config::run(cmd)),
        Some(Command::Serve(args)) => {
            let (config, context, logger) = boot(Some(&args));
            serve::run(config, context, logger);
        }
        None => {
            let (config, context, logger) = boot(None);
            gui::run(config, context, logger);
        }
    }
}

/// The run modes' shared prelude: resolve the config (the serve flags
/// override the canonical locations), embed the tauri context — ONE
/// `generate_context!` invocation, it embeds the frontend assets into the
/// binary — and initialize logging, so both modes log identically.
fn boot(serve: Option<&serve::ServeArgs>) -> (AppConfig, tauri::Context, Arc<Logger>) {
    let config = crate::core::config::load(serve.and_then(|a| a.config.clone()));
    let context = tauri::generate_context!();
    // Effective log dir: --log-dir flag (serve only) > config `log_dir`.
    let log_dir = serve
        .and_then(|a| a.log_dir.clone())
        .or_else(|| config.log_dir.clone());
    let logger = Logger::init(log_dir.as_deref());
    (config, context, logger)
}

/// Report a CLI subcommand's outcome and exit (0 on success, 1 with the error
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
