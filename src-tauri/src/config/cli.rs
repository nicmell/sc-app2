//! The `config` CLI subcommands (the `plugin` family's sibling): write the
//! default `config.json` to a path, and validate an existing one — the strict
//! counterpart of [`super::load`], which silently falls back to defaults on a
//! malformed file. Validation goes beyond JSON shape: every peer's routing
//! regex must compile and its target must look like `host:port`, the same
//! requirements the bridge enforces (by skipping the peer) at startup.

use clap::Subcommand;

use crate::config;

#[derive(Subcommand)]
pub enum ConfigCommand {
    /// Write the default config.json to the given path
    Write {
        /// Destination path (must not exist yet)
        path: String,
    },
    /// Validate a config.json file
    Validate {
        /// Path to a config.json
        path: String,
    },
}

pub fn run(cmd: ConfigCommand) -> Result<(), String> {
    match cmd {
        ConfigCommand::Write { path } => cmd_write(&path),
        ConfigCommand::Validate { path } => cmd_validate(&path),
    }
}

fn print_config(config: &config::AppConfig) {
    println!("  port:            {}", config.port);
    println!("  connect_timeout: {}s", config.connect_timeout);
    if let Some(dir) = &config.log_dir {
        println!("  log_dir:         {}", dir.display());
    }
    println!("  peers:");
    for peer in &config.peers {
        println!("    - {} → {} ({})", peer.name, peer.target, peer.pattern);
    }
}

fn cmd_write(path: &str) -> Result<(), String> {
    let dest = std::path::Path::new(path);
    if dest.exists() {
        return Err(format!("\"{path}\" already exists; remove it first"));
    }
    if let Some(dir) = dest.parent().filter(|d| !d.as_os_str().is_empty()) {
        std::fs::create_dir_all(dir).map_err(|e| format!("Error creating \"{}\": {e}", dir.display()))?;
    }
    let json = serde_json::to_string_pretty(&config::AppConfig::default()).map_err(|e| e.to_string())?;
    std::fs::write(dest, json + "\n").map_err(|e| format!("Error writing \"{path}\": {e}"))?;
    println!("Default config written to \"{path}\".");
    Ok(())
}

/// `host:port` with a valid port — what [`crate::core::peer`]'s resolve
/// accepts (IP literals parse as `SocketAddr`; hostnames go through DNS at
/// connect time, so only the shape is checked here).
fn is_valid_target(target: &str) -> bool {
    if target.parse::<std::net::SocketAddr>().is_ok() {
        return true;
    }
    match target.rsplit_once(':') {
        Some((host, port)) => !host.is_empty() && port.parse::<u16>().is_ok(),
        None => false,
    }
}

fn cmd_validate(path: &str) -> Result<(), String> {
    let text = std::fs::read_to_string(path).map_err(|e| format!("Error reading \"{path}\": {e}"))?;
    let config = config::parse(&text).map_err(|e| format!("\"{path}\" is not a valid config: {e}"))?;

    for peer in &config.peers {
        regex::Regex::new(&peer.pattern)
            .map_err(|e| format!("peer \"{}\": invalid pattern regex: {e}", peer.name))?;
        if !is_valid_target(&peer.target) {
            return Err(format!(
                "peer \"{}\": target \"{}\" is not a host:port address",
                peer.name, peer.target
            ));
        }
    }

    println!("Config is valid.");
    print_config(&config);
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    fn tmp(name: &str) -> std::path::PathBuf {
        std::env::temp_dir().join(format!("sc-app2-config-cli-{name}.json"))
    }

    #[test]
    fn write_then_validate_round_trips() {
        let path = tmp("roundtrip");
        std::fs::remove_file(&path).ok();
        assert!(cmd_write(path.to_str().unwrap()).is_ok());
        assert!(cmd_validate(path.to_str().unwrap()).is_ok());
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn write_refuses_existing_file() {
        let path = tmp("existing");
        std::fs::write(&path, "{}").unwrap();
        assert!(cmd_write(path.to_str().unwrap()).is_err());
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn validate_rejects_malformed_json_and_bad_peers() {
        let path = tmp("malformed");
        std::fs::write(&path, "not json").unwrap();
        assert!(cmd_validate(path.to_str().unwrap()).is_err());

        std::fs::write(
            &path,
            r#"{ "peers": [{ "name": "bad", "pattern": "(", "target": "127.0.0.1:1" }] }"#,
        )
        .unwrap();
        assert!(cmd_validate(path.to_str().unwrap()).unwrap_err().contains("pattern"));

        std::fs::write(
            &path,
            r#"{ "peers": [{ "name": "bad", "pattern": "^/x", "target": "nonsense" }] }"#,
        )
        .unwrap();
        assert!(cmd_validate(path.to_str().unwrap()).unwrap_err().contains("host:port"));
        std::fs::remove_file(path).ok();
    }

    #[test]
    fn target_shapes() {
        assert!(is_valid_target("127.0.0.1:57110"));
        assert!(is_valid_target("localhost:3000"));
        assert!(!is_valid_target("no-port"));
        assert!(!is_valid_target("host:notaport"));
        assert!(!is_valid_target(":3000"));
    }
}
