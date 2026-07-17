#!/usr/bin/env bash
# Regenerate packages/server-commands/pkg — the jco-transpiled wasm component
# of the scserver-commands crate (the package's encode/decode engine). The
# output is COMMITTED (like the generated XSD), so frontend work needs no
# wasm toolchain; rerun this whenever the crate or its WIT changes.
#
# Prereqs (one-time):
#   rustup target add wasm32-unknown-unknown
#   cargo install cargo-component
#
# wasm32-unknown-unknown (not wasip1) keeps the component pure compute:
# the wasip1 std runtime drags WASI env/fs/io imports in, which jco would
# satisfy with the preview2 shim — breaking the browser bundle and the
# no-fetch node test path. The guard below keeps that honest.
set -euo pipefail
cd "$(dirname "$0")/.."

cargo component build --release --features component --target wasm32-unknown-unknown \
  --manifest-path src-tauri/crates/scserver-commands/Cargo.toml

rm -rf packages/server-commands/pkg
yarn jco transpile src-tauri/target/wasm32-unknown-unknown/release/scserver_commands.wasm \
  -o packages/server-commands/pkg --name scserver

# The component must stay pure compute: a WASI import would drag the
# preview2 shim into the bundle (and break the no-fetch node test path).
if grep -q "preview2-shim" packages/server-commands/pkg/scserver.js; then
  echo "ERROR: transpiled component imports the WASI preview2 shim — fix the crate" >&2
  exit 1
fi
echo "OK: packages/server-commands/pkg regenerated"
