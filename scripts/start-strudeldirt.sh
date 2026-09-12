#!/usr/bin/env bash
# Run sclang and mount StrudelDirt on top of an externally-running scsynth.
# Everything comes from the repo's deps/ tree (pinned submodules +
# the sc3-plugins release) — the SuperCollider support folder is NOT a
# dependency.
#
# scsynth must already be running on UDP 57110 — we don't manage its
# lifecycle. `yarn osc` boots both; this script is the attach-only half.
#
# We pass `-l <generated-config>` to sclang so only these paths contribute
# to the compiled class library:
#   <SCClassLibrary>       SuperCollider standard library
#   deps/StrudelDirt       StrudelDirt (exposes the SuperDirt class)
#   deps/Vowel             Vowel quark
#   deps/sc3-plugins       sc3-plugins .sc class files (macOS)
#   scripts/sc-classes     the REPO-OWNED classlib (ScApp*, PURE-BRIDGE.md §3.1)
#
# Wire: `yarn strudeldirt`. Pre-reqs: `yarn deps` + scsynth on 57110.
set -euo pipefail

SCRIPTS="$(cd "$(dirname "$0")" && pwd)"
REPO_ROOT="$(cd "$SCRIPTS/.." && pwd)"
STARTUP="$SCRIPTS/sc-startup.scd"

# Auto-connect scsynth's JACK ports to the system in/out ports.
export SC_JACK_DEFAULT_INPUTS="system"
export SC_JACK_DEFAULT_OUTPUTS="system"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

# ── Locate sclang (PATH first, then the macOS app bundle) ────────────
# ~/.bin wrappers are only on PATH via interactive .zshrc; fall back to the
# app bundle so a `yarn osc` outside interactive zsh still resolves it.
# Override with SC_APP_SCLANG. start-osc.sh exports the path it resolved.
SCLANG="${SC_APP_SCLANG:-}"
if [ -z "$SCLANG" ]; then
  SCLANG="$(command -v sclang 2>/dev/null || true)"
fi
if [ -z "$SCLANG" ] && [ -x "/Applications/SuperCollider.app/Contents/MacOS/sclang" ]; then
  SCLANG="/Applications/SuperCollider.app/Contents/MacOS/sclang"
fi
if [ -z "$SCLANG" ]; then
  cat >&2 <<EOF
error: sclang not found in PATH or the SuperCollider app bundle

Install SuperCollider (https://supercollider.github.io/) and ensure
sclang is on PATH, or set SC_APP_SCLANG. On macOS the binary lives at:
  /Applications/SuperCollider.app/Contents/MacOS/sclang
EOF
  exit 1
fi

# SC_SUPPORT is resolved ONLY to keep it OUT: sclang compiles the
# support folder's Extensions/ dirs IMPLICITLY (includePaths cannot opt
# out of them) — excludePaths below is what actually isolates this
# sclang from whatever the user has installed there.
case "$(uname -s)" in
  Darwin*)
    SCCLASSLIB="/Applications/SuperCollider.app/Contents/Resources/SCClassLibrary"
    SC_SUPPORT="$HOME/Library/Application Support/SuperCollider"
    SYS_SUPPORT="/Library/Application Support/SuperCollider"
    ;;
  Linux*)
    if [ -d "/usr/share/SuperCollider/SCClassLibrary" ]; then
      SCCLASSLIB="/usr/share/SuperCollider/SCClassLibrary"
    elif [ -d "/usr/local/share/SuperCollider/SCClassLibrary" ]; then
      SCCLASSLIB="/usr/local/share/SuperCollider/SCClassLibrary"
    else
      die "SCClassLibrary not found — set SC_APP_CLASSLIB to override"
    fi
    SC_SUPPORT="$HOME/.local/share/SuperCollider"
    SYS_SUPPORT="/usr/share/SuperCollider"
    ;;
  *)
    die "unsupported OS: $(uname -s)"
    ;;
esac
SC_SUPPORT="${SC_APP_SUPPORT:-$SC_SUPPORT}"

SCCLASSLIB="${SC_APP_CLASSLIB:-$SCCLASSLIB}"
DEPS="$REPO_ROOT/deps"
STRUDELDIRT="$DEPS/StrudelDirt"
VOWEL="$DEPS/Vowel"
DIRT_SAMPLES="$DEPS/Dirt-Samples"
SC3PLUGINS="$DEPS/sc3-plugins"
SC_CLASSES="$SCRIPTS/sc-classes"

# ── Pre-flight checks ────────────────────────────────────────────────
# An uninitialized submodule is an EMPTY directory — test for content.
need_dep() { [ -n "$(ls -A "$DEPS/$1" 2>/dev/null)" ] || die "$1 missing at $DEPS/$1 — run: yarn deps"; }
[ -d "$SCCLASSLIB" ]    || die "SCClassLibrary not found at $SCCLASSLIB"
need_dep StrudelDirt
need_dep Vowel
need_dep Dirt-Samples
[ -d "$SC_CLASSES" ]    || die "repo classlib missing at $SC_CLASSES"
[ -f "$STARTUP" ]       || die "startup file not found at $STARTUP"

# ── Generate sclang config (pinned includePaths) ─────────────────────
CONF="$(mktemp -t sc-app2-sclang-conf.XXXXXX)"
trap 'rm -f "$CONF"' EXIT

{
  echo "includePaths:"
  echo "- $SCCLASSLIB"
  echo "- $STRUDELDIRT"
  echo "- $VOWEL"
  if [ -d "$SC3PLUGINS" ]; then
    echo "- $SC3PLUGINS"
  fi
  echo "- $SC_CLASSES"
  echo "excludePaths:"
  echo "- $SC_SUPPORT/Extensions"
  echo "- $SYS_SUPPORT/Extensions"
  echo "postInlineWarnings: false"
} > "$CONF"

# ── Banner + launch ──────────────────────────────────────────────────
echo "starting sclang (attaches to scsynth + mounts StrudelDirt)"
echo "  deps -> $DEPS"
echo "  attaching to scsynth at 127.0.0.1:57110 (must already be running)"
echo "  StrudelDirt -> 127.0.0.1:57120 (12 orbits)"
echo "  Ctrl-C to stop sclang+StrudelDirt (scsynth survives)."

# Sample path consumed by sc-startup.scd's `~dirt.loadSoundFiles`.
export SC_APP_DIRT_SAMPLES="$DIRT_SAMPLES/*"

exec "$SCLANG" -l "$CONF" "$STARTUP"
