// ================================================================== Flow Catalogue engine
//
// The catalogue is data: 503 presets validated by scripts/catalog_schema.py and embedded above.
// This block turns a preset into real layers, effects and expressions. Every native effect is
// checked before use and every addProperty() call stays inside a try/catch, so a host that ships
// an older effect registry disables one card instead of breaking the panel.
//
// Naming contract, used by removal and by the tests:
//   effects, text animators, masks -> "Flow: cat <preset id> ..."
//   created layers                 -> comment "flow:cat:<preset id>"
//   time remap expressions         -> comment "flow:cat:<preset id>" inside the expression

var CAT_KIND_KEYS = ["titles", "textAnims", "transitions", "effects", "gradients", "palettes", "captions", "sfx", "tools"];
var CAT_KIND_LABELS = {
  titles: "Titles",
  textAnims: "Text animations",
  transitions: "Transitions",
  effects: "Effects",
  gradients: "Gradients & generators",
  palettes: "Palettes",
  captions: "Captions",
  sfx: "Sounds",
  tools: "Tools"
};
var CAT_STRINGS = {
  fr: {
    titles: "Titres", textAnims: "Animations de texte", transitions: "Transitions", effects: "Effets",
    gradients: "D\u00e9grad\u00e9s & g\u00e9n\u00e9rateurs", palettes: "Palettes", captions: "Sous-titres",
    sfx: "Sons", tools: "Outils", catalogue: "Catalogue", allKinds: "Tous les types", allFamilies: "Toutes les familles",
    search: "Rechercher", recent: "R\u00e9cents", add: "Ajouter \u00e0 la timeline", remove: "Retirer", unavailable: "Indisponible",
    missingFx: "Effet natif absent", approx: "Approximation", notInstalled: "Non install\u00e9",
    openComp: "Ouvrez d'abord une composition.", selectLayers: "S\u00e9lectionnez au moins un calque.",
    selectTwo: "S\u00e9lectionnez au moins deux calques.", selectText: "S\u00e9lectionnez un calque de texte.",
    applied: "ajout\u00e9", removed: "retir\u00e9", nothing: "Rien \u00e0 retirer.",
    helperOff: "Le helper Flow Studio n'est pas lanc\u00e9.", soundMissing: "Ce son n'est pas encore install\u00e9.",
    toolMissing: "Cet outil n'est pas disponible dans cette version.", beatsHint: "Utilisez Montage > Rythme & Beat.",
    done: "Termin\u00e9.", noLayers: "Aucun calque s\u00e9lectionn\u00e9.",
    timeRemap: "Le remappage temporel demande un calque de s\u00e9quence ou une pr\u00e9composition.",
    timeRemapSelect: "S\u00e9lectionnez un calque de s\u00e9quence ou une pr\u00e9composition.",
    timeRemapSkipped: "Calques sans remappage temporel ignor\u00e9s"
  },
  en: {
    titles: "Titles", textAnims: "Text animations", transitions: "Transitions", effects: "Effects",
    gradients: "Gradients & generators", palettes: "Palettes", captions: "Captions",
    sfx: "Sounds", tools: "Tools", catalogue: "Catalogue", allKinds: "All kinds", allFamilies: "All families",
    search: "Search", recent: "Recent", add: "Add to timeline", remove: "Remove", unavailable: "Unavailable",
    missingFx: "Native effect missing", approx: "Approximation", notInstalled: "Not installed",
    openComp: "Open a composition first.", selectLayers: "Select one or more layers first.",
    selectTwo: "Select at least two layers.", selectText: "Select a text layer first.",
    applied: "added", removed: "removed", nothing: "Nothing to remove.",
    helperOff: "The Flow Studio helper is not running.", soundMissing: "This sound is not installed yet.",
    toolMissing: "This tool is not available in this version.", beatsHint: "Use Montage > Rhythm & Beat.",
    done: "Done.", noLayers: "No layer selected.",
    timeRemap: "Time remapping needs a footage or precomposition layer.",
    timeRemapSelect: "Select a footage or precomposition layer first.",
    timeRemapSkipped: "Layers without time remapping skipped"
  },
  ar: {
    titles: "\u0627\u0644\u0639\u0646\u0627\u0648\u064a\u0646", textAnims: "\u062d\u0631\u0643\u0627\u062a \u0627\u0644\u0646\u0635", transitions: "\u0627\u0644\u0627\u0646\u062a\u0642\u0627\u0644\u0627\u062a", effects: "\u0627\u0644\u062a\u0623\u062b\u064a\u0631\u0627\u062a",
    gradients: "\u0627\u0644\u062a\u062f\u0631\u062c\u0627\u062a \u0648\u0627\u0644\u0645\u0648\u0644\u062f\u0627\u062a", palettes: "\u0644\u0648\u062d\u0627\u062a \u0627\u0644\u0623\u0644\u0648\u0627\u0646", captions: "\u0627\u0644\u062a\u0631\u062c\u0645\u0627\u062a",
    sfx: "\u0627\u0644\u0623\u0635\u0648\u0627\u062a", tools: "\u0627\u0644\u0623\u062f\u0648\u0627\u062a", catalogue: "\u0627\u0644\u0643\u062a\u0627\u0644\u0648\u062c", allKinds: "\u0643\u0644 \u0627\u0644\u0623\u0646\u0648\u0627\u0639", allFamilies: "\u0643\u0644 \u0627\u0644\u0639\u0627\u0626\u0644\u0627\u062a",
    search: "\u0628\u062d\u062b", recent: "\u0627\u0644\u0623\u062d\u062f\u062b", add: "\u0623\u0636\u0641 \u0625\u0644\u0649 \u0627\u0644\u062e\u0637 \u0627\u0644\u0632\u0645\u0646\u064a", remove: "\u0625\u0632\u0627\u0644\u0629", unavailable: "\u063a\u064a\u0631 \u0645\u062a\u0627\u062d",
    missingFx: "\u0627\u0644\u062a\u0623\u062b\u064a\u0631 \u0627\u0644\u0623\u0635\u0644\u064a \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f", approx: "\u062a\u0642\u0631\u064a\u0628", notInstalled: "\u063a\u064a\u0631 \u0645\u062b\u0628\u062a",
    openComp: "\u0627\u0641\u062a\u062d \u062a\u0631\u0643\u064a\u0628\u064b\u0627 \u0623\u0648\u0644\u064b\u0627.", selectLayers: "\u0627\u062e\u062a\u0631 \u0637\u0628\u0642\u0629 \u0648\u0627\u062d\u062f\u0629 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.",
    selectTwo: "\u0627\u062e\u062a\u0631 \u0637\u0628\u0642\u062a\u064a\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644.", selectText: "\u0627\u062e\u062a\u0631 \u0637\u0628\u0642\u0629 \u0646\u0635 \u0623\u0648\u0644\u064b\u0627.",
    applied: "\u062a\u0645\u062a \u0627\u0644\u0625\u0636\u0627\u0641\u0629", removed: "\u062a\u0645\u062a \u0627\u0644\u0625\u0632\u0627\u0644\u0629", nothing: "\u0644\u0627 \u0634\u064a\u0621 \u0644\u0625\u0632\u0627\u0644\u062a\u0647.",
    helperOff: "\u0645\u0633\u0627\u0639\u062f Flow Studio \u063a\u064a\u0631 \u0645\u0634\u063a\u0644.", soundMissing: "\u0647\u0630\u0627 \u0627\u0644\u0635\u0648\u062a \u063a\u064a\u0631 \u0645\u062b\u0628\u062a \u0628\u0639\u062f.",
    toolMissing: "\u0647\u0630\u0647 \u0627\u0644\u0623\u062f\u0627\u0629 \u063a\u064a\u0631 \u0645\u062a\u0627\u062d\u0629 \u0641\u064a \u0647\u0630\u0647 \u0627\u0644\u0646\u0633\u062e\u0629.", beatsHint: "\u0627\u0633\u062a\u062e\u062f\u0645 Montage > Rhythm & Beat.",
    done: "\u062a\u0645.", noLayers: "\u0644\u0645 \u064a\u062a\u0645 \u0627\u062e\u062a\u064a\u0627\u0631 \u0623\u064a \u0637\u0628\u0642\u0629.",
    timeRemap: "\u064a\u062d\u062a\u0627\u062c \u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u062a\u0648\u0642\u064a\u062a \u0625\u0644\u0649 \u0637\u0628\u0642\u0629 \u0644\u0642\u0637\u0627\u062a \u0623\u0648 \u062a\u0631\u0643\u064a\u0628 \u0645\u0633\u0628\u0642.",
    timeRemapSelect: "\u0627\u062e\u062a\u0631 \u0637\u0628\u0642\u0629 \u0644\u0642\u0637\u0627\u062a \u0623\u0648 \u062a\u0631\u0643\u064a\u0628\u064b\u0627 \u0645\u0633\u0628\u0642\u064b\u0627 \u0623\u0648\u0644\u064b\u0627.",
    timeRemapSkipped: "\u062a\u0645 \u062a\u062c\u0627\u0647\u0644 \u0627\u0644\u0637\u0628\u0642\u0627\u062a \u0627\u0644\u062a\u064a \u0644\u0627 \u062a\u062f\u0639\u0645 \u062a\u063a\u064a\u064a\u0631 \u0627\u0644\u062a\u0648\u0642\u064a\u062a"
  }
};

function catTr(key) {
  var table = CAT_STRINGS[LANG] || CAT_STRINGS.en;
  if (table[key] !== undefined) return table[key];
  if (CAT_STRINGS.en[key] !== undefined) return CAT_STRINGS.en[key];
  return String(key);
}

function catKindLabel(key) {
  var map = { titles: "titles", textAnims: "textAnims", transitions: "transitions", effects: "effects",
    gradients: "gradients", palettes: "palettes", captions: "captions", sfx: "sfx", tools: "tools" };
  return catTr(map[key] || "catalogue");
}

function catItems(key) {
  var list = FLOW_CATALOG && FLOW_CATALOG[key];
  return list && list.length ? list : [];
}

function catAll() {
  var out = [];
  for (var i = 0; i < CAT_KIND_KEYS.length; i++) {
    var key = CAT_KIND_KEYS[i];
    var list = catItems(key);
    for (var j = 0; j < list.length; j++) out.push(list[j]);
  }
  return out;
}

function catById(id) {
  var all = catAll();
  for (var i = 0; i < all.length; i++) if (all[i].id === id) return all[i];
  return null;
}

function catTextById(id) {
  var list = catItems("textAnims");
  for (var i = 0; i < list.length; i++) if (list[i].id === id) return list[i];
  return null;
}

function catFamilies(key) {
  var list = catItems(key);
  var seen = {};
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var f = String(list[i].family || "");
    if (!f || seen[f]) continue;
    seen[f] = true;
    out.push(f);
  }
  return out;
}

function catNum(value, fallback, lo, hi) {
  var n = typeof value === "number" && isFinite(value) ? value : fallback;
  if (lo !== undefined && n < lo) n = lo;
  if (hi !== undefined && n > hi) n = hi;
  return n;
}

function catBool(value) {
  return value === true;
}

function catColor(hex, fallback) {
  var rgb = hexToUnit(hex, fallback || [1, 1, 1]);
  return [rgb[0], rgb[1], rgb[2], 1];
}

// ------------------------------------------------------------------ native availability

var CAT_NATIVE = null;
var CAT_NATIVE_SOURCE = "";
var CAT_SFX_CHECKED = false;
var CAT_SFX_MAP = {};

function catNativeMap() {
  if (CAT_NATIVE) return CAT_NATIVE;
  var map = {};
  try {
    var list = app.run("effect.list", {});
    if (list && list.length) {
      for (var i = 0; i < list.length; i++) {
        var e = list[i];
        if (e && e.id) map[String(e.id)] = String(e.name || e.id);
      }
      CAT_NATIVE_SOURCE = "host";
    }
  } catch (e) {}
  if (!map["ec.blur.gaussian"] && FLOW_NATIVE_IDS && FLOW_NATIVE_IDS.length) {
    for (var j = 0; j < FLOW_NATIVE_IDS.length; j++) map[FLOW_NATIVE_IDS[j]] = FLOW_NATIVE_IDS[j];
    CAT_NATIVE_SOURCE = "snapshot";
  }
  CAT_NATIVE = map;
  return map;
}

function catHasFx(id) {
  var map = catNativeMap();
  return map && map[id] !== undefined;
}

var CAT_OP_FX = {
  fade: [],
  dip: ["ec.color.exposure"],
  exposure: ["ec.color.exposure"],
  grain: ["ec.noise.noise"],
  blur: ["ec.blur.gaussian"],
  levels: ["ec.color.brightnesscontrast"],
  slide: ["ec.distort.transform"],
  push: ["ec.distort.transform"],
  blurdir: ["ec.blur.directional"],
  spin: ["ec.distort.transform"],
  zoom: ["ec.distort.transform"],
  zoomthrough: ["ec.distort.transform"],
  dolly: ["ec.distort.transform"],
  swing: ["ec.distort.transform"],
  scaleWidth: ["ec.distort.transform"],
  wipe: ["ec.transition.linearwipe"],
  rotate: ["ec.distort.transform"],
  iris: ["ec.transition.iriswipe"],
  radial: ["ec.transition.radialwipe"],
  venetian: ["ec.transition.venetian"],
  mosaic: ["ec.stylize.mosaic"],
  glitch: ["ec.distort.transform"],
  rgbsplit: ["ec.vr.chromaticaberrations"],
  flash: ["ec.color.exposure"],
  leak: ["ec.generate.cclightsweep"],
  burn: ["ec.stylize.ccburnfilm"],
  ripple: ["ec.distort.ripple"],
  wave: ["ec.distort.wavewarp"],
  shake: ["ec.distort.transform"],
  strobe: ["ec.color.exposure"],
  smear: ["ec.blur.directional"],
  look: ["ec.color.lumetri"],
  bw: ["ec.color.blackwhite"],
  duotone: ["ec.color.tritone"],
  glow: ["ec.stylize.glow"],
  radialblur: ["ec.blur.radial"],
  scanlines: ["ec.generate.grid"],
  flicker: ["ec.color.exposure"],
  posterize: ["ec.stylize.posterize"],
  echo: ["ec.time.echo"],
  findedges: ["ec.stylize.findedges"],
  kaleido: ["ec.distort.mirror"],
  vignette: ["ec.color.lumetri"],
  letterbox: [],
  safezone: [],
  sharpen: ["ec.blur.unsharp"],
  denoise: ["ec.noise.removegrain"],
  freeze: [],
  speedramp: [],
  reverse: [],
  mirror: ["ec.distort.mirror"],
  crop: [],
  punch: ["ec.distort.transform"],
  pushin: ["ec.distort.transform"],
  pullout: ["ec.distort.transform"],
  wiggle: ["ec.distort.transform"],
  rotatepulse: ["ec.distort.transform"],
  drift: ["ec.distort.transform"],
  bounce: ["ec.distort.transform"],
  offset: ["ec.distort.transform"]
};

var CAT_GEN_FX = {
  solid: ["ec.generate.fill"],
  checker: ["ec.generate.checkerboard"],
  grid: ["ec.generate.grid"],
  noise: ["ec.noise.noise"]
};

function catRequiredFx(item) {
  var out = [];
  var ops = item.ops || [];
  for (var i = 0; i < ops.length; i++) {
    var need = CAT_OP_FX[ops[i].op] || [];
    for (var j = 0; j < need.length; j++) if (out.indexOf(need[j]) < 0) out.push(need[j]);
  }
  if (item.kind === "gradient" && item.sub === "generator") {
    var gen = CAT_GEN_FX[item.gen] || [];
    for (var k = 0; k < gen.length; k++) if (out.indexOf(gen[k]) < 0) out.push(gen[k]);
  }
  var style = item.style || {};
  if (item.kind === "title") {
    if (style.shadow && out.indexOf("ec.perspective.dropshadow") < 0) out.push("ec.perspective.dropshadow");
    if (style.glow && out.indexOf("ec.stylize.glow") < 0) out.push("ec.stylize.glow");
  }
  if (item.kind === "caption" && style.shadow && out.indexOf("ec.perspective.dropshadow") < 0) {
    out.push("ec.perspective.dropshadow");
  }
  return out;
}

function catEnsureSfx() {
  if (CAT_SFX_CHECKED) return CAT_SFX_MAP;
  CAT_SFX_CHECKED = true;
  try {
    if (typeof libLoadSounds === "function") libLoadSounds();
  } catch (e) {}
  for (var i = 0; i < libSounds.length; i++) {
    var s = libSounds[i];
    if (!s || !s.name) continue;
    CAT_SFX_MAP[String(s.name).toLowerCase()] = s;
    CAT_SFX_MAP[String(s.name).toLowerCase().replace(/[^a-z0-9]+/g, "")] = s;
  }
  return CAT_SFX_MAP;
}

function catSfxEntry(item) {
  var map = catEnsureSfx();
  var name = String(item.name || "").toLowerCase();
  if (map[name]) return map[name];
  var compact = name.replace(/[^a-z0-9]+/g, "");
  return map[compact] || null;
}

function catToolMissing(item) {
  if (item.tool === "marker.beats") return catTr("beatsHint");
  if (item.tool === "history.repeat" || item.tool === "history.clear") return catTr("toolMissing");
  if (item.tool === "layer.precompose" && !catHostHasPrecompose()) return catTr("toolMissing");
  return "";
}

function catHostHasPrecompose() {
  try {
    var comp = activeComp();
    return !!(comp && comp.layers && typeof comp.layers.precompose === "function");
  } catch (e) {
    return false;
  }
}

// Time remapping is a host capability of the layer, not of the preset: footage and precompositions
// can be remapped, solids, text and shapes cannot. The catalogue greys those cards from the current
// selection instead of letting the apply fail halfway.
var CAT_REMAP_OPS = { freeze: true, speedramp: true, reverse: true };
var CAT_REMAP_TOOLS = { "time.freeze": true, "time.reverse": true };

function catNeedsRemap(item) {
  if (!item) return false;
  if (item.kind === "tool") return !!CAT_REMAP_TOOLS[item.tool];
  var ops = item.ops || [];
  for (var i = 0; i < ops.length; i++) {
    if (CAT_REMAP_OPS[ops[i].op]) return true;
  }
  return false;
}

function catCanRemap(layer) {
  if (!layer) return false;
  try {
    if (layer.timeRemapEnabled) return true;
  } catch (e) {}
  var source = null;
  try {
    source = layer.source;
  } catch (e2) {
    source = null;
  }
  if (!source) return false;
  try {
    if (source instanceof CompItem) return true;
  } catch (e3) {}
  try {
    return !!(source.mainSource && source.mainSource.file);
  } catch (e4) {
    return false;
  }
}

function catRemapTargets(layers) {
  var out = [];
  for (var i = 0; layers && i < layers.length; i++) {
    if (catCanRemap(layers[i])) out.push(layers[i]);
  }
  return out;
}

function catSelectedLayers() {
  try {
    var comp = activeComp();
    return comp ? comp.selectedLayers : [];
  } catch (e) {
    return [];
  }
}

// Returns { ok: true } or { ok: false, reason: "..." }.
function catEnabled(item, layers) {
  if (!item) return { ok: false, reason: catTr("nothing") };
  var needs = catRequiredFx(item);
  for (var i = 0; i < needs.length; i++) {
    if (!catHasFx(needs[i])) return { ok: false, reason: catTr("missingFx") + ": " + needs[i] };
  }
  if (item.kind === "sfx") {
    var map = catEnsureSfx();
    var entry = catSfxEntry(item);
    if (!entry) {
      var any = false;
      for (var k in map) { any = true; break; }
      return { ok: false, reason: any ? catTr("soundMissing") : catTr("helperOff") };
    }
  }
  if (item.kind === "tool") {
    var missing = catToolMissing(item);
    if (missing) return { ok: false, reason: missing };
  }
  if (catNeedsRemap(item)) {
    var sel = layers || catSelectedLayers();
    if (!sel.length) return { ok: false, reason: catTr("timeRemapSelect") };
    if (!catRemapTargets(sel).length) return { ok: false, reason: catTr("timeRemap") };
  }
  return { ok: true };
}

// ------------------------------------------------------------------ effect helpers

// Returns the effect, or null when the host does not ship it. catEnabled() is the gate that tells
// the user why a card is greyed; this guard only keeps one missing effect from breaking the apply.
function catAddFx(layer, id, tag, suffix) {
  try {
    var parade = layer.property("ADBE Effect Parade");
    var fx = parade.addProperty(id);
    fx.name = "Flow: " + tag + (suffix ? " " + suffix : "");
    return fx;
  } catch (e) {
    return null;
  }
}

function catSet(fx, paths, value) {
  if (!fx) return false;
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    var target = fx;
    var parts = String(path).split("/");
    var ok = true;
    for (var j = 0; j < parts.length; j++) {
      try {
        target = target.property(parts[j]);
      } catch (e) {
        target = null;
        ok = false;
        break;
      }
      if (!target) { ok = false; break; }
    }
    if (!ok || !target) continue;
    try {
      target.setValue(value);
      return true;
    } catch (e2) {}
  }
  return false;
}

function catExpr(fx, paths, expression) {
  if (!fx) return false;
  for (var i = 0; i < paths.length; i++) {
    var path = paths[i];
    var target = fx;
    var parts = String(path).split("/");
    var ok = true;
    for (var j = 0; j < parts.length; j++) {
      try {
        target = target.property(parts[j]);
      } catch (e) {
        target = null;
        ok = false;
        break;
      }
      if (!target) { ok = false; break; }
    }
    if (!ok || !target) continue;
    try {
      target.expression = expression;
      return true;
    } catch (e2) {}
  }
  return false;
}

// The Transform effect keeps independent scale axes: setting only Scale Height stretches the layer.
// Every scale op must set both, in the same expression.
function catSetScale(fx, value) {
  var h = catSet(fx, ["scaleHeight", "Scale Height"], value);
  var w = catSet(fx, ["scaleWidth", "Scale Width"], value);
  return h || w;
}

function catExprScale(fx, expression) {
  var h = catExpr(fx, ["scaleHeight", "Scale Height"], expression);
  var w = catExpr(fx, ["scaleWidth", "Scale Width"], expression);
  return h || w;
}

function catWindow(t0, dur, easing, reverse) {
  var d = Math.max(0.0001, dur);
  return fxWindow(Math.round(t0 * 1000) / 1000, d, easing) +
    "var away=" + (reverse ? "E(p)" : "1-E(p)") + ";";
}

function catTransform(layer, tag, suffix) {
  return catAddFx(layer, "ec.distort.transform", tag, suffix);
}

function catApplyTextFont(td, style, k) {
  var font = String(style.font || "Inter");
  var weight = style.weight && style.weight !== "Regular" ? String(style.weight) : "";
  var picked = false;
  if (weight) {
    // The weight suffix is a request, not a guarantee: keep the base family when it is absent.
    try { td.font = font + "-" + weight; picked = true; } catch (e) {}
  }
  if (!picked) {
    try { td.font = font; } catch (e2) {}
  }
  try { td.fontSize = Math.max(1, catNum(style.size, 54, 1, 4000) * k); } catch (e3) {}
  try { td.fillColor = hexToUnit(style.fill, [1, 1, 1]); td.applyFill = true; } catch (e4) {}
  if (style.stroke) {
    try {
      td.applyStroke = true;
      td.strokeColor = hexToUnit(style.stroke, [0, 0, 0]);
      td.strokeWidth = catNum(style.strokeWidth, 0, 0, 40) * k;
    } catch (e5) {}
  } else {
    try { td.applyStroke = false; } catch (e6) {}
  }
  try { td.tracking = catNum(style.tracking, 0, -1000, 1000); } catch (e7) {}
  try { td.leading = Math.max(1, catNum(style.size, 54, 1, 4000) * catNum(style.leading, 1.15, 0.5, 3) * k); } catch (e8) {}
  try {
    td.justification = style.align === "left" ? ParagraphJustification.LEFT_JUSTIFY :
      style.align === "right" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY;
  } catch (e9) {}
  try {
    if (style.rtl) td.direction = ParagraphDirection.RIGHT_TO_LEFT;
  } catch (e10) {}
  return td;
}

function catAnchorPoint(style, comp) {
  var m = catNum(style.margin, 0.08, 0, 0.3);
  var x = comp.width / 2, y = comp.height / 2;
  if (String(style.anchor).indexOf("left") >= 0) x = comp.width * m;
  else if (String(style.anchor).indexOf("right") >= 0) x = comp.width * (1 - m);
  if (String(style.anchor).indexOf("top") >= 0) y = comp.height * m;
  else if (String(style.anchor).indexOf("bottom") >= 0) y = comp.height * (1 - m);
  return [x, y];
}

function catPlaceText(layer, style, comp, atTime) {
  var target = catAnchorPoint(style, comp);
  var rect = null;
  try { rect = layer.sourceRectAtTime(atTime, false); } catch (e) {}
  if (!rect) return [target[0], target[1]];
  var x = target[0], y = target[1];
  if (String(style.anchor).indexOf("left") >= 0) x -= rect.left;
  else if (String(style.anchor).indexOf("right") >= 0) x -= rect.left + rect.width;
  else x -= rect.left + rect.width / 2;
  if (String(style.anchor).indexOf("top") >= 0) y -= rect.top;
  else if (String(style.anchor).indexOf("bottom") >= 0) y -= rect.top + rect.height;
  else y -= rect.top + rect.height / 2;
  layer.transform.position.setValue([x, y]);
  return [x, y];
}

function catShapeRect(comp, name, comment, center, size, radius, color, opacity, t0, t1) {
  var s = comp.layers.addShape();
  s.name = name;
  s.comment = comment;
  var contents = s.property("Contents") || s.property("ADBE Root Vectors Group");
  var group = contents.addProperty("ADBE Vector Group");
  var gcontents = group.property("Contents");
  var rect = gcontents.addProperty("ADBE Vector Shape - Rect");
  try { rect.property("ADBE Vector Rect Size").setValue(size); } catch (e) {}
  try { if (radius > 0) rect.property("ADBE Vector Rect Roundness").setValue(radius); } catch (e2) {}
  var fill = gcontents.addProperty("ADBE Vector Graphic - Fill");
  try { fill.property("ADBE Vector Fill Color").setValue(color); } catch (e3) {}
  try { s.transform.position.setValue(center); } catch (e4) {}
  try { if (opacity < 100) s.transform.opacity.setValue(opacity); } catch (e5) {}
  s.inPoint = t0;
  s.outPoint = t1;
  return s;
}

function catShapeOutline(comp, name, comment, center, size, color, width, t0, t1) {
  var s = comp.layers.addShape();
  s.name = name;
  s.comment = comment;
  var contents = s.property("Contents") || s.property("ADBE Root Vectors Group");
  var group = contents.addProperty("ADBE Vector Group");
  var gcontents = group.property("Contents");
  var rect = gcontents.addProperty("ADBE Vector Shape - Rect");
  try { rect.property("ADBE Vector Rect Size").setValue(size); } catch (e) {}
  var stroke = gcontents.addProperty("ADBE Vector Graphic - Stroke");
  try { stroke.property("ADBE Vector Stroke Color").setValue(color); } catch (e3) {}
  try { stroke.property("ADBE Vector Stroke Width").setValue(width); } catch (e4) {}
  try { s.transform.position.setValue(center); } catch (e5) {}
  s.inPoint = t0;
  s.outPoint = t1;
  return s;
}

function catTextShadow(layer, tag, style, k) {
  try {
    var fx = catAddFx(layer, "ec.perspective.dropshadow", tag, "shadow");
    catSet(fx, ["color", "Shadow Color"], [0, 0, 0, 1]);
    catSet(fx, ["opacity", "Opacity"], 45);
    catSet(fx, ["direction", "Direction"], 135);
    catSet(fx, ["distance", "Distance"], 4 * k);
    catSet(fx, ["softness", "Softness"], 8 * k);
  } catch (e) {}
}

function catTextGlow(layer, tag, style, k) {
  try {
    var fx = catAddFx(layer, "ec.stylize.glow", tag, "glow");
    catSet(fx, ["radius", "Glow Radius"], 24 * k);
    catSet(fx, ["intensity", "Glow Intensity"], 1.4);
    catSet(fx, ["threshold", "Glow Threshold"], 40);
  } catch (e) {}
}

// ------------------------------------------------------------------ text animators

function catTextAnimator(layer, name) {
  var anims = layer.property("ADBE Text Properties").property("ADBE Text Animators");
  var a = anims.addProperty("ADBE Text Animator");
  a.name = "Flow: " + name;
  return a;
}

function catApplyTextAnim(layer, anim, mode, t0, dur, tag) {
  if (!anim) return;
  var a = catTextAnimator(layer, tag + " " + mode);
  var props = a.property("ADBE Text Animator Properties");
  var from = anim.from || {};

  if (mode === "loop") {
    var loop = anim.loop;
    var period = Math.max(0.1, catNum(anim.period, 2, 0.1, 60));
    var amount = catNum(anim.amount, 2, 0, 100);
    var phase = "var a=time*" + (2 * Math.PI / period) + ";";
    if (loop === "position") {
      try {
        props.addProperty("ADBE Text Position 3D").expression = phase + "[0," + amount + "*Math.sin(a),0];";
      } catch (e) {}
    } else if (loop === "scale") {
      try {
        props.addProperty("ADBE Text Scale 3D").expression = phase + "var s=100+" + amount + "*Math.sin(a);[s,s,s];";
      } catch (e2) {}
    } else if (loop === "opacity") {
      try {
        props.addProperty("ADBE Text Opacity").expression = phase + "100-" + amount + "*(0.5+0.5*Math.sin(a));";
      } catch (e3) {}
    } else {
      try {
        props.addProperty("ADBE Text Fill Color").expression =
          phase + "[0.5+0.5*Math.sin(a),0.5+0.5*Math.sin(a+2.094),0.5+0.5*Math.sin(a+4.188),1];";
      } catch (e4) {}
    }
    var selL = a.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    try { selL.property("ADBE Text Percent Start").setValue(0); } catch (e5) {}
    try { selL.property("ADBE Text Percent End").setValue(100); } catch (e6) {}
    return;
  }

  if (from.opacity !== undefined) {
    try { props.addProperty("ADBE Text Opacity").setValue(catNum(from.opacity, 0, 0, 100)); } catch (e7) {}
  }
  if (from.position) {
    try { props.addProperty("ADBE Text Position 3D").setValue([catNum(from.position[0], 0, -10000, 10000), catNum(from.position[1], 0, -10000, 10000), 0]); } catch (e8) {}
  }
  if (from.scale !== undefined) {
    var sc = catNum(from.scale, 100, 0, 1000);
    try { props.addProperty("ADBE Text Scale 3D").setValue([sc, sc, sc]); } catch (e9) {}
  }
  if (from.rotation !== undefined) {
    try { props.addProperty("ADBE Text Rotation").setValue(catNum(from.rotation, 0, -3600, 3600)); } catch (e10) {}
  }
  if (from.blur !== undefined) {
    var bl = catNum(from.blur, 0, 0, 500);
    try { props.addProperty("ADBE Text Blur").setValue([bl, bl]); } catch (e11) {}
  }
  if (from.tracking !== undefined) {
    try { props.addProperty("ADBE Text Tracking Amount").setValue(catNum(from.tracking, 0, -500, 500)); } catch (e12) {}
  }

  var sel = a.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
  var windowExpr = catWindow(t0, catNum(dur, anim.duration, 0.05, 20), anim.easing || "outCubic", mode === "out");
  try {
    // In: the selector's Start runs 0 -> 100, so characters leave the "from" state unit by unit.
    // Out: Start stays 0 and End runs 0 -> 100 (End = 100*E), so characters enter it and disappear.
    sel.property("ADBE Text Percent Start").expression = windowExpr + (mode === "out" ? "0;" : "100*E(p);");
    sel.property("ADBE Text Percent End").expression = windowExpr + (mode === "out" ? "100*E(p);" : "100;");
  } catch (e13) {}
  try {
    var adv = sel.property("advanced");
    adv.property("basedOn").setValue(BASED_ON[anim.unit] || 1);
    adv.property("easeHigh").setValue(0);
    adv.property("easeLow").setValue(0);
    adv.property("smoothness").setValue(catNum(anim.smooth, 100, 0, 100));
    adv.property("randomize").setValue(anim.random ? 1 : 0);
  } catch (e14) {}
}

// ------------------------------------------------------------------ ops

function catApplyOp(layer, op, item, comp, t0, dur, reverse, tag, suffix, win, constantAll, isEffect) {
  var name = op.op;
  var w = comp.width, h = comp.height;
  var fx, i, j;

  if (name === "fade") {
    fx = catTransform(layer, tag, suffix);
    if (constantAll) catSet(fx, ["opacity", "Opacity"], 100);
    else catExpr(fx, ["opacity", "Opacity"], win + "100*(1-away);");
    return;
  }
  if (name === "dip") {
    var custom = op.color === "custom";
    if (custom) {
      fx = catAddFx(layer, "ec.color.tint", tag, suffix);
      var c = catColor(op.value || "#000000", [0, 0, 0]);
      catSet(fx, ["black", "Map Black To"], c);
      catSet(fx, ["white", "Map White To"], c);
      if (constantAll) catSet(fx, ["amount", "Amount to Tint"], 100);
      else catExpr(fx, ["amount", "Amount to Tint"], win + "100*away;");
    } else {
      fx = catAddFx(layer, "ec.color.exposure", tag, suffix);
      var amount = catNum(op.amount, 8, 0, 20) * (op.color === "white" ? 1 : -1);
      if (constantAll) catSet(fx, ["master/exposure", "Master/Exposure"], amount);
      else catExpr(fx, ["master/exposure", "Master/Exposure"], win + amount + "*away;");
    }
    return;
  }
  if (name === "exposure") {
    fx = catAddFx(layer, "ec.color.exposure", tag, suffix);
    var ev = catNum(op.amount, 1, 0, 20);
    if (constantAll) catSet(fx, ["master/exposure", "Master/Exposure"], ev);
    else catExpr(fx, ["master/exposure", "Master/Exposure"], win + ev + "*away;");
    return;
  }
  if (name === "grain") {
    fx = catAddFx(layer, "ec.noise.noise", tag, suffix);
    var g = catNum(op.amount, 15, 0, 100);
    if (constantAll) catSet(fx, ["amount", "Amount of Noise"], g);
    else catExpr(fx, ["amount", "Amount of Noise"], win + g + "*away;");
    return;
  }
  if (name === "blur") {
    fx = catAddFx(layer, "ec.blur.gaussian", tag, suffix);
    var b = catNum(op.amount, 20, 0, 500);
    if (constantAll || catBool(op.constant)) catSet(fx, ["blurriness", "Blurriness"], b);
    else catExpr(fx, ["blurriness", "Blurriness"], win + b + "*away;");
    return;
  }
  if (name === "levels") {
    fx = catAddFx(layer, "ec.color.brightnesscontrast", tag, suffix);
    var lv = catNum(op.amount, 40, 0, 100);
    if (constantAll) catSet(fx, ["contrast", "Contrast"], lv);
    else catExpr(fx, ["contrast", "Contrast"], win + lv + "*away;");
    return;
  }
  if (name === "slide" || name === "push") {
    fx = catTransform(layer, tag, suffix);
    var dx = catNum(op.dx, 0, -2, 2) * w;
    var dy = catNum(op.dy, 0, -2, 2) * h;
    catExpr(fx, ["position", "Position"], win + "[value[0]+" + dx + "*away,value[1]+" + dy + "*away];");
    return;
  }
  if (name === "blurdir") {
    fx = catAddFx(layer, "ec.blur.directional", tag, suffix);
    catSet(fx, ["direction", "Direction"], catNum(op.direction, 0, 0, 360));
    var bl = catNum(op.amount, 40, 0, 500);
    if (constantAll || catBool(op.constant)) catSet(fx, ["length", "Blur Length"], bl);
    else catExpr(fx, ["length", "Blur Length"], win + bl + "*away;");
    return;
  }
  if (name === "spin") {
    fx = catTransform(layer, tag, suffix);
    var ang = catNum(op.angle, -180, -720, 720);
    var sc = catNum(op.scale, 30, 0, 400);
    catExpr(fx, ["rotation", "Rotation"], win + ang + "*away;");
    catExprScale(fx, win + sc + "+(100-" + sc + ")*(1-away);");
    return;
  }
  if (name === "zoom") {
    fx = catTransform(layer, tag, suffix);
    var from = catNum(op.from, 250, 0, 1000);
    catExprScale(fx, win + from + "+(100-" + from + ")*(1-away);");
    return;
  }
  if (name === "zoomthrough") {
    fx = catTransform(layer, tag, suffix);
    catExprScale(fx, win + "100+900*away;");
    catExpr(fx, ["opacity", "Opacity"], win + "100*(1-away*0.85);");
    return;
  }
  if (name === "dolly") {
    fx = catTransform(layer, tag, suffix);
    catExprScale(fx, win + "100+35*away;");
    var db = catAddFx(layer, "ec.blur.gaussian", tag, suffix ? suffix + " blur" : "blur");
    catExpr(db, ["blurriness", "Blurriness"], win + "18*away;");
    return;
  }
  if (name === "swing") {
    fx = catTransform(layer, tag, suffix);
    catExpr(fx, ["rotation", "Rotation"], win + catNum(op.angle, 25, -90, 90) + "*away;");
    return;
  }
  if (name === "scaleWidth") {
    fx = catTransform(layer, tag, suffix);
    var sw = catNum(op.from, 0, 0, 100);
    catExpr(fx, ["scaleWidth", "Scale Width"], win + sw + "+(100-" + sw + ")*(1-away);");
    return;
  }
  if (name === "wipe") {
    fx = catAddFx(layer, "ec.transition.linearwipe", tag, suffix);
    catSet(fx, ["angle", "Wipe Angle"], catNum(op.angle, 0, -360, 360));
    catSet(fx, ["feather", "Feather"], catNum(op.feather, 10, 0, 200));
    catExpr(fx, ["completion", "Transition Completion"], win + "100*away;");
    return;
  }
  if (name === "rotate") {
    fx = catTransform(layer, tag, suffix);
    catSet(fx, ["rotation", "Rotation"], catNum(op.angle, 0, -90, 90));
    return;
  }
  if (name === "iris") {
    fx = catAddFx(layer, "ec.transition.iriswipe", tag, suffix);
    var maxR = Math.sqrt(w * w + h * h);
    catSet(fx, ["center", "Iris Center"], [0.5, 0.5]);
    catSet(fx, ["points", "Iris Points"], catNum(op.points, 12, 3, 100));
    catSet(fx, ["feather", "Feather"], 6);
    catExpr(fx, ["outerRadius", "Outer Radius"], win + "(1-away)*" + maxR + ";");
    return;
  }
  if (name === "radial") {
    fx = catAddFx(layer, "ec.transition.radialwipe", tag, suffix);
    catSet(fx, ["startAngle", "Start Angle"], catNum(op.angle, 0, -360, 360));
    catSet(fx, ["feather", "Feather"], 6);
    catExpr(fx, ["completion", "Transition Completion"], win + "100*away;");
    return;
  }
  if (name === "venetian") {
    fx = catAddFx(layer, "ec.transition.venetian", tag, suffix);
    catSet(fx, ["direction", "Direction"], op.direction === "horizontal" ? 0 : 90);
    catSet(fx, ["width", "Width"], catNum(op.width, 12, 1, 200));
    catSet(fx, ["feather", "Feather"], 2);
    catExpr(fx, ["completion", "Transition Completion"], win + "100*away;");
    return;
  }
  if (name === "mosaic") {
    fx = catAddFx(layer, "ec.stylize.mosaic", tag, suffix);
    var max = catNum(op.max, 40, 2, 2000);
    if (constantAll || catBool(op.constant)) {
      catSet(fx, ["horizontal", "Horizontal Blocks"], max);
      catSet(fx, ["vertical", "Vertical Blocks"], max);
    } else {
      var code = win + "Math.max(2,Math.round(4000-(4000-" + max + ")*away));";
      catExpr(fx, ["horizontal", "Horizontal Blocks"], code);
      catExpr(fx, ["vertical", "Vertical Blocks"], code);
    }
    return;
  }
  if (name === "glitch") {
    fx = catTransform(layer, tag, suffix);
    var ga = catNum(op.amount, 50, 0, 500);
    var gf = catNum(op.fps, 16, 1, 60);
    var jitter = "var s=Math.floor(time*" + gf + ");var ja=Math.abs(Math.sin(s*12.9898)*43758.5453)%1;var jb=Math.abs(Math.sin(s*78.233)*12345.678)%1;";
    catExpr(fx, ["position", "Position"], win + jitter + "[value[0]+(ja-0.5)*" + ga + "*away,value[1]+(jb-0.5)*" + (ga * 0.16) + "*away];");
    try {
      var ca = catAddFx(layer, "ec.vr.chromaticaberrations", tag, suffix ? suffix + " rgb" : "rgb");
      catExpr(ca, ["aberrationRed", "Aberration (Red)"], win + (ga * 0.08) + "*away;");
      catExpr(ca, ["aberrationBlue", "Aberration (Blue)"], win + "-" + (ga * 0.08) + "*away;");
    } catch (e) {}
    return;
  }
  if (name === "rgbsplit") {
    fx = catAddFx(layer, "ec.vr.chromaticaberrations", tag, suffix);
    var ra = catNum(op.amount, 20, 0, 200);
    if (constantAll) {
      catSet(fx, ["aberrationRed", "Aberration (Red)"], ra);
      catSet(fx, ["aberrationBlue", "Aberration (Blue)"], -ra);
    } else {
      catExpr(fx, ["aberrationRed", "Aberration (Red)"], win + ra + "*away;");
      catExpr(fx, ["aberrationBlue", "Aberration (Blue)"], win + "-" + ra + "*away;");
    }
    return;
  }
  if (name === "flash") {
    fx = catAddFx(layer, "ec.color.exposure", tag, suffix);
    var fa = catNum(op.amount, 4, 0, 20);
    catExpr(fx, ["master/exposure", "Master/Exposure"], win + fa + "*away;");
    return;
  }
  if (name === "leak") {
    fx = catAddFx(layer, "ec.generate.cclightsweep", tag, suffix);
    catSet(fx, ["center", "Center"], [0.5, 0.5]);
    catSet(fx, ["direction", "Direction"], -30);
    catSet(fx, ["width", "Width"], 120);
    catSet(fx, ["lightColor", "Light Color"], [1, 0.86, 0.62, 1]);
    var la = catNum(op.amount, 120, 0, 500);
    catExpr(fx, ["sweepIntensity", "Sweep Intensity"], win + la + "*away;");
    catExpr(fx, ["edgeIntensity", "Edge Intensity"], win + "100*away;");
    return;
  }
  if (name === "burn") {
    fx = catAddFx(layer, "ec.stylize.ccburnfilm", tag, suffix);
    var ba = catNum(op.amount, 80, 0, 100);
    if (constantAll) catSet(fx, ["burn", "Burn"], ba);
    else catExpr(fx, ["burn", "Burn"], win + ba + "*away;");
    return;
  }
  if (name === "ripple") {
    fx = catAddFx(layer, "ec.distort.ripple", tag, suffix);
    var rr = catNum(op.radius, 50, 0, 500);
    catSet(fx, ["radius", "Radius"], rr);
    catSet(fx, ["waveWidth", "Wave Width"], 40);
    catSet(fx, ["speed", "Wave Speed"], 1);
    if (constantAll) catSet(fx, ["waveHeight", "Wave Height"], rr * 0.25);
    else catExpr(fx, ["waveHeight", "Wave Height"], win + (rr * 0.25) + "*away;");
    return;
  }
  if (name === "wave") {
    fx = catAddFx(layer, "ec.distort.wavewarp", tag, suffix);
    var wh = catNum(op.height, 20, 0, 500);
    catSet(fx, ["width", "Wave Width"], 80);
    catSet(fx, ["speed", "Wave Speed"], catNum(op.speed, 1, 0, 20));
    if (constantAll || isEffect) catSet(fx, ["height", "Wave Height"], wh);
    else catExpr(fx, ["height", "Wave Height"], win + wh + "*away;");
    return;
  }
  if (name === "shake" || name === "wiggle") {
    fx = catTransform(layer, tag, suffix);
    var sa = catNum(op.amount, 20, 0, 200);
    var sf = catNum(op.fps, 12, 1, 60);
    catExpr(fx, ["position", "Position"], win + "var w=wiggle(" + sf + "," + sa + ");[value[0]+(w[0]-value[0])*away,value[1]+(w[1]-value[1])*away];");
    return;
  }
  if (name === "strobe") {
    fx = catAddFx(layer, "ec.color.exposure", tag, suffix);
    var st = catNum(op.amount, 2.5, 0, 20);
    var stf = catNum(op.fps, 14, 1, 60);
    catExpr(fx, ["master/exposure", "Master/Exposure"], win + "(Math.floor((time-t0)*" + stf + ")%2===0?" + st + "*away:0);");
    return;
  }
  if (name === "smear") {
    fx = catAddFx(layer, "ec.blur.directional", tag, suffix);
    catSet(fx, ["direction", "Direction"], 0);
    var sm = catNum(op.amount, 60, 0, 500);
    catExpr(fx, ["length", "Blur Length"], win + sm + "*away;");
    return;
  }
  if (name === "look") {
    fx = catAddFx(layer, "ec.color.lumetri", tag, suffix);
    if (op.temperature !== undefined) catSet(fx, ["basicCorrection/whiteBalance/temperature"], catNum(op.temperature, 0, -100, 100));
    if (op.tint !== undefined) catSet(fx, ["basicCorrection/whiteBalance/tint"], catNum(op.tint, 0, -100, 100));
    if (op.exposure !== undefined) catSet(fx, ["basicCorrection/tone/exposure"], catNum(op.exposure, 0, -5, 5));
    if (op.contrast !== undefined) catSet(fx, ["basicCorrection/tone/contrast"], catNum(op.contrast, 0, -100, 100));
    if (op.highlights !== undefined) catSet(fx, ["basicCorrection/tone/highlights"], catNum(op.highlights, 0, -100, 100));
    if (op.shadows !== undefined) catSet(fx, ["basicCorrection/tone/shadows"], catNum(op.shadows, 0, -100, 100));
    if (op.blacks !== undefined) catSet(fx, ["basicCorrection/tone/blacks"], catNum(op.blacks, 0, -100, 100));
    if (op.saturation !== undefined) catSet(fx, ["basicCorrection/saturation"], catNum(100 + op.saturation, 100, 0, 200));
    if (op.vibrance !== undefined) catSet(fx, ["creative/adjustments/vibrance"], catNum(op.vibrance, 0, -100, 100));
    if (op.faded !== undefined) catSet(fx, ["creative/adjustments/fadedFilm"], catNum(op.faded, 0, 0, 100));
    return;
  }
  if (name === "bw") {
    fx = catAddFx(layer, "ec.color.blackwhite", tag, suffix);
    catSet(fx, ["tint", "Tint"], false);
    if (op.contrast) {
      var bc = catAddFx(layer, "ec.color.brightnesscontrast", tag, suffix ? suffix + " contrast" : "contrast");
      catSet(bc, ["contrast", "Contrast"], catNum(op.contrast, 0, -100, 100));
    }
    return;
  }
  if (name === "duotone") {
    fx = catAddFx(layer, "ec.color.tritone", tag, suffix);
    var sh = catColor(op.shadow || "#000000", [0, 0, 0]);
    var hi = catColor(op.highlight || "#FFFFFF", [1, 1, 1]);
    catSet(fx, ["shadows", "Shadows"], sh);
    catSet(fx, ["highlights", "Highlights"], hi);
    catSet(fx, ["midtones", "Midtones"], [(sh[0] + hi[0]) / 2, (sh[1] + hi[1]) / 2, (sh[2] + hi[2]) / 2, 1]);
    catSet(fx, ["blend", "Blend With Original"], 100);
    return;
  }
  if (name === "glow") {
    fx = catAddFx(layer, "ec.stylize.glow", tag, suffix);
    catSet(fx, ["radius", "Glow Radius"], catNum(op.radius, 30, 0, 1000));
    catSet(fx, ["intensity", "Glow Intensity"], catNum(op.intensity, 1.2, 0, 255));
    catSet(fx, ["threshold", "Glow Threshold"], catNum(op.threshold, 60, 0, 100));
    return;
  }
  if (name === "radialblur") {
    fx = catAddFx(layer, "ec.blur.radial", tag, suffix);
    catSet(fx, ["type", "Type"], op.type === "zoom" ? 1 : 0);
    var rb = catNum(op.amount, 20, 0, 500);
    if (constantAll || catBool(op.constant)) catSet(fx, ["amount", "Amount"], rb);
    else catExpr(fx, ["amount", "Amount"], win + rb + "*away;");
    return;
  }
  if (name === "scanlines") {
    fx = catAddFx(layer, "ec.generate.grid", tag, suffix);
    catSet(fx, ["anchor", "Anchor"], [0, 0]);
    catSet(fx, ["width", "Width"], w);
    catSet(fx, ["height", "Height"], 4);
    catSet(fx, ["border", "Border"], 2);
    catSet(fx, ["color", "Color"], [0, 0, 0, 1]);
    catSet(fx, ["opacity", "Opacity"], catNum(op.amount, 30, 0, 100));
    catSet(fx, ["sizeFrom", "Size From"], 1);
    return;
  }
  if (name === "flicker") {
    fx = catAddFx(layer, "ec.color.exposure", tag, suffix);
    var fk = catNum(op.amount, 2, 0, 20);
    catExpr(fx, ["master/exposure", "Master/Exposure"], win + "var s=Math.floor(time*18);var f=Math.abs(Math.sin(s*12.9898)*43758.5453)%1;" + fk + "*(f-0.5)*away;");
    return;
  }
  if (name === "posterize") {
    fx = catAddFx(layer, "ec.stylize.posterize", tag, suffix);
    catSet(fx, ["level", "Level"], catNum(op.levels, 6, 2, 255));
    return;
  }
  if (name === "echo") {
    fx = catAddFx(layer, "ec.time.echo", tag, suffix);
    catSet(fx, ["numberOfEchoes", "Number Of Echoes"], catNum(op.count, 4, 1, 32));
    catSet(fx, ["echoTime", "Echo Time (seconds)"], -2 / Math.max(1, comp.frameRate));
    catSet(fx, ["decay", "Decay"], catNum(op.intensity, 80, 0, 100) / 100);
    return;
  }
  if (name === "findedges") {
    fx = catAddFx(layer, "ec.stylize.findedges", tag, suffix);
    catSet(fx, ["invert", "Invert"], false);
    catSet(fx, ["blend", "Blend With Original"], 0);
    return;
  }
  if (name === "kaleido") {
    fx = catAddFx(layer, "ec.distort.mirror", tag, suffix);
    catSet(fx, ["angle", "Reflection Angle"], 180 / catNum(op.segments, 6, 2, 32));
    return;
  }
  if (name === "vignette") {
    fx = catAddFx(layer, "ec.color.lumetri", tag, suffix);
    catSet(fx, ["vignette/vignetteAmount"], catNum(op.amount, -50, -200, 200) / 20);
    catSet(fx, ["vignette/vignetteMidpoint"], 50);
    catSet(fx, ["vignette/vignetteFeather"], 50);
    return;
  }
  if (name === "letterbox") {
    catLetterbox(comp, item, catNum(op.ratio, 2.39, 0.4, 3), t0, isEffect ? comp.duration : t0 + Math.max(5, dur));
    return;
  }
  if (name === "safezone") {
    catSafezone(comp, item, t0, isEffect ? comp.duration : t0 + Math.max(5, dur));
    return;
  }
  if (name === "sharpen") {
    fx = catAddFx(layer, "ec.blur.unsharp", tag, suffix);
    catSet(fx, ["amount", "Amount"], catNum(op.amount, 40, 0, 500));
    catSet(fx, ["radius", "Radius"], 2);
    catSet(fx, ["threshold", "Threshold"], 0);
    return;
  }
  if (name === "denoise") {
    fx = catAddFx(layer, "ec.noise.removegrain", tag, suffix);
    catSet(fx, ["noiseReductionSettings/noiseReduction"], catNum(1 + catNum(op.radius, 2, 0, 50) / 10, 1, 1, 5));
    catSet(fx, ["noiseReductionSettings/passes"], 2);
    catSet(fx, ["viewingMode", "Viewing Mode"], 3);
    return;
  }
  if (name === "freeze") {
    catTimeRemap(layer, item.id, "var t=" + Math.max(0, comp.time - layer.startTime) + ";t;");
    return;
  }
  if (name === "speedramp") {
    catTimeRemap(layer, item.id, "var x=Math.max(0,time-inPoint);var d=Math.max(0.001,outPoint-inPoint);x+0.5*x*x/d;");
    return;
  }
  if (name === "reverse") {
    catTimeRemap(layer, item.id, "(outPoint-inPoint)-(time-inPoint);");
    return;
  }
  if (name === "mirror") {
    fx = catAddFx(layer, "ec.distort.mirror", tag, suffix);
    catSet(fx, ["angle", "Reflection Angle"], catNum(op.angle, 90, -360, 360));
    return;
  }
  if (name === "crop") {
    catCropMask(layer, item, comp, catNum(op.ratio, 0.5625, 0.2, 3));
    return;
  }
  if (name === "punch") {
    fx = catTransform(layer, tag, suffix);
    catExprScale(fx, win + "100+" + catNum(op.amount, 20, 0, 200) + "*away;");
    return;
  }
  if (name === "pushin") {
    fx = catTransform(layer, tag, suffix);
    catExprScale(fx, win + "100+" + catNum(op.amount, 15, 0, 200) + "*(1-away);");
    return;
  }
  if (name === "pullout") {
    fx = catTransform(layer, tag, suffix);
    catExprScale(fx, win + "100+" + catNum(op.amount, 15, 0, 200) + "*away;");
    return;
  }
  if (name === "rotatepulse") {
    fx = catTransform(layer, tag, suffix);
    var rp = catNum(op.amount, 4, 0, 90);
    catExpr(fx, ["rotation", "Rotation"], win + rp + "*Math.sin(time*Math.PI)*away;");
    return;
  }
  if (name === "drift") {
    fx = catTransform(layer, tag, suffix);
    var da = catNum(op.amount, 10, 0, 200);
    var dp = Math.max(0.5, catNum(op.period, 6, 0.5, 60));
    catExpr(fx, ["position", "Position"], "var a=time*" + (2 * Math.PI / dp) + ";[value[0]+" + da + "*Math.sin(a),value[1]+" + da + "*Math.cos(a*0.8)];");
    return;
  }
  if (name === "bounce") {
    fx = catTransform(layer, tag, suffix);
    var bo = catNum(op.amount, 60, 0, 500);
    catExpr(fx, ["position", "Position"], win + "[value[0],value[1]-" + bo + "*away*Math.abs(Math.sin(Math.PI*3*E(p)))];");
    return;
  }
  if (name === "offset") {
    fx = catTransform(layer, tag, suffix);
    catExpr(fx, ["position", "Position"], "[value[0]+" + (catNum(op.x, 0, -2, 2) * w) + ",value[1]+" + (catNum(op.y, 0, -2, 2) * h) + "];");
    return;
  }
  // Unknown ops are refused by the schema; if one reaches here, leave the layer untouched rather
  // than inventing an effect.
}

function catApplyOps(layer, ops, item, comp, t0, dur, reverse, isEffect) {
  var tag = "cat " + item.id;
  var constantAll = isEffect && dur <= 0.05;
  // The window is always built, even in the constant case: every op that animates reads `away`
  // from it, and a missing prelude would leave an expression referencing an undefined name.
  var win = catWindow(t0, dur, "outCubic", reverse);
  for (var i = 0; i < ops.length; i++) {
    var suffix = ops.length > 1 ? " " + (i + 1) : "";
    catApplyOp(layer, ops[i], item, comp, t0, dur, reverse, tag, suffix, win, constantAll, isEffect);
  }
}

function catTimeRemap(layer, id, expression) {
  try {
    layer.timeRemapEnabled = true;
    layer.timeRemap.expression = "/* flow:cat:" + id + " */ " + expression;
  } catch (e) {
    throw new Error("Time remapping is not available on this layer.");
  }
}

function catCropMask(layer, item, comp, ratio) {
  var mw = comp.width, mh = comp.width / Math.max(0.01, ratio);
  if (mh > comp.height) { mh = comp.height; mw = comp.height * ratio; }
  var x = (comp.width - mw) / 2, y = (comp.height - mh) / 2;
  try {
    var masks = layer.property("ADBE Mask Parade");
    var mask = masks.addProperty("ADBE Mask Atom");
    mask.name = "Flow: cat " + item.id + " crop";
    mask.maskMode = MaskMode.ADD;
    var shape = new Shape();
    shape.vertices = [[x, y], [x + mw, y], [x + mw, y + mh], [x, y + mh]];
    shape.closed = true;
    mask.property("ADBE Mask Shape").setValue(shape);
  } catch (e) {
    throw new Error("Crop needs a mask on this layer: " + e);
  }
}

function catLetterbox(comp, item, ratio, t0, t1) {
  var bar = (comp.height - comp.width / ratio) / 2;
  if (bar <= 0.5) return;
  var comment = "flow:cat:" + item.id;
  var a = comp.layers.addSolid([0, 0, 0], "Flow: cat " + item.id + " bar 1", comp.width, bar, comp.pixelAspect, comp.duration);
  a.comment = comment;
  a.inPoint = t0;
  a.outPoint = Math.min(comp.duration, t1);
  try { a.transform.position.setValue([comp.width / 2, bar / 2]); } catch (e) {}
  var b = comp.layers.addSolid([0, 0, 0], "Flow: cat " + item.id + " bar 2", comp.width, bar, comp.pixelAspect, comp.duration);
  b.comment = comment;
  b.inPoint = t0;
  b.outPoint = Math.min(comp.duration, t1);
  try { b.transform.position.setValue([comp.width / 2, comp.height - bar / 2]); } catch (e2) {}
}

function catSafezone(comp, item, t0, t1) {
  var comment = "flow:cat:" + item.id;
  var sizes = [[0.9, "Action"], [0.8, "Title"]];
  for (var i = 0; i < sizes.length; i++) {
    var s = sizes[i];
    var layer = catShapeOutline(comp, "Flow: cat " + item.id + " safe " + s[1], comment,
      [comp.width / 2, comp.height / 2], [comp.width * s[0], comp.height * s[0]],
      [1, 1, 1, 1], 2 * (comp.height / 1080), t0, Math.min(comp.duration, t1));
    try { layer.guideLayer = true; } catch (e) {}
  }
}

// ------------------------------------------------------------------ titles

function catApplyTitle(item, comp) {
  var style = item.style;
  var k = comp.height / 1080;
  var text = String(item.text || "");
  if (style.caps === "upper") text = text.toUpperCase();
  else if (style.caps === "lower") text = text.toLowerCase();
  var t0 = comp.time;
  var t1 = Math.min(comp.duration, t0 + catNum(item.duration, 4.5, 0.5, 60));
  var td = catApplyTextFont(new TextDocument(text), style, k);
  var layer = comp.layers.addText(td);
  layer.name = "Flow: " + item.name;
  layer.comment = "flow:cat:" + item.id;
  layer.inPoint = t0;
  layer.outPoint = t1;
  var pos = catPlaceText(layer, style, comp, t0);
  var rect = null;
  try { rect = layer.sourceRectAtTime(t0, false); } catch (e) {}

  var tag = "cat " + item.id;
  var pad = style.size * k * 0.38;
  if (rect && (style.glass || style.bar || style.underline)) {
    var left = pos[0] + rect.left, top = pos[1] + rect.top;
    var bgW = rect.width + pad * 2, bgH = rect.height + pad * 0.9;
    var shape = null;
    if (style.glass) {
      var gc = catColor(style.glassFill || "#FFFFFF", [1, 1, 1]);
      shape = catShapeRect(comp, "Flow: " + item.name + " glass", "flow:cat:" + item.id,
        [left + bgW / 2, top + bgH / 2 - pad * 0.1], [bgW, bgH], Math.min(28, bgH * 0.22), gc,
        catNum(style.glassOpacity, 12, 0, 100), t0, t1);
    } else if (style.bar) {
      var bc = catColor(style.barFill || "#5CE1FF", [0.36, 0.88, 1]);
      shape = catShapeRect(comp, "Flow: " + item.name + " bar", "flow:cat:" + item.id,
        [left + bgW / 2, top + bgH / 2 - pad * 0.1], [bgW, bgH], 0, bc, 100, t0, t1);
    }
    if (shape) {
      try {
        shape.parent = layer;
        shape.transform.position.setValue([left + bgW / 2 - pos[0], top + bgH / 2 - pad * 0.1 - pos[1]]);
        shape.moveAfter(layer);
      } catch (e2) {}
    }
    if (style.underline) {
      var uc = catColor(style.underlineColor || "#5CE1FF", [0.36, 0.88, 1]);
      var ul = catShapeRect(comp, "Flow: " + item.name + " underline", "flow:cat:" + item.id,
        [left + rect.width / 2, top + rect.height + pad * 0.18], [rect.width, Math.max(2, style.size * k * 0.06)],
        0, uc, 100, t0, t1);
      try {
        ul.parent = layer;
        ul.transform.position.setValue([left + rect.width / 2 - pos[0], top + rect.height + pad * 0.18 - pos[1]]);
        ul.moveAfter(layer);
      } catch (e3) {}
    }
  }

  if (style.shadow) catTextShadow(layer, tag, style, k);
  if (style.glow) catTextGlow(layer, tag, style, k);

  var anim = catTextById(item.anim);
  if (anim) catApplyTextAnim(layer, anim, "in", t0, anim.duration, tag);
  var outAnim = catTextById(item.out);
  if (outAnim) {
    var outStart = Math.max(t0, t1 - catNum(outAnim.duration, 0.6, 0.05, 20));
    catApplyTextAnim(layer, outAnim, "out", outStart, outAnim.duration, tag);
  }
  return "\"" + item.name + "\" " + catTr("applied") + ".";
}

// ------------------------------------------------------------------ text animations

function catApplyTextItem(item, comp, layers) {
  var targets = [];
  for (var i = 0; i < layers.length; i++) {
    if (layers[i].property("Source Text")) targets.push(layers[i]);
  }
  if (!targets.length) throw new Error(catTr("selectText"));
  var mode = item.mode === "out" ? "out" : item.mode === "loop" ? "loop" : "in";
  for (var j = 0; j < targets.length; j++) {
    var layer = targets[j];
    catClearLayer(layer, item.id);
    var start = comp.time;
    if (mode === "out") start = Math.max(layer.inPoint, layer.outPoint - catNum(item.duration, 0.6, 0.05, 20));
    else if (start < layer.inPoint) start = layer.inPoint;
    catApplyTextAnim(layer, item, mode, start, item.duration, "cat " + item.id);
  }
  return "\"" + item.name + "\" " + catTr("applied") + ".";
}

// ------------------------------------------------------------------ gradients, palettes, captions

function catApplyGradient(item, comp) {
  var t0 = comp.time;
  var t1 = Math.min(comp.duration, t0 + 6);
  var layer = comp.layers.addSolid([0, 0, 0], "Flow: " + item.name, comp.width, comp.height, comp.pixelAspect, comp.duration);
  layer.comment = "flow:cat:" + item.id;
  layer.inPoint = t0;
  layer.outPoint = t1;
  layer.moveToEnd();
  if (item.sub === "generator") {
    catApplyGenerator(item, layer, comp);
    return "\"" + item.name + "\" " + catTr("applied") + ".";
  }
  var bg = item.bg;
  var colors = bg.colors || [];
  var kind = bg.kind === "four" ? "four" : bg.kind === "radial" ? "radial" : "linear";
  // A four-corner gradient keeps its four stops. The ramp only has two, so it spans the whole
  // range: first stop to last stop.
  var p = {
    name: item.name,
    kind: kind,
    colors: kind === "four"
      ? [colors[0] || "#000000", colors[1] || "#FFFFFF", colors[2] || "#FFFFFF", colors[3] || "#FFFFFF"]
      : [colors[0] || "#000000", colors[3] || colors[1] || "#FFFFFF", colors[2], colors[3]],
    angle: bg.angle,
    anim: bg.anim,
    speed: bg.speed
  };
  paintGradient(layer, p, comp.width, comp.height);
  catTagGradientEffects(layer, item.id);
  return "\"" + item.name + "\" " + catTr("applied") + ".";
}

function catTagGradientEffects(layer, id) {
  var parade = layer.property("ADBE Effect Parade");
  for (var i = 1; i <= parade.numProperties; i++) {
    var fx = parade.property(i);
    if (String(fx.name) === "Flow Gradient") fx.name = "Flow: cat " + id;
  }
}

function catApplyGenerator(item, layer, comp) {
  var gen = item.gen;
  var color = catColor(item.color || "#101526", [0.06, 0.08, 0.15]);
  var tag = "cat " + item.id;
  if (gen === "solid") {
    var fill = catAddFx(layer, "ec.generate.fill", tag);
    catSet(fill, ["color", "Color"], color);
    return;
  }
  if (gen === "grey-scale") {
    paintGradient(layer, { name: item.name, kind: "linear", colors: ["#000000", "#FFFFFF", "#FFFFFF", "#FFFFFF"], angle: 0, anim: "none", speed: 0 }, comp.width, comp.height);
    catTagGradientEffects(layer, item.id);
    return;
  }
  if (gen === "checker" || gen === "grid") {
    var fx = catAddFx(layer, gen === "checker" ? "ec.generate.checkerboard" : "ec.generate.grid", tag);
    catSet(fx, ["anchor", "Anchor"], [0, 0]);
    catSet(fx, ["width", "Width"], 64);
    catSet(fx, ["height", "Height"], 64);
    catSet(fx, ["color", "Color"], color);
    if (gen === "grid") catSet(fx, ["border", "Border"], 2);
    return;
  }
  if (gen === "noise") {
    var n = catAddFx(layer, "ec.noise.noise", tag);
    catSet(n, ["amount", "Amount of Noise"], 18);
    catSet(n, ["color", "Use Color Noise"], true);
    return;
  }
  if (gen === "color-bars-smpte" || gen === "color-bars-ebu") {
    var bars = ["#C0C0C0", "#C0C000", "#00C0C0", "#00C000", "#C000C0", "#C00000", "#0000C0"];
    var bw = comp.width / bars.length;
    for (var i = 0; i < bars.length; i++) {
      catShapeRect(comp, "Flow: " + item.name + " bar " + (i + 1), "flow:cat:" + item.id,
        [bw * (i + 0.5), comp.height / 2], [bw, comp.height], 0, catColor(bars[i], [0.5, 0.5, 0.5]), 100, layer.inPoint, layer.outPoint);
    }
    try { layer.remove(); } catch (e) {}
    return;
  }
  if (gen === "countdown") {
    for (var n = 5; n >= 1; n--) {
      var td = new TextDocument(String(n));
      td.fontSize = comp.height * 0.35;
      td.fillColor = [1, 1, 1];
      td.applyFill = true;
      td.justification = ParagraphJustification.CENTER_JUSTIFY;
      var t = comp.layers.addText(td);
      t.name = "Flow: " + item.name + " " + n;
      t.comment = "flow:cat:" + item.id;
      t.inPoint = layer.inPoint + (5 - n);
      t.outPoint = Math.min(layer.outPoint, t.inPoint + 1);
      t.transform.position.setValue([comp.width / 2, comp.height / 2]);
    }
    try { layer.remove(); } catch (e2) {}
    return;
  }
  if (gen === "grid") return;
}

function catApplyPalette(item, comp) {
  var t0 = comp.time;
  var t1 = Math.min(comp.duration, t0 + 6);
  var colors = item.colors || [];
  var cardW = Math.min(comp.width * 0.78, 960);
  var sw = cardW / colors.length;
  var cardH = sw * 1.15;
  var x0 = (comp.width - cardW) / 2;
  var y0 = (comp.height - cardH) / 2;
  for (var i = 0; i < colors.length; i++) {
    catShapeRect(comp, "Flow: " + item.name + " " + (i + 1), "flow:cat:" + item.id,
      [x0 + sw * (i + 0.5), y0 + cardH / 2], [sw - 6, cardH], 8, catColor(colors[i], [1, 1, 1]), 100, t0, t1);
  }
  var td = new TextDocument(item.name);
  td.fontSize = Math.max(18, comp.height * 0.028);
  td.fillColor = [1, 1, 1];
  td.applyFill = true;
  td.justification = ParagraphJustification.CENTER_JUSTIFY;
  var label = comp.layers.addText(td);
  label.name = "Flow: " + item.name + " label";
  label.comment = "flow:cat:" + item.id;
  label.inPoint = t0;
  label.outPoint = t1;
  label.transform.position.setValue([comp.width / 2, y0 - comp.height * 0.05]);
  return "\"" + item.name + "\" " + catTr("applied") + ".";
}

// Caption styles are their own model (`fontFamily`, `fontStyle`, `fontSize`, `lineSpacing`), not the
// title model, so they get their own mapping instead of falling through undefined values.
function catCaptionStyle(td, style, k) {
  var family = String(style.fontFamily || "Inter");
  var face = style.fontStyle && style.fontStyle !== "Regular" ? String(style.fontStyle) : "";
  var picked = false;
  if (face) {
    try { td.font = family + "-" + face; picked = true; } catch (e) {}
  }
  if (!picked) {
    try { td.font = family; } catch (e2) {}
  }
  var size = catNum(style.fontSize, 54, 4, 500);
  try { td.fontSize = Math.max(1, size * k); } catch (e3) {}
  try { td.fillColor = hexToUnit(style.fill, [1, 1, 1]); td.applyFill = true; } catch (e4) {}
  var sw = catNum(style.strokeWidth, 0, 0, 40);
  if (style.stroke && sw > 0) {
    try {
      td.applyStroke = true;
      td.strokeColor = hexToUnit(style.stroke, [0, 0, 0]);
      td.strokeWidth = sw * k;
    } catch (e5) {}
  } else {
    try { td.applyStroke = false; } catch (e6) {}
  }
  try { td.tracking = catNum(style.tracking, 0, -1000, 1000); } catch (e7) {}
  try { td.leading = Math.max(1, size * catNum(style.lineSpacing, 1.2, 0.5, 3) * k); } catch (e8) {}
  try {
    td.justification = style.align === "left" ? ParagraphJustification.LEFT_JUSTIFY :
      style.align === "right" ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY;
  } catch (e9) {}
  if (style.uppercase) {
    try { td.allCaps = true; } catch (e10) {}
  }
  return td;
}

function catApplyCaption(item, comp, layers) {
  var st = item.style;
  var k = comp.height / 1080;
  var targets = [];
  for (var i = 0; i < layers.length; i++) {
    if (layers[i].property("Source Text")) targets.push(layers[i]);
  }
  if (!targets.length) {
    var t0 = comp.time;
    var t1 = Math.min(comp.duration, t0 + 4);
    var td = catCaptionStyle(new TextDocument("Caption style preview"), st, k);
    var sample = comp.layers.addText(td);
    sample.name = "Flow: " + item.name;
    sample.comment = "flow:cat:" + item.id;
    sample.inPoint = t0;
    sample.outPoint = t1;
    var anchor = String(st.position.anchor || "bottom");
    var pos = catAnchorPoint({ anchor: anchor === "top" ? "top-center" : anchor === "middle" ? "middle-center" : "bottom-center", margin: st.position.margin, align: st.align }, comp);
    var ox = catNum(st.position.offsetX, 0, -50, 50) * comp.width / 100;
    sample.transform.position.setValue([pos[0] + ox, pos[1]]);
    return "\"" + item.name + "\" " + catTr("applied") + ".";
  }
  for (var j = 0; j < targets.length; j++) {
    var layer = targets[j];
    try {
      var doc = layer.property("Source Text").value;
      catCaptionStyle(doc, st, k);
      layer.property("Source Text").setValue(doc);
    } catch (e) {}
    if (st.shadow) {
      try {
        var tag = "cat " + item.id + " " + j;
        var sh = catAddFx(layer, "ec.perspective.dropshadow", tag, "shadow");
        catSet(sh, ["opacity", "Opacity"], catNum(st.shadow.opacity, 60, 0, 100));
        catSet(sh, ["direction", "Direction"], catNum(st.shadow.angle, 135, -360, 360));
        catSet(sh, ["distance", "Distance"], catNum(st.shadow.distance, 4, 0, 200));
        catSet(sh, ["softness", "Softness"], catNum(st.shadow.softness, 8, 0, 200));
        catSet(sh, ["color", "Shadow Color"], catColor(st.shadow.color || "#000000", [0, 0, 0]));
      } catch (e2) {}
    }
  }
  return "\"" + item.name + "\" " + catTr("applied") + ".";
}

// ------------------------------------------------------------------ sounds

function catApplySfx(item, comp) {
  var entry = catSfxEntry(item);
  if (!entry) throw new Error(catTr("soundMissing"));
  sfxPlace(comp, entry, comp.time);
  return "\"" + item.name + "\" " + catTr("applied") + ".";
}

// ------------------------------------------------------------------ tools

function catToolNumber(comp, prefix) {
  var n = 0;
  var prop = comp.markerProperty;
  for (var i = 1; i <= prop.numKeys; i++) {
    if (String(prop.keyValue(i).comment).indexOf(prefix) === 0) n++;
  }
  return n;
}

var CAT_TOOL_IMPL = {
  "marker.chapters": function (item, comp) {
    var n = catToolNumber(comp, "Chapter") + 1;
    comp.markerProperty.setValueAtTime(comp.time, new MarkerValue("Chapter " + n));
    return "Chapter " + n + " " + catTr("applied") + ".";
  },
  "marker.notes": function (item, comp) {
    comp.markerProperty.setValueAtTime(comp.time, new MarkerValue("Note"));
    return "Note " + catTr("applied") + ".";
  },
  "layer.rename": function (item, comp, layers) {
    if (!layers.length) throw new Error(catTr("selectLayers"));
    for (var i = 0; i < layers.length; i++) {
      var n = i + 1;
      layers[i].name = "Layer " + (n < 10 ? "0" : "") + n;
    }
    return layers.length + " " + catTr("applied") + ".";
  },
  "layer.labels": function (item, comp, layers) {
    if (!layers.length) throw new Error(catTr("selectLayers"));
    for (var i = 0; i < layers.length; i++) {
      try { layers[i].label = ((layers[i].label || 0) % 16) + 1; } catch (e) {}
    }
    return layers.length + " " + catTr("applied") + ".";
  },
  "layer.nulls": function (item, comp, layers) {
    if (!layers.length) throw new Error(catTr("selectLayers"));
    var ax = 0, ay = 0;
    for (var i = 0; i < layers.length; i++) {
      var p = layers[i].transform.position.value;
      ax += p[0]; ay += p[1];
    }
    var nullLayer = comp.layers.addNull();
    nullLayer.name = "Flow: " + item.name;
    nullLayer.comment = "flow:cat:" + item.id;
    nullLayer.inPoint = comp.time;
    nullLayer.outPoint = comp.duration;
    nullLayer.transform.position.setValue([ax / layers.length, ay / layers.length]);
    for (var j = 0; j < layers.length; j++) {
      try { layers[j].parent = nullLayer; } catch (e) {}
    }
    return "Null " + catTr("applied") + ".";
  },
  "layer.anchor": function (item, comp, layers) {
    if (!layers.length) throw new Error(catTr("selectLayers"));
    for (var i = 0; i < layers.length; i++) {
      var l = layers[i];
      var r = [0, 0, comp.width, comp.height];
      try { var sr = l.sourceRectAtTime(comp.time, false); r = [sr.left, sr.top, sr.width, sr.height]; } catch (e) {}
      var center = [r[0] + r[2] / 2, r[1] + r[3] / 2];
      var cur = l.transform.anchorPoint.value;
      var dx = center[0] - cur[0], dy = center[1] - cur[1];
      l.transform.anchorPoint.setValue(center);
      var pos = l.transform.position.value;
      l.transform.position.setValue([pos[0] + dx, pos[1] + dy]);
    }
    return "Anchor " + catTr("applied") + ".";
  },
  "layer.trim": function (item, comp, layers) {
    if (!layers.length) throw new Error(catTr("selectLayers"));
    var n = 0;
    for (var i = 0; i < layers.length; i++) {
      try {
        var contents = layers[i].property("Contents") || layers[i].property("ADBE Root Vectors Group");
        if (!contents) continue;
        var trim = contents.addProperty("ADBE Vector Filter - Trim");
        trim.property("ADBE Vector Trim End").setValueAtTime(comp.time, 0);
        trim.property("ADBE Vector Trim End").setValueAtTime(comp.time + 1, 100);
        n++;
      } catch (e) {}
    }
    if (!n) throw new Error("Select a shape layer first.");
    return n + " " + catTr("applied") + ".";
  },
  "layer.sequence": function (item, comp, layers) {
    if (layers.length < 2) throw new Error(catTr("selectTwo"));
    for (var i = 0; i < layers.length; i++) {
      var l = layers[i];
      var shift = i * 0.2;
      var d = l.outPoint - l.inPoint;
      l.startTime += shift;
      l.inPoint += shift;
      l.outPoint = l.inPoint + d;
    }
    return layers.length + " " + catTr("applied") + ".";
  },
  "layer.align-left": function (item, comp, layers) {
    if (!layers.length) throw new Error(catTr("selectLayers"));
    var min = null;
    for (var i = 0; i < layers.length; i++) {
      var x = layers[i].transform.position.value[0];
      if (min === null || x < min) min = x;
    }
    for (var j = 0; j < layers.length; j++) {
      var p = layers[j].transform.position.value;
      layers[j].transform.position.setValue([min, p[1]]);
    }
    return layers.length + " " + catTr("applied") + ".";
  },
  "layer.distribute": function (item, comp, layers) {
    if (layers.length < 2) throw new Error(catTr("selectTwo"));
    var sorted = layers.slice().sort(function (a, b) { return a.transform.position.value[1] - b.transform.position.value[1]; });
    var top = sorted[0].transform.position.value[1];
    var bottom = sorted[sorted.length - 1].transform.position.value[1];
    for (var i = 0; i < sorted.length; i++) {
      var p = sorted[i].transform.position.value;
      var y = top + (bottom - top) * (i / Math.max(1, sorted.length - 1));
      sorted[i].transform.position.setValue([p[0], y]);
    }
    return sorted.length + " " + catTr("applied") + ".";
  },
  "layer.precompose": function (item, comp, layers) {
    if (!layers.length) throw new Error(catTr("selectLayers"));
    if (!comp.layers.precompose) throw new Error(catTr("toolMissing"));
    var indices = [];
    for (var i = 0; i < layers.length; i++) indices.push(layers[i].index);
    comp.layers.precompose(indices, "Flow: " + item.name, true);
    return "Pre-compose " + catTr("applied") + ".";
  },
  "text.explode": function (item, comp, layers) {
    var target = null;
    for (var i = 0; i < layers.length; i++) if (layers[i].property("Source Text")) { target = layers[i]; break; }
    if (!target) throw new Error(catTr("selectText"));
    var orig = target.property("Source Text").value;
    var words = String(orig.text).split(/\s+/);
    var base = target.transform.position.value;
    var made = 0;
    for (var w = 0; w < words.length; w++) {
      if (!words[w]) continue;
      var nd = new TextDocument(words[w]);
      nd.fontSize = orig.fontSize;
      nd.font = orig.font;
      nd.fillColor = orig.fillColor;
      nd.applyFill = true;
      var wl = comp.layers.addText(nd);
      wl.name = "Flow: " + item.name + " " + (w + 1);
      wl.comment = "flow:cat:" + item.id;
      wl.inPoint = target.inPoint;
      wl.outPoint = target.outPoint;
      wl.transform.position.setValue([base[0] + (w - words.length / 2) * (orig.fontSize * 1.5), base[1]]);
      made++;
    }
    target.enabled = false;
    return made + " " + catTr("applied") + ".";
  },
  "layer.batch-offset": function (item, comp, layers) {
    if (!layers.length) throw new Error(catTr("selectLayers"));
    for (var i = 0; i < layers.length; i++) {
      var l = layers[i];
      var shift = i * 0.1;
      var d = l.outPoint - l.inPoint;
      l.startTime += shift;
      l.inPoint += shift;
      l.outPoint = l.inPoint + d;
    }
    return layers.length + " " + catTr("applied") + ".";
  },
  "project.preset-916": function (item, comp) { return catNewComp(comp, 1080, 1920, "9:16"); },
  "project.preset-11": function (item, comp) { return catNewComp(comp, 1080, 1080, "1:1"); },
  "project.preset-45": function (item, comp) { return catNewComp(comp, 1080, 1350, "4:5"); },
  "project.preset-169": function (item, comp) { return catNewComp(comp, 1920, 1080, "16:9"); },
  "project.preset-4k": function (item, comp) { return catNewComp(comp, 3840, 2160, "4K UHD"); },
  "project.safe": function (item, comp) {
    catSafezone(comp, item, comp.time, comp.duration);
    return "Safe areas " + catTr("applied") + ".";
  },
  "time.freeze": function (item, comp, layers) {
    if (!layers.length) throw new Error(catTr("timeRemapSelect"));
    var targets = catRemapTargets(layers);
    if (!targets.length) throw new Error(catTr("timeRemap"));
    for (var i = 0; i < targets.length; i++) catTimeRemap(targets[i], item.id, "var t=" + Math.max(0, comp.time - targets[i].startTime) + ";t;");
    return "Freeze " + catTr("applied") + "." + catRemapNote(layers.length - targets.length);
  },
  "time.reverse": function (item, comp, layers) {
    if (!layers.length) throw new Error(catTr("timeRemapSelect"));
    var targets = catRemapTargets(layers);
    if (!targets.length) throw new Error(catTr("timeRemap"));
    for (var j = 0; j < targets.length; j++) catTimeRemap(targets[j], item.id, "(outPoint-inPoint)-(time-inPoint);");
    return "Reverse " + catTr("applied") + "." + catRemapNote(layers.length - targets.length);
  }
};

function catRemapNote(skipped) {
  return skipped ? " (" + catTr("timeRemapSkipped") + ": " + skipped + ")" : "";
}

function catNewComp(comp, w, h, label) {
  var c = app.project.items.addComp("Flow " + label, w, h, comp.pixelAspect, comp.duration, comp.frameRate);
  try { app.run("comp.open", { comp: c.__id }); } catch (e) {}
  return "Composition " + label + " " + catTr("applied") + ".";
}

function catApplyTool(item, comp, layers) {
  var fn = CAT_TOOL_IMPL[item.tool];
  if (!fn) throw new Error(catTr("toolMissing"));
  if (catNeedsRemap(item)) {
    if (!layers || !layers.length) throw new Error(catTr("timeRemapSelect"));
    if (!catRemapTargets(layers).length) throw new Error(catTr("timeRemap"));
  }
  return fn(item, comp, layers);
}

// ------------------------------------------------------------------ apply and remove

function catApplyItem(item, ctx) {
  if (!item) throw new Error(catTr("nothing"));
  if (!ctx || !ctx.comp) throw new Error(catTr("openComp"));
  var comp = ctx.comp;
  var layers = ctx.layers || comp.selectedLayers;
  var enabled = catEnabled(item, layers);
  if (!enabled.ok) throw new Error(enabled.reason);
  if (item.kind === "title") return catApplyTitle(item, comp);
  if (item.kind === "text") return catApplyTextItem(item, comp, layers);
  if (item.kind === "transition") {
    if (!layers.length) throw new Error(catTr("selectLayers"));
    var sides = ctx.side === 1 ? [true] : ctx.side === 2 ? [false, true] : [false];
    var made = 0;
    for (var i = 0; i < layers.length; i++) {
      for (var s = 0; s < sides.length; s++) {
        var out = sides[s];
        var dur = catNum(item.duration, 1, 0.05, 10);
        var t0 = out ? Math.max(layers[i].inPoint, layers[i].outPoint - dur) : layers[i].inPoint;
        catClearLayer(layers[i], item.id);
        catApplyOps(layers[i], item.ops || [], item, comp, t0, dur, out, false);
        made++;
      }
    }
    return "\"" + item.name + "\" " + catTr("applied") + " (" + made + ").";
  }
  if (item.kind === "effect") {
    var targets = [];
    for (var j = 0; j < layers.length; j++) targets.push(layers[j]);
    var remap = catNeedsRemap(item);
    var skipped = 0;
    if (remap) {
      if (!targets.length) throw new Error(catTr("timeRemapSelect"));
      var capable = catRemapTargets(targets);
      if (!capable.length) throw new Error(catTr("timeRemap"));
      skipped = targets.length - capable.length;
      targets = capable;
    }
    var adjustment = false;
    if (!targets.length) {
      var adj = comp.layers.addSolid([1, 1, 1], "Flow Adjustment: " + item.name, comp.width, comp.height, comp.pixelAspect, comp.duration);
      adj.adjustmentLayer = true;
      adj.comment = "flow:cat:" + item.id;
      adj.inPoint = comp.time;
      targets.push(adj);
      adjustment = true;
    }
    var when = item.when || "playhead";
    for (var k = 0; k < targets.length; k++) {
      var target = targets[k];
      var d = catNum(item.duration, 0.6, 0.01, 30);
      var start = when === "layerStart" ? target.inPoint : when === "layerEnd" ? Math.max(0, target.outPoint - d) : comp.time;
      catClearLayer(target, item.id);
      catApplyOps(target, item.ops || [], item, comp, Math.round(start * 1000) / 1000, d, when === "layerEnd", true);
    }
    return "\"" + item.name + "\" " + catTr("applied") + (adjustment ? " (adjustment layer)" : "") +
      (skipped ? " (" + catTr("timeRemapSkipped") + ": " + skipped + ")" : "") + ".";
  }
  if (item.kind === "gradient") return catApplyGradient(item, comp);
  if (item.kind === "palette") return catApplyPalette(item, comp);
  if (item.kind === "caption") return catApplyCaption(item, comp, layers);
  if (item.kind === "sfx") return catApplySfx(item, comp);
  if (item.kind === "tool") return catApplyTool(item, comp, layers);
  throw new Error(catTr("toolMissing"));
}

function catClearLayer(layer, id) {
  var prefix = "Flow: cat " + id;
  var n = 0;
  try {
    var parade = layer.property("ADBE Effect Parade");
    for (var i = parade.numProperties; i >= 1; i--) {
      if (String(parade.property(i).name).indexOf(prefix) === 0) {
        parade.property(i).remove();
        n++;
      }
    }
  } catch (e) {}
  try {
    var anims = layer.property("ADBE Text Properties").property("ADBE Text Animators");
    for (var j = anims.numProperties; j >= 1; j--) {
      if (String(anims.property(j).name).indexOf(prefix) === 0) {
        anims.property(j).remove();
        n++;
      }
    }
  } catch (e2) {}
  try {
    var masks = layer.property("ADBE Mask Parade");
    for (var k = masks.numProperties; k >= 1; k--) {
      if (String(masks.property(k).name).indexOf(prefix) === 0) {
        masks.property(k).remove();
        n++;
      }
    }
  } catch (e3) {}
  try {
    if (layer.timeRemapEnabled && String(layer.timeRemap.expression).indexOf("flow:cat:" + id) >= 0) {
      layer.timeRemap.expression = "";
      layer.timeRemapEnabled = false;
      n++;
    }
  } catch (e4) {}
  return n;
}

function catRemoveItem(item, comp, layers) {
  if (!item) return 0;
  if (!comp) comp = activeComp();
  if (!comp) throw new Error(catTr("openComp"));
  if (!layers) layers = comp.selectedLayers;
  var n = 0;
  for (var i = 0; i < layers.length; i++) n += catClearLayer(layers[i], item.id);
  var comment = "flow:cat:" + item.id;
  for (var j = comp.numLayers; j >= 1; j--) {
    var l = comp.layers[j];
    if (String(l.comment) === comment || String(l.name).indexOf("Flow: cat " + item.id) === 0) {
      try { l.remove(); n++; } catch (e) {}
    }
  }
  return n;
}
