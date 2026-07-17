#!/usr/bin/env bash
# Run scsynth + sclang+StrudelDirt together for the dev workflow.
#
# Spawns scsynth + sclang as background children; this script stays in the
# foreground as the dev console. Ctrl-C cleans up both via the EXIT trap.
# Pre-flight refuses to start if either UDP port is occupied (usually a
# leftover from a previous session).
#
# Wire: `yarn osc`. Pre-reqs: StrudelDirt + Vowel + Dirt-Samples quarks
# installed in the SuperCollider support folder (Quarks.install). To attach
# to an already-running scsynth instead, use `yarn strudeldirt`.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

# Auto-connect scsynth's JACK ports to the system in/out ports.
export SC_JACK_DEFAULT_INPUTS="system"
export SC_JACK_DEFAULT_OUTPUTS="system"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

# ── Resolve scsynth + sclang (PATH first, then the macOS app bundle) ──
# ~/.bin wrappers are only on PATH via interactive .zshrc, so a `yarn osc`
# launched outside an interactive zsh can't see them — fall back to the
# SuperCollider.app bundle. Override with SC_APP_SCSYNTH / SC_APP_SCLANG.
resolve_bin() {  # $1 = command, $2 = app-bundle fallback → prints abs path
  local found
  found="$(command -v "$1" 2>/dev/null)" && { printf '%s' "$found"; return 0; }
  [ -x "$2" ] && { printf '%s' "$2"; return 0; }
  return 1
}
SCSYNTH="${SC_APP_SCSYNTH:-$(resolve_bin scsynth /Applications/SuperCollider.app/Contents/Resources/scsynth || true)}"
SCLANG="${SC_APP_SCLANG:-$(resolve_bin sclang /Applications/SuperCollider.app/Contents/MacOS/sclang || true)}"
[ -n "$SCSYNTH" ] || die "scsynth not found in PATH or the SuperCollider app bundle — set SC_APP_SCSYNTH"
[ -n "$SCLANG" ]  || die "sclang not found in PATH or the SuperCollider app bundle — set SC_APP_SCLANG"
# Pass the resolved sclang down to start-strudeldirt.sh so both agree.
export SC_APP_SCLANG="$SCLANG"

# ── Pre-flight ───────────────────────────────────────────────────────
case "$(uname -s)" in
  Darwin*) SC_SUPPORT="$HOME/Library/Application Support/SuperCollider" ;;
  Linux*)  SC_SUPPORT="$HOME/.local/share/SuperCollider" ;;
  *)       SC_SUPPORT="" ;;
esac
SC_SUPPORT="${SC_APP_SUPPORT:-$SC_SUPPORT}"
QUARKS="$SC_SUPPORT/downloaded-quarks"
[ -d "$QUARKS/StrudelDirt" ]  || die "StrudelDirt quark missing at $QUARKS/StrudelDirt — run: Quarks.install(\"https://github.com/daslyfe/StrudelDirt.git\")"
[ -d "$QUARKS/Dirt-Samples" ] || die "Dirt-Samples missing at $QUARKS/Dirt-Samples — run: Quarks.install(\"Dirt-Samples\")"
[ -d "$QUARKS/Vowel" ]        || die "Vowel quark missing at $QUARKS/Vowel — run: Quarks.install(\"Vowel\")"

# Refuse to start if either UDP port is already *bound* (a listener).
# A connected client (e.g. the sc-app2 bridge, whose socket is
# local->127.0.0.1:PORT) also shows up in `lsof -iUDP:PORT` but must NOT
# block us — so we ignore NAMEs containing "->" and only flag bound sockets.
check_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    # `|| true`: when the port is free, lsof exits non-zero, which under
    # `set -euo pipefail` would otherwise abort the whole script here.
    local occ; occ="$(lsof -nP -iUDP:"$port" 2>/dev/null | awk 'NR>1 && $9 !~ /->/ {print; exit}')" || true
    if [ -n "$occ" ]; then
      local pid; pid="$(printf '%s' "$occ" | awk '{print $2}')"
      local cmd; cmd="$(printf '%s' "$occ" | awk '{print $1}')"
      die "UDP port $port already bound by $cmd (pid $pid). Kill it first: kill -9 $pid"
    fi
  fi
}
check_port 57110
check_port 57120

# ── scsynth options (SuperDirt-tuned; must match sc-startup.scd) ─────
SCSYNTH_OPTS=(-u 57110 -b 262144 -m 262144 -w 2048 -n 32768 -l 8 -i 2 -o 2)
case "$(uname -s)" in
  Darwin*)
    SC_STOCK_PLUGINS="${SC_APP_STOCK_PLUGINS:-/Applications/SuperCollider.app/Contents/Resources/plugins}"
    [ -d "$SC_STOCK_PLUGINS" ] || die "stock plugins dir not found at $SC_STOCK_PLUGINS"
    SC3PLUGINS="$SC_SUPPORT/Extensions/SC3plugins"
    if [ -d "$SC3PLUGINS" ]; then
      SCSYNTH_PLUGIN_ARGS=(-U "$SC_STOCK_PLUGINS:$SC3PLUGINS")
    else
      SCSYNTH_PLUGIN_ARGS=()
    fi
    ;;
  Linux*)
    SCSYNTH_PLUGIN_ARGS=()
    ;;
  *)
    die "unsupported OS: $(uname -s)"
    ;;
esac

cleanup() {
  trap - EXIT INT TERM
  echo
  echo "[osc] shutting down…"
  if [ -n "${scsynth_pid:-}" ] && kill -0 "$scsynth_pid" 2>/dev/null; then
    kill "$scsynth_pid" 2>/dev/null || true
  fi
  if [ -n "${sclang_pid:-}" ] && kill -0 "$sclang_pid" 2>/dev/null; then
    kill "$sclang_pid" 2>/dev/null || true
  fi
  wait 2>/dev/null || true
}
trap cleanup EXIT INT TERM

echo "[osc] starting scsynth on UDP 57110…"
"$SCSYNTH" "${SCSYNTH_OPTS[@]}" "${SCSYNTH_PLUGIN_ARGS[@]}" &
scsynth_pid=$!

# Give scsynth a moment to bind before sclang attaches (sc-startup.scd has
# its own retry too, but this keeps the post window readable).
sleep 1

echo "[osc] starting sclang+StrudelDirt (attaches to scsynth)…"
"$REPO_ROOT/scripts/start-strudeldirt.sh" &
sclang_pid=$!

echo "[osc] both running. Ctrl-C to stop."
echo "  scsynth pid=$scsynth_pid (UDP 57110)"
echo "  sclang  pid=$sclang_pid  (UDP 57120, StrudelDirt)"

# Wait for either child to exit; the trap cleans up the other. Polled with
# kill -0 rather than `wait -n` — macOS ships bash 3.2, which lacks it.
# Ctrl-C interrupts the sleep and fires the trap.
while kill -0 "$scsynth_pid" 2>/dev/null && kill -0 "$sclang_pid" 2>/dev/null; do
  sleep 1
done
