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

# Sound-effect pack: copied to <settings>/FlowStudio/assets/sfx-pack so the helper
# (sfx.pack.list) can find it at runtime.
sfx_source="$root/assets/sfx-pack"
sfx_dest="$base/FlowStudio/assets/sfx-pack"
if [ -d "$sfx_source" ]; then
  if [ -e "$sfx_dest" ]; then
    stamp="$(date +%Y%m%d-%H%M%S)"
    mv "$sfx_dest" "$sfx_dest.$stamp.bak"
    echo "Backup of the previous pack: $sfx_dest.$stamp.bak"
  fi
  mkdir -p "$(dirname "$sfx_dest")"
  cp -r "$sfx_source/." "$sfx_dest/"
  echo "Installed sound pack: $sfx_dest"
else
  echo "No assets/sfx-pack found alongside the panel; sounds will fall back to built-in."
fi
# Catalogue thumbnails: copied to <settings>/FlowStudio/assets/thumbs so the Library shows a
# picture for every preset. Without them the panel keeps its drawn miniatures.
thumb_source="$root/assets/thumbs"
thumb_dest="$base/FlowStudio/assets/thumbs"
if [ -d "$thumb_source" ]; then
  mkdir -p "$(dirname "$thumb_dest")"
  rm -rf "$thumb_dest"
  cp -r "$thumb_source" "$thumb_dest"
  echo "Installed catalogue thumbnails: $thumb_dest"
else
  echo "No assets/thumbs found alongside the panel; cards fall back to drawn miniatures."
fi
echo "Restart EffectCraft, then open Window > Flow Studio.jsx."
echo "Optional helper (silence, captions, sounds, models): run effectcraft-flow-helper serve."
