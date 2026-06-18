fn main() {
    // Only the `gui` feature embeds the frontend + generates the Tauri context;
    // a headless build skips this so it doesn't require a built `dist/`.
    if std::env::var_os("CARGO_FEATURE_GUI").is_some() {
        tauri_build::build();
    }
}
