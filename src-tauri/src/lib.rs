//! sc-app2 entry point — the module tree and nothing else.
//!
//! Two layers: [`cli`] is the argv surface (one file per command — the
//! no-server `plugin`/`config` groups, plus the `serve` and GUI run modes
//! and their shared boot prelude); [`core`] is the whole application engine
//! (the OSC bridge + scsynth supervisor, sessions, scope streaming, the
//! `Server` facade, and the axum `router` transport), composed by
//! [`core::start`].
//!
//! * `serve [--config <path>]` → headless HTTP server ([`cli::serve`]).
//! * `plugin <validate|add|remove|list>` → manage plugin bundles
//!   ([`cli::plugin`]).
//! * `config <write|validate>` → write/validate `config.json`
//!   ([`cli::config`]).
//! * no subcommand → native GUI, which also runs the HTTP server for
//!   external clients ([`cli::gui`]).

mod cli;
mod core;

pub fn run() {
    cli::run();
}
