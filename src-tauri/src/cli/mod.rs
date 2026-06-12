//! The command-line surface: the clap definitions plus the no-server
//! subcommand groups, one file per group ([`plugin`], [`config`]). These are
//! plain filesystem operations over the same managers the HTTP routes use —
//! no logger or server involved; [`parse_and_dispatch`] runs them and exits
//! before any of that boots. The run modes themselves (serve / GUI) stay in
//! `lib.rs`, the composition root.

pub mod config;
pub mod plugin;

use std::path::PathBuf;

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
    Serve {
        /// Path to config.json. Defaults to the canonical app config dir.
        #[arg(long)]
        config: Option<PathBuf>,
        /// Directory for the rotated JSON log file. Overrides config `log_dir`.
        #[arg(long)]
        log_dir: Option<PathBuf>,
    },
    /// Manage plugin bundles (validate / add / remove / list).
    #[command(subcommand)]
    Plugin(plugin::PluginCommand),
    /// Manage config.json (write the default / validate one).
    #[command(subcommand)]
    Config(config::ConfigCommand),
}

/// Parse argv and run any no-server subcommand (exiting the process when one
/// ran); return the surviving command — `Serve` or none (GUI) — for the
/// composition root to boot.
pub fn parse_and_dispatch() -> Option<Command> {
    match Cli::parse().command {
        Some(Command::Plugin(cmd)) => exit_cli(plugin::run(cmd)),
        Some(Command::Config(cmd)) => exit_cli(config::run(cmd)),
        other => other,
    }
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
