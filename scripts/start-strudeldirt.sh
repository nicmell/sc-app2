#!/usr/bin/env bash
# Run sclang and mount StrudelDirt on top of an externally-running scsynth.
# Pinned to the vendored strudeldirt/ submodule and deps/ tree.
#
# scsynth must already be running on UDP 57110 — we don't manage its
# lifecycle. `yarn osc` boots both; this script is the attach-only half.
#
# We pass `-l <generated-config>` to sclang so only these paths contribute
# to the compiled class library (the user's system quark folder is invisible
# — no class-name conflicts):
#   <SCClassLibrary>     SuperCollider standard library
#   strudeldirt/         vendored StrudelDirt (submodule)
#   deps/Vowel           Vowel quark
#   deps/sc3-plugins     sc3-plugins .sc class files (macOS)
#
# Wire: `yarn strudeldirt`. Pre-reqs: `yarn deps` (one-time) + scsynth on 57110.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
STRUDELDIRT="$REPO_ROOT/strudeldirt"
DEPS="$REPO_ROOT/deps"
STARTUP="$REPO_ROOT/scripts/sc-startup.scd"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

# ── Locate sclang + per-OS class library ─────────────────────────────
if ! command -v sclang >/dev/null 2>&1; then
  cat >&2 <<EOF
error: sclang not found in PATH

Install SuperCollider (https://supercollider.github.io/) and ensure
sclang is on PATH. On macOS the binary lives at:
  /Applications/SuperCollider.app/Contents/MacOS/sclang
EOF
  exit 1
fi

case "$(uname -s)" in
  Darwin*)
    SCCLASSLIB="/Applications/SuperCollider.app/Contents/Resources/SCClassLibrary"
    ;;
  Linux*)
    if [ -d "/usr/share/SuperCollider/SCClassLibrary" ]; then
      SCCLASSLIB="/usr/share/SuperCollider/SCClassLibrary"
    elif [ -d "/usr/local/share/SuperCollider/SCClassLibrary" ]; then
      SCCLASSLIB="/usr/local/share/SuperCollider/SCClassLibrary"
    else
      die "SCClassLibrary not found — set SC_APP_CLASSLIB to override"
    fi
    ;;
  *)
    die "unsupported OS: $(uname -s)"
    ;;
esac

SCCLASSLIB="${SC_APP_CLASSLIB:-$SCCLASSLIB}"

# ── Pre-flight checks ────────────────────────────────────────────────
[ -d "$SCCLASSLIB" ] || die "SCClassLibrary not found at $SCCLASSLIB"
[ -d "$STRUDELDIRT/classes" ] || die "$STRUDELDIRT not initialised — run: git submodule update --init strudeldirt"
[ -d "$DEPS/Dirt-Samples" ] || die "Dirt-Samples missing — run: yarn deps"
[ -d "$DEPS/Vowel" ] || die "Vowel quark missing — run: yarn deps"
[ -f "$STARTUP" ] || die "startup file not found at $STARTUP"

# ── Generate sclang config (pinned includePaths) ─────────────────────
CONF="$(mktemp -t sc-app2-sclang-conf.XXXXXX)"
trap 'rm -f "$CONF"' EXIT

{
  echo "includePaths:"
  echo "- $SCCLASSLIB"
  echo "- $STRUDELDIRT"
  echo "- $DEPS/Vowel"
  if [ -d "$DEPS/sc3-plugins" ]; then
    echo "- $DEPS/sc3-plugins"
  fi
  echo "excludePaths: []"
  echo "postInlineWarnings: false"
} > "$CONF"

# ── Banner + launch ──────────────────────────────────────────────────
echo "starting sclang (attaches to scsynth + mounts StrudelDirt)"
echo "  strudeldirt -> $STRUDELDIRT"
echo "  deps -> $DEPS"
echo "  attaching to scsynth at 127.0.0.1:57110 (must already be running)"
echo "  StrudelDirt -> 127.0.0.1:57120 (12 orbits)"
echo "  Ctrl-C to stop sclang+StrudelDirt (scsynth survives)."

# Sample path consumed by sc-startup.scd's `~dirt.loadSoundFiles`.
export SC_APP_DIRT_SAMPLES="$DEPS/Dirt-Samples/*"

exec sclang -l "$CONF" "$STARTUP"
