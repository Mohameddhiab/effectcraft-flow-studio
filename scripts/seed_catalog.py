"""Seed catalog/*.json from catalog_data.py, once.

Run:  python scripts/seed_catalog.py
Then: python scripts/build_catalog.py --check
"""

import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import catalog_data as D  # noqa: E402

CATALOG = ROOT / "catalog"


def write(name, kind, items):
    doc = {
        "schema": 1,
        "kind": kind,
        "count": len(items),
        "items": items,
    }
    path = CATALOG / name
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(doc, indent=1, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"{name}: {len(items)}")
    return len(items)


def write_native():
    raw_path = ROOT / "target" / "native-effects-raw.json"
    if not raw_path.exists():
        print("native-effects-raw.json missing: run the CLI effect.list first", file=sys.stderr)
        return
    raw = json.loads(raw_path.read_text(encoding="utf-16"))
    items = [{"id": e.get("id"), "name": e.get("name"), "category": e.get("category")} for e in raw]
    items.sort(key=lambda e: e["id"])
    doc = {"schema": 1, "generatedFrom": "effectcraft-cli effect.list --empty --json", "count": len(items), "items": items}
    (CATALOG / "native-effect-ids.json").write_text(json.dumps(doc, indent=1, ensure_ascii=True) + "\n", encoding="utf-8")
    print(f"native-effect-ids.json: {len(items)}")


def main():
    CATALOG.mkdir(parents=True, exist_ok=True)
    counts = {}
    counts["titles.json"] = write("titles.json", "title", D.titles())
    counts["text-animations.json"] = write("text-animations.json", "text", D.text_animations())
    counts["transitions.json"] = write("transitions.json", "transition", D.transitions())
    counts["effects.json"] = write("effects.json", "effect", D.effects())
    counts["gradients.json"] = write("gradients.json", "gradient", D.gradients() + D.generators())
    counts["palettes.json"] = write("palettes.json", "palette", D.palettes())
    counts["captions.json"] = write("captions.json", "caption", D.captions())
    counts["sfx.json"] = write("sfx.json", "sfx", D.sounds())
    counts["tools.json"] = write("tools.json", "tool", D.tools())
    write_native()
    total = sum(counts.values())
    print(f"TOTAL {total}")
    summary = {"schema": 1, "total": total, "counts": {k.replace(".json", ""): v for k, v in counts.items()}}
    (CATALOG / "index.json").write_text(json.dumps(summary, indent=1, ensure_ascii=True) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
