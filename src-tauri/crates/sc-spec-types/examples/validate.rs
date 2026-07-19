use std::path::Path;

fn main() -> Result<(), String> {
    const PACKAGES: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../../../packages");
    let synthdef = Path::new(PACKAGES).join("synthdef-compiler/specs");
    let ugens = sc_spec_types::load_ugens(synthdef.join("ugens.json").as_path())?;
    let commands = sc_spec_types::load_commands(
        Path::new(PACKAGES)
            .join("server-commands/specs/server-commands.json")
            .as_path(),
    )?;
    let envs = sc_spec_types::load_envs(synthdef.join("envs.json").as_path())?;
    let ugen_count: usize = ugens.categories.iter().map(|c| c.ugens.len()).sum();
    println!(
        "validated: {} UGen categories / {} UGens, {} commands, {} env shapes",
        ugens.categories.len(),
        ugen_count,
        commands.commands.len(),
        envs.shapes.len()
    );
    Ok(())
}
