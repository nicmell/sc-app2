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

use std::path::PathBuf;

use clap::{Parser, Subcommand};

use crate::core::config as core_config;

#[derive(Parser)]
#[command(name = "sc-app2", version, about = "SCSynth controller")]
struct Cli {
    /// The app root owning config.json, plugins, sessions, and logs.
    /// Defaults to SC_APP_DIR, then the canonical platform dir.
    #[arg(long, global = true)]
    app_dir: Option<PathBuf>,
    /// Path to config.json. Defaults to the app dir's config.json.
    #[arg(long, global = true)]
    config: Option<PathBuf>,
    /// Directory for the rotated JSON log file, resolved against the cwd.
    /// Overrides config `log_dir` (which is app-dir-relative; default
    /// the app dir's logs/).
    #[arg(long, global = true)]
    log_dir: Option<PathBuf>,
    #[command(subcommand)]
    command: Option<Command>,
}

#[derive(Subcommand)]
pub enum Command {
    /// Run the HTTP server headlessly on localhost (no GUI).
    Serve,
    /// Manage plugin bundles (validate / add / remove / list).
    #[command(subcommand)]
    Plugin(plugin::PluginCommand),
    /// Manage config.json (write the default / validate one).
    #[command(subcommand)]
    Config(config::ConfigCommand),
}

/// Parse argv, install the resolved app root, and run the chosen command —
/// every command's behavior lives in its own file; this is the single
/// exhaustive dispatch. Every command but the GUI reports through
/// [`exit_cli`] (the GUI owns the process until its window closes).
pub fn run() {
    let cli = Cli::parse();
    // ONE code path owns the whole precedence chain (an empty SC_APP_DIR is
    // ignored there, which clap's own env fallback would reject).
    core_config::set_root(core_config::resolve_root(
        cli.app_dir,
        std::env::var_os("SC_APP_DIR"),
    ));
    let overrides = Overrides {
        config: cli.config,
        // Absolutized here: the flag is cwd-relative by CLI convention,
        // while config `log_dir` stays app-dir-relative (core::start).
        log_dir: cli
            .log_dir
            .map(|dir| std::path::absolute(&dir).unwrap_or(dir)),
    };
    match cli.command {
        Some(Command::Plugin(cmd)) => exit_cli(plugin::run(cmd)),
        Some(Command::Config(cmd)) => exit_cli(config::run(cmd, &overrides)),
        Some(Command::Serve) => exit_cli(serve::run(overrides, context())),
        None => gui::run(overrides, context()),
    }
}

/// The global `--config` / `--log-dir` overrides, resolved by the dispatch
/// and handed to whichever command boots the engine.
pub struct Overrides {
    pub config: Option<PathBuf>,
    pub log_dir: Option<PathBuf>,
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
