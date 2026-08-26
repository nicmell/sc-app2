#!/usr/bin/env bash
# Zip every plugin under examples/plugins/<category>/ into
# <out>/<category>/<name>.zip (default out: examples/dist, gitignored).
# Each source dir must contain metadata.json + the entry file at its root.
# Overwrites in place — re-run after every source change (`yarn examples:sync`
# packages AND imports into the dev app root).
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:-examples/dist}"

for dir in "$root"/examples/plugins/*/*/; do
  [ -f "$dir/metadata.json" ] || continue
  name="$(basename "$dir")"
  category="$(basename "$(dirname "$dir")")"
  mkdir -p "$root/$out/$category"
  zip_path="$root/$out/$category/$name.zip"
  rm -f "$zip_path"
  # Exclude dotfiles at EVERY level (.DS_Store in nested asset dirs too).
  (cd "$dir" && zip -qr "$zip_path" . -x '.*' '*/.*')
  echo "packaged $category/$name → $out/$category/$name.zip"
done
