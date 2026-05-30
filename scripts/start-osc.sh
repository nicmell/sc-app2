#!/usr/bin/env bash
# Run scsynth + sclang+StrudelDirt together for the dev workflow.
#
# Spawns scsynth + sclang as background children; this script stays in the
# foreground as the dev console. Ctrl-C cleans up both via the EXIT trap.
# Pre-flight refuses to start if either UDP port is occupied (usually a
# leftover from a previous session).
#
# Wire: `yarn osc`. Pre-reqs: `yarn deps` (one-time, fetches Dirt-Samples +
# Vowel + sc3-plugins). To attach to an already-running scsynth instead, use
# `yarn strudeldirt`.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPS="$REPO_ROOT/deps"

die() { printf 'error: %s\n' "$*" >&2; exit 1; }

# ── Pre-flight ───────────────────────────────────────────────────────
command -v scsynth >/dev/null 2>&1 || die "scsynth not found in PATH"
command -v sclang  >/dev/null 2>&1 || die "sclang not found in PATH"
[ -d "$REPO_ROOT/strudeldirt/classes" ] \
  || die "strudeldirt/ submodule not initialised — run: git submodule update --init strudeldirt"
[ -d "$DEPS/Dirt-Samples" ] || die "Dirt-Samples missing — run: yarn deps"
[ -d "$DEPS/Vowel" ]        || die "Vowel quark missing — run: yarn deps"

# Refuse to start if either UDP port is already *bound* (a listener).
# A connected client (e.g. the sc-app2 bridge, whose socket is
# local->127.0.0.1:PORT) also shows up in `lsof -iUDP:PORT` but must NOT
# block us — so we ignore NAMEs containing "->" and only flag bound sockets.
check_port() {
  local port="$1"
  if command -v lsof >/dev/null 2>&1; then
    local occ; occ="$(lsof -nP -iUDP:"$port" 2>/dev/null | awk 'NR>1 && $9 !~ /->/ {print; exit}')"
    if [ -n "$occ" ]; then
      local pid; pid="$(printf '%s' "$occ" | awk '{print $2}')"
      local cmd; cmd="$(printf '%s' "$occ" | awk '{print $1}')"
      die "UDP port $port already bound by $cmd (pid $pid). Kill it first: kill $pid"
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
    if [ -d "$DEPS/sc3-plugins" ]; then
      SCSYNTH_PLUGIN_ARGS=(-U "$SC_STOCK_PLUGINS:$DEPS/sc3-plugins")
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
scsynth "${SCSYNTH_OPTS[@]}" "${SCSYNTH_PLUGIN_ARGS[@]}" &
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

# Wait for either child to exit; the trap cleans up the other.
wait -n "$scsynth_pid" "$sclang_pid"
exit $?
