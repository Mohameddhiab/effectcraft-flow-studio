"""Build the embedded blocks of the Flow Studio panel.

Two sources are generated into ``extensions/scriptui-panels/Flow Studio.jsx`` so the installable
panel stays one file:

* the catalogue data, from ``catalog/*.json`` (``// <flow-catalog>``);
* the catalogue engine, from ``flow-install/src/catalog-core.jsx`` (``// <flow-engine>``);
* the catalogue screens, from ``flow-install/src/catalog-ui.jsx`` (``// <flow-catalog-ui>``).

The catalogue JSON is the source of truth and is validated field by field by ``catalog_schema``
before anything is written.  Nobody edits a generated block by hand.

Run:
    python scripts/build_catalog.py --check     # validate, and fail if an embed is stale
    python scripts/build_catalog.py --print     # print the data block to stdout
    python scripts/build_catalog.py --inject    # rewrite every block in the panel
"""

import argparse
import json
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))

import catalog_schema  # noqa: E402

CATALOG = ROOT / "catalog"
PANEL = ROOT / "extensions" / "scriptui-panels" / "Flow Studio.jsx"
CORE = ROOT / "flow-install" / "src" / "catalog-core.jsx"
UI = ROOT / "flow-install" / "src" / "catalog-ui.jsx"

CATALOG_BEGIN = "// <flow-catalog>"
CATALOG_END = "// </flow-catalog>"
ENGINE_BEGIN = "// <flow-engine>"
ENGINE_END = "// </flow-engine>"
UI_BEGIN = "// <flow-catalog-ui>"
UI_END = "// </flow-catalog-ui>"

ANCHOR_DATA = "  var DEFAULT_PORT = 9890;"
ANCHOR_UI = '  libSearch.minimumSize = [90, -1];'

KINDS = (
    ("titles", "titles.json"),
    ("widgets", "widgets.json"),
    ("textAnims", "text-animations.json"),
    ("transitions", "transitions.json"),
    ("effects", "effects.json"),
    ("gradients", "gradients.json"),
    ("palettes", "palettes.json"),
    ("captions", "captions.json"),
    ("sfx", "sfx.json"),
    ("tools", "tools.json"),
)


def read_items(name):
    doc = json.loads((CATALOG / name).read_text(encoding="utf-8"))
    return doc["items"]


def compact(value):
    return json.dumps(value, ensure_ascii=True, separators=(",", ":"), sort_keys=False)


def read_source(path):
    text = path.read_text(encoding="utf-8")
    return text.replace("\r\n", "\n").replace("\r", "\n").strip("\n")


def build_data_block():
    parts = []
    counts = {}
    for key, name in KINDS:
        items = read_items(name)
        counts[key] = len(items)
        parts.append(f"  FLOW_CATALOG.{key} = {compact(items)};")
    native = read_items("native-effect-ids.json")
    native_ids = [e["id"] for e in native if isinstance(e, dict) and isinstance(e.get("id"), str)]
    native_ids.sort()
    total = sum(counts.values())
    header = [
        "",
        "  // " + CATALOG_BEGIN,
        "  // Generated from catalog/*.json by scripts/build_catalog.py. Do not edit by hand.",
        "  // Every preset is data: field-by-field validated before it is embedded, never evaluated.",
        f'  var FLOW_CATALOG = {{ "schema": 1, "total": {total}, "counts": {compact(counts)} }};',
    ]
    footer = [
        f"  var FLOW_NATIVE_IDS = {compact(native_ids)};",
        "  // " + CATALOG_END,
        "",
    ]
    block = "\n".join(header + parts + footer)
    if not block.isascii():
        raise SystemExit("the catalogue block is not ASCII")
    return block, total, counts


def build_source_block(path, begin, end, note):
    body = read_source(path)
    if not body.isascii():
        raise SystemExit(f"{path.name} is not ASCII; escape the non-ASCII characters")
    return "\n".join(
        [
            "",
            "  // " + begin,
            f"  // Generated from {note} by scripts/build_catalog.py. Do not edit by hand.",
            body,
            "  // " + end,
            "",
        ]
    )


def find_block(text, begin, end):
    start = text.find(begin)
    if start < 0:
        return None
    stop = text.find(end, start)
    if stop < 0:
        return None
    stop += len(end)
    line_start = text.rfind("\n", 0, start) + 1
    line_end = text.find("\n", stop)
    if line_end < 0:
        line_end = len(text)
    else:
        line_end += 1
    return line_start, line_end


def inject_after(text, anchor, block):
    at = text.find(anchor)
    if at < 0:
        raise SystemExit(f"anchor not found in the panel: {anchor!r}")
    insert_at = text.find("\n", at)
    if insert_at < 0:
        raise SystemExit("the anchor is the last line of the panel")
    return text[: insert_at + 1] + block + text[insert_at + 1 :]


def inject_block(text, block, begin, end, anchor):
    span = find_block(text, begin, end)
    if span is not None:
        return text[: span[0]] + block + text[span[1] :]
    return inject_after(text, anchor, block)


def block_state(text, block, begin, end):
    span = find_block(text, begin, end)
    if span is None:
        return "absent"
    return "current" if text[span[0] : span[1]].strip() == block.strip() else "STALE"


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--check", action="store_true", help="validate, and fail if an embed is stale")
    group.add_argument("--print", dest="show", action="store_true", help="print the data block")
    group.add_argument("--inject", action="store_true", help="write every block into the panel")
    args = parser.parse_args()

    errors, counts = catalog_schema.validate()
    if errors:
        print(f"{len(errors)} catalogue error(s):", file=sys.stderr)
        for error in errors:
            print("  " + error, file=sys.stderr)
        return 1

    data_block, total, counts = build_data_block()
    engine_block = build_source_block(CORE, ENGINE_BEGIN, ENGINE_END, "flow-install/src/catalog-core.jsx")
    ui_block = build_source_block(UI, UI_BEGIN, UI_END, "flow-install/src/catalog-ui.jsx")
    print(f"catalogue valid: {total} presets ({len(data_block)} bytes embedded)")

    if args.show:
        print(data_block)
        return 0

    try:
        panel = PANEL.read_text(encoding="utf-8")
    except OSError as exc:
        print(f"cannot read the panel: {exc}", file=sys.stderr)
        return 1

    blocks = (
        ("catalogue", data_block, CATALOG_BEGIN, CATALOG_END, ANCHOR_DATA),
        ("engine", engine_block, ENGINE_BEGIN, ENGINE_END, ANCHOR_DATA),
        ("catalogue UI", ui_block, UI_BEGIN, UI_END, ANCHOR_UI),
    )

    if args.check:
        stale = False
        for label, block, begin, end, _ in blocks:
            state = block_state(panel, block, begin, end)
            print(f"panel {label}: {state}")
            if state == "STALE":
                stale = True
        return 1 if stale else 0

    updated = panel
    # Data first, then the engine, then the screens: each injected block is independent, and the
    # UI block reads the engine's functions at call time.
    for label, block, begin, end, anchor in blocks:
        updated = inject_block(updated, block, begin, end, anchor)
    if updated == panel:
        print("panel embeds: already current")
    else:
        PANEL.write_text(updated, encoding="utf-8", newline="\n")
        print(f"panel embeds: written ({len(updated)} bytes)")
    summary = {"schema": 1, "total": total, "counts": counts}
    (CATALOG / "index.json").write_text(json.dumps(summary, indent=1, ensure_ascii=True) + "\n", encoding="utf-8")
    print("catalogue index: written")
    return 0


if __name__ == "__main__":
    sys.exit(main())
