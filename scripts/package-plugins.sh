#!/usr/bin/env bash
# Zip every plugin under examples/plugins/<category>/ into <out>/<name>.zip
# (FLAT; default out: examples/dist, gitignored).
# Each source dir must contain metadata.json + the entry file at its root.
# Overwrites in place — re-run after every source change (`yarn examples:sync`
# packages AND imports into the dev app root).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:-examples/dist}"

mkdir -p "$root/$out"

for dir in "$root"/examples/plugins/*/*/; do
  [ -f "$dir/metadata.json" ] || continue
  name="$(basename "$dir")"
  zip_path="$root/$out/$name.zip"
  rm -f "$zip_path"
  # Exclude dotfiles at EVERY level (.DS_Store in nested asset dirs too).
  (cd "$dir" && zip -qr "$zip_path" . -x '.*' '*/.*')
  echo "packaged $name → $out/$name.zip"
done
