//! The `plugin` CLI subcommands: validate a
//! bundle, validate + install it, remove one, list the installed ones. Thin
//! wrappers over [`manager`] — the same validation/storage the HTTP routes
//! use, so a bundle that passes here uploads clean and vice versa.

use clap::Subcommand;

use crate::core::plugin::manager;

#[derive(Subcommand)]
pub enum PluginCommand {
    /// Validate plugin bundles
    Validate {
        /// Plugin zips, or directories containing *.zip (globs via the shell)
        #[arg(required = true)]
        paths: Vec<String>,
    },
    /// Validate and install plugin bundles
    Add {
        /// Plugin zips, or directories containing *.zip (globs via the shell)
        #[arg(required = true)]
        paths: Vec<String>,
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
        PluginCommand::Validate { paths } => run_bundles(&paths, manager::validate_plugin, "valid"),
        PluginCommand::Add { paths } => run_bundles(&paths, manager::add_plugin, "added"),
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

/// Expand one CLI path into plugin zips: a file is taken as the zip it is,
/// a directory contributes its DIRECT `*.zip` children (flat, sorted — a
/// stable report across filesystems; globs are the shell's job and arrive
/// here as individual paths). A directory with no zips, or a missing path,
/// is an argument error.
fn expand(path: &str) -> Result<Vec<std::path::PathBuf>, String> {
    let p = std::path::Path::new(path);
    if p.is_file() {
        return Ok(vec![p.to_path_buf()]);
    }
    if p.is_dir() {
        let entries = std::fs::read_dir(p).map_err(|e| format!("Error reading \"{path}\": {e}"))?;
        let mut zips: Vec<std::path::PathBuf> = entries
            .filter_map(|entry| entry.ok().map(|e| e.path()))
            .filter(|candidate| {
                candidate.is_file()
                    && candidate
                        .extension()
                        .is_some_and(|e| e.eq_ignore_ascii_case("zip"))
            })
            .collect();
        if zips.is_empty() {
            return Err(format!("no plugin zips found in \"{path}\""));
        }
        zips.sort();
        return Ok(zips);
    }
    Err(format!("\"{path}\" does not exist"))
}

/// Run `op` over every zip the paths expand to. Per-zip validation failures
/// are LOGGED and never block the rest (the intentional `invalid/` example
/// fixtures fail by design when importing `examples/dist` wholesale); the
/// command errors only when the arguments are bad or NOTHING succeeded.
fn run_bundles(
    paths: &[String],
    op: impl Fn(&[u8]) -> Result<manager::PluginInfo, manager::PluginError>,
    verb: &str,
) -> Result<(), String> {
    let mut zips = Vec::new();
    for path in paths {
        zips.extend(expand(path)?);
    }
    let single = zips.len() == 1;
    let mut failed = 0usize;
    for zip in &zips {
        let shown = zip.display();
        let result = std::fs::read(zip)
            .map_err(|e| manager::PluginError::Io(format!("Error reading \"{shown}\": {e}")))
            .and_then(|bytes| op(&bytes));
        match result {
            Ok(info) => {
                println!("{verb} {} v{}", info.name, info.version);
                if single {
                    print_plugin_info(&info);
                }
            }
            Err(e) => {
                failed += 1;
                if single {
                    // The full multi-line error (the spec gate's whole
                    // violation list) — a single explicit bundle deserves
                    // full detail.
                    println!("failed {shown}: {e}");
                } else {
                    let text = e.to_string();
                    let first = text.lines().next().unwrap_or_default();
                    println!("failed {shown}: {first}");
                }
            }
        }
    }
    println!("{} {verb}, {failed} failed", zips.len() - failed);
    if failed == zips.len() {
        return Err("no bundle succeeded".to_string());
    }
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
    fn expand_takes_files_and_flat_zip_directories_only() {
        let root = std::env::temp_dir().join("sc-app2-test-expand");
        let _ = std::fs::remove_dir_all(&root);
        std::fs::create_dir_all(root.join("nested")).unwrap();
        std::fs::write(root.join("b.zip"), "x").unwrap();
        std::fs::write(root.join("a.zip"), "x").unwrap();
        std::fs::write(root.join("notes.txt"), "x").unwrap();
        std::fs::write(root.join("nested").join("deep.zip"), "x").unwrap();

        let zips = expand(root.to_str().unwrap()).unwrap();
        let names: Vec<_> = zips
            .iter()
            .map(|z| z.file_name().unwrap().to_string_lossy().to_string())
            .collect();
        // Flat + sorted: nested/deep.zip and notes.txt are NOT picked up.
        assert_eq!(names, ["a.zip", "b.zip"]);

        assert!(expand(root.join("nested").join("missing").to_str().unwrap()).is_err());
        let empty = root.join("empty");
        std::fs::create_dir_all(&empty).unwrap();
        assert!(expand(empty.to_str().unwrap())
            .unwrap_err()
            .contains("no plugin zips"));
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn query_splits_name_and_version() {
        assert_eq!(parse_query("my-plugin-1.2.3"), ("my-plugin", Some("1.2.3")));
        assert_eq!(parse_query("my-plugin"), ("my-plugin", None));
        // A dash without a dotted suffix stays part of the name.
        assert_eq!(parse_query("my-plugin-extra"), ("my-plugin-extra", None));
        assert_eq!(parse_query("plain"), ("plain", None));
    }
}
