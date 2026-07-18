use std::path::Path;

fn main() -> Result<(), String> {
    const ROOT: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/../../../assets/specs");
    let ugens = sc_spec_types::load_ugens(Path::new(ROOT).join("ugens.json").as_path())?;
    let commands = sc_spec_types::load_commands(Path::new(ROOT).join("server-commands.json").as_path())?;
    let envs = sc_spec_types::load_envs(Path::new(ROOT).join("envs.json").as_path())?;
    let ugen_count: usize = ugens.categories.iter().map(|c| c.ugens.len()).sum();
    println!(
        "validated: {} UGen categories / {} UGens, {} commands, {} env shapes",
        ugens.categories.len(), ugen_count, commands.commands.len(), envs.shapes.len()
    );
    Ok(())
}
