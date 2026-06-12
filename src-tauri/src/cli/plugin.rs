//! The `plugin` CLI subcommands (ported from upstream sc-app): validate a
//! bundle, validate + install it, remove one, list the installed ones. Thin
//! wrappers over [`manager`] — the same validation/storage the HTTP routes
//! use, so a bundle that passes here uploads clean and vice versa.

use clap::Subcommand;

use crate::core::plugin::manager;

#[derive(Subcommand)]
pub enum PluginCommand {
    /// Validate a plugin zip file
    Validate {
        /// Path to plugin zip
        path: String,
    },
    /// Validate and install a plugin
    Add {
        /// Path to plugin zip
        path: String,
    },
    /// Remove a plugin by name or name-version
    Remove {
        /// Plugin name or name-version (e.g. my-plugin or my-plugin-1.2.3)
        name: String,
    },
    /// List installed plugins
    List,
}

pub fn run(cmd: PluginCommand) -> Result<(), String> {
    match cmd {
        PluginCommand::Validate { path } => cmd_validate(&path),
        PluginCommand::Add { path } => cmd_add(&path),
        PluginCommand::Remove { name } => cmd_remove(&name),
        PluginCommand::List => cmd_list(),
    }
}

fn print_plugin_info(info: &manager::PluginInfo) {
    // Empty for `validate` — the id is minted at install time.
    if !info.id.is_empty() {
        println!("  id:      {}", info.id);
    }
    println!("  name:    {}", info.name);
    println!("  version: {}", info.version);
    println!("  author:  {}", info.author);
    println!("  entry:   {}", info.entry);
    if !info.assets.is_empty() {
        println!("  assets:");
        for asset in &info.assets {
            println!("    - {} ({})", asset.path, asset.mime_type);
        }
    }
}

fn read_zip(path: &str) -> Result<Vec<u8>, String> {
    std::fs::read(path).map_err(|e| format!("Error reading \"{path}\": {e}"))
}

fn cmd_validate(path: &str) -> Result<(), String> {
    let info = manager::validate_plugin(&read_zip(path)?)?;
    println!("Plugin is valid.");
    print_plugin_info(&info);
    Ok(())
}

fn cmd_add(path: &str) -> Result<(), String> {
    let info = manager::add_plugin(&read_zip(path)?)?;
    println!("Plugin added.");
    print_plugin_info(&info);
    Ok(())
}

/// Split a removal query into name + optional version: a trailing
/// `-<something with a dot>` reads as a version (`my-plugin-1.2.3`),
/// anything else is all name (`my-plugin`).
fn parse_query(query: &str) -> (&str, Option<&str>) {
    match query.rsplit_once('-') {
        Some((name, version)) if version.contains('.') => (name, Some(version)),
        _ => (query, None),
    }
}

fn cmd_remove(query: &str) -> Result<(), String> {
    let (name, version) = parse_query(query);
    let info = manager::list_plugins()?
        .into_iter()
        .find(|p| p.name == name && version.is_none_or(|v| p.version == v))
        .ok_or_else(|| format!("Plugin \"{query}\" not found"))?;

    println!("Removing {} v{}...", info.name, info.version);
    manager::remove_plugin(&info.id)?;
    println!("Plugin removed.");
    Ok(())
}

fn cmd_list() -> Result<(), String> {
    let plugins = manager::list_plugins()?;
    if plugins.is_empty() {
        println!("No plugins installed.");
        return Ok(());
    }
    println!("Installed plugins:");
    for p in &plugins {
        println!("  {} v{} by {}", p.name, p.version, p.author);
    }
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn query_splits_name_and_version() {
        assert_eq!(parse_query("my-plugin-1.2.3"), ("my-plugin", Some("1.2.3")));
        assert_eq!(parse_query("my-plugin"), ("my-plugin", None));
        // A dash without a dotted suffix stays part of the name.
        assert_eq!(parse_query("my-plugin-extra"), ("my-plugin-extra", None));
        assert_eq!(parse_query("plain"), ("plain", None));
    }
}
