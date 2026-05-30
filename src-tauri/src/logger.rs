//! Logging.
//!
//! [`Logger::init`] installs the global `tracing` subscriber (stderr always,
//! plus a daily-rotated JSON file when a `log_dir` is given) and returns a
//! [`Logger`] that **owns the file appender's flush guard**. The `Server`
//! holds the returned `Arc<Logger>`, so the guard lives for the server's
//! lifetime in both run modes.
//!
//! The `Logger`'s methods are a convenience handle for handlers; they
//! delegate to the same global pipeline as the `tracing::` macros (which
//! internal/startup code uses directly for richer structured fields).

use std::path::Path;
use std::sync::Arc;

use tracing_appender::non_blocking::WorkerGuard;

/// Owns the file-appender flush guard (if file logging is active) and is a
/// handle handlers can log through.
pub struct Logger {
    _guard: Option<WorkerGuard>,
}

impl Logger {
    /// Initialize the global tracing subscriber once and return the logger.
    pub fn init(log_dir: Option<&Path>) -> Arc<Logger> {
        Arc::new(Logger {
            _guard: init_tracing(log_dir),
        })
    }
}

/// Convenience handle for handlers — unused until handlers land (they'll
/// reach it via `Server::logger`).
#[allow(dead_code)]
impl Logger {
    pub fn info(&self, msg: &str) {
        tracing::info!("{msg}");
    }

    pub fn warn(&self, msg: &str) {
        tracing::warn!("{msg}");
    }

    pub fn error(&self, msg: &str) {
        tracing::error!("{msg}");
    }

    pub fn debug(&self, msg: &str) {
        tracing::debug!("{msg}");
    }
}

/// Set the global subscriber. stderr at INFO+ always; a daily-rotated JSON
/// file in `log_dir` when given (returning its `WorkerGuard`). `RUST_LOG`
/// overrides the default filter.
fn init_tracing(log_dir: Option<&Path>) -> Option<WorkerGuard> {
    use tracing_subscriber::{fmt, layer::SubscriberExt, util::SubscriberInitExt, EnvFilter};

    let env_filter = EnvFilter::try_from_default_env()
        .unwrap_or_else(|_| EnvFilter::new("info,sc_app2_lib=info"));
    let stderr_layer = fmt::layer().with_writer(std::io::stderr).with_target(true);

    // Stderr-only path: no log dir, or the dir can't be created.
    let dir = match log_dir {
        Some(dir) => match std::fs::create_dir_all(dir) {
            Ok(()) => dir,
            Err(e) => {
                eprintln!("[logger] could not create {}: {e}", dir.display());
                tracing_subscriber::registry()
                    .with(env_filter)
                    .with(stderr_layer)
                    .init();
                return None;
            }
        },
        None => {
            tracing_subscriber::registry()
                .with(env_filter)
                .with(stderr_layer)
                .init();
            return None;
        }
    };

    let appender = tracing_appender::rolling::daily(dir, "sc-app2.log");
    let (non_blocking, guard) = tracing_appender::non_blocking(appender);
    let file_layer = fmt::layer()
        .with_writer(non_blocking)
        .with_ansi(false)
        .json();

    tracing_subscriber::registry()
        .with(env_filter)
        .with(stderr_layer)
        .with(file_layer)
        .init();

    tracing::info!(log_dir = %dir.display(), "tracing initialised — file output active");
    Some(guard)
}
