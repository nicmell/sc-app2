#!/usr/bin/env bash
# Run sclang and mount StrudelDirt on top of an externally-running scsynth.
# Pinned to the quarks installed in the SuperCollider support folder.
#
# scsynth must already be running on UDP 57110 — we don't manage its
# lifecycle. `yarn osc` boots both; this script is the attach-only half.
#
# We pass `-l <generated-config>` to sclang so only these paths contribute
# to the compiled class library:
#   <SCClassLibrary>              SuperCollider standard library
#   downloaded-quarks/StrudelDirt StrudelDirt quark (exposes the SuperDirt class)
#   downloaded-quarks/Vowel       Vowel quark
#   Extensions/SC3plugins         sc3-plugins .sc class files (macOS)
#
# Wire: `yarn strudeldirt`. Pre-reqs: StrudelDirt + Vowel + Dirt-Samples quarks
# installed (Quarks.install) + scsynth on 57110.
set -euo pipefail

STARTUP="$(cd "$(dirname "$0")" && pwd)/sc-startup.scd"

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

case "$(uname -s)" in
  Darwin*)
    SCCLASSLIB="/Applications/SuperCollider.app/Contents/Resources/SCClassLibrary"
    SC_SUPPORT="$HOME/Library/Application Support/SuperCollider"
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
    ;;
  *)
    die "unsupported OS: $(uname -s)"
    ;;
esac

SCCLASSLIB="${SC_APP_CLASSLIB:-$SCCLASSLIB}"
SC_SUPPORT="${SC_APP_SUPPORT:-$SC_SUPPORT}"
QUARKS="$SC_SUPPORT/downloaded-quarks"
STRUDELDIRT="$QUARKS/StrudelDirt"
VOWEL="$QUARKS/Vowel"
DIRT_SAMPLES="$QUARKS/Dirt-Samples"
SC3PLUGINS="$SC_SUPPORT/Extensions/SC3plugins"

# ── Pre-flight checks ────────────────────────────────────────────────
[ -d "$SCCLASSLIB" ]    || die "SCClassLibrary not found at $SCCLASSLIB"
[ -d "$STRUDELDIRT" ]   || die "StrudelDirt quark missing at $STRUDELDIRT — run: Quarks.install(\"https://github.com/daslyfe/StrudelDirt.git\")"
[ -d "$VOWEL" ]         || die "Vowel quark missing at $VOWEL — run: Quarks.install(\"Vowel\")"
[ -d "$DIRT_SAMPLES" ]  || die "Dirt-Samples missing at $DIRT_SAMPLES — run: Quarks.install(\"Dirt-Samples\")"
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
  echo "excludePaths: []"
  echo "postInlineWarnings: false"
} > "$CONF"

# ── Banner + launch ──────────────────────────────────────────────────
echo "starting sclang (attaches to scsynth + mounts StrudelDirt)"
echo "  quarks -> $QUARKS"
echo "  attaching to scsynth at 127.0.0.1:57110 (must already be running)"
echo "  StrudelDirt -> 127.0.0.1:57120 (12 orbits)"
echo "  Ctrl-C to stop sclang+StrudelDirt (scsynth survives)."

# Sample path consumed by sc-startup.scd's `~dirt.loadSoundFiles`.
export SC_APP_DIRT_SAMPLES="$DIRT_SAMPLES/*"

exec "$SCLANG" -l "$CONF" "$STARTUP"
