#!/usr/bin/env sh
# Installs ONLY the Flow Studio panel into EffectCraft's Scripts folder (macOS / Linux).
# EffectCraft itself must already be installed; this script does not build, copy or modify the app.
set -eu
root="$(cd "$(dirname "$0")/.." && pwd)"
base="${EFFECTCRAFT_CONFIG_DIR:-}"
if [ -z "$base" ]; then
  case "$(uname -s)" in
    Darwin) base="$HOME/Library/Application Support/EffectCraft" ;;
    *) base="${XDG_CONFIG_HOME:-$HOME/.config}/effectcraft" ;;
  esac
fi
dest="$base/Scripts/ScriptUI Panels"
source="$root/extensions/scriptui-panels/Flow Studio.jsx"
if [ ! -f "$source" ]; then
  echo "Missing panel file: $source"
  exit 1
fi
mkdir -p "$dest"
if [ -f "$dest/Flow Studio.jsx" ]; then
  backup="$dest/Flow Studio.jsx.$(date +%Y%m%d-%H%M%S).bak"
  cp "$dest/Flow Studio.jsx" "$backup"
  echo "Backup of the previous panel: $backup"
fi
cp "$source" "$dest/"
echo "Installed: $dest/Flow Studio.jsx"
echo "Restart EffectCraft, then open Window > Flow Studio.jsx."
echo "Optional helper (silence, captions, sounds, models): run effectcraft-flow-helper serve."
