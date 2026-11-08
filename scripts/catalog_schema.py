"""Field-by-field validation of the Flow Studio catalogue.

The catalogue is data, never code: this module is the only gate between the JSON files and the
panel.  It rejects unknown fields (so a future field cannot silently do nothing), out-of-range
numbers, unknown easings, unknown operation names and dangling cross-references.

Run:  python scripts/catalog_schema.py
"""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CATALOG = ROOT / "catalog"

EASINGS = {
    "linear", "inSine", "outSine", "inOutSine",
    "inQuad", "outQuad", "inOutQuad", "inCubic", "outCubic", "inOutCubic",
    "inQuart", "outQuart", "inOutQuart", "inQuint", "outQuint", "inOutQuint",
    "inExpo", "outExpo", "inOutExpo", "inCirc", "outCirc", "inOutCirc",
    "inBack", "outBack", "inOutBack", "inElastic", "outElastic", "inOutElastic",
    "inBounce", "outBounce", "inOutBounce",
    "smooth", "smoother", "spring", "anticipate", "steps", "hold",
}

TEXT_UNITS = {"chars", "words", "lines"}
WEIGHTS = {"Regular", "Medium", "SemiBold", "Bold", "Black", "Light", "Italic"}
CAPS = {"none", "upper", "lower", "small"}
ANCHORS = {"top-left", "top-center", "top-right", "middle-left", "middle-center",
           "middle-right", "bottom-left", "bottom-center", "bottom-right"}
ALIGN = {"left", "center", "right"}
BG_KINDS = {"linear", "radial", "four"}
BG_ANIMS = {"none", "rotate", "pulse", "drift"}
CAPTION_ANCHORS = {"top", "middle", "bottom"}
CAPTION_ANIMS = {"none", "fade", "pop", "slideUp"}
CAPTION_STYLES = {"Regular", "Medium", "SemiBold", "Bold", "Black", "Light", "Italic"}
GENERATORS = {"solid", "grey-scale", "color-bars-smpte", "color-bars-ebu", "checker", "grid", "noise", "countdown"}
SFX_RECIPES = {"legacy", "whoosh", "riser", "reverse", "boom", "impact", "drop", "downlifter",
               "ui", "chime", "shimmer", "sparkle", "digital", "camera", "ambience", "cartoon", "scifi"}
TOOL_IDS = {
    "marker.chapters", "marker.beats", "marker.notes",
    "layer.rename", "layer.labels", "layer.nulls", "layer.anchor", "layer.trim",
    "layer.sequence", "layer.align-left", "layer.distribute", "layer.precompose",
    "text.explode", "layer.batch-offset",
    "project.preset-916", "project.preset-11", "project.preset-45", "project.preset-169",
    "project.preset-4k", "project.safe",
    "history.repeat", "history.clear", "time.freeze", "time.reverse",
}
NEEDS = {"comp", "layers", "two-layers", "text", "shape", "audio"}

ID_RE = re.compile(r"^[a-z][a-z0-9-]*(\.[a-z0-9-]+)+$")
HEX_RE = re.compile(r"^#[0-9A-Fa-f]{6}$")
NUM = (int, float)

# Operation vocabulary shared by transitions, effects and generators.  Each entry lists the
# accepted keys (all optional unless marked in REQUIRED) and their range or enum.
OP_RANGES = {
    "fade": {},
    "dip": {"color": {"black", "white", "custom"}, "value": HEX_RE, "amount": (0, 20)},
    "exposure": {"amount": (0, 20)},
    "grain": {"amount": (0, 100), "ramp": bool},
    "blur": {"amount": (0, 500), "constant": bool},
    "levels": {"amount": (0, 100)},
    "slide": {"dx": (-2, 2), "dy": (-2, 2)},
    "push": {"dx": (-2, 2), "dy": (-2, 2)},
    "blurdir": {"amount": (0, 500), "direction": (0, 360), "constant": bool},
    "spin": {"angle": (-720, 720), "scale": (0, 400)},
    "zoom": {"from": (0, 1000)},
    "zoomthrough": {},
    "punch": {"amount": (0, 200)},
    "offset": {"x": (-2, 2), "y": (-2, 2)},
    "dolly": {},
    "swing": {"angle": (-90, 90)},
    "scaleWidth": {"from": (0, 100)},
    "wipe": {"angle": (-360, 360), "feather": (0, 200)},
    "rotate": {"angle": (-90, 90)},
    "iris": {"points": (3, 100), "reverse": bool},
    "radial": {"angle": (-360, 360)},
    "venetian": {"direction": {"horizontal", "vertical"}, "width": (1, 200)},
    "mosaic": {"max": (2, 2000), "constant": bool},
    "glitch": {"amount": (0, 500), "fps": (1, 60)},
    "rgbsplit": {"amount": (0, 200)},
    "flash": {"amount": (0, 20)},
    "leak": {"amount": (0, 500)},
    "burn": {"amount": (0, 100)},
    "ripple": {"radius": (0, 500)},
    "wave": {"height": (0, 500), "speed": (0, 20), "constant": bool},
    "shake": {"amount": (0, 200), "fps": (1, 60)},
    "strobe": {"fps": (1, 60), "amount": (0, 20)},
    "smear": {"amount": (0, 100)},
    "look": {"temperature": (-100, 100), "contrast": (-100, 100), "shadows": (-100, 100),
             "highlights": (-100, 100), "saturation": (-100, 100), "vibrance": (-100, 100),
             "faded": (0, 100), "blacks": (-100, 100), "tint": (-100, 100), "exposure": (-5, 5)},
    "bw": {"contrast": (-100, 100)},
    "duotone": {"shadow": HEX_RE, "highlight": HEX_RE},
    "glow": {"radius": (0, 1000), "intensity": (0, 255), "threshold": (0, 100)},
    "radialblur": {"amount": (0, 500), "type": {"spin", "zoom"}, "constant": bool},
    "scanlines": {"amount": (0, 100)},
    "flicker": {"amount": (0, 20)},
    "posterize": {"levels": (2, 64)},
    "echo": {"count": (1, 32), "intensity": (0, 100)},
    "findedges": {},
    "kaleido": {"segments": (2, 32)},
    "vignette": {"amount": (-200, 200)},
    "letterbox": {"ratio": (0.4, 3.0)},
    "safezone": {},
    "sharpen": {"amount": (0, 500)},
    "denoise": {"radius": (0, 50)},
    "freeze": {},
    "speedramp": {},
    "reverse": {},
    "mirror": {"angle": (-360, 360)},
    "crop": {"ratio": (0.2, 3.0)},
    "pullout": {"amount": (0, 200)},
    "pushin": {"amount": (0, 200)},
    "wiggle": {"amount": (0, 200), "fps": (0.1, 30)},
    "rotatepulse": {"amount": (0, 90)},
    "drift": {"amount": (0, 200), "period": (0.5, 60)},
    "bounce": {"amount": (0, 500)},
}
OP_REQUIRED = {
    "dip": {"color"},
    "slide": {"dx", "dy"},
    "push": {"dx", "dy"},
    "blurdir": {"amount", "direction"},
    "zoom": {"from"},
    "iris": {"points"},
    "venetian": {"direction"},
    "mosaic": {"max"},
    "offset": {"x", "y"},
    "glitch": {"amount"},
    "rgbsplit": {"amount"},
    "shake": {"amount"},
    "strobe": {"fps"},
    "duotone": {"shadow", "highlight"},
    "glow": {"radius", "intensity"},
    "letterbox": {"ratio"},
    "mirror": {"angle"},
    "crop": {"ratio"},
    "drift": {"amount"},
}


class Errors(list):
    def add(self, where, message):
        self.append(f"{where}: {message}")


def is_num(v):
    return isinstance(v, NUM) and not isinstance(v, bool)


def check_keys(obj, allowed, where, errors, required=()):
    if not isinstance(obj, dict):
        errors.add(where, "expected an object")
        return False
    for key in obj:
        if key not in allowed:
            errors.add(where, f"unknown field `{key}`")
    for key in required:
        if key not in obj:
            errors.add(where, f"missing field `{key}`")
    return True


def check_str(value, where, errors, lo=1, hi=80, pattern=None):
    if not isinstance(value, str) or not (lo <= len(value) <= hi):
        errors.add(where, f"expected a string of {lo}..{hi} characters")
        return False
    if pattern is not None and not pattern.match(value):
        errors.add(where, f"`{value}` does not match the expected shape")
        return False
    return True


def check_range(value, lo, hi, where, errors, integer=False):
    if not is_num(value) or not (lo <= value <= hi):
        errors.add(where, f"expected a number in {lo}..{hi}")
        return False
    if integer and int(value) != value:
        errors.add(where, "expected a whole number")
        return False
    return True


def check_bool(value, where, errors):
    if not isinstance(value, bool):
        errors.add(where, "expected true or false")
        return False
    return True


def check_hex(value, where, errors):
    if not isinstance(value, str) or not HEX_RE.match(value):
        errors.add(where, f"expected #RRGGBB, got {value!r}")
        return False
    return True


def check_tags(value, where, errors):
    if not isinstance(value, list) or not (1 <= len(value) <= 8):
        errors.add(where, "expected 1..8 tags")
        return False
    for tag in value:
        if not isinstance(tag, str) or not re.match(r"^[a-z0-9][a-z0-9-]{0,19}$", tag):
            errors.add(where, f"bad tag {tag!r}")
            return False
    return True


def check_common(item, kind, where, errors):
    check_keys(item, {"id", "kind", "name", "family", "tags", "approx", "note"} |
               _KIND_FIELDS[kind], where, errors, ("id", "kind", "name", "family", "tags"))
    check_str(item.get("id"), where + ".id", errors, 3, 80, ID_RE)
    if item.get("kind") != kind:
        errors.add(where, f"kind should be {kind!r}")
    check_str(item.get("name"), where + ".name", errors, 1, 80)
    check_str(item.get("family"), where + ".family", errors, 1, 40)
    check_tags(item.get("tags"), where + ".tags", errors)
    if "approx" in item:
        check_bool(item["approx"], where + ".approx", errors)
    if "note" in item:
        check_str(item["note"], where + ".note", errors, 1, 240)


_KIND_FIELDS = {
    "title": {"text", "duration", "anim", "out", "style"},
    "text": {"unit", "mode", "from", "easing", "duration", "smooth", "random", "loop", "period", "amount"},
    "transition": {"duration", "ops"},
    "effect": {"when", "duration", "ops"},
    "gradient": {"sub", "bg", "gen", "color"},
    "palette": {"colors"},
    "caption": {"style"},
    "sfx": {"seconds", "recipe", "variant"},
    "tool": {"tool", "needs"},
}


def check_ops(ops, where, errors):
    if not isinstance(ops, list) or not (1 <= len(ops) <= 12):
        errors.add(where, "expected 1..12 operations")
        return
    for i, op in enumerate(ops):
        w = f"{where}[{i}]"
        if not isinstance(op, dict):
            errors.add(w, "expected an object")
            continue
        name = op.get("op")
        if name not in OP_RANGES:
            errors.add(w, f"unknown operation {name!r}")
            continue
        spec = OP_RANGES[name]
        check_keys(op, {"op"} | set(spec), w, errors, ("op",) + tuple(OP_REQUIRED.get(name, ())))
        for key, rule in spec.items():
            if key not in op:
                continue
            value = op[key]
            kw = f"{w}.{key}"
            if isinstance(rule, tuple):
                check_range(value, rule[0], rule[1], kw, errors, integer=(key in ("points", "fps", "count", "segments", "levels")))
            elif isinstance(rule, set):
                if value not in rule:
                    errors.add(kw, f"expected one of {sorted(rule)}")
            elif rule is bool:
                check_bool(value, kw, errors)
            elif hasattr(rule, "match"):
                check_hex(value, kw, errors)
            else:
                errors.add(kw, "bad validation rule")


def check_style(style, where, errors):
    allowed = set(TITLE_STYLE_FIELDS)
    if not check_keys(style, allowed, where, errors, tuple(sorted(allowed))):
        return
    check_range(style["size"], 8, 400, where + ".size", errors)
    check_str(style["font"], where + ".font", errors, 1, 40)
    if style["weight"] not in WEIGHTS:
        errors.add(where + ".weight", f"expected one of {sorted(WEIGHTS)}")
    check_range(style["tracking"], -100, 500, where + ".tracking", errors)
    check_range(style["leading"], 0.5, 3.0, where + ".leading", errors)
    if style["caps"] not in CAPS:
        errors.add(where + ".caps", f"expected one of {sorted(CAPS)}")
    check_hex(style["fill"], where + ".fill", errors)
    if style["fill2"] is not None:
        check_hex(style["fill2"], where + ".fill2", errors)
    if style["stroke"] is not None:
        check_hex(style["stroke"], where + ".stroke", errors)
    check_range(style["strokeWidth"], 0, 40, where + ".strokeWidth", errors)
    for key in ("shadow", "glow", "glass", "bar", "underline", "rtl"):
        check_bool(style[key], where + "." + key, errors)
    check_hex(style["glowColor"], where + ".glowColor", errors)
    if style["align"] not in ALIGN:
        errors.add(where + ".align", f"expected one of {sorted(ALIGN)}")
    if style["anchor"] not in ANCHORS:
        errors.add(where + ".anchor", f"expected one of {sorted(ANCHORS)}")
    check_range(style["margin"], 0, 0.3, where + ".margin", errors)
    check_hex(style["glassFill"], where + ".glassFill", errors)
    check_range(style["glassOpacity"], 0, 100, where + ".glassOpacity", errors)
    check_hex(style["barFill"], where + ".barFill", errors)
    check_hex(style["underlineColor"], where + ".underlineColor", errors)


TITLE_STYLE_FIELDS = (
    "size", "font", "weight", "tracking", "leading", "caps", "fill", "fill2", "stroke",
    "strokeWidth", "shadow", "glow", "glowColor", "align", "anchor", "margin", "glass",
    "glassFill", "glassOpacity", "bar", "barFill", "underline", "underlineColor", "rtl",
)


def check_text(item, where, errors, text_ids):
    if item.get("unit") not in TEXT_UNITS:
        errors.add(where + ".unit", f"expected one of {sorted(TEXT_UNITS)}")
    mode = item.get("mode")
    if mode not in {"in", "out", "loop"}:
        errors.add(where + ".mode", "expected in, out or loop")
    if mode == "loop":
        if item.get("loop") not in {"scale", "position", "opacity", "color"}:
            errors.add(where + ".loop", "expected scale, position, opacity or color")
        check_range(item.get("period"), 0.2, 60, where + ".period", errors)
        check_range(item.get("amount"), 0, 100, where + ".amount", errors)
    else:
        check_keys(item["from"], {"opacity", "scale", "rotation", "blur", "tracking", "position"}, where + ".from", errors)
        if not item["from"]:
            errors.add(where + ".from", "an entrance or exit needs at least one starting value")
        f = item["from"]
        if "opacity" in f:
            check_range(f["opacity"], 0, 100, where + ".from.opacity", errors)
        if "scale" in f:
            check_range(f["scale"], 0, 1000, where + ".from.scale", errors)
        if "rotation" in f:
            check_range(f["rotation"], -3600, 3600, where + ".from.rotation", errors)
        if "blur" in f:
            check_range(f["blur"], 0, 500, where + ".from.blur", errors)
        if "tracking" in f:
            check_range(f["tracking"], -500, 500, where + ".from.tracking", errors)
        if "position" in f:
            pos = f["position"]
            if not isinstance(pos, list) or len(pos) != 2 or not all(is_num(v) and -10000 <= v <= 10000 for v in pos):
                errors.add(where + ".from.position", "expected [x, y]")
    if item.get("easing") not in EASINGS:
        errors.add(where + ".easing", f"unknown easing {item.get('easing')!r}")
    check_range(item.get("duration"), 0.05, 20, where + ".duration", errors)
    check_range(item.get("smooth"), 0, 100, where + ".smooth", errors)
    check_bool(item.get("random"), where + ".random", errors)


def check_title(item, where, errors, text_ids):
    check_str(item.get("text"), where + ".text", errors, 1, 250)
    check_range(item.get("duration"), 0.5, 60, where + ".duration", errors)
    for key in ("anim", "out"):
        value = item.get(key)
        if value is not None and value not in text_ids:
            errors.add(where + "." + key, f"unknown text animation {value!r}")
    check_style(item.get("style"), where + ".style", errors)


def check_gradient(item, where, errors):
    sub = item.get("sub")
    if sub == "gradient":
        bg = item.get("bg")
        if not check_keys(bg, {"kind", "colors", "angle", "anim", "speed"}, where + ".bg", errors,
                          ("kind", "colors", "angle", "anim", "speed")):
            return
        if bg["kind"] not in BG_KINDS:
            errors.add(where + ".bg.kind", f"expected one of {sorted(BG_KINDS)}")
        colors = bg["colors"]
        if not isinstance(colors, list) or len(colors) != 4:
            errors.add(where + ".bg.colors", "expected exactly 4 colours")
        else:
            for i, c in enumerate(colors):
                check_hex(c, f"{where}.bg.colors[{i}]", errors)
        check_range(bg["angle"], -360, 360, where + ".bg.angle", errors)
        if bg["anim"] not in BG_ANIMS:
            errors.add(where + ".bg.anim", f"expected one of {sorted(BG_ANIMS)}")
        check_range(bg["speed"], 0, 200, where + ".bg.speed", errors)
    elif sub == "generator":
        if item.get("gen") not in GENERATORS:
            errors.add(where + ".gen", f"expected one of {sorted(GENERATORS)}")
        check_hex(item.get("color"), where + ".color", errors)
    else:
        errors.add(where + ".sub", "expected gradient or generator")


def check_palette(item, where, errors):
    colors = item.get("colors")
    if not isinstance(colors, list) or len(colors) != 5:
        errors.add(where + ".colors", "expected exactly 5 colours")
        return
    for i, c in enumerate(colors):
        check_hex(c, f"{where}.colors[{i}]", errors)


def check_shadow(shadow, where, errors):
    if shadow is None:
        return
    if not check_keys(shadow, {"color", "opacity", "angle", "distance", "softness"}, where, errors,
                      ("color", "opacity", "angle", "distance", "softness")):
        return
    check_hex(shadow["color"], where + ".color", errors)
    check_range(shadow["opacity"], 0, 100, where + ".opacity", errors)
    check_range(shadow["angle"], -360, 360, where + ".angle", errors)
    check_range(shadow["distance"], 0, 100, where + ".distance", errors)
    check_range(shadow["softness"], 0, 100, where + ".softness", errors)


def check_caption(item, where, errors):
    st = item.get("style")
    allowed = {"fontFamily", "fontStyle", "fontSize", "uppercase", "tracking", "lineSpacing",
               "fill", "stroke", "strokeWidth", "shadow", "position", "align", "group", "animation"}
    if not check_keys(st, allowed, where + ".style", errors, tuple(sorted(allowed))):
        return
    check_str(st["fontFamily"], where + ".style.fontFamily", errors, 1, 40)
    if st["fontStyle"] not in CAPTION_STYLES:
        errors.add(where + ".style.fontStyle", f"expected one of {sorted(CAPTION_STYLES)}")
    check_range(st["fontSize"], 10, 300, where + ".style.fontSize", errors)
    check_bool(st["uppercase"], where + ".style.uppercase", errors)
    check_range(st["tracking"], -100, 500, where + ".style.tracking", errors)
    check_range(st["lineSpacing"], 0.8, 3.0, where + ".style.lineSpacing", errors)
    check_hex(st["fill"], where + ".style.fill", errors)
    check_hex(st["stroke"], where + ".style.stroke", errors)
    check_range(st["strokeWidth"], 0, 50, where + ".style.strokeWidth", errors)
    check_shadow(st["shadow"], where + ".style.shadow", errors)
    pos = st["position"]
    if check_keys(pos, {"anchor", "margin", "offsetX"}, where + ".style.position", errors,
                  ("anchor", "margin", "offsetX")):
        if pos["anchor"] not in CAPTION_ANCHORS:
            errors.add(where + ".style.position.anchor", f"expected one of {sorted(CAPTION_ANCHORS)}")
        check_range(pos["margin"], 0, 0.4, where + ".style.position.margin", errors)
        check_range(pos["offsetX"], -1, 1, where + ".style.position.offsetX", errors)
    if st["align"] not in ALIGN:
        errors.add(where + ".style.align", f"expected one of {sorted(ALIGN)}")
    group = st["group"]
    if check_keys(group, {"maxChars", "maxWords", "maxDuration", "maxGap"}, where + ".style.group", errors,
                  ("maxChars", "maxWords", "maxDuration", "maxGap")):
        check_range(group["maxChars"], 5, 200, where + ".style.group.maxChars", errors, integer=True)
        check_range(group["maxWords"], 1, 50, where + ".style.group.maxWords", errors, integer=True)
        check_range(group["maxDuration"], 0.5, 30, where + ".style.group.maxDuration", errors)
        check_range(group["maxGap"], 0, 10, where + ".style.group.maxGap", errors)
    anim = st["animation"]
    if check_keys(anim, {"kind", "duration", "easing"}, where + ".style.animation", errors,
                  ("kind", "duration", "easing")):
        if anim["kind"] not in CAPTION_ANIMS:
            errors.add(where + ".style.animation.kind", f"expected one of {sorted(CAPTION_ANIMS)}")
        check_range(anim["duration"], 0, 2, where + ".style.animation.duration", errors)
        if anim["easing"] not in EASINGS:
            errors.add(where + ".style.animation.easing", f"unknown easing {anim['easing']!r}")


def check_sfx(item, where, errors):
    check_range(item.get("seconds"), 0.02, 10, where + ".seconds", errors)
    if item.get("recipe") not in SFX_RECIPES:
        errors.add(where + ".recipe", f"expected one of {sorted(SFX_RECIPES)}")
    check_range(item.get("variant"), 0, 100000, where + ".variant", errors, integer=True)


def check_tool(item, where, errors):
    if item.get("tool") not in TOOL_IDS:
        errors.add(where + ".tool", f"unknown tool {item.get('tool')!r}")
    if item.get("needs") not in NEEDS:
        errors.add(where + ".needs", f"expected one of {sorted(NEEDS)}")


def load(name, errors):
    path = CATALOG / name
    if not path.exists():
        errors.add(name, "file is missing")
        return None
    try:
        doc = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, ValueError) as exc:
        errors.add(name, f"cannot read JSON: {exc}")
        return None
    if not isinstance(doc, dict) or doc.get("schema") != 1:
        errors.add(name, "expected an object with schema 1")
        return None
    items = doc.get("items")
    if not isinstance(items, list):
        errors.add(name, "expected an `items` array")
        return None
    if doc.get("count") != len(items):
        errors.add(name, f"count is {doc.get('count')}, but there are {len(items)} items")
    return items


def validate():
    errors = Errors()
    kinds = {
        "titles.json": "title",
        "text-animations.json": "text",
        "transitions.json": "transition",
        "effects.json": "effect",
        "gradients.json": "gradient",
        "palettes.json": "palette",
        "captions.json": "caption",
        "sfx.json": "sfx",
        "tools.json": "tool",
    }
    docs = {}
    for name, kind in kinds.items():
        items = load(name, errors)
        if items is None:
            continue
        docs[kind] = items
        for i, item in enumerate(items):
            where = f"{name}[{i}]"
            if not isinstance(item, dict):
                errors.add(where, "expected an object")
                continue
            check_common(item, kind, where, errors)

    seen = {}
    for kind, items in docs.items():
        for item in items:
            if not isinstance(item, dict) or not isinstance(item.get("id"), str):
                continue
            if item["id"] in seen:
                errors.add(item["id"], f"duplicate id (already in {seen[item['id']]})")
            seen[item["id"]] = kind

    text_ids = {i["id"] for i in docs.get("text", []) if isinstance(i, dict) and isinstance(i.get("id"), str)}
    for i, item in enumerate(docs.get("text", [])):
        if isinstance(item, dict):
            check_text(item, f"text-animations.json[{i}]", errors, text_ids)
    for i, item in enumerate(docs.get("title", [])):
        if isinstance(item, dict):
            check_title(item, f"titles.json[{i}]", errors, text_ids)
    for i, item in enumerate(docs.get("transition", [])):
        if isinstance(item, dict):
            check_range(item.get("duration"), 0.05, 10, f"transitions.json[{i}].duration", errors)
            check_ops(item.get("ops"), f"transitions.json[{i}].ops", errors)
    for i, item in enumerate(docs.get("effect", [])):
        if isinstance(item, dict):
            if item.get("when") not in {"playhead", "layerStart", "layerEnd"}:
                errors.add(f"effects.json[{i}].when", "expected playhead, layerStart or layerEnd")
            check_range(item.get("duration"), 0.01, 30, f"effects.json[{i}].duration", errors)
            check_ops(item.get("ops"), f"effects.json[{i}].ops", errors)
    for i, item in enumerate(docs.get("gradient", [])):
        if isinstance(item, dict):
            check_gradient(item, f"gradients.json[{i}]", errors)
    for i, item in enumerate(docs.get("palette", [])):
        if isinstance(item, dict):
            check_palette(item, f"palettes.json[{i}]", errors)
    for i, item in enumerate(docs.get("caption", [])):
        if isinstance(item, dict):
            check_caption(item, f"captions.json[{i}]", errors)
    for i, item in enumerate(docs.get("sfx", [])):
        if isinstance(item, dict):
            check_sfx(item, f"sfx.json[{i}]", errors)
    for i, item in enumerate(docs.get("tool", [])):
        if isinstance(item, dict):
            check_tool(item, f"tools.json[{i}]", errors)

    # The native effect registry is a snapshot used to document what the engine ships.  It is
    # not needed for the op vocabulary, but a stale/empty snapshot is a build error so the docs
    # and the availability fallback stay honest.
    native = CATALOG / "native-effect-ids.json"
    if not native.exists():
        errors.add("native-effect-ids.json", "file is missing")
    else:
        try:
            doc = json.loads(native.read_text(encoding="utf-8"))
            count = len(doc.get("items") or [])
            if count < 250:
                errors.add("native-effect-ids.json", f"only {count} effects in the snapshot")
            for e in doc.get("items") or []:
                if not isinstance(e, dict) or not isinstance(e.get("id"), str) or not e["id"].startswith("ec."):
                    errors.add("native-effect-ids.json", f"bad entry {e!r}")
                    break
        except (OSError, ValueError) as exc:
            errors.add("native-effect-ids.json", f"cannot read: {exc}")

    return errors, {k: len(v) for k, v in docs.items()}


def main():
    errors, counts = validate()
    for kind, count in sorted(counts.items()):
        print(f"{kind:12} {count:4}")
    print(f"{'total':12} {sum(counts.values()):4}")
    if errors:
        print(f"\n{len(errors)} error(s):", file=sys.stderr)
        for e in errors:
            print("  " + e, file=sys.stderr)
        return 1
    print("catalog OK")
    return 0


if __name__ == "__main__":
    sys.exit(main())
