#!/usr/bin/env bash
# Populate deps/ — THE runtime source tree for the audio stack
# (start-osc.sh / start-strudeldirt.sh read nothing else; the
# SuperCollider support folder is not a dependency).
#
#   deps/
#     StrudelDirt/    ← pinned git submodule (the SuperDirt fork sclang mounts)
#     Vowel/          ← pinned git submodule (quark used by the Dirt vowel module)
#     Dirt-Samples/   ← pinned git submodule (audio sample library, ~400 MB)
#     sc3-plugins/    ← prebuilt binary release (UGen plugins for global
#                       effects; macOS: pinned zip; Linux: via apt) — the
#                       one non-submodule, and the one .gitignore entry
#
# The source deps are git submodules so the pin IS the gitlink — visible
# in diffs, updated by commit, no bespoke bookkeeping. They stay
# uninitialized on a plain clone (only the audio stack needs them);
# `shallow = true` keeps their history out.
#
# Idempotent — re-running aligns submodules to the pins and skips
# anything already present.
#
# Wire: `yarn deps`
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DEPS="$REPO_ROOT/deps"
mkdir -p "$DEPS"

# Pinned sc3-plugins release. SC's plugin ABI is stable across minor
# versions, so 3.13.0 plugins load fine in SC 3.14.x.
SC3_PLUGINS_TAG="Version-3.13.0"
SC3_PLUGINS_VERSION="3.13.0"

ok()   { printf '  \033[32m✓\033[0m %s\n' "$*"; }
skip() { printf '  \033[33m·\033[0m %s\n' "$*"; }
warn() { printf '  \033[33m!\033[0m %s\n' "$*" >&2; }
die()  { printf '  \033[31m✗\033[0m %s\n' "$*" >&2; exit 1; }

echo "populating $DEPS"
echo

# ── 1. Source deps: the pinned submodules ────────────────────────────
echo "[1/2] source deps (git submodules: StrudelDirt, Vowel, Dirt-Samples)"
SUBMODULES=(deps/StrudelDirt deps/Vowel deps/Dirt-Samples)
# A pinned SHA can sit behind a moved upstream tip, where a shallow
# fetch may miss it — retry without --depth; the committed gitlink is
# the truth either way.
if git -C "$REPO_ROOT" submodule update --init --depth 1 -- "${SUBMODULES[@]}" 2>/dev/null; then
  ok "submodules at their pins (shallow)"
else
  warn "shallow init missed a pin — retrying with full history"
  git -C "$REPO_ROOT" submodule update --init -- "${SUBMODULES[@]}"
  ok "submodules at their pins"
fi
echo

# ── 2. sc3-plugins (macOS pre-built; Linux via apt) ──────────────────
echo "[2/2] sc3-plugins (needed for global effects)"
case "$(uname -s)" in
  Darwin*)
    if [ -d "$DEPS/sc3-plugins" ]; then
      skip "already present at $DEPS/sc3-plugins"
    else
      tmp="$(mktemp -d)"
      trap 'rm -rf "$tmp"' EXIT

      url="https://github.com/supercollider/sc3-plugins/releases/download/${SC3_PLUGINS_TAG}/sc3-plugins-${SC3_PLUGINS_VERSION}-macOS.zip"
      echo "  downloading pinned release $SC3_PLUGINS_TAG"
      echo "  $url"
      curl -fsSL "$url" -o "$tmp/sc3-plugins.zip" \
        || die "download failed — check sc3-plugins releases page for current asset URL"
      unzip -q "$tmp/sc3-plugins.zip" -d "$tmp/extracted"
      inner="$(find "$tmp/extracted" -maxdepth 1 -mindepth 1 -type d | head -1)"
      [ -n "$inner" ] || die "extracted sc3-plugins zip but found no inner directory"
      mv "$inner" "$DEPS/sc3-plugins"
      # Strip macOS AppleDouble metadata (._*.scx) — scsynth's -U scan
      # logs 'slice is not valid mach-o file' for each otherwise.
      find "$DEPS/sc3-plugins" -name '._*' -delete 2>/dev/null || true
      ok "installed at $DEPS/sc3-plugins ($SC3_PLUGINS_TAG)"

      rm -rf "$tmp"
      trap - EXIT
    fi
    ;;
  Linux*)
    if dpkg -s supercollider-sc3-plugins >/dev/null 2>&1; then
      ok "supercollider-sc3-plugins already installed via apt"
    else
      warn "supercollider-sc3-plugins not installed"
      warn "  install with: sudo apt install supercollider-sc3-plugins"
      warn "  (without it, global effects like delay/reverb won't work)"
    fi
    ;;
  *)
    skip "unsupported OS: skipping sc3-plugins"
    ;;
esac
echo

echo "done. Dependency tree:"
ls -1 "$DEPS"
echo
echo "next: yarn osc   # boot scsynth + StrudelDirt together"
