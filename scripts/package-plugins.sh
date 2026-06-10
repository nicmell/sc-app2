#!/usr/bin/env bash
# Zip every plugin under examples/<category>/ into <out>/<name>.zip (default
# out: tmp/). Each examples/<category>/<name>/ must contain metadata.json +
# the entry file at its root.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:-tmp}"
mkdir -p "$root/$out"

for dir in "$root"/examples/*/*/; do
  [ -f "$dir/metadata.json" ] || continue
  name="$(basename "$dir")"
  zip_path="$root/$out/$name.zip"
  rm -f "$zip_path"
  (cd "$dir" && zip -qr "$zip_path" . -x '.*')
  echo "packaged $name → $out/$name.zip"
done
