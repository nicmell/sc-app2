#!/usr/bin/env bash
# Regenerate packages/server-commands/pkg — the wasm-bindgen build of the
# scserver-commands crate (the package's encode/decode engine, with
# tsify-generated TypeScript types whose discriminant IS the OSC address).
# The output is COMMITTED (like the generated XSD), so frontend work needs
# no wasm toolchain; rerun this whenever the crate changes.
#
# Prereqs (one-time):
#   rustup target add wasm32-unknown-unknown
#   cargo install wasm-pack
set -euo pipefail
cd "$(dirname "$0")/.."

rm -rf packages/server-commands/pkg
wasm-pack build src-tauri/crates/scserver-commands \
  --release --target web \
  --out-dir "$(pwd)/packages/server-commands/pkg" --out-name scserver_commands -- --features wasm

# wasm-pack writes an npm manifest + .gitignore into the out dir; this pkg is
# an internal committed artifact consumed by path, not published.
rm -f packages/server-commands/pkg/.gitignore packages/server-commands/pkg/package.json

# The generated surface the package wraps — regenerating with a crate that
# lost one of these is a build break waiting to happen; fail here instead.
for sym in "export function encode" "export function decode_reply" "export type ServerReply"; do
  grep -q "$sym" packages/server-commands/pkg/scserver_commands.d.ts || {
    echo "ERROR: '$sym' missing from the generated .d.ts" >&2
    exit 1
  }
done
echo "OK: packages/server-commands/pkg regenerated"
