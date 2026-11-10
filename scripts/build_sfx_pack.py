"""Build and check the Flow Studio original sound-effects pack.

The pack is data, not code: 84 WAV files synthesised by ``assets/sfx-pack/generate_sfx.py`` from
oscillators and seeded noise.  This script is the only writer of the catalogue, the per-file
attribution sidecars and the pack block of ``ATTRIBUTION.md``, so they cannot drift from the WAVs.

Run from the repository root:

    python scripts/build_sfx_pack.py --write
    python scripts/build_sfx_pack.py --check

``--write`` also regenerates ``catalog/sfx.json`` from the pack unless ``--no-catalog`` is given.
Every input is treated as hostile: the WAV headers are parsed by the standard library, sizes are
bounded, ids and paths are validated, and a malformed file is reported instead of crashing.
"""

from __future__ import annotations

import argparse
import hashlib
import json
import re
import struct
import sys
import wave
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PACK = ROOT / "assets" / "sfx-pack"
CATALOG = ROOT / "catalog" / "sfx.json"
ATTRIBUTION = ROOT / "ATTRIBUTION.md"

ID_RE = re.compile(r"^[a-z0-9][a-z0-9-]{0,39}$")
PEAK_BINS = 64
MAX_FILES = 500
MAX_SECONDS = 120.0
CATEGORY_ORDER = [
    "Whoosh & Transition",
    "Impact & Hit",
    "Riser & Build",
    "Drop & Bass",
    "UI & Click",
    "Notification & Chime",
    "Magic & Sparkle",
    "Glitch & Digital",
    "Camera & Foley",
    "Ambience",
    "Cartoon & Pop",
    "Sci-Fi & Laser",
]
TODAY = "2026-11-09"
MARK_START = "<!-- sfx-pack:start -->"
MARK_END = "<!-- sfx-pack:end -->"


class PackError(Exception):
    """A problem the user can act on."""


def slug(text: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", text.lower()).strip("-")
    return value or "sound"


def read_wav(path: Path) -> dict:
    """Return the measured metadata and 64 absolute-peak bins for one PCM WAV."""
    try:
        with wave.open(str(path), "rb") as wav:
            channels = wav.getnchannels()
            width = wav.getsampwidth()
            rate = wav.getframerate()
            frames = wav.getnframes()
            if channels not in (1, 2):
                raise PackError(f"{path.name}: {channels} channels (expected mono or stereo)")
            if width != 2:
                raise PackError(f"{path.name}: {width * 8}-bit samples (expected 16-bit PCM)")
            if rate < 8000 or rate > 192000:
                raise PackError(f"{path.name}: sample rate {rate}")
            if frames <= 0 or frames > rate * MAX_SECONDS:
                raise PackError(f"{path.name}: {frames} frames")
            raw = wav.readframes(frames)
    except wave.Error as exc:
        raise PackError(f"{path.name}: not a readable PCM WAV ({exc})") from exc
    except OSError as exc:
        raise PackError(f"{path.name}: {exc}") from exc

    expected = frames * channels * 2
    if len(raw) != expected:
        raise PackError(f"{path.name}: truncated sample data ({len(raw)} of {expected} bytes)")
    count = frames
    peak = 0.0
    energy = 0.0
    bins = [0.0] * PEAK_BINS
    for index, (sample,) in enumerate(struct.iter_unpack("<h", raw)):
        value = sample / 32768.0
        magnitude = -value if value < 0 else value
        if magnitude > peak:
            peak = magnitude
        energy += value * value
        frame = index // channels
        slot = min(PEAK_BINS - 1, frame * PEAK_BINS // count)
        if magnitude > bins[slot]:
            bins[slot] = magnitude
    seconds = count / float(rate)
    rms = (energy / float(count * channels)) ** 0.5
    return {
        "seconds": round(seconds, 4),
        "sampleRate": rate,
        "channels": channels,
        "peak": round(peak, 4),
        "rms": round(rms, 4),
        "bytes": path.stat().st_size,
        "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
        "peaks": [round(v, 4) for v in bins],
    }


def scan_pack() -> list[dict]:
    """Read every WAV in ``wav/<category>/`` and validate the naming contract."""
    wav_root = PACK / "wav"
    if not wav_root.is_dir():
        raise PackError(f"missing pack folder: {wav_root}")
    files = sorted(wav_root.glob("*/*.wav"))
    if not files:
        raise PackError(f"no WAV files under {wav_root}")
    if len(files) > MAX_FILES:
        raise PackError(f"{len(files)} WAV files (at most {MAX_FILES})")
    items = []
    seen = set()
    for path in files:
        sound_id = path.stem
        if not ID_RE.match(sound_id):
            raise PackError(f"{path}: bad id {sound_id!r} (a-z, 0-9 and '-')")
        if sound_id in seen:
            raise PackError(f"duplicate id {sound_id!r}")
        seen.add(sound_id)
        category = path.parent.name
        if not category or category.startswith("."):
            raise PackError(f"{path}: bad category folder")
        meta = read_wav(path)
        items.append({
            "id": sound_id,
            "name": sound_id.replace("-", " ").capitalize(),
            "category": category,
            "categorySlug": category,
            "tags": sorted({t for t in re.split(r"[^a-z0-9]+", category.lower()) if t}),
            "file": path.relative_to(PACK).as_posix(),
            **meta,
        })
    return items


def with_names(items: list[dict]) -> list[dict]:
    """Use the curated display names already in the shipped catalogue when they match an id."""
    old = {}
    catalog = PACK / "catalog.json"
    if catalog.is_file():
        try:
            doc = json.loads(catalog.read_text(encoding="utf-8"))
            for item in doc.get("items", []):
                if isinstance(item, dict) and isinstance(item.get("id"), str):
                    old[item["id"]] = item
        except (OSError, ValueError):
            old = {}
    for item in items:
        previous = old.get(item["id"])
        if previous and isinstance(previous.get("name"), str) and previous["name"].strip():
            item["name"] = previous["name"].strip()
        if previous and isinstance(previous.get("category"), str) and previous["category"].strip():
            item["category"] = previous["category"].strip()
        if previous and isinstance(previous.get("tags"), list):
            tags = [t for t in previous["tags"] if isinstance(t, str) and re.match(r"^[a-z0-9][a-z0-9-]{0,19}$", t)]
            if tags:
                item["tags"] = tags[:8]
    return items


def ordered(items: list[dict]) -> list[dict]:
    def key(item: dict):
        try:
            rank = CATEGORY_ORDER.index(item["category"])
        except ValueError:
            rank = len(CATEGORY_ORDER)
        return (rank, item["category"], item["id"])
    return sorted(items, key=key)


def catalog_document(items: list[dict]) -> dict:
    return {
        "name": "Flow Studio Original SFX",
        "license": "CC0-1.0",
        "sampleRate": 44100,
        "count": len(items),
        "peaks": PEAK_BINS,
        "categories": [c for c in CATEGORY_ORDER if any(i["category"] == c for i in items)],
        "items": [
            {
                "id": i["id"],
                "name": i["name"],
                "category": i["category"],
                "tags": i["tags"],
                "seconds": i["seconds"],
                "sampleRate": i["sampleRate"],
                "channels": i["channels"],
                "peak": i["peak"],
                "rms": i["rms"],
                "bytes": i["bytes"],
                "sha256": i["sha256"],
                "peaks": i["peaks"],
                "file": i["file"],
            }
            for i in items
        ],
    }


def catalog_json(items: list[dict]) -> str:
    return json.dumps(catalog_document(items), indent=2, ensure_ascii=True) + "\n"


def catalogue_json(items: list[dict]) -> str:
    """The Library catalogue: one validated sfx preset per pack sound."""
    entries = []
    for i in items:
        family = i["category"]
        tags = ["sound"] + [t for t in i["tags"] if t != "sound"][:7]
        entries.append({
            "id": "sfx." + i["id"],
            "kind": "sfx",
            "name": i["name"],
            "family": family,
            "tags": tags,
            "seconds": max(0.03, round(float(i["seconds"]), 3)),
            "recipe": "asset",
            "variant": 0,
            "asset": i["id"],
        })
    doc = {"schema": 1, "kind": "sfx", "count": len(entries), "items": entries}
    return json.dumps(doc, indent=2, ensure_ascii=True) + "\n"


def sidecar(item: dict) -> str:
    return (
        f"asset:        {item['file']}\n"
        f"title:        {item['name']} ({item['category']})\n"
        "author:       Flow Studio contributors\n"
        "source:       original work\n"
        "license:      CC0-1.0\n"
        "license-file: LICENSE-CC0.txt\n"
        f"added:        {TODAY} by Flow Studio contributors\n"
        f"notes:        Synthesised from oscillators and seeded noise by generate_sfx.py; "
        f"{item['seconds']:.3f} s, {item['sampleRate']} Hz, {item['channels']} channel(s), "
        f"16-bit PCM. No third-party recording or sample.\n"
    )


def sidecar_path(wav: Path) -> Path:
    return wav.with_name(wav.name + ".attribution")


def pack_readme(items: list[dict]) -> str:
    categories = [c for c in CATEGORY_ORDER if any(i["category"] == c for i in items)]
    total_seconds = sum(i["seconds"] for i in items)
    horror = ", ".join(categories[:6]) + ", " + ", ".join(categories[6:])
    return f"""# Flow Studio Original SFX Pack ({len(items)} sounds, CC0)

{len(items)} original sound effects in {len(categories)} categories, 44.1 kHz, mono, 16-bit WAV,
about {total_seconds:.0f} s in total.  Every sound is synthesised from oscillators and seeded noise by
`generate_sfx.py`: nothing is sampled, recorded or copied, so nothing here belongs to anybody else.
Released under **CC0-1.0**.

Categories: {horror}.

Files: `wav/<category>/<id>.wav`, `catalog.json` (id, name, category, tags, duration, level, SHA-256,
64 waveform peaks and the relative path), one `.attribution` sidecar per WAV, `LICENSE-CC0.txt` and
this README.

Regenerate the catalogue, the sidecars and the `ATTRIBUTION.md` block after changing a WAV:

```sh
python scripts/build_sfx_pack.py --write
python scripts/build_sfx_pack.py --check
```

The panel reads the pack through the Flow helper (`sfx.pack.list`), which validates every id, path,
duration and peak before returning it.  The installer copies the folder to
`<settings folder>/FlowStudio/assets/sfx-pack`; the helper also finds a checkout's `assets/sfx-pack`
while developing.  Copy the WAV files once into a project through the Sounds screen; the panel reuses
the imported footage item instead of importing it again.
"""


def pack_attribution_text(items: list[dict]) -> str:
    return (
        "Flow Studio Original SFX Pack: original work generated by generate_sfx.py (oscillators and\n"
        "seeded noise). No third-party recordings or samples. License: CC0-1.0.\n"
        f"{len(items)} WAV files; see each file's .attribution sidecar and ATTRIBUTION.md.\n"
    )


def pack_root_sidecar(items: list[dict]) -> str:
    return (
        "asset:        sfx-pack\n"
        "title:        Flow Studio Original SFX Pack\n"
        "author:       Flow Studio contributors\n"
        "source:       original work\n"
        "license:      CC0-1.0\n"
        "license-file: LICENSE-CC0.txt\n"
        f"added:        {TODAY} by Flow Studio contributors\n"
        f"notes:        {len(items)} sound effects synthesised from oscillators and seeded noise by\n"
        "              generate_sfx.py; no third-party recordings, samples or Adobe artwork.\n"
    )


def attribution_block(items: list[dict]) -> str:
    rows = [
        "## Sound effects",
        "",
        f"The {len(items)} WAV files in `assets/sfx-pack/wav/` are original work by the Flow Studio",
        "contributors, synthesised from oscillators and seeded noise by",
        "`assets/sfx-pack/generate_sfx.py`. They are dedicated to the public domain under",
        "**CC0-1.0** (`assets/sfx-pack/LICENSE-CC0.txt`). Every file has a `.attribution` sidecar;",
        "the table below is generated by `scripts/build_sfx_pack.py`.",
        "",
        "| Asset | Title | Author | Source | License |",
        "|---|---|---|---|---|",
    ]
    for item in items:
        rows.append(
            f"| `assets/sfx-pack/{item['file']}` | {item['name']} ({item['category']}) | "
            "Flow Studio contributors | Original work | CC0-1.0 |"
        )
    rows.append("")
    return "\n".join(rows)


def read_text(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8")
    except OSError as exc:
        raise PackError(f"cannot read {path}: {exc}") from exc


def write_text(path: Path, text: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(text, encoding="utf-8", newline="\n")


def replace_block(text: str, block: str) -> str:
    if MARK_START in text and MARK_END in text:
        before = text.split(MARK_START, 1)[0]
        after = text.split(MARK_END, 1)[1]
        return before + MARK_START + "\n" + block.rstrip("\n") + "\n" + MARK_END + after
    suffix = "" if text.endswith("\n") else "\n"
    return text + suffix + "\n" + MARK_START + "\n" + block.rstrip("\n") + "\n" + MARK_END + "\n"


def write_all(items: list[dict], write_catalogue: bool) -> None:
    write_text(PACK / "catalog.json", catalog_json(items))
    write_text(PACK / "README.md", pack_readme(items))
    write_text(PACK / "ATTRIBUTION.txt", pack_attribution_text(items))
    write_text(PACK / ".attribution", pack_root_sidecar(items))
    for item in items:
        wav = PACK / item["file"]
        write_text(sidecar_path(wav), sidecar(item))
    write_text(ATTRIBUTION, replace_block(read_text(ATTRIBUTION), attribution_block(items)))
    if write_catalogue:
        write_text(CATALOG, catalogue_json(items))


def check_all(items: list[dict]) -> list[str]:
    problems = []
    expected = {
        PACK / "catalog.json": catalog_json(items),
        PACK / "README.md": pack_readme(items),
        PACK / "ATTRIBUTION.txt": pack_attribution_text(items),
        PACK / ".attribution": pack_root_sidecar(items),
    }
    for path, text in expected.items():
        try:
            actual = read_text(path)
        except PackError as exc:
            problems.append(str(exc))
            continue
        if actual != text:
            problems.append(f"{path.relative_to(ROOT)} is out of date; run --write")
    for item in items:
        wav = PACK / item["file"]
        try:
            actual = read_text(sidecar_path(wav))
        except PackError as exc:
            problems.append(str(exc))
            continue
        if actual != sidecar(item):
            problems.append(f"{sidecar_path(wav).relative_to(ROOT)} is out of date; run --write")
    try:
        text = read_text(ATTRIBUTION)
    except PackError as exc:
        problems.append(str(exc))
    else:
        if replace_block(text, attribution_block(items)) != text:
            problems.append("ATTRIBUTION.md is out of date; run --write")
    try:
        actual = read_text(CATALOG)
    except PackError:
        actual = ""
    if actual != catalogue_json(items):
        problems.append("catalog/sfx.json is out of date; run --write")
    return problems


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Build or check the Flow Studio SFX pack")
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--write", action="store_true", help="regenerate catalogue, sidecars and ATTRIBUTION.md")
    group.add_argument("--check", action="store_true", help="fail when a generated file is out of date")
    parser.add_argument("--no-catalog", action="store_true", help="do not rewrite catalog/sfx.json")
    args = parser.parse_args(argv)

    try:
        items = ordered(with_names(scan_pack()))
        if args.write:
            write_all(items, not args.no_catalog)
            print(f"sfx pack: {len(items)} sounds, {sum(i['bytes'] for i in items)} bytes")
            return 0
        problems = check_all(items)
        if problems:
            for problem in problems[:20]:
                print(problem, file=sys.stderr)
            if len(problems) > 20:
                print(f"... and {len(problems) - 20} more", file=sys.stderr)
            return 1
        print(f"sfx pack valid: {len(items)} sounds ({sum(i['seconds'] for i in items):.1f} s)")
        return 0
    except PackError as exc:
        print(f"sfx pack: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
