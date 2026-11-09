// Flow Studio: one dockable panel for easing, an expression library, silence removal,
// auto-captions with a full style editor, text animations, gradient backgrounds, video effects,
// original sound effects, stroke control and the open speech-model manager.
//
// A ScriptUI panel (Window ▸ Flow Studio.jsx) on EffectCraft's public scripting API, so it lives
// in the Scripts folder and an EffectCraft update never replaces it. Original work, MIT OR Apache-2.0.
//
// Everything that needs files, processes or the network (decoding audio, finding silence, running
// whisper.cpp, downloading models) is done by `effectcraft-flow-helper serve`, which this panel
// reaches over a loopback socket. Turn on Preferences ▸ Scripting & Expressions ▸ Allow Scripts
// to Write Files and Access Network so the panel may connect.

(function flowStudio(thisObj) {
  var SECTION = "Flow Studio";
  var G = $.global;
  var DEFAULT_PORT = 9890;



  // // <flow-engine>
  // Generated from flow-install/src/catalog-core.jsx by scripts/build_catalog.py. Do not edit by hand.
// ================================================================== Flow Catalogue engine
//
// The catalogue is data: 499 presets validated by scripts/catalog_schema.py and embedded above.
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
  // // </flow-engine>



  // // <flow-catalog>
  // Generated from catalog/*.json by scripts/build_catalog.py. Do not edit by hand.
  // Every preset is data: field-by-field validated before it is embedded, never evaluated.
  var FLOW_CATALOG = { "schema": 1, "total": 499, "counts": {"titles":60,"textAnims":96,"transitions":55,"effects":70,"gradients":50,"palettes":30,"captions":34,"sfx":80,"tools":24} };
  FLOW_CATALOG.titles = [{"id":"title.lower-third.minimal-line","kind":"title","name":"Minimal Line","family":"Lower thirds","tags":["lowerthird","minimal","name"],"text":"JANE DOE\rDIRECTOR OF PHOTOGRAPHY","duration":4.5,"anim":"text.line-rise","out":"text.fade-up-out","style":{"size":58,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"left","anchor":"bottom-left","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":true,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.lower-third.glass-card","kind":"title","name":"Glass Card","family":"Lower thirds","tags":["lowerthird","glass","card"],"text":"ALEX MORGAN\rCREATIVE DIRECTOR","duration":4.5,"anim":"text.fade-up","out":"text.fade-up-out","style":{"size":54,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"left","anchor":"bottom-left","margin":0.09,"glass":true,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.lower-third.bold-bar","kind":"title","name":"Bold Bar","family":"Lower thirds","tags":["lowerthird","bar","bold"],"text":"SAM RIVERA\rEDITOR","duration":4.5,"anim":"text.words-slide","out":"text.fade-up-out","style":{"size":66,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#0B0E14","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"left","anchor":"bottom-left","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.lower-third.corner-tag","kind":"title","name":"Corner Tag","family":"Lower thirds","tags":["lowerthird","corner","tag"],"text":"LIVE FROM PARIS","duration":4.5,"anim":"text.slide-right","out":"text.fade-down-out","style":{"size":40,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"left","anchor":"top-left","margin":0.05,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#FF5F6D","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.lower-third.underline-slide","kind":"title","name":"Underline Slide","family":"Lower thirds","tags":["lowerthird","underline","slide"],"text":"MAYA CHEN\rFILMMAKER","duration":4.5,"anim":"text.tracking-in","out":"text.fade-up-out","style":{"size":60,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"left","anchor":"bottom-left","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":true,"underlineColor":"#7B7DFF","rtl":false}},{"id":"title.lower-third.split-reveal","kind":"title","name":"Split Reveal","family":"Lower thirds","tags":["lowerthird","split","reveal"],"text":"NOAH KIM\rSOUND DESIGNER","duration":4.5,"anim":"text.mask-wipe","out":"text.fade-up-out","style":{"size":58,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#F5F7FB","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"left","anchor":"bottom-left","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":true,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.lower-third.ticker","kind":"title","name":"Ticker","family":"Lower thirds","tags":["lowerthird","ticker","news"],"text":"BREAKING  /  NEW RELEASE  /  TODAY","duration":4.5,"anim":"text.slide-left","out":"text.slide-right-out","style":{"size":34,"font":"Inter","weight":"SemiBold","tracking":6,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"left","anchor":"bottom-left","margin":0.06,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#101526","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.lower-third.name-role","kind":"title","name":"Name + Role","family":"Lower thirds","tags":["lowerthird","name","role"],"text":"AVA STONE\rHEAD OF VIDEO","duration":4.5,"anim":"text.line-rise","out":"text.fade-up-out","style":{"size":50,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"left","anchor":"bottom-left","margin":0.08,"glass":true,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.lower-third.social-handle","kind":"title","name":"Social Handle","family":"Lower thirds","tags":["lowerthird","social","handle"],"text":"@FLOWSTUDIO","duration":4.5,"anim":"text.tracking-in","out":"text.fade-in-slow-out","style":{"size":34,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#5CE1FF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"right","anchor":"bottom-right","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":true,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.lower-third.subscribe-bar","kind":"title","name":"Subscribe Bar","family":"Lower thirds","tags":["lowerthird","subscribe","cta"],"text":"SUBSCRIBE FOR MORE","duration":4.5,"anim":"text.pop-in","out":"text.fade-up-out","style":{"size":38,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"bottom-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#FF0033","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.lower-third.location-pin","kind":"title","name":"Location Pin","family":"Lower thirds","tags":["lowerthird","location","travel"],"text":"REYKJAVIK  //  64.1 N","duration":4.5,"anim":"text.slide-down","out":"text.fade-up-out","style":{"size":30,"font":"Inter","weight":"SemiBold","tracking":3,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"right","anchor":"top-right","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.lower-third.quote-card","kind":"title","name":"Quote Card","family":"Lower thirds","tags":["lowerthird","quote","serif"],"text":"\u201cThe edit is the story.\u201d","duration":4.5,"anim":"text.words-slide","out":"text.fade-up-out","style":{"size":48,"font":"Georgia","weight":"Italic","tracking":0,"leading":1.15,"caps":"none","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"left","anchor":"bottom-left","margin":0.12,"glass":true,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.full.cinematic-spaced","kind":"title","name":"Cinematic Spaced","family":"Full screen titles","tags":["title","cinematic","spaced"],"text":"THE LAST LIGHT","duration":4.5,"anim":"text.tracking-in","out":"text.fade-up-out","style":{"size":96,"font":"Inter","weight":"Light","tracking":28,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.full.big-bold","kind":"title","name":"Big Bold","family":"Full screen titles","tags":["title","bold","impact"],"text":"MAKE IT LOUD","duration":4.5,"anim":"text.pop-in","out":"text.fade-up-out","style":{"size":180,"font":"Impact","weight":"Black","tracking":0,"leading":0.95,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.full.outline-hollow","kind":"title","name":"Outline Hollow","family":"Full screen titles","tags":["title","outline","hollow"],"text":"OUT OF THE FRAME","duration":4.5,"anim":"text.blur-reveal","out":"text.fade-up-out","style":{"size":120,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#0B0E14","fill2":null,"stroke":"#FFFFFF","strokeWidth":4,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false},"approx":true},{"id":"title.full.neon-sign","kind":"title","name":"Neon Sign","family":"Full screen titles","tags":["title","neon","glow"],"text":"OPEN ALL NIGHT","duration":4.5,"anim":"text.neon-flicker","out":"text.fade-up-out","style":{"size":100,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#5CE1FF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":true,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.full.glitch-title","kind":"title","name":"Glitch Title","family":"Full screen titles","tags":["title","glitch","digital"],"text":"SIGNAL LOST","duration":4.5,"anim":"text.glitch-in","out":"text.glitch-in-out","style":{"size":120,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#F5F7FB","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":true,"glowColor":"#FF5F6D","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.full.chrome","kind":"title","name":"Chrome","family":"Full screen titles","tags":["title","chrome","metal"],"text":"FUTURE FORWARD","duration":4.5,"anim":"text.slide-up","out":"text.fade-up-out","style":{"size":110,"font":"Inter","weight":"SemiBold","tracking":6,"leading":1.15,"caps":"upper","fill":"#DCE6F5","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":true,"glowColor":"#7B7DFF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false},"approx":true},{"id":"title.full.retro-80s","kind":"title","name":"Retro 80s","family":"Full screen titles","tags":["title","retro","80s"],"text":"MIDNIGHT DRIVE","duration":4.5,"anim":"text.flip-x","out":"text.fade-up-out","style":{"size":100,"font":"Trebuchet MS","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#FF6FD8","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":true,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.full.handwritten","kind":"title","name":"Handwritten","family":"Full screen titles","tags":["title","handwritten","soft"],"text":"just breathe","duration":4.5,"anim":"text.fade-in-slow","out":"text.fade-up-out","style":{"size":86,"font":"Segoe Script","weight":"Regular","tracking":0,"leading":1.15,"caps":"none","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false},"approx":true},{"id":"title.full.editorial-serif","kind":"title","name":"Editorial Serif","family":"Full screen titles","tags":["title","editorial","serif"],"text":"A Quiet Revolution","duration":4.5,"anim":"text.words-slide","out":"text.fade-up-out","style":{"size":92,"font":"Georgia","weight":"Italic","tracking":0,"leading":1.15,"caps":"none","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.full.brutalist","kind":"title","name":"Brutalist","family":"Full screen titles","tags":["title","brutalist","raw"],"text":"NO FILTER","duration":4.5,"anim":"text.words-slide","out":"text.slide-right-out","style":{"size":200,"font":"Impact","weight":"Black","tracking":-4,"leading":0.9,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"left","anchor":"middle-left","margin":0.04,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.full.gradient-fill","kind":"title","name":"Gradient Fill","family":"Full screen titles","tags":["title","gradient","color"],"text":"CHASING LIGHT","duration":4.5,"anim":"text.tracking-in","out":"text.fade-up-out","style":{"size":120,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFB36B","fill2":"#7B7DFF","stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false},"approx":true},{"id":"title.full.duotone","kind":"title","name":"Duotone","family":"Full screen titles","tags":["title","duotone","color"],"text":"TWO WORLDS","duration":4.5,"anim":"text.blur-reveal","out":"text.fade-up-out","style":{"size":120,"font":"Inter","weight":"SemiBold","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFB36B","fill2":"#5CE1FF","stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false},"approx":true},{"id":"title.social.hormozi","kind":"title","name":"Hormozi","family":"Social titles","tags":["social","bold","shorts"],"text":"THIS CHANGES EVERYTHING","duration":4.5,"anim":"text.pop-in","out":"text.pop-in-out","style":{"size":104,"font":"Inter","weight":"Black","tracking":0,"leading":1.0,"caps":"upper","fill":"#FFE600","fill2":null,"stroke":"#000000","strokeWidth":14,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.social.word-pop","kind":"title","name":"Word Pop","family":"Social titles","tags":["social","word","pop"],"text":"WAIT FOR IT","duration":4.5,"anim":"text.pop-in","out":"text.pop-in-out","style":{"size":118,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":"#000000","strokeWidth":10,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.social.karaoke-glow","kind":"title","name":"Karaoke Glow","family":"Social titles","tags":["social","karaoke","glow"],"text":"SING IT LOUD","duration":4.5,"anim":"text.karaoke-fill","out":"text.fade-up-out","style":{"size":88,"font":"Inter","weight":"Bold","tracking":0,"leading":1.15,"caps":"upper","fill":"#5CE1FF","fill2":null,"stroke":"#000000","strokeWidth":6,"shadow":true,"glow":true,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.social.beasty-bold","kind":"title","name":"Beasty Bold","family":"Social titles","tags":["social","bold","beasty"],"text":"NO SHORTCUTS","duration":4.5,"anim":"text.scale-up","out":"text.pop-in-out","style":{"size":120,"font":"Inter","weight":"Black","tracking":0,"leading":0.95,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":"#FF0033","strokeWidth":12,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.social.clean-white","kind":"title","name":"Clean White","family":"Social titles","tags":["social","clean","minimal"],"text":"A simple sentence.","duration":4.5,"anim":"text.fade-up","out":"text.fade-up-out","style":{"size":68,"font":"Inter","weight":"Medium","tracking":0,"leading":1.15,"caps":"none","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"bottom-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.social.yellow-highlight","kind":"title","name":"Yellow Highlight","family":"Social titles","tags":["social","yellow","highlight"],"text":"THE IMPORTANT PART","duration":4.5,"anim":"text.highlight-sweep","out":"text.fade-up-out","style":{"size":78,"font":"Inter","weight":"Bold","tracking":0,"leading":1.15,"caps":"upper","fill":"#111111","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#FFE600","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.social.boxed","kind":"title","name":"Boxed","family":"Social titles","tags":["social","box","block"],"text":"FULL FRAME","duration":4.5,"anim":"text.unfold","out":"text.fade-up-out","style":{"size":96,"font":"Inter","weight":"Bold","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#101526","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.social.outlined-heavy","kind":"title","name":"Outlined Heavy","family":"Social titles","tags":["social","outline","heavy"],"text":"LOUD AND CLEAR","duration":4.5,"anim":"text.stretch-in","out":"text.pop-in-out","style":{"size":110,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":"#000000","strokeWidth":16,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.social.typewriter-line","kind":"title","name":"Typewriter Line","family":"Social titles","tags":["social","typewriter","mono"],"text":"one letter at a time","duration":4.5,"anim":"text.typewriter","out":"text.fade-up-out","style":{"size":52,"font":"Courier New","weight":"Bold","tracking":0,"leading":1.15,"caps":"lower","fill":"#F5F7FB","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"bottom-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.social.emoji-burst","kind":"title","name":"Emoji Burst","family":"Social titles","tags":["social","emoji","burst"],"text":"BIG NEWS","duration":4.5,"anim":"text.elastic-in","out":"text.pop-in-out","style":{"size":106,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":"#FFE600","stroke":null,"strokeWidth":0,"shadow":true,"glow":true,"glowColor":"#FFE600","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false},"approx":true},{"id":"title.social.soft-shadow","kind":"title","name":"Soft Shadow","family":"Social titles","tags":["social","shadow","soft"],"text":"Quiet confidence","duration":4.5,"anim":"text.fade-in-slow","out":"text.fade-up-out","style":{"size":64,"font":"Inter","weight":"Medium","tracking":0,"leading":1.15,"caps":"none","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"bottom-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.social.arabic-naskh","kind":"title","name":"Arabic Naskh","family":"Social titles","tags":["social","arabic","rtl","naskh"],"text":"\u0645\u0631\u062d\u0628\u0627 \u0628\u0627\u0644\u0639\u0627\u0644\u0645","duration":4.5,"anim":"text.fade-up","out":"text.fade-up-out","style":{"size":72,"font":"Noto Naskh Arabic","weight":"Regular","tracking":0,"leading":1.15,"caps":"none","fill":"#FFFFFF","fill2":null,"stroke":"#000000","strokeWidth":5,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"right","anchor":"bottom-right","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":true}},{"id":"title.cta.subscribe","kind":"title","name":"Subscribe","family":"Calls to action","tags":["cta","subscribe","youtube"],"text":"SUBSCRIBE","duration":4.5,"anim":"text.pop-in","out":"text.pop-in-out","style":{"size":84,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"bottom-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#FF0033","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.cta.like","kind":"title","name":"Like","family":"Calls to action","tags":["cta","like","social"],"text":"LIKE THIS","duration":4.5,"anim":"text.bounce-in","out":"text.pop-in-out","style":{"size":88,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#5CE1FF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.cta.follow","kind":"title","name":"Follow","family":"Calls to action","tags":["cta","follow","social"],"text":"FOLLOW FOR MORE","duration":4.5,"anim":"text.slide-up","out":"text.fade-up-out","style":{"size":64,"font":"Inter","weight":"Bold","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"bottom-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":true,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.cta.swipe-up","kind":"title","name":"Swipe Up","family":"Calls to action","tags":["cta","swipe","stories"],"text":"SWIPE UP","duration":4.5,"anim":"text.slide-up","out":"text.slide-down-out","style":{"size":76,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#111111","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"bottom-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#FFFFFF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.cta.link-in-bio","kind":"title","name":"Link in Bio","family":"Calls to action","tags":["cta","link","bio"],"text":"LINK IN BIO","duration":4.5,"anim":"text.tracking-in","out":"text.fade-up-out","style":{"size":52,"font":"Inter","weight":"Medium","tracking":0,"leading":1.15,"caps":"upper","fill":"#F5F7FB","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"bottom-center","margin":0.08,"glass":true,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.cta.sale-badge","kind":"title","name":"Sale Badge","family":"Calls to action","tags":["cta","sale","badge"],"text":"-50% TODAY","duration":4.5,"anim":"text.pop-in","out":"text.pop-in-out","style":{"size":96,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#FF5F6D","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.cta.countdown","kind":"title","name":"Countdown","family":"Calls to action","tags":["cta","countdown","number"],"text":"3","duration":4.5,"anim":"text.counter-roll","out":"text.pop-in-out","style":{"size":200,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":true,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.cta.live","kind":"title","name":"Live","family":"Calls to action","tags":["cta","live","stream"],"text":"LIVE NOW","duration":4.5,"anim":"text.neon-flicker","out":"text.fade-up-out","style":{"size":64,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"top-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#FF0033","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.generic.scrolling-credits","kind":"title","name":"Scrolling Credits","family":"Generic titles","tags":["generic","credits","scroll"],"text":"DIRECTED BY\rJANE DOE\r\rEDITED BY\rSAM RIVERA","duration":10,"anim":"text.fade-in-slow","out":"text.fade-up-out","style":{"size":44,"font":"Inter","weight":"Medium","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.generic.title-card","kind":"title","name":"Title Card","family":"Generic titles","tags":["generic","card","chapter"],"text":"CHAPTER ONE","duration":4.5,"anim":"text.fade-up","out":"text.fade-up-out","style":{"size":92,"font":"Inter","weight":"Light","tracking":18,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.generic.chapter-number","kind":"title","name":"Chapter Number","family":"Generic titles","tags":["generic","number","chapter"],"text":"01","duration":4.5,"anim":"text.counter-roll","out":"text.fade-up-out","style":{"size":180,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#5CE1FF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.generic.date-stamp","kind":"title","name":"Date Stamp","family":"Generic titles","tags":["generic","date","stamp"],"text":"12.08.2026","duration":4.5,"anim":"text.typewriter","out":"text.fade-up-out","style":{"size":38,"font":"Courier New","weight":"Bold","tracking":0,"leading":1.15,"caps":"upper","fill":"#F5F7FB","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"right","anchor":"bottom-right","margin":0.06,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.generic.kinetic-typography","kind":"title","name":"Kinetic Typography","family":"Generic titles","tags":["generic","kinetic","type"],"text":"EVERY FRAME COUNTS","duration":4.5,"anim":"text.cascade","out":"text.slide-right-out","style":{"size":104,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.generic.quote-highlight","kind":"title","name":"Quote Highlight","family":"Generic titles","tags":["generic","quote","serif"],"text":"\u201cShow, don't tell.\u201d","duration":4.5,"anim":"text.words-slide","out":"text.fade-up-out","style":{"size":64,"font":"Georgia","weight":"Italic","tracking":0,"leading":1.15,"caps":"none","fill":"#F5F7FB","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":true,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.generic.stat-counter","kind":"title","name":"Stat Counter","family":"Generic titles","tags":["generic","stat","number"],"text":"98%","duration":4.5,"anim":"text.counter-roll","out":"text.fade-up-out","style":{"size":160,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#44D7A2","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.generic.versus","kind":"title","name":"Versus","family":"Generic titles","tags":["generic","versus","compare"],"text":"A  /  B","duration":4.5,"anim":"text.flip-y","out":"text.fade-up-out","style":{"size":120,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":"#7B7DFF","strokeWidth":6,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.callout.arrow-label","kind":"title","name":"Arrow Label","family":"Callouts","tags":["callout","arrow","label"],"text":"THIS PART","duration":4.5,"anim":"text.slide-left","out":"text.fade-up-out","style":{"size":34,"font":"Inter","weight":"Bold","tracking":0,"leading":1.15,"caps":"upper","fill":"#111111","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"left","anchor":"middle-left","margin":0.12,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#FFE600","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.callout.circle-note","kind":"title","name":"Circle Note","family":"Callouts","tags":["callout","circle","note"],"text":"LOOK HERE","duration":4.5,"anim":"text.pop-in","out":"text.pop-in-out","style":{"size":32,"font":"Inter","weight":"Bold","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":"#5CE1FF","strokeWidth":7,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.callout.underline-note","kind":"title","name":"Underline Note","family":"Callouts","tags":["callout","underline","note"],"text":"important detail","duration":4.5,"anim":"text.fade-up","out":"text.fade-up-out","style":{"size":30,"font":"Inter","weight":"Medium","tracking":0,"leading":1.15,"caps":"none","fill":"#F5F7FB","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"left","anchor":"bottom-left","margin":0.1,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":false,"barFill":"#5CE1FF","underline":true,"underlineColor":"#FF5F6D","rtl":false}},{"id":"title.callout.sticker","kind":"title","name":"Sticker","family":"Callouts","tags":["callout","sticker","fun"],"text":"NEW!","duration":4.5,"anim":"text.elastic-in","out":"text.pop-in-out","style":{"size":48,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#FFFFFF","fill2":null,"stroke":"#111111","strokeWidth":6,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#FF6FD8","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.callout.speech-bubble","kind":"title","name":"Speech Bubble","family":"Callouts","tags":["callout","bubble","speech"],"text":"Wait, what?","duration":4.5,"anim":"text.pop-in","out":"text.pop-in-out","style":{"size":34,"font":"Inter","weight":"Medium","tracking":0,"leading":1.15,"caps":"none","fill":"#111111","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"right","anchor":"middle-right","margin":0.1,"glass":true,"glassFill":"#FFFFFF","glassOpacity":95,"bar":false,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.callout.tooltip","kind":"title","name":"Tooltip","family":"Callouts","tags":["callout","tooltip","hint"],"text":"pro tip","duration":4.5,"anim":"text.fade-up","out":"text.fade-up-out","style":{"size":24,"font":"Inter","weight":"Medium","tracking":0,"leading":1.15,"caps":"lower","fill":"#F5F7FB","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"top-center","margin":0.06,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#101526","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.callout.number-badge","kind":"title","name":"Number Badge","family":"Callouts","tags":["callout","number","badge"],"text":"1","duration":4.5,"anim":"text.pop-in","out":"text.pop-in-out","style":{"size":44,"font":"Inter","weight":"Black","tracking":0,"leading":1.15,"caps":"upper","fill":"#111111","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"top-left","margin":0.06,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#5CE1FF","underline":false,"underlineColor":"#5CE1FF","rtl":false}},{"id":"title.callout.highlight-box","kind":"title","name":"Highlight Box","family":"Callouts","tags":["callout","box","highlight"],"text":"READ THIS","duration":4.5,"anim":"text.highlight-sweep","out":"text.fade-up-out","style":{"size":40,"font":"Inter","weight":"Bold","tracking":0,"leading":1.15,"caps":"upper","fill":"#111111","fill2":null,"stroke":null,"strokeWidth":0,"shadow":true,"glow":false,"glowColor":"#5CE1FF","align":"center","anchor":"middle-center","margin":0.08,"glass":false,"glassFill":"#FFFFFF","glassOpacity":12,"bar":true,"barFill":"#FFE600","underline":false,"underlineColor":"#5CE1FF","rtl":false}}];
  FLOW_CATALOG.textAnims = [{"id":"text.fade-up","kind":"text","name":"Fade Up","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"position":[0,40]},"easing":"outCubic","duration":0.8,"smooth":100,"random":false},{"id":"text.fade-down","kind":"text","name":"Fade Down","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"position":[0,-40]},"easing":"outCubic","duration":0.8,"smooth":100,"random":false},{"id":"text.fade-in-slow","kind":"text","name":"Fade In Slow","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0},"easing":"smooth","duration":1.6,"smooth":100,"random":false},{"id":"text.pop-in","kind":"text","name":"Pop In","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"scale":0},"easing":"outBack","duration":0.7,"smooth":100,"random":false},{"id":"text.scale-up","kind":"text","name":"Scale Up","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"scale":40},"easing":"outQuart","duration":0.8,"smooth":100,"random":false},{"id":"text.bounce-in","kind":"text","name":"Bounce In","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"position":[0,-80]},"easing":"outBounce","duration":1.0,"smooth":100,"random":false},{"id":"text.elastic-in","kind":"text","name":"Elastic In","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"scale":20},"easing":"outElastic","duration":1.1,"smooth":100,"random":false},{"id":"text.drop-bounce","kind":"text","name":"Drop Bounce","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"position":[0,-120]},"easing":"outBounce","duration":1.0,"smooth":100,"random":false},{"id":"text.slide-left","kind":"text","name":"Slide Left","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"position":[60,0]},"easing":"outCubic","duration":0.8,"smooth":100,"random":false},{"id":"text.slide-right","kind":"text","name":"Slide Right","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"position":[-60,0]},"easing":"outCubic","duration":0.8,"smooth":100,"random":false},{"id":"text.slide-up","kind":"text","name":"Slide Up","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"position":[0,60]},"easing":"outCubic","duration":0.8,"smooth":100,"random":false},{"id":"text.slide-down","kind":"text","name":"Slide Down","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"position":[0,-60]},"easing":"outCubic","duration":0.8,"smooth":100,"random":false},{"id":"text.typewriter","kind":"text","name":"Typewriter","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0},"easing":"linear","duration":1.2,"smooth":0,"random":false},{"id":"text.blur-reveal","kind":"text","name":"Blur Reveal","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"blur":30},"easing":"outQuad","duration":1.0,"smooth":100,"random":false},{"id":"text.tracking-in","kind":"text","name":"Tracking In","family":"Entrance","tags":["entrance","lines"],"unit":"lines","mode":"in","from":{"opacity":0,"tracking":40},"easing":"outCubic","duration":1.2,"smooth":100,"random":false},{"id":"text.words-slide","kind":"text","name":"Words Slide","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"position":[-60,0]},"easing":"outExpo","duration":0.9,"smooth":100,"random":false},{"id":"text.line-rise","kind":"text","name":"Line Rise","family":"Entrance","tags":["entrance","lines"],"unit":"lines","mode":"in","from":{"opacity":0,"position":[0,70]},"easing":"outQuart","duration":0.9,"smooth":100,"random":false},{"id":"text.spin-words","kind":"text","name":"Spin Words","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"scale":40,"rotation":-90},"easing":"outBack","duration":0.9,"smooth":100,"random":false},{"id":"text.flip-x","kind":"text","name":"Flip X","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"scale":0,"rotation":90},"easing":"outBack","duration":0.8,"smooth":100,"random":false},{"id":"text.flip-y","kind":"text","name":"Flip Y","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"scale":0,"rotation":-90},"easing":"outBack","duration":0.8,"smooth":100,"random":false},{"id":"text.rotate-in","kind":"text","name":"Rotate In","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"rotation":-180},"easing":"outQuart","duration":1.0,"smooth":100,"random":false},{"id":"text.wave","kind":"text","name":"Wave","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"position":[0,30]},"easing":"outSine","duration":1.0,"smooth":70,"random":false},{"id":"text.wobble","kind":"text","name":"Wobble","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"rotation":20},"easing":"outElastic","duration":1.0,"smooth":80,"random":false},{"id":"text.random-fade","kind":"text","name":"Random Fade","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0},"easing":"linear","duration":1.2,"smooth":100,"random":true},{"id":"text.scramble","kind":"text","name":"Scramble","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"blur":10},"easing":"linear","duration":1.1,"smooth":60,"random":true},{"id":"text.glitch-in","kind":"text","name":"Glitch In","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"blur":14,"position":[6,0]},"easing":"steps","duration":0.7,"smooth":20,"random":true},{"id":"text.mask-wipe","kind":"text","name":"Mask Wipe","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"tracking":-30},"easing":"outExpo","duration":1.0,"smooth":10,"random":false},{"id":"text.unfold","kind":"text","name":"Unfold","family":"Entrance","tags":["entrance","lines"],"unit":"lines","mode":"in","from":{"opacity":0,"scale":10},"easing":"outQuart","duration":0.9,"smooth":100,"random":false},{"id":"text.stretch-in","kind":"text","name":"Stretch In","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"scale":140},"easing":"outExpo","duration":0.8,"smooth":100,"random":false},{"id":"text.rubber-band","kind":"text","name":"Rubber Band","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"scale":30},"easing":"outElastic","duration":1.0,"smooth":100,"random":false},{"id":"text.swing","kind":"text","name":"Swing","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"rotation":35},"easing":"outBack","duration":1.0,"smooth":100,"random":false},{"id":"text.cascade","kind":"text","name":"Cascade","family":"Entrance","tags":["entrance","lines"],"unit":"lines","mode":"in","from":{"opacity":0,"position":[20,40]},"easing":"outCubic","duration":1.2,"smooth":60,"random":false},{"id":"text.spotlight","kind":"text","name":"Spotlight","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0},"easing":"outQuad","duration":1.4,"smooth":0,"random":false},{"id":"text.highlight-sweep","kind":"text","name":"Highlight Sweep","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"tracking":30},"easing":"outExpo","duration":1.1,"smooth":100,"random":false},{"id":"text.karaoke-fill","kind":"text","name":"Karaoke Fill","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0},"easing":"outCubic","duration":1.0,"smooth":0,"random":false},{"id":"text.neon-flicker","kind":"text","name":"Neon Flicker","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"blur":6},"easing":"steps","duration":0.9,"smooth":10,"random":true},{"id":"text.counter-roll","kind":"text","name":"Counter Roll","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"position":[0,80]},"easing":"outExpo","duration":0.8,"smooth":100,"random":false},{"id":"text.tilt-in","kind":"text","name":"Tilt In","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"rotation":12,"position":[0,30]},"easing":"outBack","duration":0.8,"smooth":100,"random":false},{"id":"text.drop-in","kind":"text","name":"Drop In","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"blur":4,"position":[0,-60]},"easing":"outQuad","duration":0.6,"smooth":100,"random":false},{"id":"text.rise-fade","kind":"text","name":"Rise Fade","family":"Entrance","tags":["entrance","lines"],"unit":"lines","mode":"in","from":{"opacity":0,"position":[0,24]},"easing":"outSine","duration":1.2,"smooth":100,"random":false},{"id":"text.slide-blur","kind":"text","name":"Slide Blur","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"blur":18,"position":[-100,0]},"easing":"outExpo","duration":0.9,"smooth":100,"random":false},{"id":"text.pulse-in","kind":"text","name":"Pulse In","family":"Entrance","tags":["entrance","words"],"unit":"words","mode":"in","from":{"opacity":0,"scale":60},"easing":"outElastic","duration":0.9,"smooth":100,"random":false},{"id":"text.compression","kind":"text","name":"Compression","family":"Entrance","tags":["entrance","lines"],"unit":"lines","mode":"in","from":{"opacity":0,"scale":160},"easing":"outQuart","duration":0.7,"smooth":100,"random":false},{"id":"text.expand","kind":"text","name":"Expand","family":"Entrance","tags":["entrance","lines"],"unit":"lines","mode":"in","from":{"opacity":0,"scale":40},"easing":"outCubic","duration":1.0,"smooth":100,"random":false},{"id":"text.offset-in","kind":"text","name":"Offset In","family":"Entrance","tags":["entrance","chars"],"unit":"chars","mode":"in","from":{"opacity":0,"position":[20,-20]},"easing":"outCubic","duration":0.9,"smooth":100,"random":false},{"id":"text.fade-up-out","kind":"text","name":"Fade Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"position":[0,40]},"easing":"outCubic","duration":0.8,"smooth":100,"random":false},{"id":"text.fade-down-out","kind":"text","name":"Fade Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"position":[0,-40]},"easing":"outCubic","duration":0.8,"smooth":100,"random":false},{"id":"text.fade-in-slow-out","kind":"text","name":"Fade Slow Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0},"easing":"smooth","duration":1.6,"smooth":100,"random":false},{"id":"text.pop-in-out","kind":"text","name":"Pop Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"scale":0},"easing":"outBack","duration":0.7,"smooth":100,"random":false},{"id":"text.scale-up-out","kind":"text","name":"Scale Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"scale":40},"easing":"outQuart","duration":0.8,"smooth":100,"random":false},{"id":"text.bounce-in-out","kind":"text","name":"Bounce Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"position":[0,-80]},"easing":"outBounce","duration":1.0,"smooth":100,"random":false},{"id":"text.elastic-in-out","kind":"text","name":"Elastic Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"scale":20},"easing":"outElastic","duration":1.1,"smooth":100,"random":false},{"id":"text.drop-bounce-out","kind":"text","name":"Drop Bounce Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"position":[0,-120]},"easing":"outBounce","duration":1.0,"smooth":100,"random":false},{"id":"text.slide-left-out","kind":"text","name":"Slide Left Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"position":[60,0]},"easing":"outCubic","duration":0.8,"smooth":100,"random":false},{"id":"text.slide-right-out","kind":"text","name":"Slide Right Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"position":[-60,0]},"easing":"outCubic","duration":0.8,"smooth":100,"random":false},{"id":"text.slide-up-out","kind":"text","name":"Slide Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"position":[0,60]},"easing":"outCubic","duration":0.8,"smooth":100,"random":false},{"id":"text.slide-down-out","kind":"text","name":"Slide Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"position":[0,-60]},"easing":"outCubic","duration":0.8,"smooth":100,"random":false},{"id":"text.typewriter-out","kind":"text","name":"Typewriter Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0},"easing":"linear","duration":1.2,"smooth":0,"random":false},{"id":"text.blur-reveal-out","kind":"text","name":"Blur Reveal Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"blur":30},"easing":"outQuad","duration":1.0,"smooth":100,"random":false},{"id":"text.tracking-in-out","kind":"text","name":"Tracking Out","family":"Exit","tags":["exit","lines"],"unit":"lines","mode":"out","from":{"opacity":0,"tracking":40},"easing":"outCubic","duration":1.2,"smooth":100,"random":false},{"id":"text.words-slide-out","kind":"text","name":"Words Slide Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"position":[-60,0]},"easing":"outExpo","duration":0.9,"smooth":100,"random":false},{"id":"text.line-rise-out","kind":"text","name":"Line Rise Out","family":"Exit","tags":["exit","lines"],"unit":"lines","mode":"out","from":{"opacity":0,"position":[0,70]},"easing":"outQuart","duration":0.9,"smooth":100,"random":false},{"id":"text.spin-words-out","kind":"text","name":"Spin Words Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"scale":40,"rotation":-90},"easing":"outBack","duration":0.9,"smooth":100,"random":false},{"id":"text.flip-x-out","kind":"text","name":"Flip X Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"scale":0,"rotation":90},"easing":"outBack","duration":0.8,"smooth":100,"random":false},{"id":"text.flip-y-out","kind":"text","name":"Flip Y Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"scale":0,"rotation":-90},"easing":"outBack","duration":0.8,"smooth":100,"random":false},{"id":"text.rotate-in-out","kind":"text","name":"Rotate Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"rotation":-180},"easing":"outQuart","duration":1.0,"smooth":100,"random":false},{"id":"text.wave-out","kind":"text","name":"Wave Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"position":[0,30]},"easing":"outSine","duration":1.0,"smooth":70,"random":false},{"id":"text.wobble-out","kind":"text","name":"Wobble Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"rotation":20},"easing":"outElastic","duration":1.0,"smooth":80,"random":false},{"id":"text.random-fade-out","kind":"text","name":"Random Fade Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0},"easing":"linear","duration":1.2,"smooth":100,"random":true},{"id":"text.scramble-out","kind":"text","name":"Scramble Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"blur":10},"easing":"linear","duration":1.1,"smooth":60,"random":true},{"id":"text.glitch-in-out","kind":"text","name":"Glitch Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"blur":14,"position":[6,0]},"easing":"steps","duration":0.7,"smooth":20,"random":true},{"id":"text.mask-wipe-out","kind":"text","name":"Mask Wipe Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"tracking":-30},"easing":"outExpo","duration":1.0,"smooth":10,"random":false},{"id":"text.unfold-out","kind":"text","name":"Unfold Out","family":"Exit","tags":["exit","lines"],"unit":"lines","mode":"out","from":{"opacity":0,"scale":10},"easing":"outQuart","duration":0.9,"smooth":100,"random":false},{"id":"text.stretch-in-out","kind":"text","name":"Stretch Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"scale":140},"easing":"outExpo","duration":0.8,"smooth":100,"random":false},{"id":"text.rubber-band-out","kind":"text","name":"Rubber Band Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"scale":30},"easing":"outElastic","duration":1.0,"smooth":100,"random":false},{"id":"text.swing-out","kind":"text","name":"Swing Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"rotation":35},"easing":"outBack","duration":1.0,"smooth":100,"random":false},{"id":"text.cascade-out","kind":"text","name":"Cascade Out","family":"Exit","tags":["exit","lines"],"unit":"lines","mode":"out","from":{"opacity":0,"position":[20,40]},"easing":"outCubic","duration":1.2,"smooth":60,"random":false},{"id":"text.spotlight-out","kind":"text","name":"Spotlight Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0},"easing":"outQuad","duration":1.4,"smooth":0,"random":false},{"id":"text.highlight-sweep-out","kind":"text","name":"Highlight Sweep Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"tracking":30},"easing":"outExpo","duration":1.1,"smooth":100,"random":false},{"id":"text.karaoke-fill-out","kind":"text","name":"Karaoke Fill Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0},"easing":"outCubic","duration":1.0,"smooth":0,"random":false},{"id":"text.neon-flicker-out","kind":"text","name":"Neon Flicker Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"blur":6},"easing":"steps","duration":0.9,"smooth":10,"random":true},{"id":"text.counter-roll-out","kind":"text","name":"Counter Roll Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"position":[0,80]},"easing":"outExpo","duration":0.8,"smooth":100,"random":false},{"id":"text.tilt-in-out","kind":"text","name":"Tilt Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"rotation":12,"position":[0,30]},"easing":"outBack","duration":0.8,"smooth":100,"random":false},{"id":"text.drop-in-out","kind":"text","name":"Drop Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"blur":4,"position":[0,-60]},"easing":"outQuad","duration":0.6,"smooth":100,"random":false},{"id":"text.rise-fade-out","kind":"text","name":"Rise Fade Out","family":"Exit","tags":["exit","lines"],"unit":"lines","mode":"out","from":{"opacity":0,"position":[0,24]},"easing":"outSine","duration":1.2,"smooth":100,"random":false},{"id":"text.slide-blur-out","kind":"text","name":"Slide Blur Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"blur":18,"position":[-100,0]},"easing":"outExpo","duration":0.9,"smooth":100,"random":false},{"id":"text.pulse-in-out","kind":"text","name":"Pulse Out","family":"Exit","tags":["exit","words"],"unit":"words","mode":"out","from":{"opacity":0,"scale":60},"easing":"outElastic","duration":0.9,"smooth":100,"random":false},{"id":"text.compression-out","kind":"text","name":"Compression Out","family":"Exit","tags":["exit","lines"],"unit":"lines","mode":"out","from":{"opacity":0,"scale":160},"easing":"outQuart","duration":0.7,"smooth":100,"random":false},{"id":"text.expand-out","kind":"text","name":"Expand Out","family":"Exit","tags":["exit","lines"],"unit":"lines","mode":"out","from":{"opacity":0,"scale":40},"easing":"outCubic","duration":1.0,"smooth":100,"random":false},{"id":"text.offset-in-out","kind":"text","name":"Offset Out","family":"Exit","tags":["exit","chars"],"unit":"chars","mode":"out","from":{"opacity":0,"position":[20,-20]},"easing":"outCubic","duration":0.9,"smooth":100,"random":false},{"id":"text.loop-pulse","kind":"text","name":"Pulse","family":"Loop","tags":["loop","scale"],"unit":"chars","mode":"loop","loop":"scale","period":1.6,"amount":4,"easing":"linear","duration":0.5,"smooth":100,"random":false},{"id":"text.loop-float","kind":"text","name":"Float","family":"Loop","tags":["loop","position"],"unit":"chars","mode":"loop","loop":"position","period":3.0,"amount":8,"easing":"linear","duration":0.5,"smooth":100,"random":false},{"id":"text.loop-shake","kind":"text","name":"Shake","family":"Loop","tags":["loop","position"],"unit":"chars","mode":"loop","loop":"position","period":0.25,"amount":3,"easing":"linear","duration":0.5,"smooth":100,"random":false},{"id":"text.loop-breathe","kind":"text","name":"Breathe","family":"Loop","tags":["loop","scale"],"unit":"chars","mode":"loop","loop":"scale","period":4.0,"amount":2,"easing":"linear","duration":0.5,"smooth":100,"random":false},{"id":"text.loop-shimmer","kind":"text","name":"Shimmer","family":"Loop","tags":["loop","opacity"],"unit":"chars","mode":"loop","loop":"opacity","period":2.2,"amount":18,"easing":"linear","duration":0.5,"smooth":100,"random":false},{"id":"text.loop-color-cycle","kind":"text","name":"Color Cycle","family":"Loop","tags":["loop","color"],"unit":"chars","mode":"loop","loop":"color","period":6.0,"amount":0,"easing":"linear","duration":0.5,"smooth":100,"random":false}];
  FLOW_CATALOG.transitions = [{"id":"trans.cross-dissolve","kind":"transition","name":"Cross Dissolve","family":"Fades","tags":["fade","dissolve"],"duration":1.0,"ops":[{"op":"fade"}]},{"id":"trans.dip-black","kind":"transition","name":"Dip to Black","family":"Fades","tags":["fade","black"],"duration":1.0,"ops":[{"op":"dip","color":"black","amount":9}]},{"id":"trans.dip-white","kind":"transition","name":"Dip to White","family":"Fades","tags":["fade","white"],"duration":1.0,"ops":[{"op":"dip","color":"white","amount":9}]},{"id":"trans.dip-color","kind":"transition","name":"Dip to Color","family":"Fades","tags":["fade","color"],"duration":1.0,"ops":[{"op":"dip","color":"custom","value":"#5CE1FF","amount":7}]},{"id":"trans.additive","kind":"transition","name":"Additive Dissolve","family":"Fades","tags":["fade","additive"],"duration":1.0,"ops":[{"op":"fade"},{"op":"exposure","amount":2}]},{"id":"trans.film-dissolve","kind":"transition","name":"Film Dissolve","family":"Fades","tags":["fade","film"],"duration":1.0,"ops":[{"op":"fade"},{"op":"grain","amount":18,"ramp":true}]},{"id":"trans.blur-dissolve","kind":"transition","name":"Blur Dissolve","family":"Fades","tags":["fade","blur"],"duration":1.0,"ops":[{"op":"fade"},{"op":"blur","amount":80}]},{"id":"trans.luma-fade","kind":"transition","name":"Luma Fade","family":"Fades","tags":["fade","luma"],"duration":1.0,"ops":[{"op":"levels","amount":45},{"op":"fade"}]},{"id":"trans.slide-left","kind":"transition","name":"Slide Left","family":"Movement","tags":["slide","left"],"duration":1.0,"ops":[{"op":"slide","dx":1,"dy":0}]},{"id":"trans.slide-right","kind":"transition","name":"Slide Right","family":"Movement","tags":["slide","right"],"duration":1.0,"ops":[{"op":"slide","dx":-1,"dy":0}]},{"id":"trans.slide-up","kind":"transition","name":"Slide Up","family":"Movement","tags":["slide","up"],"duration":1.0,"ops":[{"op":"slide","dx":0,"dy":1}]},{"id":"trans.slide-down","kind":"transition","name":"Slide Down","family":"Movement","tags":["slide","down"],"duration":1.0,"ops":[{"op":"slide","dx":0,"dy":-1}]},{"id":"trans.push-left","kind":"transition","name":"Push Left","family":"Movement","tags":["push","left"],"duration":1.0,"ops":[{"op":"push","dx":1,"dy":0}]},{"id":"trans.push-right","kind":"transition","name":"Push Right","family":"Movement","tags":["push","right"],"duration":1.0,"ops":[{"op":"push","dx":-1,"dy":0}]},{"id":"trans.push-up","kind":"transition","name":"Push Up","family":"Movement","tags":["push","up"],"duration":1.0,"ops":[{"op":"push","dx":0,"dy":1}]},{"id":"trans.push-down","kind":"transition","name":"Push Down","family":"Movement","tags":["push","down"],"duration":1.0,"ops":[{"op":"push","dx":0,"dy":-1}]},{"id":"trans.whip-left","kind":"transition","name":"Whip Pan Left","family":"Movement","tags":["whip","left"],"duration":1.0,"ops":[{"op":"slide","dx":1,"dy":0},{"op":"blurdir","amount":120,"direction":0}]},{"id":"trans.whip-right","kind":"transition","name":"Whip Pan Right","family":"Movement","tags":["whip","right"],"duration":1.0,"ops":[{"op":"slide","dx":-1,"dy":0},{"op":"blurdir","amount":120,"direction":180}]},{"id":"trans.whip-up","kind":"transition","name":"Whip Pan Up","family":"Movement","tags":["whip","up"],"duration":1.0,"ops":[{"op":"slide","dx":0,"dy":1},{"op":"blurdir","amount":120,"direction":90}]},{"id":"trans.whip-down","kind":"transition","name":"Whip Pan Down","family":"Movement","tags":["whip","down"],"duration":1.0,"ops":[{"op":"slide","dx":0,"dy":-1},{"op":"blurdir","amount":120,"direction":270}]},{"id":"trans.spin","kind":"transition","name":"Spin","family":"Movement","tags":["spin","rotate"],"duration":1.0,"ops":[{"op":"spin","angle":-180,"scale":30}]},{"id":"trans.zoom-in","kind":"transition","name":"Zoom In","family":"Movement","tags":["zoom","in"],"duration":1.0,"ops":[{"op":"zoom","from":250}]},{"id":"trans.zoom-out","kind":"transition","name":"Zoom Out","family":"Movement","tags":["zoom","out"],"duration":1.0,"ops":[{"op":"zoom","from":30}]},{"id":"trans.zoom-through","kind":"transition","name":"Zoom Through","family":"Movement","tags":["zoom","through"],"duration":1.0,"ops":[{"op":"zoomthrough"}]},{"id":"trans.dolly-zoom","kind":"transition","name":"Dolly Zoom","family":"Movement","tags":["dolly","zoom"],"duration":1.0,"ops":[{"op":"dolly"}],"approx":true},{"id":"trans.roll","kind":"transition","name":"Roll","family":"Movement","tags":["roll","move"],"duration":1.0,"ops":[{"op":"spin","angle":-90,"scale":100},{"op":"offset","x":1,"y":0}]},{"id":"trans.swing","kind":"transition","name":"Swing","family":"Movement","tags":["swing","rotate"],"duration":1.0,"ops":[{"op":"swing","angle":25}]},{"id":"trans.cube-rotate","kind":"transition","name":"Cube Rotate","family":"Movement","tags":["cube","3d"],"duration":1.0,"ops":[{"op":"scaleWidth","from":0},{"op":"fade"}],"approx":true,"note":"Approximated with a horizontal squeeze: no true 3D card effect is available."},{"id":"trans.page-peel","kind":"transition","name":"Page Peel","family":"Movement","tags":["page","peel"],"duration":1.0,"ops":[{"op":"wipe","angle":45,"feather":30},{"op":"rotate","angle":8}],"approx":true,"note":"Approximated with a feathered diagonal wipe."},{"id":"trans.iris-circle","kind":"transition","name":"Iris Circle","family":"Shapes","tags":["iris","circle"],"duration":1.0,"ops":[{"op":"iris","points":12,"reverse":true}]},{"id":"trans.iris-box","kind":"transition","name":"Iris Box","family":"Shapes","tags":["iris","box"],"duration":1.0,"ops":[{"op":"iris","points":4,"reverse":true}]},{"id":"trans.iris-diamond","kind":"transition","name":"Iris Diamond","family":"Shapes","tags":["iris","diamond"],"duration":1.0,"ops":[{"op":"iris","points":3,"reverse":true}]},{"id":"trans.clock-wipe","kind":"transition","name":"Clock Wipe","family":"Shapes","tags":["clock","wipe"],"duration":1.0,"ops":[{"op":"radial","angle":-90}]},{"id":"trans.radial-wipe","kind":"transition","name":"Radial Wipe","family":"Shapes","tags":["radial","wipe"],"duration":1.0,"ops":[{"op":"radial","angle":0}]},{"id":"trans.barn-h","kind":"transition","name":"Barn Doors H","family":"Shapes","tags":["barn","doors"],"duration":1.0,"ops":[{"op":"wipe","angle":90,"feather":2}],"approx":true},{"id":"trans.barn-v","kind":"transition","name":"Barn Doors V","family":"Shapes","tags":["barn","doors"],"duration":1.0,"ops":[{"op":"wipe","angle":0,"feather":2}],"approx":true},{"id":"trans.split-h","kind":"transition","name":"Split H","family":"Shapes","tags":["split","horizontal"],"duration":1.0,"ops":[{"op":"wipe","angle":90,"feather":12}]},{"id":"trans.split-v","kind":"transition","name":"Split V","family":"Shapes","tags":["split","vertical"],"duration":1.0,"ops":[{"op":"wipe","angle":0,"feather":12}]},{"id":"trans.blinds-h","kind":"transition","name":"Blinds H","family":"Shapes","tags":["blinds","horizontal"],"duration":1.0,"ops":[{"op":"venetian","direction":"horizontal","width":18}]},{"id":"trans.blinds-v","kind":"transition","name":"Blinds V","family":"Shapes","tags":["blinds","vertical"],"duration":1.0,"ops":[{"op":"venetian","direction":"vertical","width":18}]},{"id":"trans.checker","kind":"transition","name":"Checker","family":"Shapes","tags":["checker","blocks"],"duration":1.0,"ops":[{"op":"mosaic","max":220},{"op":"fade"}],"approx":true},{"id":"trans.venetian","kind":"transition","name":"Venetian","family":"Shapes","tags":["venetian","blinds"],"duration":1.0,"ops":[{"op":"venetian","direction":"vertical","width":8}]},{"id":"trans.glitch","kind":"transition","name":"Glitch","family":"Stylised","tags":["glitch","rgb"],"duration":1.0,"ops":[{"op":"glitch","amount":60,"fps":16}]},{"id":"trans.rgb-split","kind":"transition","name":"RGB Split","family":"Stylised","tags":["rgb","split"],"duration":1.0,"ops":[{"op":"rgbsplit","amount":35},{"op":"fade"}],"approx":true,"note":"Approximated with per-channel blur."},{"id":"trans.flash-through","kind":"transition","name":"Flash Through","family":"Stylised","tags":["flash","white"],"duration":1.0,"ops":[{"op":"flash","amount":6}]},{"id":"trans.light-leak","kind":"transition","name":"Light Leak","family":"Stylised","tags":["light","leak"],"duration":1.0,"ops":[{"op":"leak","amount":140},{"op":"fade"}],"approx":true},{"id":"trans.film-burn","kind":"transition","name":"Film Burn","family":"Stylised","tags":["film","burn"],"duration":1.0,"ops":[{"op":"burn","amount":100},{"op":"fade"}]},{"id":"trans.pixelate","kind":"transition","name":"Pixelate","family":"Stylised","tags":["pixelate","blocks"],"duration":1.0,"ops":[{"op":"mosaic","max":320},{"op":"fade"}]},{"id":"trans.mosaic","kind":"transition","name":"Mosaic","family":"Stylised","tags":["mosaic","tile"],"duration":1.0,"ops":[{"op":"mosaic","max":120},{"op":"fade"}]},{"id":"trans.ripple","kind":"transition","name":"Ripple","family":"Stylised","tags":["ripple","wave"],"duration":1.0,"ops":[{"op":"ripple","radius":70},{"op":"fade"}]},{"id":"trans.wave-warp","kind":"transition","name":"Wave Warp","family":"Stylised","tags":["wave","warp"],"duration":1.0,"ops":[{"op":"wave","height":40},{"op":"fade"}]},{"id":"trans.shake-cut","kind":"transition","name":"Shake Cut","family":"Stylised","tags":["shake","cut"],"duration":1.0,"ops":[{"op":"shake","amount":45,"fps":18},{"op":"fade"}]},{"id":"trans.strobe","kind":"transition","name":"Strobe","family":"Stylised","tags":["strobe","flash"],"duration":1.0,"ops":[{"op":"strobe","fps":14},{"op":"flash","amount":2}]},{"id":"trans.luma-wipe","kind":"transition","name":"Luma Wipe","family":"Stylised","tags":["luma","wipe"],"duration":1.0,"ops":[{"op":"levels","amount":60},{"op":"fade"}]},{"id":"trans.smear","kind":"transition","name":"Smear","family":"Stylised","tags":["smear","motion"],"duration":1.0,"ops":[{"op":"smear","amount":80},{"op":"fade"}]}];
  FLOW_CATALOG.effects = [{"id":"fx.motion.shake-light","kind":"effect","name":"Shake Light","family":"Motion","tags":["shake","light"],"when":"playhead","duration":0.6,"ops":[{"op":"shake","amount":10,"fps":12}]},{"id":"fx.motion.shake-strong","kind":"effect","name":"Shake Strong","family":"Motion","tags":["shake","strong"],"when":"playhead","duration":0.6,"ops":[{"op":"shake","amount":34,"fps":18}]},{"id":"fx.motion.handheld","kind":"effect","name":"Handheld","family":"Motion","tags":["handheld","camera"],"when":"playhead","duration":2.0,"ops":[{"op":"shake","amount":5,"fps":4},{"op":"shake","amount":1.5,"fps":11}]},{"id":"fx.motion.zoom-punch","kind":"effect","name":"Zoom Punch","family":"Motion","tags":["zoom","punch"],"when":"playhead","duration":0.35,"ops":[{"op":"punch","amount":26}]},{"id":"fx.motion.slow-push-in","kind":"effect","name":"Slow Push-In","family":"Motion","tags":["push","slow"],"when":"playhead","duration":4.0,"ops":[{"op":"pushin","amount":18}]},{"id":"fx.motion.pull-out","kind":"effect","name":"Pull-Out","family":"Motion","tags":["pull","slow"],"when":"playhead","duration":4.0,"ops":[{"op":"pullout","amount":18}]},{"id":"fx.motion.whip","kind":"effect","name":"Whip","family":"Motion","tags":["whip","fast"],"when":"playhead","duration":0.4,"ops":[{"op":"slide","dx":0.6,"dy":0},{"op":"blurdir","amount":60,"direction":0}]},{"id":"fx.motion.wiggle","kind":"effect","name":"Wiggle","family":"Motion","tags":["wiggle","loop"],"when":"playhead","duration":2.0,"ops":[{"op":"wiggle","amount":8,"fps":3}]},{"id":"fx.motion.rotate-pulse","kind":"effect","name":"Rotate Pulse","family":"Motion","tags":["rotate","pulse"],"when":"playhead","duration":2.0,"ops":[{"op":"rotatepulse","amount":4}]},{"id":"fx.motion.camera-drift","kind":"effect","name":"Camera Drift","family":"Motion","tags":["drift","camera"],"when":"playhead","duration":2.0,"ops":[{"op":"drift","amount":12,"period":6}]},{"id":"fx.motion.bounce","kind":"effect","name":"Bounce","family":"Motion","tags":["bounce","entrance"],"when":"playhead","duration":0.6,"ops":[{"op":"bounce","amount":60}]},{"id":"fx.look.teal-orange","kind":"effect","name":"Teal & Orange","family":"Look","tags":["look","cinema"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","temperature":8,"contrast":12,"shadows":-8,"highlights":6,"saturation":4}]},{"id":"fx.look.cinematic-warm","kind":"effect","name":"Cinematic Warm","family":"Look","tags":["look","warm"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","temperature":14,"contrast":10,"highlights":4}]},{"id":"fx.look.cold-blue","kind":"effect","name":"Cold Blue","family":"Look","tags":["look","cold"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","temperature":-18,"contrast":8,"shadows":6}]},{"id":"fx.look.bleach-bypass","kind":"effect","name":"Bleach Bypass","family":"Look","tags":["look","bleach"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","saturation":-55,"contrast":30,"faded":4}]},{"id":"fx.look.bw-contrast","kind":"effect","name":"B&W Contrast","family":"Look","tags":["look","blackwhite"],"when":"layerStart","duration":0.01,"ops":[{"op":"bw","contrast":24}]},{"id":"fx.look.bw-soft","kind":"effect","name":"B&W Soft","family":"Look","tags":["look","blackwhite"],"when":"layerStart","duration":0.01,"ops":[{"op":"bw","contrast":4}]},{"id":"fx.look.sepia","kind":"effect","name":"Sepia","family":"Look","tags":["look","sepia"],"when":"layerStart","duration":0.01,"ops":[{"op":"duotone","shadow":"#2B1B10","highlight":"#F0D9B5"}]},{"id":"fx.look.vintage-fade","kind":"effect","name":"Vintage Fade","family":"Look","tags":["look","vintage"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","faded":22,"saturation":-18,"temperature":6}]},{"id":"fx.look.matte-black","kind":"effect","name":"Matte Black","family":"Look","tags":["look","matte"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","contrast":18,"blacks":-12,"saturation":-8}]},{"id":"fx.look.high-key","kind":"effect","name":"High Key","family":"Look","tags":["look","bright"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","exposure":0.4,"contrast":6,"highlights":12}]},{"id":"fx.look.low-key","kind":"effect","name":"Low Key","family":"Look","tags":["look","dark"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","exposure":-0.4,"contrast":16,"shadows":-10}]},{"id":"fx.look.vibrance-pop","kind":"effect","name":"Vibrance Pop","family":"Look","tags":["look","vibrant"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","vibrance":28,"saturation":6}]},{"id":"fx.look.day-for-night","kind":"effect","name":"Day for Night","family":"Look","tags":["look","night"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","exposure":-0.6,"temperature":-20,"shadows":8,"saturation":-12}]},{"id":"fx.look.golden-hour","kind":"effect","name":"Golden Hour","family":"Look","tags":["look","golden"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","temperature":22,"highlights":10,"saturation":10}]},{"id":"fx.look.cyberpunk","kind":"effect","name":"Cyberpunk","family":"Look","tags":["look","cyberpunk"],"when":"layerStart","duration":0.01,"ops":[{"op":"duotone","shadow":"#12002B","highlight":"#5CE1FF"},{"op":"look","saturation":16,"contrast":14}]},{"id":"fx.look.moody-green","kind":"effect","name":"Moody Green","family":"Look","tags":["look","green"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","temperature":-6,"tint":12,"contrast":10,"saturation":-10}]},{"id":"fx.look.pastel","kind":"effect","name":"Pastel","family":"Look","tags":["look","pastel"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","faded":14,"saturation":-6,"highlights":8}]},{"id":"fx.look.warm-social","kind":"effect","name":"Warm Social","family":"Look","tags":["look","warm"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","temperature":12,"vibrance":18}]},{"id":"fx.look.cool-social","kind":"effect","name":"Cool Social","family":"Look","tags":["look","cool"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","temperature":-12,"vibrance":14}]},{"id":"fx.blur.gaussian","kind":"effect","name":"Gaussian Blur","family":"Blur & Glow","tags":["blur","gaussian"],"when":"layerStart","duration":0.01,"ops":[{"op":"blur","amount":18,"constant":true}]},{"id":"fx.blur.directional","kind":"effect","name":"Directional Blur","family":"Blur & Glow","tags":["blur","directional"],"when":"layerStart","duration":0.01,"ops":[{"op":"blurdir","amount":24,"direction":0,"constant":true}]},{"id":"fx.blur.radial","kind":"effect","name":"Radial Blur","family":"Blur & Glow","tags":["blur","radial"],"when":"layerStart","duration":0.01,"ops":[{"op":"radialblur","amount":18,"constant":true}]},{"id":"fx.blur.zoom","kind":"effect","name":"Zoom Blur","family":"Blur & Glow","tags":["blur","zoom"],"when":"layerStart","duration":0.01,"ops":[{"op":"radialblur","amount":26,"type":"zoom","constant":true}]},{"id":"fx.glow.soft","kind":"effect","name":"Glow Soft","family":"Blur & Glow","tags":["glow","soft"],"when":"layerStart","duration":0.01,"ops":[{"op":"glow","radius":30,"intensity":1.2}]},{"id":"fx.glow.strong","kind":"effect","name":"Glow Strong","family":"Blur & Glow","tags":["glow","strong"],"when":"layerStart","duration":0.01,"ops":[{"op":"glow","radius":80,"intensity":2.2}]},{"id":"fx.glow.bloom","kind":"effect","name":"Bloom","family":"Blur & Glow","tags":["bloom","glow"],"when":"layerStart","duration":0.01,"ops":[{"op":"glow","radius":120,"intensity":1.6,"threshold":72}]},{"id":"fx.glow.dream","kind":"effect","name":"Dream Glow","family":"Blur & Glow","tags":["dream","glow"],"when":"layerStart","duration":0.01,"ops":[{"op":"glow","radius":60,"intensity":1.4},{"op":"look","faded":8,"saturation":4}]},{"id":"fx.style.glitch","kind":"effect","name":"Glitch","family":"Stylised","tags":["glitch","digital"],"when":"playhead","duration":0.8,"ops":[{"op":"glitch","amount":40,"fps":16}]},{"id":"fx.style.rgb-split","kind":"effect","name":"RGB Split","family":"Stylised","tags":["rgb","split"],"when":"layerStart","duration":0.01,"ops":[{"op":"rgbsplit","amount":18}],"approx":true,"note":"Per-channel blur stands in for a spatial split."},{"id":"fx.style.scanlines","kind":"effect","name":"Scanlines","family":"Stylised","tags":["scanlines","crt"],"when":"layerStart","duration":0.01,"ops":[{"op":"scanlines","amount":34}]},{"id":"fx.style.vhs","kind":"effect","name":"VHS","family":"Stylised","tags":["vhs","retro"],"when":"layerStart","duration":0.01,"ops":[{"op":"scanlines","amount":24},{"op":"grain","amount":20},{"op":"wave","height":6,"constant":true},{"op":"look","saturation":-8,"faded":12}]},{"id":"fx.style.crt","kind":"effect","name":"CRT","family":"Stylised","tags":["crt","retro"],"when":"layerStart","duration":0.01,"ops":[{"op":"scanlines","amount":40},{"op":"glow","radius":20,"intensity":1.2},{"op":"look","contrast":12}]},{"id":"fx.style.film-grain","kind":"effect","name":"Film Grain","family":"Stylised","tags":["grain","film"],"when":"layerStart","duration":0.01,"ops":[{"op":"grain","amount":16}]},{"id":"fx.style.old-film","kind":"effect","name":"Old Film","family":"Stylised","tags":["oldfilm","retro"],"when":"layerStart","duration":0.01,"ops":[{"op":"duotone","shadow":"#2B1B10","highlight":"#F0D9B5"},{"op":"grain","amount":12},{"op":"flicker","amount":1.5}]},{"id":"fx.style.halftone","kind":"effect","name":"Halftone","family":"Stylised","tags":["halftone","print"],"when":"layerStart","duration":0.01,"ops":[{"op":"posterize","levels":4},{"op":"scanlines","amount":18}],"approx":true},{"id":"fx.style.posterize","kind":"effect","name":"Posterize","family":"Stylised","tags":["posterize","flat"],"when":"layerStart","duration":0.01,"ops":[{"op":"posterize","levels":6}]},{"id":"fx.style.pixelate","kind":"effect","name":"Pixelate","family":"Stylised","tags":["pixelate","mosaic"],"when":"layerStart","duration":0.01,"ops":[{"op":"mosaic","max":60,"constant":true}]},{"id":"fx.style.mosaic","kind":"effect","name":"Mosaic","family":"Stylised","tags":["mosaic","tile"],"when":"layerStart","duration":0.01,"ops":[{"op":"mosaic","max":24,"constant":true}]},{"id":"fx.style.duotone","kind":"effect","name":"Duotone","family":"Stylised","tags":["duotone","color"],"when":"layerStart","duration":0.01,"ops":[{"op":"duotone","shadow":"#1A0033","highlight":"#5CE1FF"}]},{"id":"fx.style.neon-edge","kind":"effect","name":"Neon Edge","family":"Stylised","tags":["neon","edge"],"when":"layerStart","duration":0.01,"ops":[{"op":"findedges"},{"op":"glow","radius":18,"intensity":1.8}]},{"id":"fx.style.sketch","kind":"effect","name":"Sketch","family":"Stylised","tags":["sketch","line"],"when":"layerStart","duration":0.01,"ops":[{"op":"findedges"},{"op":"bw","contrast":20}]},{"id":"fx.style.heat-wave","kind":"effect","name":"Heat Wave","family":"Stylised","tags":["heat","wave"],"when":"playhead","duration":2.0,"ops":[{"op":"wave","height":22,"speed":1.4}]},{"id":"fx.style.echo-trail","kind":"effect","name":"Echo Trail","family":"Stylised","tags":["echo","trail"],"when":"layerStart","duration":0.01,"ops":[{"op":"echo","count":4,"intensity":80}]},{"id":"fx.style.strobe","kind":"effect","name":"Strobe","family":"Stylised","tags":["strobe","flash"],"when":"playhead","duration":1.0,"ops":[{"op":"strobe","amount":2.5,"fps":14}]},{"id":"fx.style.flicker","kind":"effect","name":"Flicker","family":"Stylised","tags":["flicker","light"],"when":"playhead","duration":1.0,"ops":[{"op":"flicker","amount":3}]},{"id":"fx.style.kaleido","kind":"effect","name":"Kaleido","family":"Stylised","tags":["kaleido","mirror"],"when":"layerStart","duration":0.01,"ops":[{"op":"kaleido","segments":6}],"approx":true},{"id":"fx.util.vignette","kind":"effect","name":"Vignette","family":"Utility","tags":["vignette","dark"],"when":"layerStart","duration":0.01,"ops":[{"op":"vignette","amount":-55}]},{"id":"fx.util.letterbox-239","kind":"effect","name":"Letterbox 2.39","family":"Utility","tags":["letterbox","cinema"],"when":"layerStart","duration":0.01,"ops":[{"op":"letterbox","ratio":2.39}]},{"id":"fx.util.letterbox-185","kind":"effect","name":"Letterbox 1.85","family":"Utility","tags":["letterbox","cinema"],"when":"layerStart","duration":0.01,"ops":[{"op":"letterbox","ratio":1.85}]},{"id":"fx.util.letterbox-45","kind":"effect","name":"Letterbox 4:5","family":"Utility","tags":["letterbox","social"],"when":"layerStart","duration":0.01,"ops":[{"op":"letterbox","ratio":0.8}]},{"id":"fx.util.safe-zone","kind":"effect","name":"Safe Zone Overlay","family":"Utility","tags":["safezone","guide"],"when":"layerStart","duration":0.01,"ops":[{"op":"safezone"}]},{"id":"fx.util.auto-contrast","kind":"effect","name":"Auto Contrast","family":"Utility","tags":["contrast","auto"],"when":"layerStart","duration":0.01,"ops":[{"op":"look","contrast":14,"shadows":-6,"highlights":6}]},{"id":"fx.util.sharpen","kind":"effect","name":"Sharpen","family":"Utility","tags":["sharpen","detail"],"when":"layerStart","duration":0.01,"ops":[{"op":"sharpen","amount":40}]},{"id":"fx.util.denoise-light","kind":"effect","name":"Light Denoise","family":"Utility","tags":["denoise","noise"],"when":"layerStart","duration":0.01,"ops":[{"op":"denoise","radius":2.5}]},{"id":"fx.util.freeze-frame","kind":"effect","name":"Freeze Frame","family":"Utility","tags":["freeze","time"],"when":"playhead","duration":0.01,"ops":[{"op":"freeze"}]},{"id":"fx.util.speed-ramp","kind":"effect","name":"Speed Ramp","family":"Utility","tags":["speed","ramp"],"when":"layerStart","duration":0.01,"ops":[{"op":"speedramp"}],"approx":true,"note":"Expression time remap; tune the key times in the timeline."},{"id":"fx.util.reverse","kind":"effect","name":"Reverse Clip","family":"Utility","tags":["reverse","time"],"when":"layerStart","duration":0.01,"ops":[{"op":"reverse"}]},{"id":"fx.util.mirror","kind":"effect","name":"Mirror","family":"Utility","tags":["mirror","symmetry"],"when":"layerStart","duration":0.01,"ops":[{"op":"mirror","angle":90}]},{"id":"fx.util.crop-916","kind":"effect","name":"Crop 9:16","family":"Utility","tags":["crop","vertical"],"when":"layerStart","duration":0.01,"ops":[{"op":"crop","ratio":0.5625}]}];
  FLOW_CATALOG.gradients = [{"id":"bg.sunset","kind":"gradient","name":"Sunset","family":"Warm","tags":["gradient","warm","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#FF512F","#DD2476","#6A11CB","#2575FC"],"angle":45,"anim":"rotate","speed":20}},{"id":"bg.ocean","kind":"gradient","name":"Ocean","family":"Cool","tags":["gradient","cool","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#0F2027","#2C5364","#00C6FF","#0072FF"],"angle":90,"anim":"rotate","speed":15}},{"id":"bg.aurora","kind":"gradient","name":"Aurora","family":"Nature","tags":["gradient","nature","four"],"sub":"gradient","bg":{"kind":"four","colors":["#00F5A0","#00D9F5","#7F00FF","#E100FF"],"angle":0,"anim":"drift","speed":40}},{"id":"bg.neon-night","kind":"gradient","name":"Neon Night","family":"Neon","tags":["gradient","neon","four"],"sub":"gradient","bg":{"kind":"four","colors":["#0B0B2B","#FF00C8","#00E5FF","#1A0033"],"angle":0,"anim":"drift","speed":50}},{"id":"bg.candy","kind":"gradient","name":"Candy","family":"Pastel","tags":["gradient","pastel","four"],"sub":"gradient","bg":{"kind":"four","colors":["#FFB6B9","#FAE3D9","#BBDED6","#8AC6D1"],"angle":0,"anim":"drift","speed":30}},{"id":"bg.mint","kind":"gradient","name":"Mint","family":"Nature","tags":["gradient","nature","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#A8FF78","#78FFD6","#78FFD6","#78FFD6"],"angle":135,"anim":"none","speed":30}},{"id":"bg.gold","kind":"gradient","name":"Gold","family":"Warm","tags":["gradient","warm","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#F7971E","#FFD200","#FFD200","#FFD200"],"angle":0,"anim":"none","speed":30}},{"id":"bg.midnight","kind":"gradient","name":"Midnight","family":"Dark","tags":["gradient","dark","radial"],"sub":"gradient","bg":{"kind":"radial","colors":["#2B3A67","#0A0A14","#0A0A14","#0A0A14"],"angle":0,"anim":"pulse","speed":30}},{"id":"bg.fire","kind":"gradient","name":"Fire","family":"Warm","tags":["gradient","warm","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#F12711","#F5AF19","#F5AF19","#F5AF19"],"angle":90,"anim":"rotate","speed":15}},{"id":"bg.lavender","kind":"gradient","name":"Lavender","family":"Pastel","tags":["gradient","pastel","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#E8D5FF","#C6A8FF","#9B7DFF","#6C4FD8"],"angle":120,"anim":"none","speed":20}},{"id":"bg.peach","kind":"gradient","name":"Peach","family":"Pastel","tags":["gradient","pastel","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#FFD3A5","#FD6585","#FD6585","#FD6585"],"angle":45,"anim":"none","speed":20}},{"id":"bg.steel","kind":"gradient","name":"Steel","family":"Cool","tags":["gradient","cool","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#1F2937","#374151","#6B7280","#9CA3AF"],"angle":180,"anim":"none","speed":20}},{"id":"bg.forest","kind":"gradient","name":"Forest","family":"Nature","tags":["gradient","nature","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#0B3D2E","#1F6F50","#3FA37A","#A8E6CF"],"angle":90,"anim":"drift","speed":18}},{"id":"bg.dusk","kind":"gradient","name":"Dusk","family":"Warm","tags":["gradient","warm","four"],"sub":"gradient","bg":{"kind":"four","colors":["#2B1055","#7597DE","#FFB36B","#FF6B6B"],"angle":0,"anim":"drift","speed":25}},{"id":"bg.ice","kind":"gradient","name":"Ice","family":"Cool","tags":["gradient","cool","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#E0F7FF","#A5D8FF","#4DABF7","#1C7ED6"],"angle":135,"anim":"none","speed":20}},{"id":"bg.rose-gold","kind":"gradient","name":"Rose Gold","family":"Luxury","tags":["gradient","luxury","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#F9D9C6","#E8A87C","#C97B63","#8C4A3C"],"angle":45,"anim":"none","speed":20}},{"id":"bg.cyber","kind":"gradient","name":"Cyber","family":"Neon","tags":["gradient","neon","four"],"sub":"gradient","bg":{"kind":"four","colors":["#0D0221","#3A0CA3","#F72585","#4CC9F0"],"angle":0,"anim":"drift","speed":45}},{"id":"bg.lava","kind":"gradient","name":"Lava","family":"Warm","tags":["gradient","warm","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#1A0000","#8B0000","#FF4500","#FFD700"],"angle":90,"anim":"pulse","speed":25}},{"id":"bg.sky","kind":"gradient","name":"Sky","family":"Nature","tags":["gradient","nature","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#56CCF2","#2F80ED","#B2FEFA","#0ED2F7"],"angle":0,"anim":"drift","speed":12}},{"id":"bg.mono","kind":"gradient","name":"Mono","family":"Dark","tags":["gradient","dark","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#000000","#1F1F1F","#4A4A4A","#BFBFBF"],"angle":0,"anim":"none","speed":10}},{"id":"bg.emerald","kind":"gradient","name":"Emerald","family":"Luxury","tags":["gradient","luxury","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#022C22","#065F46","#10B981","#D1FAE5"],"angle":120,"anim":"none","speed":15}},{"id":"bg.sapphire","kind":"gradient","name":"Sapphire","family":"Luxury","tags":["gradient","luxury","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#0A1128","#1C3F94","#2563EB","#93C5FD"],"angle":90,"anim":"drift","speed":14}},{"id":"bg.coral","kind":"gradient","name":"Coral","family":"Warm","tags":["gradient","warm","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#FF7E5F","#FEB47B","#FFD6A5","#FFF1E6"],"angle":45,"anim":"none","speed":15}},{"id":"bg.violet","kind":"gradient","name":"Violet","family":"Neon","tags":["gradient","neon","four"],"sub":"gradient","bg":{"kind":"four","colors":["#1A0033","#5B21B6","#A78BFA","#F5D0FE"],"angle":0,"anim":"pulse","speed":30}},{"id":"bg.sand","kind":"gradient","name":"Sand","family":"Calm","tags":["gradient","calm","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#E9D8A6","#D4A373","#BC6C25","#FEFAE0"],"angle":30,"anim":"none","speed":10}},{"id":"bg.slate","kind":"gradient","name":"Slate","family":"Corporate","tags":["gradient","corporate","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#0F172A","#1E293B","#334155","#64748B"],"angle":180,"anim":"none","speed":10}},{"id":"bg.navy","kind":"gradient","name":"Navy","family":"Corporate","tags":["gradient","corporate","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#020617","#0F172A","#1E3A8A","#3B82F6"],"angle":90,"anim":"drift","speed":10}},{"id":"bg.teal","kind":"gradient","name":"Teal","family":"Corporate","tags":["gradient","corporate","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#042F2E","#115E59","#14B8A6","#99F6E4"],"angle":135,"anim":"none","speed":12}},{"id":"bg.sunrise","kind":"gradient","name":"Sunrise","family":"Warm","tags":["gradient","warm","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#FF9A8B","#FF6A88","#FF99AC","#FFDEE9"],"angle":0,"anim":"drift","speed":18}},{"id":"bg.glacier","kind":"gradient","name":"Glacier","family":"Cool","tags":["gradient","cool","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#001219","#005F73","#0A9396","#94D2BD"],"angle":90,"anim":"none","speed":12}},{"id":"bg.magenta","kind":"gradient","name":"Magenta","family":"Neon","tags":["gradient","neon","four"],"sub":"gradient","bg":{"kind":"four","colors":["#1A001A","#7A0066","#FF00AA","#FFB3E6"],"angle":0,"anim":"pulse","speed":35}},{"id":"bg.amber","kind":"gradient","name":"Amber","family":"Warm","tags":["gradient","warm","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#3D1F00","#92400E","#F59E0B","#FEF3C7"],"angle":45,"anim":"none","speed":12}},{"id":"bg.plum","kind":"gradient","name":"Plum","family":"Dark","tags":["gradient","dark","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#1A0B2E","#3B0764","#6B21A8","#C084FC"],"angle":120,"anim":"drift","speed":20}},{"id":"bg.seafoam","kind":"gradient","name":"Seafoam","family":"Calm","tags":["gradient","calm","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#E0F2F1","#B2DFDB","#80CBC4","#4DB6AC"],"angle":0,"anim":"none","speed":10}},{"id":"bg.copper","kind":"gradient","name":"Copper","family":"Luxury","tags":["gradient","luxury","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#2B1B10","#7C2D12","#C2410C","#FDBA74"],"angle":90,"anim":"none","speed":12}},{"id":"bg.arctic","kind":"gradient","name":"Arctic","family":"Cool","tags":["gradient","cool","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#F8FAFC","#CBD5E1","#64748B","#0F172A"],"angle":180,"anim":"none","speed":10}},{"id":"bg.tropical","kind":"gradient","name":"Tropical","family":"Nature","tags":["gradient","nature","four"],"sub":"gradient","bg":{"kind":"four","colors":["#006D77","#83C5BE","#FFDDD2","#E29578"],"angle":0,"anim":"drift","speed":20}},{"id":"bg.noir","kind":"gradient","name":"Noir","family":"Dark","tags":["gradient","dark","radial"],"sub":"gradient","bg":{"kind":"radial","colors":["#000000","#0A0A0A","#2B2B2B","#6B6B6B"],"angle":0,"anim":"pulse","speed":10}},{"id":"bg.blush","kind":"gradient","name":"Blush","family":"Pastel","tags":["gradient","pastel","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#FFF1F2","#FFE4E6","#FECDD3","#FDA4AF"],"angle":45,"anim":"none","speed":8}},{"id":"bg.electric","kind":"gradient","name":"Electric","family":"Neon","tags":["gradient","neon","four"],"sub":"gradient","bg":{"kind":"four","colors":["#001233","#0353A4","#00B4D8","#90E0EF"],"angle":0,"anim":"drift","speed":40}},{"id":"bg.earth","kind":"gradient","name":"Earth","family":"Nature","tags":["gradient","nature","linear"],"sub":"gradient","bg":{"kind":"linear","colors":["#2F1B0C","#6B4423","#A67B5B","#D2B48C"],"angle":90,"anim":"none","speed":10}},{"id":"bg.galaxy","kind":"gradient","name":"Galaxy","family":"Dark","tags":["gradient","dark","radial"],"sub":"gradient","bg":{"kind":"radial","colors":["#000000","#1B0033","#4C1D95","#EC4899"],"angle":0,"anim":"drift","speed":30}},{"id":"gen.solid","kind":"gradient","name":"Solid Color","family":"Generators","tags":["generator","solid"],"sub":"generator","gen":"solid","color":"#0B0E14"},{"id":"gen.grey-scale","kind":"gradient","name":"Grey Scale","family":"Generators","tags":["generator","grey-scale"],"sub":"generator","gen":"grey-scale","color":"#000000"},{"id":"gen.color-bars-smpte","kind":"gradient","name":"SMPTE Color Bars","family":"Generators","tags":["generator","color-bars-smpte"],"sub":"generator","gen":"color-bars-smpte","color":"#C0C0C0"},{"id":"gen.color-bars-ebu","kind":"gradient","name":"EBU Color Bars","family":"Generators","tags":["generator","color-bars-ebu"],"sub":"generator","gen":"color-bars-ebu","color":"#C0C0C0"},{"id":"gen.checker","kind":"gradient","name":"Checkerboard","family":"Generators","tags":["generator","checker"],"sub":"generator","gen":"checker","color":"#101526"},{"id":"gen.grid","kind":"gradient","name":"Grid","family":"Generators","tags":["generator","grid"],"sub":"generator","gen":"grid","color":"#101526"},{"id":"gen.noise","kind":"gradient","name":"Noise","family":"Generators","tags":["generator","noise"],"sub":"generator","gen":"noise","color":"#101526"},{"id":"gen.countdown","kind":"gradient","name":"Countdown","family":"Generators","tags":["generator","countdown"],"sub":"generator","gen":"countdown","color":"#0B0E14"}];
  FLOW_CATALOG.palettes = [{"id":"pal.corporate.trust","kind":"palette","name":"Trust Blue","family":"Corporate","tags":["palette","corporate"],"colors":["#0B1F3A","#123B6D","#1E5AA8","#4F8FD4","#E8F1FB"]},{"id":"pal.corporate.slate","kind":"palette","name":"Slate Office","family":"Corporate","tags":["palette","corporate"],"colors":["#0F172A","#1E293B","#475569","#94A3B8","#F1F5F9"]},{"id":"pal.corporate.graphite","kind":"palette","name":"Graphite","family":"Corporate","tags":["palette","corporate"],"colors":["#111111","#2E2E2E","#5C5C5C","#A3A3A3","#F5F5F5"]},{"id":"pal.tech.quantum","kind":"palette","name":"Quantum","family":"Tech","tags":["palette","tech"],"colors":["#03071E","#370617","#6A040F","#DC2F02","#FFBA08"]},{"id":"pal.tech.circuit","kind":"palette","name":"Circuit","family":"Tech","tags":["palette","tech"],"colors":["#001219","#005F73","#0A9396","#94D2BD","#E9D8A6"]},{"id":"pal.tech.signal","kind":"palette","name":"Signal","family":"Tech","tags":["palette","tech"],"colors":["#0D1B2A","#1B263B","#415A77","#778DA9","#E0E1DD"]},{"id":"pal.nature.forest","kind":"palette","name":"Forest Floor","family":"Nature","tags":["palette","nature"],"colors":["#0B3D2E","#1F6F50","#3FA37A","#A8E6CF","#F2FFF9"]},{"id":"pal.nature.desert","kind":"palette","name":"Desert Clay","family":"Nature","tags":["palette","nature"],"colors":["#3D1F00","#92400E","#D97706","#FCD34D","#FFFBEB"]},{"id":"pal.nature.ocean","kind":"palette","name":"Ocean Depth","family":"Nature","tags":["palette","nature"],"colors":["#012A4A","#01497C","#2A6F97","#61A5C2","#D7F9FF"]},{"id":"pal.luxury.gold","kind":"palette","name":"Quiet Gold","family":"Luxury","tags":["palette","luxury"],"colors":["#1A1305","#3D2C0A","#8A6A1F","#D4AF37","#FFF6D6"]},{"id":"pal.luxury.wine","kind":"palette","name":"Wine Cellar","family":"Luxury","tags":["palette","luxury"],"colors":["#1A0010","#4A0E2E","#7B1E4B","#B05A7A","#F7E6EE"]},{"id":"pal.luxury.jade","kind":"palette","name":"Jade","family":"Luxury","tags":["palette","luxury"],"colors":["#031A16","#064E3B","#0F766E","#5EEAD4","#ECFDF5"]},{"id":"pal.energy.volt","kind":"palette","name":"Volt","family":"Energy","tags":["palette","energy"],"colors":["#111111","#3A0CA3","#7209B7","#F72585","#4CC9F0"]},{"id":"pal.energy.flame","kind":"palette","name":"Flame","family":"Energy","tags":["palette","energy"],"colors":["#1A0000","#7F1D1D","#DC2626","#F97316","#FDE68A"]},{"id":"pal.energy.pulse","kind":"palette","name":"Pulse","family":"Energy","tags":["palette","energy"],"colors":["#001219","#005F73","#EE9B00","#CA6702","#BB3E03"]},{"id":"pal.calm.linen","kind":"palette","name":"Linen","family":"Calm","tags":["palette","calm"],"colors":["#F8F4E3","#E9E3D5","#CFC8B8","#A8A08E","#6B6455"]},{"id":"pal.calm.sage","kind":"palette","name":"Sage","family":"Calm","tags":["palette","calm"],"colors":["#1F2A24","#3E4F42","#7A8F7B","#B7C9B1","#EDF3E9"]},{"id":"pal.calm.mist","kind":"palette","name":"Mist","family":"Calm","tags":["palette","calm"],"colors":["#F4F7FB","#DCE6F2","#B7C9DD","#8AA6C1","#5C7A99"]},{"id":"pal.retro.arcade","kind":"palette","name":"Arcade","family":"Retro","tags":["palette","retro"],"colors":["#0B0B2B","#2D1B69","#FF00C8","#00E5FF","#FFE600"]},{"id":"pal.retro.film","kind":"palette","name":"Film Stock","family":"Retro","tags":["palette","retro"],"colors":["#1C120C","#4A2C1A","#8C5A3C","#C9A27E","#F0E2D0"]},{"id":"pal.retro.paper","kind":"palette","name":"Paper","family":"Retro","tags":["palette","retro"],"colors":["#2B2118","#5C4A32","#A88B63","#D9C7A7","#F5EDDC"]},{"id":"pal.neon.cyber","kind":"palette","name":"Cyber","family":"Neon","tags":["palette","neon"],"colors":["#0D0221","#3A0CA3","#F72585","#4CC9F0","#FFFFFF"]},{"id":"pal.neon.toxic","kind":"palette","name":"Toxic","family":"Neon","tags":["palette","neon"],"colors":["#000000","#1A3300","#66FF00","#CCFF00","#FFFFFF"]},{"id":"pal.neon.ultra","kind":"palette","name":"Ultra Violet","family":"Neon","tags":["palette","neon"],"colors":["#12002B","#4C1D95","#8B5CF6","#E879F9","#FDF4FF"]},{"id":"pal.pastel.cloud","kind":"palette","name":"Cloud","family":"Pastel","tags":["palette","pastel"],"colors":["#FDF2F8","#FCE7F3","#FBCFE8","#F9A8D4","#EC4899"]},{"id":"pal.pastel.mint","kind":"palette","name":"Mint Cream","family":"Pastel","tags":["palette","pastel"],"colors":["#F0FDFA","#CCFBF1","#99F6E4","#5EEAD4","#14B8A6"]},{"id":"pal.pastel.apricot","kind":"palette","name":"Apricot","family":"Pastel","tags":["palette","pastel"],"colors":["#FFF7ED","#FFEDD5","#FED7AA","#FDBA74","#F97316"]},{"id":"pal.dark.obsidian","kind":"palette","name":"Obsidian","family":"Dark","tags":["palette","dark"],"colors":["#000000","#0A0A0A","#1A1A1A","#333333","#E5E5E5"]},{"id":"pal.dark.ink","kind":"palette","name":"Ink","family":"Dark","tags":["palette","dark"],"colors":["#050914","#0B1224","#15213D","#2B3A67","#DCE6F5"]},{"id":"pal.dark.ember","kind":"palette","name":"Ember","family":"Dark","tags":["palette","dark"],"colors":["#0A0505","#1F0A0A","#4C1D1D","#991B1B","#FCA5A5"]}];
  FLOW_CATALOG.captions = [{"id":"cap.clean","kind":"caption","name":"Clean","family":"Essential","tags":["caption","clean"],"style":{"fontFamily":"Inter","fontStyle":"Medium","fontSize":54,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":0,"shadow":{"color":"#000000","opacity":60,"angle":135,"distance":4,"softness":8},"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":32,"maxWords":7,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}}},{"id":"cap.bold-yellow","kind":"caption","name":"Bold Yellow","family":"Bold","tags":["caption","yellow","bold"],"style":{"fontFamily":"Inter","fontStyle":"Bold","fontSize":76,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#FFE600","stroke":"#000000","strokeWidth":9,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":20,"maxWords":3,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"pop","duration":0.18,"easing":"outBack"}}},{"id":"cap.word-pop","kind":"caption","name":"Word Pop","family":"Bold","tags":["caption","word","pop"],"style":{"fontFamily":"Inter","fontStyle":"Bold","fontSize":110,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":10,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":20,"maxWords":1,"maxDuration":4,"maxGap":0.4},"animation":{"kind":"pop","duration":0.14,"easing":"outBack"}}},{"id":"cap.minimal","kind":"caption","name":"Minimal","family":"Essential","tags":["caption","minimal"],"style":{"fontFamily":"Inter","fontStyle":"Regular","fontSize":40,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":0,"shadow":null,"position":{"anchor":"bottom","margin":0.08,"offsetX":0},"align":"center","group":{"maxChars":44,"maxWords":9,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"none","duration":0.15,"easing":"outCubic"}}},{"id":"cap.subtitle-outline","kind":"caption","name":"Subtitle Outline","family":"Essential","tags":["caption","outline"],"style":{"fontFamily":"Inter","fontStyle":"SemiBold","fontSize":54,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":6,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":32,"maxWords":7,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"slideUp","duration":0.2,"easing":"outCubic"}}},{"id":"cap.hormozi","kind":"caption","name":"Hormozi","family":"Social","tags":["caption","hormozi","yellow"],"style":{"fontFamily":"Inter","fontStyle":"Bold","fontSize":120,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#FFE600","stroke":"#000000","strokeWidth":14,"shadow":null,"position":{"anchor":"middle","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":20,"maxWords":1,"maxDuration":4,"maxGap":0.4},"animation":{"kind":"pop","duration":0.12,"easing":"outBack"}}},{"id":"cap.karaoke","kind":"caption","name":"Karaoke","family":"Social","tags":["caption","karaoke"],"style":{"fontFamily":"Inter","fontStyle":"SemiBold","fontSize":64,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":7,"shadow":null,"position":{"anchor":"bottom","margin":0.1,"offsetX":0},"align":"center","group":{"maxChars":30,"maxWords":5,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"none","duration":0.15,"easing":"outCubic"}}},{"id":"cap.beasty","kind":"caption","name":"Beasty","family":"Social","tags":["caption","beasty","bold"],"style":{"fontFamily":"Inter","fontStyle":"Black","fontSize":118,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#FF0033","strokeWidth":12,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":18,"maxWords":2,"maxDuration":4,"maxGap":0.5},"animation":{"kind":"pop","duration":0.16,"easing":"outBack"}}},{"id":"cap.boxed-dark","kind":"caption","name":"Boxed Dark","family":"Boxed","tags":["caption","box","dark"],"style":{"fontFamily":"Inter","fontStyle":"SemiBold","fontSize":56,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":0,"shadow":{"color":"#000000","opacity":55,"angle":135,"distance":3,"softness":6},"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":28,"maxWords":6,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}}},{"id":"cap.boxed-light","kind":"caption","name":"Boxed Light","family":"Boxed","tags":["caption","box","light"],"style":{"fontFamily":"Inter","fontStyle":"SemiBold","fontSize":56,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#111111","stroke":"#000000","strokeWidth":0,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":28,"maxWords":6,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}}},{"id":"cap.glass","kind":"caption","name":"Glass","family":"Boxed","tags":["caption","glass"],"style":{"fontFamily":"Inter","fontStyle":"Medium","fontSize":52,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":0,"shadow":{"color":"#000000","opacity":40,"angle":135,"distance":6,"softness":14},"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":30,"maxWords":7,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}}},{"id":"cap.neon","kind":"caption","name":"Neon","family":"Social","tags":["caption","neon","glow"],"style":{"fontFamily":"Inter","fontStyle":"Bold","fontSize":72,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#5CE1FF","stroke":"#000000","strokeWidth":4,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":32,"maxWords":7,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"fade","duration":0.2,"easing":"outCubic"}}},{"id":"cap.retro","kind":"caption","name":"Retro","family":"Style","tags":["caption","retro"],"style":{"fontFamily":"Trebuchet MS","fontStyle":"Bold","fontSize":64,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFE600","stroke":"#7B2CBF","strokeWidth":8,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":26,"maxWords":5,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}}},{"id":"cap.comic","kind":"caption","name":"Comic","family":"Style","tags":["caption","comic"],"style":{"fontFamily":"Comic Sans MS","fontStyle":"Bold","fontSize":70,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":10,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":22,"maxWords":4,"maxDuration":4,"maxGap":0.7},"animation":{"kind":"pop","duration":0.2,"easing":"outElastic"}}},{"id":"cap.cinema","kind":"caption","name":"Cinema","family":"Style","tags":["caption","cinema"],"style":{"fontFamily":"Georgia","fontStyle":"Italic","fontSize":46,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#F5F7FB","stroke":"#000000","strokeWidth":0,"shadow":null,"position":{"anchor":"bottom","margin":0.09,"offsetX":0},"align":"center","group":{"maxChars":42,"maxWords":9,"maxDuration":5,"maxGap":1.0},"animation":{"kind":"fade","duration":0.25,"easing":"outQuad"}}},{"id":"cap.news-ticker","kind":"caption","name":"News Ticker","family":"Style","tags":["caption","news","ticker"],"style":{"fontFamily":"Inter","fontStyle":"Bold","fontSize":38,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":0,"shadow":null,"position":{"anchor":"bottom","margin":0.04,"offsetX":0},"align":"center","group":{"maxChars":52,"maxWords":10,"maxDuration":6,"maxGap":1.0},"animation":{"kind":"slideUp","duration":0.12,"easing":"linear"}}},{"id":"cap.two-tone","kind":"caption","name":"Two-Tone","family":"Social","tags":["caption","two-tone"],"style":{"fontFamily":"Inter","fontStyle":"Bold","fontSize":78,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#5CE1FF","stroke":"#101526","strokeWidth":6,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":24,"maxWords":4,"maxDuration":4,"maxGap":0.6},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}}},{"id":"cap.gradient-fill","kind":"caption","name":"Gradient Fill","family":"Social","tags":["caption","gradient"],"style":{"fontFamily":"Inter","fontStyle":"Bold","fontSize":80,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#FFB36B","stroke":"#000000","strokeWidth":0,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":24,"maxWords":4,"maxDuration":4,"maxGap":0.6},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}},"approx":true},{"id":"cap.typewriter","kind":"caption","name":"Typewriter","family":"Style","tags":["caption","typewriter"],"style":{"fontFamily":"Courier New","fontStyle":"Bold","fontSize":44,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#F5F7FB","stroke":"#000000","strokeWidth":0,"shadow":null,"position":{"anchor":"bottom","margin":0.1,"offsetX":0},"align":"center","group":{"maxChars":38,"maxWords":8,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"none","duration":0.1,"easing":"linear"}}},{"id":"cap.handwritten","kind":"caption","name":"Handwritten","family":"Style","tags":["caption","handwritten"],"style":{"fontFamily":"Segoe Script","fontStyle":"Regular","fontSize":52,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":0,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":34,"maxWords":7,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}},"approx":true},{"id":"cap.arabic-naskh","kind":"caption","name":"Arabic Naskh","family":"Arabic","tags":["caption","arabic","rtl"],"style":{"fontFamily":"Noto Naskh Arabic","fontStyle":"Regular","fontSize":58,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":4,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"right","group":{"maxChars":34,"maxWords":7,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}}},{"id":"cap.arabic-kufi","kind":"caption","name":"Arabic Kufi","family":"Arabic","tags":["caption","arabic","rtl"],"style":{"fontFamily":"Noto Kufi Arabic","fontStyle":"Bold","fontSize":56,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFE600","stroke":"#000000","strokeWidth":5,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"right","group":{"maxChars":32,"maxWords":6,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}}},{"id":"cap.arabic-bold-boxed","kind":"caption","name":"Arabic Bold Boxed","family":"Arabic","tags":["caption","arabic","rtl","box"],"style":{"fontFamily":"Noto Sans Arabic","fontStyle":"Black","fontSize":64,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":0,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"right","group":{"maxChars":28,"maxWords":6,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}}},{"id":"cap.tiny-footnote","kind":"caption","name":"Tiny Footnote","family":"Essential","tags":["caption","small"],"style":{"fontFamily":"Inter","fontStyle":"Regular","fontSize":28,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#E5E7EB","stroke":"#000000","strokeWidth":0,"shadow":null,"position":{"anchor":"bottom","margin":0.05,"offsetX":0},"align":"center","group":{"maxChars":60,"maxWords":12,"maxDuration":5,"maxGap":1.0},"animation":{"kind":"fade","duration":0.1,"easing":"linear"}}},{"id":"cap.big-center","kind":"caption","name":"Big Center","family":"Bold","tags":["caption","center","big"],"style":{"fontFamily":"Inter","fontStyle":"Black","fontSize":130,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":8,"shadow":null,"position":{"anchor":"middle","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":16,"maxWords":2,"maxDuration":4,"maxGap":0.4},"animation":{"kind":"pop","duration":0.2,"easing":"outBack"}}},{"id":"cap.top-bar","kind":"caption","name":"Top Bar","family":"Style","tags":["caption","top"],"style":{"fontFamily":"Inter","fontStyle":"Bold","fontSize":42,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":0,"shadow":null,"position":{"anchor":"top","margin":0.06,"offsetX":0},"align":"center","group":{"maxChars":42,"maxWords":8,"maxDuration":5,"maxGap":0.9},"animation":{"kind":"slideUp","duration":0.15,"easing":"outCubic"}}},{"id":"cap.lower-third","kind":"caption","name":"Lower Third Caption","family":"Style","tags":["caption","lowerthird"],"style":{"fontFamily":"Inter","fontStyle":"Medium","fontSize":44,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":0,"shadow":null,"position":{"anchor":"bottom","margin":0.16,"offsetX":0},"align":"center","group":{"maxChars":40,"maxWords":8,"maxDuration":5,"maxGap":0.9},"animation":{"kind":"slideUp","duration":0.18,"easing":"outCubic"}}},{"id":"cap.speaker-colors","kind":"caption","name":"Speaker Colors","family":"Social","tags":["caption","speaker","color"],"style":{"fontFamily":"Inter","fontStyle":"Bold","fontSize":62,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#5CE1FF","stroke":"#101526","strokeWidth":4,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":30,"maxWords":6,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}}},{"id":"cap.emoji-auto","kind":"caption","name":"Emoji Auto","family":"Social","tags":["caption","emoji"],"style":{"fontFamily":"Inter","fontStyle":"Bold","fontSize":68,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":6,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":24,"maxWords":4,"maxDuration":4,"maxGap":0.6},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}},"approx":true},{"id":"cap.highlight-keyword","kind":"caption","name":"Highlight Keyword","family":"Social","tags":["caption","keyword","highlight"],"style":{"fontFamily":"Inter","fontStyle":"Bold","fontSize":66,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":5,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":30,"maxWords":6,"maxDuration":4,"maxGap":0.7},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}},"approx":true},{"id":"cap.cinema-italic","kind":"caption","name":"Cinema Italic","family":"Style","tags":["caption","cinema","italic"],"style":{"fontFamily":"Georgia","fontStyle":"Italic","fontSize":50,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#F5F7FB","stroke":"#000000","strokeWidth":0,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":40,"maxWords":8,"maxDuration":5,"maxGap":1.0},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}}},{"id":"cap.bold-white-box","kind":"caption","name":"Bold White Box","family":"Boxed","tags":["caption","box","white"],"style":{"fontFamily":"Inter","fontStyle":"Black","fontSize":66,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#111111","stroke":"#000000","strokeWidth":0,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":24,"maxWords":5,"maxDuration":4,"maxGap":0.7},"animation":{"kind":"pop","duration":0.15,"easing":"outBack"}}},{"id":"cap.soft-shadow","kind":"caption","name":"Soft Shadow","family":"Essential","tags":["caption","shadow"],"style":{"fontFamily":"Inter","fontStyle":"Medium","fontSize":56,"uppercase":false,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":0,"shadow":{"color":"#000000","opacity":75,"angle":135,"distance":6,"softness":18},"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":34,"maxWords":7,"maxDuration":4,"maxGap":0.8},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}}},{"id":"cap.outlined-heavy","kind":"caption","name":"Outlined Heavy","family":"Bold","tags":["caption","outline","heavy"],"style":{"fontFamily":"Inter","fontStyle":"Black","fontSize":92,"uppercase":true,"tracking":0,"lineSpacing":1.2,"fill":"#FFFFFF","stroke":"#000000","strokeWidth":16,"shadow":null,"position":{"anchor":"bottom","margin":0.12,"offsetX":0},"align":"center","group":{"maxChars":20,"maxWords":3,"maxDuration":4,"maxGap":0.5},"animation":{"kind":"fade","duration":0.15,"easing":"outCubic"}}}];
  FLOW_CATALOG.sfx = [{"id":"sfx.whoosh","kind":"sfx","name":"Whoosh","family":"Whoosh","tags":["sound","whoosh"],"seconds":0.9,"recipe":"legacy","variant":0},{"id":"sfx.whoosh-fast","kind":"sfx","name":"Fast Whoosh","family":"Whoosh","tags":["sound","whoosh"],"seconds":0.4,"recipe":"legacy","variant":0},{"id":"sfx.sweep-down","kind":"sfx","name":"Sweep Down","family":"Whoosh","tags":["sound","whoosh"],"seconds":0.8,"recipe":"legacy","variant":0},{"id":"sfx.whoosh-soft","kind":"sfx","name":"Soft Whoosh","family":"Whoosh","tags":["sound","whoosh"],"seconds":1.1,"recipe":"whoosh","variant":11},{"id":"sfx.whoosh-deep","kind":"sfx","name":"Deep Whoosh","family":"Whoosh","tags":["sound","whoosh"],"seconds":1.3,"recipe":"whoosh","variant":12},{"id":"sfx.swoosh-up","kind":"sfx","name":"Swoosh Up","family":"Whoosh","tags":["sound","whoosh"],"seconds":0.7,"recipe":"whoosh","variant":13},{"id":"sfx.swoosh-down","kind":"sfx","name":"Swoosh Down","family":"Whoosh","tags":["sound","whoosh"],"seconds":0.7,"recipe":"whoosh","variant":14},{"id":"sfx.air-pass","kind":"sfx","name":"Air Pass","family":"Whoosh","tags":["sound","whoosh"],"seconds":1.5,"recipe":"whoosh","variant":15},{"id":"sfx.riser","kind":"sfx","name":"Riser","family":"Riser","tags":["sound","riser"],"seconds":1.6,"recipe":"legacy","variant":0},{"id":"sfx.tension-riser","kind":"sfx","name":"Tension Riser","family":"Riser","tags":["sound","riser"],"seconds":2.4,"recipe":"riser","variant":21},{"id":"sfx.noise-riser","kind":"sfx","name":"Noise Riser","family":"Riser","tags":["sound","riser"],"seconds":1.8,"recipe":"riser","variant":22},{"id":"sfx.reverse-swell","kind":"sfx","name":"Reverse Swell","family":"Riser","tags":["sound","riser"],"seconds":2.0,"recipe":"reverse","variant":23},{"id":"sfx.build-up","kind":"sfx","name":"Build Up","family":"Riser","tags":["sound","riser"],"seconds":2.8,"recipe":"riser","variant":24},{"id":"sfx.uplift","kind":"sfx","name":"Uplift","family":"Riser","tags":["sound","riser"],"seconds":2.2,"recipe":"riser","variant":25},{"id":"sfx.ascend","kind":"sfx","name":"Ascend","family":"Riser","tags":["sound","riser"],"seconds":1.4,"recipe":"riser","variant":26},{"id":"sfx.impact","kind":"sfx","name":"Cinematic Impact","family":"Impact","tags":["sound","impact"],"seconds":1.5,"recipe":"legacy","variant":0},{"id":"sfx.punch","kind":"sfx","name":"Punch Hit","family":"Impact","tags":["sound","impact"],"seconds":0.35,"recipe":"legacy","variant":0},{"id":"sfx.bass-drop","kind":"sfx","name":"Bass Drop","family":"Impact","tags":["sound","impact"],"seconds":1.8,"recipe":"legacy","variant":0},{"id":"sfx.heartbeat","kind":"sfx","name":"Heartbeat","family":"Impact","tags":["sound","impact"],"seconds":1.2,"recipe":"legacy","variant":0},{"id":"sfx.boom","kind":"sfx","name":"Boom","family":"Impact","tags":["sound","impact"],"seconds":1.6,"recipe":"boom","variant":31},{"id":"sfx.slam","kind":"sfx","name":"Slam","family":"Impact","tags":["sound","impact"],"seconds":0.6,"recipe":"impact","variant":32},{"id":"sfx.thud","kind":"sfx","name":"Thud","family":"Impact","tags":["sound","impact"],"seconds":0.45,"recipe":"impact","variant":33},{"id":"sfx.sub-drop","kind":"sfx","name":"Sub Drop","family":"Drop","tags":["sound","drop"],"seconds":1.4,"recipe":"drop","variant":41},{"id":"sfx.drop-hit","kind":"sfx","name":"Drop Hit","family":"Drop","tags":["sound","drop"],"seconds":1.0,"recipe":"drop","variant":42},{"id":"sfx.low-boom","kind":"sfx","name":"Low Boom","family":"Drop","tags":["sound","drop"],"seconds":1.8,"recipe":"boom","variant":43},{"id":"sfx.downlifter","kind":"sfx","name":"Downlifter","family":"Drop","tags":["sound","drop"],"seconds":1.5,"recipe":"downlifter","variant":44},{"id":"sfx.gravity","kind":"sfx","name":"Gravity","family":"Drop","tags":["sound","drop"],"seconds":2.2,"recipe":"downlifter","variant":45},{"id":"sfx.floor-shake","kind":"sfx","name":"Floor Shake","family":"Drop","tags":["sound","drop"],"seconds":1.2,"recipe":"impact","variant":46},{"id":"sfx.sub-pulse","kind":"sfx","name":"Sub Pulse","family":"Drop","tags":["sound","drop"],"seconds":1.0,"recipe":"drop","variant":47},{"id":"sfx.pop","kind":"sfx","name":"Pop","family":"UI","tags":["sound","ui"],"seconds":0.15,"recipe":"legacy","variant":0},{"id":"sfx.click","kind":"sfx","name":"Click","family":"UI","tags":["sound","ui"],"seconds":0.05,"recipe":"legacy","variant":0},{"id":"sfx.key","kind":"sfx","name":"Key Press","family":"UI","tags":["sound","ui"],"seconds":0.07,"recipe":"legacy","variant":0},{"id":"sfx.toggle","kind":"sfx","name":"Toggle","family":"UI","tags":["sound","ui"],"seconds":0.12,"recipe":"ui","variant":51},{"id":"sfx.swipe-ui","kind":"sfx","name":"Swipe UI","family":"UI","tags":["sound","ui"],"seconds":0.25,"recipe":"ui","variant":52},{"id":"sfx.hover","kind":"sfx","name":"Hover","family":"UI","tags":["sound","ui"],"seconds":0.08,"recipe":"ui","variant":53},{"id":"sfx.confirm","kind":"sfx","name":"Confirm","family":"UI","tags":["sound","ui"],"seconds":0.3,"recipe":"ui","variant":54},{"id":"sfx.ding","kind":"sfx","name":"Bell Ding","family":"Notification","tags":["sound","notification"],"seconds":1.4,"recipe":"legacy","variant":0},{"id":"sfx.notify","kind":"sfx","name":"Notification","family":"Notification","tags":["sound","notification"],"seconds":0.6,"recipe":"legacy","variant":0},{"id":"sfx.success","kind":"sfx","name":"Success Chime","family":"Notification","tags":["sound","notification"],"seconds":0.9,"recipe":"legacy","variant":0},{"id":"sfx.error","kind":"sfx","name":"Error Buzz","family":"Notification","tags":["sound","notification"],"seconds":0.45,"recipe":"legacy","variant":0},{"id":"sfx.message","kind":"sfx","name":"Message","family":"Notification","tags":["sound","notification"],"seconds":0.5,"recipe":"chime","variant":61},{"id":"sfx.alert","kind":"sfx","name":"Alert","family":"Notification","tags":["sound","notification"],"seconds":0.7,"recipe":"chime","variant":62},{"id":"sfx.chime-soft","kind":"sfx","name":"Soft Chime","family":"Notification","tags":["sound","notification"],"seconds":1.2,"recipe":"chime","variant":63},{"id":"sfx.sparkle","kind":"sfx","name":"Sparkle","family":"Magic","tags":["sound","magic"],"seconds":1.1,"recipe":"legacy","variant":0},{"id":"sfx.zap","kind":"sfx","name":"Laser Zap","family":"Magic","tags":["sound","magic"],"seconds":0.4,"recipe":"legacy","variant":0},{"id":"sfx.glitch","kind":"sfx","name":"Glitch","family":"Magic","tags":["sound","magic"],"seconds":0.5,"recipe":"legacy","variant":0},{"id":"sfx.tape-stop","kind":"sfx","name":"Tape Stop","family":"Magic","tags":["sound","magic"],"seconds":1.0,"recipe":"legacy","variant":0},{"id":"sfx.shimmer","kind":"sfx","name":"Shimmer","family":"Magic","tags":["sound","magic"],"seconds":1.6,"recipe":"shimmer","variant":71},{"id":"sfx.fairy-dust","kind":"sfx","name":"Fairy Dust","family":"Magic","tags":["sound","magic"],"seconds":1.8,"recipe":"shimmer","variant":72},{"id":"sfx.magic-wand","kind":"sfx","name":"Magic Wand","family":"Magic","tags":["sound","magic"],"seconds":1.2,"recipe":"sparkle","variant":73},{"id":"sfx.data-stream","kind":"sfx","name":"Data Stream","family":"Digital","tags":["sound","digital"],"seconds":1.4,"recipe":"digital","variant":81},{"id":"sfx.bit-crush","kind":"sfx","name":"Bit Crush","family":"Digital","tags":["sound","digital"],"seconds":0.6,"recipe":"digital","variant":82},{"id":"sfx.static-burst","kind":"sfx","name":"Static Burst","family":"Digital","tags":["sound","digital"],"seconds":0.4,"recipe":"digital","variant":83},{"id":"sfx.modem","kind":"sfx","name":"Modem","family":"Digital","tags":["sound","digital"],"seconds":1.8,"recipe":"digital","variant":84},{"id":"sfx.error-code","kind":"sfx","name":"Error Code","family":"Digital","tags":["sound","digital"],"seconds":0.8,"recipe":"digital","variant":85},{"id":"sfx.digital-rain","kind":"sfx","name":"Digital Rain","family":"Digital","tags":["sound","digital"],"seconds":2.0,"recipe":"digital","variant":86},{"id":"sfx.shutter","kind":"sfx","name":"Camera Shutter","family":"Camera","tags":["sound","camera"],"seconds":0.25,"recipe":"legacy","variant":0},{"id":"sfx.focus-pull","kind":"sfx","name":"Focus Pull","family":"Camera","tags":["sound","camera"],"seconds":0.6,"recipe":"camera","variant":91},{"id":"sfx.lens-click","kind":"sfx","name":"Lens Click","family":"Camera","tags":["sound","camera"],"seconds":0.2,"recipe":"camera","variant":92},{"id":"sfx.film-advance","kind":"sfx","name":"Film Advance","family":"Camera","tags":["sound","camera"],"seconds":0.9,"recipe":"camera","variant":93},{"id":"sfx.flash-charge","kind":"sfx","name":"Flash Charge","family":"Camera","tags":["sound","camera"],"seconds":1.2,"recipe":"riser","variant":94},{"id":"sfx.camera-roll","kind":"sfx","name":"Camera Roll","family":"Camera","tags":["sound","camera"],"seconds":1.5,"recipe":"camera","variant":95},{"id":"sfx.room-tone","kind":"sfx","name":"Room Tone","family":"Ambience","tags":["sound","ambience"],"seconds":3.0,"recipe":"ambience","variant":101},{"id":"sfx.soft-wind","kind":"sfx","name":"Soft Wind","family":"Ambience","tags":["sound","ambience"],"seconds":4.0,"recipe":"ambience","variant":102},{"id":"sfx.deep-drone","kind":"sfx","name":"Deep Drone","family":"Ambience","tags":["sound","ambience"],"seconds":5.0,"recipe":"ambience","variant":103},{"id":"sfx.air-pad","kind":"sfx","name":"Air Pad","family":"Ambience","tags":["sound","ambience"],"seconds":4.0,"recipe":"ambience","variant":104},{"id":"sfx.ocean-wash","kind":"sfx","name":"Ocean Wash","family":"Ambience","tags":["sound","ambience"],"seconds":4.5,"recipe":"ambience","variant":105},{"id":"sfx.night-ambience","kind":"sfx","name":"Night Ambience","family":"Ambience","tags":["sound","ambience"],"seconds":5.0,"recipe":"ambience","variant":106},{"id":"sfx.boing","kind":"sfx","name":"Boing","family":"Cartoon","tags":["sound","cartoon"],"seconds":0.7,"recipe":"cartoon","variant":111},{"id":"sfx.squeak","kind":"sfx","name":"Squeak","family":"Cartoon","tags":["sound","cartoon"],"seconds":0.4,"recipe":"cartoon","variant":112},{"id":"sfx.slide-whistle","kind":"sfx","name":"Slide Whistle","family":"Cartoon","tags":["sound","cartoon"],"seconds":1.0,"recipe":"cartoon","variant":113},{"id":"sfx.bonk","kind":"sfx","name":"Bonk","family":"Cartoon","tags":["sound","cartoon"],"seconds":0.3,"recipe":"cartoon","variant":114},{"id":"sfx.pop-cork","kind":"sfx","name":"Pop Cork","family":"Cartoon","tags":["sound","cartoon"],"seconds":0.25,"recipe":"cartoon","variant":115},{"id":"sfx.wobble","kind":"sfx","name":"Wobble","family":"Cartoon","tags":["sound","cartoon"],"seconds":0.8,"recipe":"cartoon","variant":116},{"id":"sfx.laser-zap","kind":"sfx","name":"Laser Zap","family":"Sci-Fi","tags":["sound","sci-fi"],"seconds":0.4,"recipe":"scifi","variant":121},{"id":"sfx.phaser","kind":"sfx","name":"Phaser","family":"Sci-Fi","tags":["sound","sci-fi"],"seconds":0.8,"recipe":"scifi","variant":122},{"id":"sfx.warp","kind":"sfx","name":"Warp","family":"Sci-Fi","tags":["sound","sci-fi"],"seconds":1.6,"recipe":"scifi","variant":123},{"id":"sfx.teleport","kind":"sfx","name":"Teleport","family":"Sci-Fi","tags":["sound","sci-fi"],"seconds":1.2,"recipe":"scifi","variant":124},{"id":"sfx.hologram","kind":"sfx","name":"Hologram","family":"Sci-Fi","tags":["sound","sci-fi"],"seconds":1.4,"recipe":"scifi","variant":125},{"id":"sfx.energy-hum","kind":"sfx","name":"Energy Hum","family":"Sci-Fi","tags":["sound","sci-fi"],"seconds":2.0,"recipe":"scifi","variant":126}];
  FLOW_CATALOG.tools = [{"id":"tool.markers.chapters","kind":"tool","name":"Chapter Markers","family":"Markers","tags":["marker","chapter"],"tool":"marker.chapters","needs":"comp"},{"id":"tool.markers.beats","kind":"tool","name":"Beat Markers","family":"Markers","tags":["marker","beat","music"],"tool":"marker.beats","needs":"audio"},{"id":"tool.markers.notes","kind":"tool","name":"Note Markers","family":"Markers","tags":["marker","note"],"tool":"marker.notes","needs":"comp"},{"id":"tool.layers.rename","kind":"tool","name":"Rename Layers","family":"Layers","tags":["rename","layer"],"tool":"layer.rename","needs":"layers"},{"id":"tool.layers.labels","kind":"tool","name":"Colour Labels","family":"Layers","tags":["label","color"],"tool":"layer.labels","needs":"layers"},{"id":"tool.layers.nulls","kind":"tool","name":"Auto Nulls","family":"Layers","tags":["null","parent"],"tool":"layer.nulls","needs":"layers"},{"id":"tool.layers.anchor","kind":"tool","name":"Anchor Snap","family":"Layers","tags":["anchor","center"],"tool":"layer.anchor","needs":"layers"},{"id":"tool.layers.trim","kind":"tool","name":"Trim Path","family":"Layers","tags":["trim","path"],"tool":"layer.trim","needs":"shape"},{"id":"tool.layers.sequence","kind":"tool","name":"Sequence Layers","family":"Layers","tags":["sequence","stagger"],"tool":"layer.sequence","needs":"two-layers"},{"id":"tool.layers.align-left","kind":"tool","name":"Align Left","family":"Layers","tags":["align","left"],"tool":"layer.align-left","needs":"layers"},{"id":"tool.layers.distribute","kind":"tool","name":"Distribute","family":"Layers","tags":["distribute","space"],"tool":"layer.distribute","needs":"two-layers"},{"id":"tool.layers.precompose","kind":"tool","name":"Pre-compose Clean","family":"Layers","tags":["precompose","clean"],"tool":"layer.precompose","needs":"layers"},{"id":"tool.layers.explode","kind":"tool","name":"Text Exploder","family":"Text","tags":["text","explode","words"],"tool":"text.explode","needs":"text"},{"id":"tool.layers.batch-offset","kind":"tool","name":"Batch Offset","family":"Layers","tags":["batch","offset","stagger"],"tool":"layer.batch-offset","needs":"layers"},{"id":"tool.project.916","kind":"tool","name":"Vertical 9:16","family":"Project","tags":["project","social","vertical"],"tool":"project.preset-916","needs":"comp"},{"id":"tool.project.11","kind":"tool","name":"Square 1:1","family":"Project","tags":["project","social","square"],"tool":"project.preset-11","needs":"comp"},{"id":"tool.project.45","kind":"tool","name":"Portrait 4:5","family":"Project","tags":["project","social","portrait"],"tool":"project.preset-45","needs":"comp"},{"id":"tool.project.169","kind":"tool","name":"Landscape 16:9","family":"Project","tags":["project","video","landscape"],"tool":"project.preset-169","needs":"comp"},{"id":"tool.project.4k","kind":"tool","name":"4K UHD","family":"Project","tags":["project","4k"],"tool":"project.preset-4k","needs":"comp"},{"id":"tool.project.safe","kind":"tool","name":"Safe Area Guides","family":"Project","tags":["project","safe","guide"],"tool":"project.safe","needs":"comp"},{"id":"tool.history.repeat","kind":"tool","name":"Repeat on Selection","family":"Workflow","tags":["history","repeat"],"tool":"history.repeat","needs":"layers"},{"id":"tool.history.clear","kind":"tool","name":"Clear Flow History","family":"Workflow","tags":["history","clear"],"tool":"history.clear","needs":"comp"},{"id":"tool.time.freeze","kind":"tool","name":"Freeze Frame","family":"Time","tags":["freeze","time"],"tool":"time.freeze","needs":"layers"},{"id":"tool.time.reverse","kind":"tool","name":"Reverse Clip","family":"Time","tags":["reverse","time"],"tool":"time.reverse","needs":"layers"}];
  var FLOW_NATIVE_IDS = ["ec.3d.channelextract","ec.3d.cryptomatte","ec.3d.depthmatte","ec.3d.depthoffield","ec.3d.extractor","ec.3d.fog3d","ec.3d.identifier","ec.3d.idmatte","ec.3d.instance3d","ec.audio.backwards","ec.audio.basstreble","ec.audio.compressor","ec.audio.delay","ec.audio.distortion","ec.audio.flangechorus","ec.audio.gate","ec.audio.highlowpass","ec.audio.modulator","ec.audio.parametriceq","ec.audio.reverb","ec.audio.stereomixer","ec.audio.tone","ec.blur.bilateral","ec.blur.cameralens","ec.blur.camerashakedeblur","ec.blur.cccross","ec.blur.ccradial","ec.blur.ccradialfast","ec.blur.ccvector","ec.blur.channel","ec.blur.compound","ec.blur.directional","ec.blur.fastbox","ec.blur.gaussian","ec.blur.radial","ec.blur.reduceflicker","ec.blur.sharpen","ec.blur.smart","ec.blur.unsharp","ec.channel.arithmetic","ec.channel.blend","ec.channel.calculations","ec.channel.cccomposite","ec.channel.combiner","ec.channel.compoundarithmetic","ec.channel.invert","ec.channel.minimax","ec.channel.removecolormatting","ec.channel.setchannels","ec.channel.setmatte","ec.channel.shiftchannels","ec.channel.solidcomposite","ec.color.autocolor","ec.color.autocontrast","ec.color.autolevels","ec.color.blackwhite","ec.color.brightnesscontrast","ec.color.broadcast","ec.color.cccolorneutralizer","ec.color.cccoloroffset","ec.color.cckernel","ec.color.cctoner","ec.color.changecolor","ec.color.changetocolor","ec.color.channelmixer","ec.color.colorama","ec.color.colorbalance","ec.color.colorbalancehls","ec.color.colorlink","ec.color.colorstabilizer","ec.color.curves","ec.color.equalize","ec.color.exposure","ec.color.gammapedestalgain","ec.color.huesaturation","ec.color.leavecolor","ec.color.levels","ec.color.levelsic","ec.color.lumetri","ec.color.ociocdl","ec.color.ociocolorspace","ec.color.ociodisplay","ec.color.ociofile","ec.color.ociolook","ec.color.photofilter","ec.color.psarbitrarymap","ec.color.selectivecolor","ec.color.shadowhighlight","ec.color.tint","ec.color.tritone","ec.color.vibrance","ec.color.videolimiter","ec.control.angle","ec.control.checkbox","ec.control.color","ec.control.dropdown","ec.control.layer","ec.control.point","ec.control.point3d","ec.control.slider","ec.control.stereo3d","ec.distort.bezierwarp","ec.distort.bulge","ec.distort.ccbender","ec.distort.ccbendit","ec.distort.ccblobbylize","ec.distort.ccflomotion","ec.distort.ccgriddler","ec.distort.cclens","ec.distort.ccpageturn","ec.distort.ccpowerpin","ec.distort.ccripplepulse","ec.distort.ccslant","ec.distort.ccsmear","ec.distort.ccsplit","ec.distort.ccsplit2","ec.distort.cctiler","ec.distort.cornerpin","ec.distort.displacementmap","ec.distort.liquify","ec.distort.magnify","ec.distort.meshwarp","ec.distort.mirror","ec.distort.offset","ec.distort.opticscompensation","ec.distort.polar","ec.distort.puppet","ec.distort.reshape","ec.distort.ripple","ec.distort.rollingshutterrepair","ec.distort.smear","ec.distort.spherize","ec.distort.transform","ec.distort.turbulentdisplace","ec.distort.twirl","ec.distort.twirllegacy","ec.distort.upscale","ec.distort.warp","ec.distort.warpstabilizer","ec.distort.wavewarp","ec.generate.advancedlightning","ec.generate.audiospectrum","ec.generate.audiowaveform","ec.generate.beam","ec.generate.ccgluegun","ec.generate.cclightburst","ec.generate.cclightrays","ec.generate.cclightsweep","ec.generate.ccthreads","ec.generate.cellpattern","ec.generate.checkerboard","ec.generate.circle","ec.generate.ellipse","ec.generate.eyedropperfill","ec.generate.fill","ec.generate.fourcolor","ec.generate.fractal","ec.generate.gradientramp","ec.generate.grid","ec.generate.lensflare","ec.generate.paintbucket","ec.generate.radiowaves","ec.generate.scribble","ec.generate.stroke","ec.generate.vegas","ec.generate.writeon","ec.key.advancedspill","ec.key.ccsimplewireremoval","ec.key.colordifference","ec.key.colorkey","ec.key.colorrange","ec.key.differencematte","ec.key.extract","ec.key.innerouter","ec.key.keycleaner","ec.key.linearcolor","ec.key.luma","ec.key.screen","ec.key.spill","ec.key.unmult","ec.keying.keylight","ec.matte.mattechoker","ec.matte.objectmatte","ec.matte.refinehard","ec.matte.refinesoft","ec.matte.rotobrush","ec.matte.simplechoker","ec.noise.addgrain","ec.noise.curlnoise","ec.noise.dustscratches","ec.noise.fractal","ec.noise.matchgrain","ec.noise.median","ec.noise.medianlegacy","ec.noise.noise","ec.noise.noisealpha","ec.noise.noisehls","ec.noise.noisehlsauto","ec.noise.removegrain","ec.noise.turbulent","ec.obsolete.basic3d","ec.obsolete.basictext","ec.obsolete.gaussianlegacy","ec.obsolete.lightning","ec.obsolete.mochashape","ec.obsolete.pathtext","ec.paint.paint","ec.perspective.3dglasses","ec.perspective.bevelalpha","ec.perspective.beveledges","ec.perspective.cameratracker","ec.perspective.cccylinder","ec.perspective.ccenvironment","ec.perspective.ccsphere","ec.perspective.ccspotlight","ec.perspective.dropshadow","ec.perspective.radialshadow","ec.sim.carddance","ec.sim.caustics","ec.sim.ccballaction","ec.sim.ccbubbles","ec.sim.ccdrizzle","ec.sim.cchair","ec.sim.ccmrmercury","ec.sim.ccparticlesystems2","ec.sim.ccparticleworld","ec.sim.ccpixelpolly","ec.sim.ccrainfall","ec.sim.ccscatterize","ec.sim.ccsnowfall","ec.sim.ccstarburst","ec.sim.foam","ec.sim.particleplayground","ec.sim.shatter","ec.sim.waveworld","ec.stylize.brushstrokes","ec.stylize.cartoon","ec.stylize.ccblockload","ec.stylize.ccburnfilm","ec.stylize.ccglass","ec.stylize.cchextile","ec.stylize.cckaleida","ec.stylize.ccmrsmoothie","ec.stylize.ccplastic","ec.stylize.ccrepetile","ec.stylize.ccthreshold","ec.stylize.ccthresholdrgb","ec.stylize.ccvignette","ec.stylize.coloremboss","ec.stylize.emboss","ec.stylize.findedges","ec.stylize.glow","ec.stylize.mosaic","ec.stylize.motiontile","ec.stylize.posterize","ec.stylize.roughenedges","ec.stylize.scatter","ec.stylize.strobe","ec.stylize.texturize","ec.stylize.threshold","ec.text.numbers","ec.text.timecode","ec.time.ccforcemotionblur","ec.time.ccwidetime","ec.time.echo","ec.time.pixelmotionblur","ec.time.posterizetime","ec.time.timedifference","ec.time.timedisplacement","ec.time.timewarp","ec.transition.blockdissolve","ec.transition.cardwipe","ec.transition.ccglasswipe","ec.transition.ccgridwipe","ec.transition.ccimagewipe","ec.transition.ccjaws","ec.transition.cclightwipe","ec.transition.cclinesweep","ec.transition.ccradialscalewipe","ec.transition.ccscalewipe","ec.transition.cctwister","ec.transition.ccwarpomatic","ec.transition.gradientwipe","ec.transition.iriswipe","ec.transition.linearwipe","ec.transition.radialwipe","ec.transition.venetian","ec.utility.applylut","ec.utility.ccoverbrights","ec.utility.cineon","ec.utility.colorprofileconverter","ec.utility.facemeasurements","ec.utility.facetrackpoints","ec.utility.growbounds","ec.utility.hdrcompander","ec.utility.hdrcompression","ec.vr.blur","ec.vr.chromaticaberrations","ec.vr.colorgradients","ec.vr.converter","ec.vr.denoise","ec.vr.digitalglitch","ec.vr.fractalnoise","ec.vr.glow","ec.vr.planetosphere","ec.vr.rotatesphere","ec.vr.sharpen","ec.vr.spheretoplane"];
  // // </flow-catalog>

  // ------------------------------------------------------------------ language & theme
  // The panel ships in French, English and Arabic. Static controls are translated once after
  // they are built, and again whenever the language changes; dynamic messages go through tr().
  var LANGS = ["fr", "en", "ar"];
  var LANG = setting("language", "fr");
  if (LANGS.indexOf(LANG) < 0) LANG = "fr";
  var THEME = setting("theme", "auto");
  if (["auto", "dark", "light"].indexOf(THEME) < 0) THEME = "auto";

  function normKey(s) {
    return String(s)
      .toLowerCase()
      .replace(/[\u00e0\u00e2\u00e4]/g, "a")
      .replace(/[\u00e7]/g, "c")
      .replace(/[\u00e8\u00e9\u00ea\u00eb]/g, "e")
      .replace(/[\u00ee\u00ef]/g, "i")
      .replace(/[\u00f4\u00f6]/g, "o")
      .replace(/[\u00f9\u00fb\u00fc]/g, "u")
      .replace(/[\u0153]/g, "oe")
      .replace(/[\u2019']/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  }

  // One canonical key set for every language. Controls are created in French (or English for a
  // few menus), and the reverse index below maps whichever text they carry back to its key, so a
  // language change translates the whole shell without rebuilding the layout.
  var STRINGS = {
    fr: {
      "library": "Biblioth\u00e8que", "montage": "Montage", "animer": "Animer", "look": "Look",
      "settings": "R\u00e9glages", "silence": "Silence", "captions": "Sous-titres", "sounds": "Sons",
      "ease": "Courbes", "expressions": "Expressions", "text": "Texte", "background": "Fond",
      "effects": "Effets", "stroke": "Contour", "models": "Mod\u00e8les", "helper": "Aide & connexion",
      "pack": "Pack de presets", "language": "Langue", "theme": "Th\u00e8me",
      "auto": "Auto (syst\u00e8me)", "dark": "Sombre", "light": "Clair",
      "applyEase": "Appliquer aux propri\u00e9t\u00e9s s\u00e9lectionn\u00e9es",
      "removeExpr": "Supprimer l'expression", "applyExpr": "Appliquer l'expression",
      "showCode": "Voir le code", "analyze": "Analyser les silences", "cutSilence": "Couper les silences",
      "detectBeats": "D\u00e9tecter le tempo & poser des marqueurs", "cutBeats": "Couper sur le tempo",
      "generate": "G\u00e9n\u00e9rer depuis le calque", "importCaptions": "Importer un fichier de sous-titres",
      "saveStyle": "Enregistrer le style", "delete": "Supprimer", "createLayers": "Cr\u00e9er les calques de texte",
      "restyle": "Re-styliser tous les sous-titres", "exportSrt": "Exporter SRT", "exportAss": "Exporter ASS",
      "applyText": "Appliquer au texte s\u00e9lectionn\u00e9", "removeAnim": "Supprimer l'animation Flow",
      "savePreset": "Enregistrer dans mes presets", "deletePreset": "Supprimer mon preset",
      "exportPresets": "Exporter mes presets", "importPresets": "Importer",
      "addBackground": "Ajouter le fond d\u00e9grad\u00e9", "updateSelected": "Mettre \u00e0 jour la s\u00e9lection",
      "applyEffect": "Appliquer l'effet", "removeEffects": "Supprimer les effets Flow",
      "applyStroke": "Appliquer le contour", "animateIn": "Animer l'apparition",
      "addPlayhead": "Ajouter \u00e0 la t\u00eate de lecture", "addSelected": "Ajouter aux calques s\u00e9lectionn\u00e9s",
      "scanFolder": "Scanner mon dossier", "addTimeline": "Ajouter \u00e0 la timeline",
      "favorite": "\u2605 Favori", "connect": "Connecter / Actualiser", "install": "Installer",
      "verify": "V\u00e9rifier", "remove": "D\u00e9sinstaller", "exportPack": "Exporter le pack complet",
      "importPack": "Importer un pack", "loadFile": "Charger ce fichier",
      "showWelcome": "Revoir l'aide de d\u00e9marrage", "testConnection": "Tester la connexion / R\u00e9essayer",
      "saveWhisper": "Enregistrer le chemin whisper-cli",
      "welcome.title": "Bienvenue dans Flow Studio",
      "welcome.body": "Flow Studio fait le montage \u00e0 votre place : silences, sous-titres, karaok\u00e9, rythme, effets. Certaines fonctions ont besoin du petit assistant local (helper).",
      "welcome.check": "V\u00e9rifier le helper", "welcome.retry": "R\u00e9essayer",
      "welcome.skip": "Continuer sans helper", "welcome.ok": "Helper connect\u00e9. Tout est pr\u00eat.",
      "welcome.fail": "Helper introuvable. Vous pouvez continuer : les fonctions sans helper restent disponibles.",
      "help.under": "Choisissez un \u00e9l\u00e9ment, puis cliquez sur le bouton principal.",
      "status.ready": "Pr\u00eat."
    },
    en: {
      "library": "Library", "montage": "Montage", "animer": "Animate", "look": "Look",
      "settings": "Settings", "silence": "Silence", "captions": "Captions", "sounds": "Sounds",
      "ease": "Ease", "expressions": "Expressions", "text": "Text", "background": "Background",
      "effects": "Effects", "stroke": "Stroke", "models": "Models", "helper": "Helper & setup",
      "pack": "Preset pack", "language": "Language", "theme": "Theme",
      "auto": "Auto (system)", "dark": "Dark", "light": "Light",
      "applyEase": "Apply to selected properties", "removeExpr": "Remove expression",
      "applyExpr": "Apply to selected property", "showCode": "Show code",
      "analyze": "Analyze silence", "cutSilence": "Cut silence",
      "detectBeats": "Detect tempo & add markers", "cutBeats": "Cut on tempo",
      "generate": "Generate from layer", "importCaptions": "Import captions from file",
      "saveStyle": "Save style", "delete": "Delete", "createLayers": "Create text layers",
      "restyle": "Restyle all", "exportSrt": "Export SRT", "exportAss": "Export ASS",
      "applyText": "Apply to selected text", "removeAnim": "Remove Flow animation",
      "savePreset": "Save as my preset", "deletePreset": "Delete my preset",
      "exportPresets": "Export my presets", "importPresets": "Import",
      "addBackground": "Add gradient background", "updateSelected": "Update selection",
      "applyEffect": "Apply effect", "removeEffects": "Remove Flow effects",
      "applyStroke": "Apply stroke", "animateIn": "Animate in",
      "addPlayhead": "Add at playhead", "addSelected": "Add at selected layers",
      "scanFolder": "Scan my folder", "addTimeline": "Add to timeline",
      "favorite": "\u2605 Favorite", "connect": "Connect / refresh", "install": "Install",
      "verify": "Verify", "remove": "Remove", "exportPack": "Export the full pack",
      "importPack": "Import a pack", "loadFile": "Load this file",
      "showWelcome": "Show the welcome screen", "testConnection": "Test connection / Retry",
      "saveWhisper": "Save whisper-cli path",
      "welcome.title": "Welcome to Flow Studio",
      "welcome.body": "Flow Studio edits for you: silence, captions, karaoke, rhythm, effects. Some features need the small local helper.",
      "welcome.check": "Check the helper", "welcome.retry": "Try again",
      "welcome.skip": "Continue without the helper",
      "welcome.ok": "Helper connected. Everything is ready.",
      "welcome.fail": "Helper not found. You can continue: features that do not need it still work.",
      "help.under": "Pick an item, then press the main button.",
      "status.ready": "Ready."
    },
    ar: {
      "library": "\u0627\u0644\u0645\u0643\u062a\u0628\u0629", "montage": "\u0627\u0644\u0645\u0648\u0646\u062a\u0627\u062c",
      "animer": "\u062a\u062d\u0631\u064a\u0643", "look": "\u0627\u0644\u0645\u0638\u0647\u0631",
      "settings": "\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a", "silence": "\u0627\u0644\u0635\u0645\u062a",
      "captions": "\u0627\u0644\u062a\u0631\u062c\u0645\u0627\u062a", "sounds": "\u0627\u0644\u0623\u0635\u0648\u0627\u062a",
      "ease": "\u0627\u0644\u0645\u0646\u062d\u0646\u064a\u0627\u062a", "expressions": "\u0627\u0644\u062a\u0639\u0628\u064a\u0631\u0627\u062a",
      "text": "\u0627\u0644\u0646\u0635", "background": "\u0627\u0644\u062e\u0644\u0641\u064a\u0629",
      "effects": "\u0627\u0644\u062a\u0623\u062b\u064a\u0631\u0627\u062a", "stroke": "\u0627\u0644\u062d\u062f\u0648\u062f",
      "models": "\u0627\u0644\u0646\u0645\u0627\u0630\u062c", "helper": "\u0627\u0644\u0645\u0633\u0627\u0639\u062f",
      "pack": "\u062d\u0632\u0645\u0629 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a", "language": "\u0627\u0644\u0644\u063a\u0629",
      "theme": "\u0627\u0644\u0633\u0645\u0629", "auto": "\u062a\u0644\u0642\u0627\u0626\u064a",
      "dark": "\u062f\u0627\u0643\u0646", "light": "\u0641\u0627\u062a\u062d",
      "applyEase": "\u062a\u0637\u0628\u064a\u0642 \u0639\u0644\u0649 \u0627\u0644\u062e\u0635\u0627\u0626\u0635 \u0627\u0644\u0645\u062d\u062f\u062f\u0629",
      "removeExpr": "\u062d\u0630\u0641 \u0627\u0644\u062a\u0639\u0628\u064a\u0631", "applyExpr": "\u062a\u0637\u0628\u064a\u0642",
      "showCode": "\u0639\u0631\u0636 \u0627\u0644\u0643\u0648\u062f", "analyze": "\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0635\u0645\u062a",
      "cutSilence": "\u0642\u0635 \u0627\u0644\u0635\u0645\u062a",
      "detectBeats": "\u0627\u0643\u062a\u0634\u0627\u0641 \u0627\u0644\u0625\u064a\u0642\u0627\u0639 \u0648\u0625\u0636\u0627\u0641\u0629 \u0639\u0644\u0627\u0645\u0627\u062a",
      "cutBeats": "\u0627\u0644\u0642\u0635 \u0639\u0644\u0649 \u0627\u0644\u0625\u064a\u0642\u0627\u0639",
      "generate": "\u0625\u0646\u0634\u0627\u0621 \u0645\u0646 \u0627\u0644\u0637\u0628\u0642\u0629",
      "importCaptions": "\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u0645\u0644\u0641",
      "saveStyle": "\u062d\u0641\u0638 \u0627\u0644\u0646\u0645\u0637", "delete": "\u062d\u0630\u0641",
      "createLayers": "\u0625\u0646\u0634\u0627\u0621 \u0637\u0628\u0642\u0627\u062a \u0627\u0644\u0646\u0635",
      "restyle": "\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u062a\u0646\u0633\u064a\u0642",
      "exportSrt": "\u062a\u0635\u062f\u064a\u0631 SRT", "exportAss": "\u062a\u0635\u062f\u064a\u0631 ASS",
      "applyText": "\u062a\u0637\u0628\u064a\u0642 \u0639\u0644\u0649 \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u062d\u062f\u062f", "removeAnim": "\u0625\u0632\u0627\u0644\u0629 \u062d\u0631\u0643\u0629 Flow",
      "savePreset": "\u062d\u0641\u0638 \u0641\u064a \u0625\u0639\u062f\u0627\u062f\u0627\u062a\u064a", "deletePreset": "\u062d\u0630\u0641 \u0625\u0639\u062f\u0627\u062f\u064a",
      "exportPresets": "\u062a\u0635\u062f\u064a\u0631 \u0625\u0639\u062f\u0627\u062f\u0627\u062a\u064a", "importPresets": "\u0627\u0633\u062a\u064a\u0631\u0627\u062f",
      "addBackground": "\u0625\u0636\u0627\u0641\u0629 \u062e\u0644\u0641\u064a\u0629 \u0645\u062a\u062f\u0631\u062c\u0629", "updateSelected": "\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u062a\u062d\u062f\u064a\u062f",
      "applyEffect": "\u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u062a\u0623\u062b\u064a\u0631", "removeEffects": "\u0625\u0632\u0627\u0644\u0629 \u062a\u0623\u062b\u064a\u0631\u0627\u062a Flow",
      "applyStroke": "\u062a\u0637\u0628\u064a\u0642 \u0627\u0644\u062d\u062f\u0648\u062f", "animateIn": "\u062a\u062d\u0631\u064a\u0643 \u0627\u0644\u0638\u0647\u0648\u0631",
      "addPlayhead": "\u0625\u0636\u0627\u0641\u0629 \u0639\u0646\u062f \u0627\u0644\u0645\u0624\u0634\u0631", "addSelected": "\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0637\u0628\u0642\u0627\u062a \u0627\u0644\u0645\u062d\u062f\u062f\u0629",
      "scanFolder": "\u0641\u062d\u0635 \u0645\u062c\u0644\u062f\u064a", "addTimeline": "\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u062e\u0637 \u0627\u0644\u0632\u0645\u0646\u064a",
      "favorite": "\u2605 \u0645\u0641\u0636\u0644\u0629", "connect": "\u0627\u062a\u0635\u0627\u0644 / \u062a\u062d\u062f\u064a\u062b",
      "install": "\u062a\u062b\u0628\u064a\u062a", "verify": "\u062a\u062d\u0642\u0642", "remove": "\u0625\u0632\u0627\u0644\u0629",
      "exportPack": "\u062a\u0635\u062f\u064a\u0631 \u0627\u0644\u062d\u0632\u0645\u0629", "importPack": "\u0627\u0633\u062a\u064a\u0631\u0627\u062f \u062d\u0632\u0645\u0629",
      "loadFile": "\u062a\u062d\u0645\u064a\u0644 \u0647\u0630\u0627 \u0627\u0644\u0645\u0644\u0641",
      "showWelcome": "\u0639\u0631\u0636 \u0634\u0627\u0634\u0629 \u0627\u0644\u0628\u062f\u0621",
      "testConnection": "\u0627\u062e\u062a\u0628\u0627\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 / \u0625\u0639\u0627\u062f\u0629",
      "saveWhisper": "\u062d\u0641\u0638 \u0645\u0633\u0627\u0631 whisper-cli",
      "welcome.title": "\u0645\u0631\u062d\u0628\u0627 \u0628\u0643 \u0641\u064a Flow Studio",
      "welcome.body": "Flow Studio \u064a\u0642\u0648\u0645 \u0628\u0627\u0644\u0645\u0648\u0646\u062a\u0627\u062c \u0639\u0646\u0643: \u0627\u0644\u0635\u0645\u062a\u060c \u0627\u0644\u062a\u0631\u062c\u0645\u0627\u062a\u060c \u0627\u0644\u0643\u0627\u0631\u0627\u0648\u0643\u064a\u060c \u0627\u0644\u0625\u064a\u0642\u0627\u0639\u060c \u0627\u0644\u062a\u0623\u062b\u064a\u0631\u0627\u062a. \u0628\u0639\u0636 \u0627\u0644\u0648\u0638\u0627\u0626\u0641 \u062a\u062d\u062a\u0627\u062c \u0625\u0644\u0649 \u0627\u0644\u0645\u0633\u0627\u0639\u062f \u0627\u0644\u0645\u062d\u0644\u064a.",
      "welcome.check": "\u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u0645\u0633\u0627\u0639\u062f", "welcome.retry": "\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629",
      "welcome.skip": "\u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629 \u0628\u062f\u0648\u0646 \u0645\u0633\u0627\u0639\u062f",
      "welcome.ok": "\u062a\u0645 \u0627\u0644\u0627\u062a\u0635\u0627\u0644. \u0643\u0644 \u0634\u064a\u0621 \u062c\u0627\u0647\u0632.",
      "welcome.fail": "\u0627\u0644\u0645\u0633\u0627\u0639\u062f \u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f. \u064a\u0645\u0643\u0646\u0643 \u0627\u0644\u0645\u062a\u0627\u0628\u0639\u0629: \u0627\u0644\u0648\u0638\u0627\u0626\u0641 \u0627\u0644\u0623\u062e\u0631\u0649 \u062a\u0639\u0645\u0644.",
      "help.under": "\u0627\u062e\u062a\u0631 \u0639\u0646\u0635\u0631\u064b\u0627 \u062b\u0645 \u0627\u0636\u063a\u0637 \u0627\u0644\u0632\u0631 \u0627\u0644\u0631\u0626\u064a\u0633\u064a.",
      "status.ready": "\u062c\u0627\u0647\u0632."
    }
  };

  var EXTRA_STRINGS = {
    fr: {
      "titles": "Titres", "transitions": "Transitions", "generators": "G\u00e9n\u00e9rateurs", "audio": "Audio",
      "favorites": "Favoris \u2605", "aeScripts": "Scripts AE",
      "duration": "Dur\u00e9e (s)", "transitionAt": "Transition au", "strength": "Force de l'effet",
      "solidColour": "Couleur unie", "startLayer": "D\u00e9but du calque", "endLayer": "Fin du calque",
      "both": "Les deux", "sensitivity": "Sensibilit\u00e9", "action": "Action",
      "keepOriginal": "Conserver le calque original", "advanced": "Mode avanc\u00e9",
      "detector": "D\u00e9tecteur", "threshold": "Seuil (dB)", "minSilence": "Silence min (s)",
      "padBefore": "Marge avant (s)", "padAfter": "Marge apr\u00e8s (s)",
      "captionStyle": "Style des sous-titres", "stylePreview": "Aper\u00e7u du style",
      "stylesClick": "Styles (cliquez pour choisir)", "preset": "Preset",
      "fontFamily": "Police", "fontStyle": "Style de police", "size": "Taille (px @1080p)",
      "textColour": "Couleur du texte", "strokeColour": "Couleur du contour",
      "strokeWidth": "\u00c9paisseur du contour", "dropShadow": "Ombre port\u00e9e",
      "uppercase": "MAJUSCULES", "position": "Position", "top": "Haut", "middle": "Milieu",
      "bottom": "Bas", "edgeMargin": "Marge au bord (%)", "animation": "Animation",
      "none": "Aucune", "fade": "Fondu", "pop": "Pop", "slideUp": "Glissement",
      "animDuration": "Animation (s)", "maxWords": "Mots max / ligne", "maxChars": "Caract\u00e8res max",
      "saveAs": "Enregistrer sous", "karaokeMode": "Karaok\u00e9",
      "karaokeOff": "D\u00e9sactiv\u00e9 (Classique)", "karaokeHormozi": "Hormozi (Pop jaune)",
      "karaokeWordPop": "Word Pop (\u00c9chelle)", "karaokeHighlight": "Karaoke (Surlignage)",
      "sensNormal": "Normale (Recommand\u00e9)", "sensStrict": "Stricte (Garder plus de voix)",
      "sensAggressive": "Agressive (Couper un maximum)", "modeRipple": "Couper et raccorder (Ripple)",
      "modeMarkers": "Marqueurs seulement", "engineAdaptive": "Adaptatif (pi\u00e8ces bruyantes)",
      "engineFixed": "Seuil fixe", "prevPage": "\u2039 Pr\u00e9c\u00e9dent", "nextPage": "Suivant \u203a",
      "preview": "Aper\u00e7u", "waveform": "Aper\u00e7u de la forme d'onde",
      "silenceEmpty": "S\u00e9lectionnez un calque audio et cliquez sur Analyser",
      "previewEmpty": "S\u00e9lectionnez un \u00e9l\u00e9ment pour voir l'aper\u00e7u",
      "silenceHint": "D\u00e9tecte et supprime automatiquement les blancs dans votre vid\u00e9o ou voix-off.",
      "captionsHint": "G\u00e9n\u00e8re des sous-titres synchronis\u00e9s par IA (Whisper) avec styles et karaok\u00e9.",
      "packHint": "Un seul fichier pour tout votre studio : animations de texte, fonds, styles de sous-titres et r\u00e9glages.",
      "packHelp": "Collez le JSON dans la zone, ou indiquez le chemin d'un fichier .json puis Chargez.",
      "libraryHelp": "Double-cliquez une vignette pour l'ajouter directement \u00e0 la timeline.",
      "helperTitle": "Guide de d\u00e9marrage & Connexion Helper",
      "helperGuide": "Pour utiliser les fonctions intelligentes de Flow Studio (analyse audio, silence, sous-titres Whisper, tempo) :\n\n1. Ouvrez Pr\u00e9f\u00e9rences > Scripts et expressions, puis cochez \u00ab Autoriser les scripts \u00e0 \u00e9crire des fichiers et acc\u00e9der au r\u00e9seau \u00bb.\n2. D\u00e9marrez le helper dans un terminal : effectcraft-flow-helper serve",
      "captionFile": "Fichier SRT / VTT",
      "captionsSteps": "1. G\u00e9n\u00e9rez depuis un calque ou importez un fichier. 2. Choisissez un style ou un mode karaok\u00e9. 3. Cr\u00e9ez les calques.",
      "easeHint": "Choisissez une courbe, puis appliquez-la aux propri\u00e9t\u00e9s s\u00e9lectionn\u00e9es.",
      "exprHint": "Choisissez une expression, r\u00e9glez ses valeurs, puis appliquez-la \u00e0 la propri\u00e9t\u00e9 s\u00e9lectionn\u00e9e.",
      "textHint": "Choisissez une animation, r\u00e9glez son d\u00e9part, puis appliquez-la au texte s\u00e9lectionn\u00e9.",
      "bgHint": "Choisissez un d\u00e9grad\u00e9, puis ajoutez-le en fond de composition.",
      "silenceReady": "S\u00e9lectionnez un calque vid\u00e9o ou audio, puis cliquez sur Analyser.",
      "easing": "Courbe"
    },
    en: {
      "titles": "Titles", "transitions": "Transitions", "generators": "Generators", "audio": "Audio",
      "favorites": "Favorites \u2605", "aeScripts": "AE Scripts",
      "duration": "Duration (s)", "transitionAt": "Transition at", "strength": "Effect strength",
      "solidColour": "Solid colour", "startLayer": "Start of layer", "endLayer": "End of layer",
      "both": "Both", "sensitivity": "Sensitivity", "action": "Action",
      "keepOriginal": "Keep the original layer", "advanced": "Advanced mode",
      "detector": "Detector", "threshold": "Threshold (dB)", "minSilence": "Min silence (s)",
      "padBefore": "Pad before (s)", "padAfter": "Pad after (s)",
      "captionStyle": "Caption style", "stylePreview": "Style preview",
      "stylesClick": "Styles (click to choose)", "preset": "Preset",
      "fontFamily": "Font family", "fontStyle": "Font style", "size": "Size (px @1080p)",
      "textColour": "Text colour", "strokeColour": "Stroke colour",
      "strokeWidth": "Stroke width", "dropShadow": "Drop shadow",
      "uppercase": "UPPERCASE", "position": "Position", "top": "Top", "middle": "Middle",
      "bottom": "Bottom", "edgeMargin": "Edge margin (%)", "animation": "Animation",
      "none": "None", "fade": "Fade", "pop": "Pop", "slideUp": "Slide up",
      "animDuration": "Animation (s)", "maxWords": "Max words / line", "maxChars": "Max characters",
      "saveAs": "Save as", "karaokeMode": "Karaoke mode",
      "karaokeOff": "Off (Classic)", "karaokeHormozi": "Hormozi (yellow pop)",
      "karaokeWordPop": "Word Pop (scale)", "karaokeHighlight": "Karaoke (highlight)",
      "sensNormal": "Normal (recommended)", "sensStrict": "Strict (keep more speech)",
      "sensAggressive": "Aggressive (cut more)", "modeRipple": "Cut and ripple",
      "modeMarkers": "Markers only", "engineAdaptive": "Adaptive (noisy rooms)",
      "engineFixed": "Fixed threshold", "prevPage": "\u2039 Previous", "nextPage": "Next \u203a",
      "preview": "Preview", "waveform": "Waveform preview",
      "silenceEmpty": "Select an audio layer, then press Analyze",
      "previewEmpty": "Select an item to see the preview",
      "silenceHint": "Detects and removes silence in your video or voice-over automatically.",
      "captionsHint": "AI-synced captions (Whisper) with styles and karaoke.",
      "packHint": "One file for the whole studio: text animations, backgrounds, caption styles and settings.",
      "packHelp": "Paste the JSON below, or type the path of a .json file and press Load.",
      "libraryHelp": "Double-click a tile to add it straight to the timeline.",
      "helperTitle": "Setup guide & helper connection",
      "helperGuide": "To use Flow Studio's smart features (audio analysis, silence, Whisper captions, tempo):\n\n1. Open Preferences > Scripts & Expressions and tick \u201cAllow scripts to write files and access the network\u201d.\n2. Start the helper in a terminal: effectcraft-flow-helper serve",
      "captionFile": "SRT / VTT file",
      "captionsSteps": "1. Generate from a layer or import a file. 2. Pick a style or karaoke mode. 3. Create the layers.",
      "easeHint": "Pick a curve, then apply it to the selected properties.",
      "exprHint": "Pick an expression, tune its values, then apply it to the selected property.",
      "textHint": "Pick an animation, set its start state, then apply it to the selected text.",
      "bgHint": "Pick a gradient, then add it as the composition background.",
      "silenceReady": "Select a video or audio layer, then press Analyze.",
      "easing": "Easing"
    },
    ar: {
      "titles": "\u0627\u0644\u0639\u0646\u0627\u0648\u064a\u0646", "transitions": "\u0627\u0644\u0627\u0646\u062a\u0642\u0627\u0644\u0627\u062a",
      "generators": "\u0627\u0644\u0645\u0648\u0644\u062f\u0627\u062a", "audio": "\u0627\u0644\u0635\u0648\u062a",
      "favorites": "\u0627\u0644\u0645\u0641\u0636\u0644\u0629 \u2605", "aeScripts": "\u0633\u0643\u0631\u0628\u062a\u0627\u062a AE",
      "duration": "\u0627\u0644\u0645\u062f\u0629 (\u062b)", "transitionAt": "\u0627\u0644\u0627\u0646\u062a\u0642\u0627\u0644 \u0639\u0646\u062f",
      "strength": "\u0642\u0648\u0629 \u0627\u0644\u062a\u0623\u062b\u064a\u0631", "solidColour": "\u0644\u0648\u0646 \u0645\u0648\u062d\u062f",
      "startLayer": "\u0628\u062f\u0627\u064a\u0629 \u0627\u0644\u0637\u0628\u0642\u0629", "endLayer": "\u0646\u0647\u0627\u064a\u0629 \u0627\u0644\u0637\u0628\u0642\u0629",
      "both": "\u0643\u0644\u0627\u0647\u0645\u0627", "sensitivity": "\u0627\u0644\u062d\u0633\u0627\u0633\u064a\u0629",
      "action": "\u0627\u0644\u0625\u062c\u0631\u0627\u0621", "keepOriginal": "\u0627\u0644\u0627\u062d\u062a\u0641\u0627\u0638 \u0628\u0627\u0644\u0637\u0628\u0642\u0629 \u0627\u0644\u0623\u0635\u0644\u064a\u0629",
      "advanced": "\u0627\u0644\u0648\u0636\u0639 \u0627\u0644\u0645\u062a\u0642\u062f\u0645", "detector": "\u0627\u0644\u0643\u0627\u0634\u0641",
      "threshold": "\u0627\u0644\u0639\u062a\u0628\u0629 (\u062f\u0628)", "minSilence": "\u0623\u0642\u0644 \u0635\u0645\u062a (\u062b)",
      "padBefore": "\u0647\u0627\u0645\u0634 \u0642\u0628\u0644 (\u062b)", "padAfter": "\u0647\u0627\u0645\u0634 \u0628\u0639\u062f (\u062b)",
      "captionStyle": "\u0646\u0645\u0637 \u0627\u0644\u062a\u0631\u062c\u0645\u0629", "stylePreview": "\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0646\u0645\u0637",
      "stylesClick": "\u0627\u0644\u0623\u0646\u0645\u0627\u0637 (\u0627\u0646\u0642\u0631 \u0644\u0644\u0627\u062e\u062a\u064a\u0627\u0631)", "preset": "\u0625\u0639\u062f\u0627\u062f",
      "fontFamily": "\u0627\u0644\u062e\u0637", "fontStyle": "\u0646\u0645\u0637 \u0627\u0644\u062e\u0637", "size": "\u0627\u0644\u062d\u062c\u0645 (px @1080p)",
      "textColour": "\u0644\u0648\u0646 \u0627\u0644\u0646\u0635", "strokeColour": "\u0644\u0648\u0646 \u0627\u0644\u062d\u062f",
      "strokeWidth": "\u0639\u0631\u0636 \u0627\u0644\u062d\u062f", "dropShadow": "\u0638\u0644",
      "uppercase": "\u0623\u062d\u0631\u0641 \u0643\u0628\u064a\u0631\u0629", "position": "\u0627\u0644\u0645\u0648\u0636\u0639",
      "top": "\u0623\u0639\u0644\u0649", "middle": "\u0627\u0644\u0648\u0633\u0637", "bottom": "\u0623\u0633\u0641\u0644",
      "edgeMargin": "\u0647\u0627\u0645\u0634 \u0627\u0644\u062d\u0627\u0641\u0629 (%)", "animation": "\u0627\u0644\u062d\u0631\u0643\u0629",
      "none": "\u0628\u062f\u0648\u0646", "fade": "\u062a\u0644\u0627\u0634\u064a", "pop": "\u0646\u0637",
      "slideUp": "\u0627\u0646\u0632\u0644\u0627\u0642", "animDuration": "\u0627\u0644\u062d\u0631\u0643\u0629 (\u062b)",
      "maxWords": "\u0623\u0642\u0635\u0649 \u0643\u0644\u0645\u0627\u062a / \u0633\u0637\u0631", "maxChars": "\u0623\u0642\u0635\u0649 \u0623\u062d\u0631\u0641",
      "saveAs": "\u062d\u0641\u0638 \u0628\u0627\u0633\u0645", "karaokeMode": "\u0643\u0627\u0631\u064a\u0648\u0643\u064a",
      "karaokeOff": "\u0645\u0639\u0637\u0644 (\u0643\u0644\u0627\u0633\u064a\u0643\u064a)", "karaokeHormozi": "\u0647\u0648\u0631\u0645\u0648\u0632\u064a (\u0623\u0635\u0641\u0631)",
      "karaokeWordPop": "\u0643\u0644\u0645\u0629 \u0645\u0646\u0628\u062b\u0642\u0629", "karaokeHighlight": "\u0643\u0627\u0631\u064a\u0648\u0643\u064a (\u062a\u0645\u064a\u064a\u0632)",
      "sensNormal": "\u0639\u0627\u062f\u064a (\u0645\u0648\u0635\u0649 \u0628\u0647)", "sensStrict": "\u0635\u0627\u0631\u0645 (\u0627\u0644\u0627\u062d\u062a\u0641\u0627\u0638 \u0628\u0645\u0632\u064a\u062f \u0645\u0646 \u0627\u0644\u0635\u0648\u062a)",
      "sensAggressive": "\u0642\u0648\u064a (\u0642\u0635 \u0623\u0643\u0628\u0631)", "modeRipple": "\u0642\u0635 \u0648\u0631\u0628\u0637",
      "modeMarkers": "\u0639\u0644\u0627\u0645\u0627\u062a \u0641\u0642\u0637", "engineAdaptive": "\u062a\u0643\u064a\u0641\u064a (\u063a\u0631\u0641 \u0635\u0627\u062e\u0628\u0629)",
      "engineFixed": "\u0639\u062a\u0628\u0629 \u062b\u0627\u0628\u062a\u0629", "prevPage": "\u2039 \u0627\u0644\u0633\u0627\u0628\u0642",
      "nextPage": "\u0627\u0644\u062a\u0627\u0644\u064a \u203a", "preview": "\u0645\u0639\u0627\u064a\u0646\u0629",
      "waveform": "\u0645\u0639\u0627\u064a\u0646\u0629 \u0627\u0644\u0645\u0648\u062c\u0629",
      "silenceEmpty": "\u0627\u062e\u062a\u0631 \u0637\u0628\u0642\u0629 \u0635\u0648\u062a\u064a\u0629 \u062b\u0645 \u0627\u0636\u063a\u0637 \u062a\u062d\u0644\u064a\u0644",
      "previewEmpty": "\u0627\u062e\u062a\u0631 \u0639\u0646\u0635\u0631\u064b\u0627 \u0644\u0645\u0639\u0627\u064a\u0646\u062a\u0647",
      "silenceHint": "\u064a\u0643\u062a\u0634\u0641 \u0627\u0644\u0635\u0645\u062a \u0641\u064a \u0627\u0644\u0641\u064a\u062f\u064a\u0648 \u0623\u0648 \u0627\u0644\u062a\u0639\u0644\u064a\u0642 \u0627\u0644\u0635\u0648\u062a\u064a \u0648\u064a\u062d\u0630\u0641\u0647 \u062a\u0644\u0642\u0627\u0626\u064a\u064b\u0627.",
      "captionsHint": "\u062a\u0631\u062c\u0645\u0627\u062a \u0645\u062a\u0632\u0627\u0645\u0646\u0629 \u0628\u0627\u0644\u0630\u0643\u0627\u0621 \u0627\u0644\u0627\u0635\u0637\u0646\u0627\u0639\u064a (Whisper) \u0645\u0639 \u0623\u0646\u0645\u0627\u0637 \u0648\u0643\u0627\u0631\u064a\u0648\u0643\u064a.",
      "packHint": "\u0645\u0644\u0641 \u0648\u0627\u062d\u062f \u0644\u0643\u0644 \u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a: \u062d\u0631\u0643\u0627\u062a \u0627\u0644\u0646\u0635\u060c \u0627\u0644\u062e\u0644\u0641\u064a\u0627\u062a\u060c \u0623\u0646\u0645\u0627\u0637 \u0627\u0644\u062a\u0631\u062c\u0645\u0627\u062a \u0648\u0627\u0644\u0625\u0639\u062f\u0627\u062f\u0627\u062a.",
      "packHelp": "\u0627\u0644\u0635\u0642 JSON \u0641\u064a \u0627\u0644\u0645\u0633\u0627\u062d\u0629\u060c \u0623\u0648 \u0623\u062f\u062e\u0644 \u0645\u0633\u0627\u0631 \u0645\u0644\u0641 .json \u062b\u0645 \u0627\u0636\u063a\u0637 \u062a\u062d\u0645\u064a\u0644.",
      "libraryHelp": "\u0627\u0646\u0642\u0631 \u0646\u0642\u0631\u064b\u0627 \u0645\u0632\u062f\u0648\u062c\u064b\u0627 \u0639\u0644\u0649 \u0628\u0637\u0627\u0642\u0629 \u0644\u0625\u0636\u0627\u0641\u062a\u0647\u0627 \u0625\u0644\u0649 \u0627\u0644\u062e\u0637 \u0627\u0644\u0632\u0645\u0646\u064a.",
      "helperTitle": "\u062f\u0644\u064a\u0644 \u0627\u0644\u0628\u062f\u0621 \u0648\u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0627\u0644\u0645\u0633\u0627\u0639\u062f",
      "helperGuide": "\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645 \u0648\u0638\u0627\u0626\u0641 Flow Studio \u0627\u0644\u0630\u0643\u064a\u0629 (\u062a\u062d\u0644\u064a\u0644 \u0627\u0644\u0635\u0648\u062a\u060c \u0627\u0644\u0635\u0645\u062a\u060c \u062a\u0631\u062c\u0645\u0627\u062a Whisper\u060c \u0627\u0644\u0625\u064a\u0642\u0627\u0639):\n\n1. \u0627\u0641\u062a\u062d \u0627\u0644\u062a\u0641\u0636\u064a\u0644\u0627\u062a > \u0627\u0644\u0633\u0643\u0631\u064a\u0628\u062a\u0627\u062a \u0648\u0627\u0644\u062a\u0639\u0628\u064a\u0631\u0627\u062a \u0648\u0641\u0639\u0651\u0644 \u0627\u0644\u0633\u0645\u0627\u062d \u0644\u0644\u0633\u0643\u0631\u064a\u0628\u062a\u0627\u062a \u0628\u0627\u0644\u0643\u062a\u0627\u0628\u0629 \u0648\u0627\u0644\u0648\u0635\u0648\u0644 \u0625\u0644\u0649 \u0627\u0644\u0634\u0628\u0643\u0629.\n2. \u0634\u063a\u0651\u0644 \u0627\u0644\u0645\u0633\u0627\u0639\u062f \u0641\u064a \u0627\u0644\u0637\u0631\u0641\u064a\u0629: effectcraft-flow-helper serve",
      "captionFile": "\u0645\u0644\u0641 SRT / VTT",
      "captionsSteps": "1. \u0623\u0646\u0634\u0626 \u0645\u0646 \u0637\u0628\u0642\u0629 \u0623\u0648 \u0627\u0633\u062a\u0648\u0631\u062f \u0645\u0644\u0641\u064b\u0627. 2. \u0627\u062e\u062a\u0631 \u0646\u0645\u0637\u064b\u0627 \u0623\u0648 \u0648\u0636\u0639 \u0643\u0627\u0631\u064a\u0648\u0643\u064a. 3. \u0623\u0646\u0634\u0626 \u0627\u0644\u0637\u0628\u0642\u0627\u062a.",
      "easeHint": "\u0627\u062e\u062a\u0631 \u0645\u0646\u062d\u0646\u0649 \u062b\u0645 \u0637\u0628\u0651\u0642\u0647 \u0639\u0644\u0649 \u0627\u0644\u062e\u0635\u0627\u0626\u0635 \u0627\u0644\u0645\u062d\u062f\u062f\u0629.",
      "exprHint": "\u0627\u062e\u062a\u0631 \u062a\u0639\u0628\u064a\u0631\u064b\u0627 \u0648\u0627\u0636\u0628\u0637 \u0642\u064a\u0645\u0647 \u062b\u0645 \u0637\u0628\u0651\u0642\u0647 \u0639\u0644\u0649 \u0627\u0644\u062e\u0627\u0635\u064a\u0629 \u0627\u0644\u0645\u062d\u062f\u062f\u0629.",
      "textHint": "\u0627\u062e\u062a\u0631 \u062d\u0631\u0643\u0629 \u0648\u0627\u0636\u0628\u0637 \u0628\u062f\u0627\u064a\u062a\u0647\u0627 \u062b\u0645 \u0637\u0628\u0651\u0642\u0647\u0627 \u0639\u0644\u0649 \u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u062d\u062f\u062f.",
      "bgHint": "\u0627\u062e\u062a\u0631 \u062a\u062f\u0631\u062c\u064b\u0627 \u062b\u0645 \u0623\u0636\u0641\u0647 \u0625\u0644\u0649 \u062e\u0644\u0641\u064a\u0629 \u0627\u0644\u062a\u0631\u0643\u064a\u0628.",
      "silenceReady": "\u0627\u062e\u062a\u0631 \u0637\u0628\u0642\u0629 \u0635\u0648\u062a\u064a\u0629 \u0623\u0648 \u0645\u0631\u0626\u064a\u0629 \u062b\u0645 \u0627\u0636\u063a\u0637 \u062a\u062d\u0644\u064a\u0644.",
      "easing": "\u0627\u0644\u0645\u0646\u062d\u0646\u0649"
    }
  };
  for (var extraLang in EXTRA_STRINGS) {
    for (var extraKey in EXTRA_STRINGS[extraLang]) STRINGS[extraLang][extraKey] = EXTRA_STRINGS[extraLang][extraKey];
  }

  // Value -> canonical key, in every language, so a control built in French can still be
  // translated after the user switches to English or Arabic.
  var REVERSE = {};
  for (var revLang in STRINGS) {
    for (var revKey in STRINGS[revLang]) {
      var revVal = normKey(STRINGS[revLang][revKey]);
      if (revVal && REVERSE[revVal] === undefined) REVERSE[revVal] = revKey;
    }
  }

  function tr(key) {
    var table = STRINGS[LANG] || STRINGS.fr;
    if (table[key] !== undefined) return table[key];
    if (STRINGS.fr[key] !== undefined) return STRINGS.fr[key];
    return String(key);
  }

  function canTranslate(text) {
    var raw = String(text);
    if (!raw) return false;
    var n = normKey(raw);
    var table = STRINGS[LANG] || STRINGS.fr;
    return table[n] !== undefined || REVERSE[n] !== undefined;
  }

  function trText(text) {
    var raw = String(text);
    if (!raw) return raw;
    var table = STRINGS[LANG] || STRINGS.fr;
    var n = normKey(raw);
    if (table[n] !== undefined) return table[n];
    var key = REVERSE[n];
    if (key !== undefined && table[key] !== undefined) return table[key];
    return raw;
  }

  function isArabic(text) {
    return /[\u0600-\u06ff\u0750-\u077f]/.test(String(text));
  }

  function hostIsDark() {
    try {
      var r = app.run("prefs.get", { key: "appearance.appearanceMode" });
      var mode = r && (r.value || r.appearanceMode || r);
      if (typeof mode === "string") return mode !== "light";
      if (mode && typeof mode === "object" && mode.value) return String(mode.value) !== "light";
    } catch (e) {}
    return true;
  }

  function isDarkTheme() {
    if (THEME === "dark") return true;
    if (THEME === "light") return false;
    return hostIsDark();
  }

  function palette() {
    if (isDarkTheme()) {
      return { bg: [0.12, 0.12, 0.14, 1], cell: [0.18, 0.18, 0.21, 1], cellHi: [0.24, 0.45, 0.62, 1], text: [0.95, 0.95, 0.97, 1], muted: [0.62, 0.62, 0.66, 1], accent: [0.35, 0.72, 1, 1], cut: [0.9, 0.25, 0.25, 0.4], voice: [0.2, 0.85, 0.4, 0.9] };
    }
    return { bg: [0.95, 0.95, 0.96, 1], cell: [0.88, 0.89, 0.91, 1], cellHi: [0.55, 0.75, 0.95, 1], text: [0.12, 0.12, 0.15, 1], muted: [0.4, 0.4, 0.45, 1], accent: [0.1, 0.45, 0.8, 1], cut: [0.85, 0.2, 0.2, 0.35], voice: [0.1, 0.6, 0.3, 0.9] };
  }

  function colorPen(g, rgba, width) {
    return g.newPen(g.PenType.SOLID_COLOR, rgba, width || 1);
  }

  function colorBrush(g, rgba) {
    return g.newBrush(g.BrushType.SOLID_COLOR, rgba);
  }

  // ------------------------------------------------------------------ small helpers

  function num(text, fallback) {
    var v = parseFloat(String(text).replace(",", "."));
    return isFinite(v) ? v : fallback;
  }

  function clamp(v, lo, hi) {
    return Math.min(hi, Math.max(lo, v));
  }

  function setting(key, fallback) {
    try {
      return app.settings.haveSetting(SECTION, key) ? app.settings.getSetting(SECTION, key) : fallback;
    } catch (e) {
      return fallback;
    }
  }

  function save(key, value) {
    try {
      app.settings.saveSetting(SECTION, key, String(value));
    } catch (e) {}
  }

  function activeComp() {
    var c = app.project.activeItem;
    return c instanceof CompItem ? c : null;
  }

  function fmt(sec) {
    var s = Math.max(0, sec);
    var m = Math.floor(s / 60);
    return (m > 0 ? m + "m " : "") + (s - m * 60).toFixed(1) + "s";
  }

  // ------------------------------------------------------------------ easing library (37)

  // Each easing is the body of a function of t in 0..1. The same text is used for the previews
  // here and inside the expressions, so what you see is what plays.
  var EASINGS = (function () {
    var list = [];
    function add(id, name, body) {
      list.push({ id: id, name: name, body: body });
    }
    add("linear", "Linear", "return t;");
    var powers = [["Quad", 2], ["Cubic", 3], ["Quart", 4], ["Quint", 5]];
    add("inSine", "Sine In", "return 1-Math.cos(t*Math.PI/2);");
    add("outSine", "Sine Out", "return Math.sin(t*Math.PI/2);");
    add("inOutSine", "Sine In-Out", "return -(Math.cos(Math.PI*t)-1)/2;");
    for (var i = 0; i < powers.length; i++) {
      var n = powers[i][0], p = powers[i][1];
      add("in" + n, n + " In", "return Math.pow(t," + p + ");");
      add("out" + n, n + " Out", "return 1-Math.pow(1-t," + p + ");");
      add("inOut" + n, n + " In-Out", "return t<0.5?" + Math.pow(2, p - 1) + "*Math.pow(t," + p + "):1-Math.pow(-2*t+2," + p + ")/2;");
    }
    add("inExpo", "Expo In", "return Math.pow(2,10*t-10);");
    add("outExpo", "Expo Out", "return 1-Math.pow(2,-10*t);");
    add("inOutExpo", "Expo In-Out", "return t<0.5?Math.pow(2,20*t-10)/2:(2-Math.pow(2,-20*t+10))/2;");
    add("inCirc", "Circ In", "return 1-Math.sqrt(1-t*t);");
    add("outCirc", "Circ Out", "return Math.sqrt(1-Math.pow(t-1,2));");
    add("inOutCirc", "Circ In-Out", "return t<0.5?(1-Math.sqrt(1-Math.pow(2*t,2)))/2:(Math.sqrt(1-Math.pow(-2*t+2,2))+1)/2;");
    add("inBack", "Back In", "var c1=1.70158,c3=c1+1;return c3*t*t*t-c1*t*t;");
    add("outBack", "Back Out", "var c1=1.70158,c3=c1+1;return 1+c3*Math.pow(t-1,3)+c1*Math.pow(t-1,2);");
    add("inOutBack", "Back In-Out", "var c2=1.70158*1.525;return t<0.5?(Math.pow(2*t,2)*((c2+1)*2*t-c2))/2:(Math.pow(2*t-2,2)*((c2+1)*(t*2-2)+c2)+2)/2;");
    add("inElastic", "Elastic In", "var c4=2*Math.PI/3;return -Math.pow(2,10*t-10)*Math.sin((t*10-10.75)*c4);");
    add("outElastic", "Elastic Out", "var c4=2*Math.PI/3;return Math.pow(2,-10*t)*Math.sin((t*10-0.75)*c4)+1;");
    add("inOutElastic", "Elastic In-Out", "var c5=2*Math.PI/4.5;return t<0.5?-(Math.pow(2,20*t-10)*Math.sin((20*t-11.125)*c5))/2:(Math.pow(2,-20*t+10)*Math.sin((20*t-11.125)*c5))/2+1;");
    var bo = "function bo(x){var n=7.5625,d=2.75;if(x<1/d)return n*x*x;if(x<2/d){x-=1.5/d;return n*x*x+0.75;}if(x<2.5/d){x-=2.25/d;return n*x*x+0.9375;}x-=2.625/d;return n*x*x+0.984375;}";
    add("inBounce", "Bounce In", bo + "return 1-bo(1-t);");
    add("outBounce", "Bounce Out", bo + "return bo(t);");
    add("inOutBounce", "Bounce In-Out", bo + "return t<0.5?(1-bo(1-2*t))/2:(1+bo(2*t-1))/2;");
    add("smooth", "Smoothstep", "return t*t*(3-2*t);");
    add("smoother", "Smootherstep", "return t*t*t*(t*(t*6-15)+10);");
    add("spring", "Spring", "return 1-Math.exp(-6*t)*Math.cos(14*t);");
    add("anticipate", "Anticipate", "return t*t*(3.5*t-2.5);");
    add("steps", "4 Steps", "return Math.floor(t*4)/4;");
    add("hold", "Hold", "return t<1?0:1;");
    return list;
  })();

  function easingById(id) {
    for (var i = 0; i < EASINGS.length; i++) if (EASINGS[i].id === id) return EASINGS[i];
    return EASINGS[0];
  }

  // The easing as a plain function (clamped at both ends so every curve starts at 0 and ends at 1).
  function easingFn(id) {
    var e = easingById(id);
    return new Function("t", "if(t<=0)return 0;if(t>=1)return 1;" + e.body);
  }

  // The easing as expression source defining `E(t)`.
  function easingSource(id) {
    return "function E(t){if(t<=0)return 0;if(t>=1)return 1;" + easingById(id).body + "}\n";
  }

  // ------------------------------------------------------------------ expression library

  // `{{name}}` is replaced by the parameter's number. "kind": pos (position-like, 2 or 3
  // values), scale, scalar (one number) or text (Source Text).
  var LIBRARY = [
    { id: "orbit", name: "Orbit", kind: "pos", info: "Circles around the layer's position.",
      params: [["radius", "Radius (px)", 100, 0, 600], ["speed", "Turns per second", 0.5, 0.05, 4]],
      code: "var a=time*{{speed}}*2*Math.PI;var v=value.slice();v[0]+=Math.cos(a)*{{radius}};v[1]+=Math.sin(a)*{{radius}};v;" },
    { id: "figure8", name: "Figure eight", kind: "pos", info: "Traces a figure eight around the position.",
      params: [["radius", "Width (px)", 120, 0, 600], ["speed", "Loops per second", 0.4, 0.05, 4]],
      code: "var a=time*{{speed}}*2*Math.PI;var v=value.slice();v[0]+=Math.sin(a)*{{radius}};v[1]+=Math.sin(2*a)*{{radius}}/2;v;" },
    { id: "spiral", name: "Spiral out", kind: "pos", info: "Spirals away from the position as time passes.",
      params: [["growth", "Growth (px/s)", 60, 0, 600], ["speed", "Turns per second", 0.6, 0.05, 4]],
      code: "var a=time*{{speed}}*2*Math.PI;var r=Math.max(0,time-inPoint)*{{growth}};var v=value.slice();v[0]+=Math.cos(a)*r;v[1]+=Math.sin(a)*r;v;" },
    { id: "bounce", name: "Bounce and settle", kind: "pos", info: "Drops in from above and settles with decaying bounces.",
      params: [["height", "Drop height (px)", 160, 0, 1000], ["damping", "Damping", 3, 0.5, 10], ["frequency", "Bounces per second", 2.5, 0.5, 8]],
      code: "var t=Math.max(0,time-inPoint);var off={{height}}*Math.exp(-{{damping}}*t)*Math.abs(Math.cos({{frequency}}*Math.PI*t));var v=value.slice();v[1]-=off;v;" },
    { id: "float", name: "Float", kind: "pos", info: "Gentle vertical floating.",
      params: [["height", "Height (px)", 20, 0, 300], ["speed", "Cycles per second", 0.35, 0.05, 3]],
      code: "var v=value.slice();v[1]+=Math.sin(time*{{speed}}*2*Math.PI)*{{height}};v;" },
    { id: "wiggle", name: "Wiggle", kind: "pos", info: "Random wandering (deterministic).",
      params: [["frequency", "Frequency (per s)", 2, 0.1, 20], ["amount", "Amount (px)", 30, 0, 500]],
      code: "wiggle({{frequency}},{{amount}});" },
    { id: "heartbeat", name: "Heartbeat", kind: "scale", info: "A double pulse, like a heartbeat.",
      params: [["amount", "Amount (%)", 18, 0, 100], ["bpm", "Beats per minute", 72, 20, 200]],
      code: "function pulse(x,c,w){return Math.exp(-Math.pow((x-c)/w,2));}var p=(time*{{bpm}}/60)%1;var s=pulse(p,0.1,0.06)+0.6*pulse(p,0.32,0.07);var k=1+{{amount}}/100*s;var v=value.slice();for(var i=0;i<v.length;i++)v[i]*=k;v;" },
    { id: "pendulum", name: "Pendulum", kind: "scalar", info: "Swings back and forth and slowly comes to rest (rotation).",
      params: [["amount", "Swing (deg)", 25, 0, 180], ["speed", "Swings per second", 0.8, 0.1, 4], ["decay", "Decay", 0.6, 0, 5]],
      code: "value+{{amount}}*Math.sin(time*{{speed}}*2*Math.PI)*Math.exp(-{{decay}}*Math.max(0,time-inPoint));" },
    { id: "pulse", name: "Pulse opacity", kind: "scalar", info: "Fades smoothly between two opacity values.",
      params: [["low", "Low (%)", 30, 0, 100], ["high", "High (%)", 100, 0, 100], ["speed", "Pulses per second", 0.8, 0.05, 6]],
      code: "var s=(Math.sin(time*{{speed}}*2*Math.PI)+1)/2;linear(s,0,1,{{low}},{{high}});" },
    { id: "stagger", name: "Stagger fade-in", kind: "scalar", info: "Fades in later the higher the layer index: select many layers and apply.",
      params: [["delay", "Delay per layer (s)", 0.1, 0, 2], ["duration", "Fade (s)", 0.4, 0.05, 3]],
      code: "var d=(index-1)*{{delay}};linear(time-inPoint-d,0,{{duration}},0,100);" },
    { id: "pingpong", name: "Loop: ping-pong", kind: "any", info: "Repeats the keyframes forwards then backwards.", params: [], code: "loopOut(\"pingpong\");" },
    { id: "cycle", name: "Loop: cycle", kind: "any", info: "Repeats the keyframes over and over.", params: [], code: "loopOut(\"cycle\");" },
    { id: "typewriter", name: "Typewriter", kind: "text", info: "Types the text out one character at a time.",
      params: [["cps", "Characters per second", 18, 1, 100]],
      code: "var s=String(value);var n=Math.floor(Math.max(0,time-inPoint)*{{cps}});s.substr(0,n);" },
    { id: "decode", name: "Decode", kind: "text", info: "Scrambled characters settle into the text.",
      params: [["duration", "Duration (s)", 1.2, 0.2, 6]],
      code: "var s=String(value);var p=Math.min(1,Math.max(0,(time-inPoint)/{{duration}}));var n=Math.floor(p*s.length);var chars=\"ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&@\";var out=s.substr(0,n);for(var i=n;i<s.length;i++){if(s.charAt(i)==\" \"){out+=\" \";continue;}seedRandom(i+Math.floor(time*24),true);out+=chars.charAt(Math.floor(random(chars.length)));}out;" },
    { id: "countup", name: "Count up", kind: "text", info: "Counts from one number to another.",
      params: [["from", "From", 0, -100000, 100000], ["to", "To", 1000, -100000, 100000], ["duration", "Duration (s)", 2, 0.2, 20]],
      code: "String(Math.round(linear(time-inPoint,0,{{duration}},{{from}},{{to}})));" }
  ];

  function libraryById(id) {
    for (var i = 0; i < LIBRARY.length; i++) if (LIBRARY[i].id === id) return LIBRARY[i];
    return null;
  }

  function fillTemplate(code, params) {
    return code.replace(/\{\{(\w+)\}\}/g, function (all, name) {
      var v = params[name];
      return typeof v === "number" && isFinite(v) ? String(v) : "0";
    });
  }

  // The kind of a property: "text", "scalar" or "vector" (with its length), from its value.
  function propKind(prop) {
    var v;
    try {
      v = prop.value;
    } catch (e) {
      return null;
    }
    if (typeof v === "number") return { kind: "scalar", n: 1 };
    if (v instanceof Array) return { kind: "vector", n: v.length };
    if (v instanceof TextDocument || typeof v === "string") return { kind: "text", n: 1 };
    return null;
  }

  function compatible(entry, pk) {
    if (!pk) return false;
    if (entry.kind === "any") return true;
    if (entry.kind === "text") return pk.kind === "text";
    if (entry.kind === "scalar") return pk.kind === "scalar";
    return pk.kind === "vector" && pk.n >= 2;
  }

  function selectedProps() {
    var comp = activeComp();
    if (!comp) return [];
    var out = [];
    var all = comp.selectedProperties;
    for (var i = 0; i < all.length; i++) {
      var p = all[i];
      if (p && p.propertyType === PropertyType.PROPERTY && p.canSetExpression) out.push(p);
    }
    return out;
  }

  // ------------------------------------------------------------------ expressions for easing

  // Eased motion between the first/next keyframes, no extra keyframes needed.
  function betweenKeysExpression(easingId) {
    return easingSource(easingId) +
      "if(numKeys<2){value;}else{" +
      "var k=nearestKey(time);var i=k.index;if(k.time>time)i--;i=Math.min(numKeys-1,Math.max(1,i));" +
      "var a=key(i),b=key(i+1);var p=Math.min(1,Math.max(0,(time-a.time)/(b.time-a.time)));var e=E(p);" +
      "if(typeof a.value==\"number\"){a.value+(b.value-a.value)*e;}else{var o=[];for(var j=0;j<a.value.length;j++)o.push(a.value[j]+(b.value[j]-a.value[j])*e);o;}}";
  }

  // Animate in from `from` to the property's own value, with an easing, a delay and a duration.
  function introExpression(easingId, from, delay, duration) {
    var list = "[" + from.join(",") + "]";
    return easingSource(easingId) +
      "var from=" + list + ";var d=Math.max(0.0001," + duration + ");var t=Math.min(1,Math.max(0,(time-inPoint-" + delay + ")/d));var e=E(t);var v=value;" +
      "if(typeof v==\"number\"){var f=from[0]===undefined?v:from[0];f+(v-f)*e;}else{var o=v.slice();for(var i=0;i<o.length;i++){var f2=from[i]===undefined?v[i]:from[i];o[i]=f2+(v[i]-f2)*e;}o;}";
  }

  // ------------------------------------------------------------------ helper client

  var HELPER_HINT = "The Flow helper is not running. Start it with: effectcraft-flow-helper serve   (and allow scripts network access in Preferences).";

  function host() {
    return "127.0.0.1:" + Math.round(num(setting("port", DEFAULT_PORT), DEFAULT_PORT));
  }

  function helper(req) {
    var s;
    try {
      s = new Socket();
    } catch (e) {
      return { ok: false, error: "Scripts may not use the network: turn on Preferences > Scripting & Expressions > Allow Scripts to Write Files and Access Network." };
    }
    s.timeout = 60;
    if (!s.open(host(), "UTF-8")) return { ok: false, error: HELPER_HINT };
    s.writeln(JSON.stringify(req));
    var line = s.readln();
    s.close();
    if (!line) return { ok: false, error: "The Flow helper did not answer." };
    try {
      return JSON.parse(line);
    } catch (e) {
      return { ok: false, error: "The Flow helper sent something unreadable." };
    }
  }

  // ------------------------------------------------------------------ the panel

  var ui = thisObj instanceof Panel ? thisObj : new Window("palette", "Flow Studio", undefined, { resizeable: true });
  ui.orientation = "column";
  ui.alignChildren = ["fill", "top"];
  ui.spacing = 6;
  ui.margins = 8;

  // ------------------------------------------------------------------ header: language & theme
  var header = ui.add("group");
  header.alignment = ["fill", "top"];
  header.alignChildren = ["fill", "center"];
  var brand = header.add("statictext", undefined, "Flow Studio");
  brand.alignment = ["left", "center"];
  var headerSpacer = header.add("statictext", undefined, "");
  headerSpacer.alignment = ["fill", "center"];
  var langDrop = header.add("dropdownlist", undefined, ["Fran\u00e7ais", "English", "\u0627\u0644\u0639\u0631\u0628\u064a\u0629"]);
  langDrop.selection = Math.max(0, LANGS.indexOf(LANG));
  langDrop.minimumSize = [92, -1];
  langDrop.alignment = ["right", "center"];
  var themeDrop = header.add("dropdownlist", undefined, ["Auto", "Sombre", "Clair"]);
  themeDrop.selection = THEME === "dark" ? 1 : THEME === "light" ? 2 : 0;
  themeDrop.minimumSize = [80, -1];
  themeDrop.alignment = ["right", "center"];

  // ------------------------------------------------------------------ first-launch help
  // Exactly two actions are shown at any time: check the helper (or retry) and continue without it.
  var welcome = ui.add("group");
  welcome.alignment = ["fill", "fill"];
  welcome.orientation = "column";
  // A centred splash: the two actions sit under the text instead of a full-height panel leaving a
  // blank stretch between them.
  welcome.alignChildren = ["fill", "center"];
  welcome.margins = 12;
  var welcomeTitle = welcome.add("statictext", undefined, tr("welcome.title"));
  try {
    welcomeTitle.graphics.font = ScriptUI.newFont("dialog", ScriptUI.FontStyle.BOLD, 15);
  } catch (e) {}
  var welcomeBody = welcome.add("statictext", undefined, tr("welcome.body"), { multiline: true });
  welcomeBody.alignment = ["fill", "top"];
  var welcomeStatus = welcome.add("statictext", undefined, "", { multiline: true });
  welcomeStatus.alignment = ["fill", "top"];
  var welcomeButtons = welcome.add("group");
  welcomeButtons.alignment = ["fill", "center"];
  welcomeButtons.alignChildren = ["fill", "center"];
  var welcomeCheck = welcomeButtons.add("button", undefined, tr("welcome.check"));
  welcomeCheck.alignment = ["fill", "center"];
  welcomeCheck.isPrimary = true;
  var welcomeSkip = welcomeButtons.add("button", undefined, tr("welcome.skip"));
  welcomeSkip.alignment = ["fill", "center"];
  var welcomeShown = setting("welcomeDone", "0") !== "1";
  welcome.visible = welcomeShown;

  // ------------------------------------------------------------------ tabbed navigation
  // Consolidated into 5 top-level categories: Library, Montage, Animer, Look, Réglages
  var tabs = ui.add("tabbedpanel");
  tabs.alignChildren = ["fill", "fill"];
  tabs.alignment = ["fill", "fill"];
  tabs.visible = !welcomeShown;

  var libraryTab = tabs.add("tab", undefined, "Library");
  var montageTab = tabs.add("tab", undefined, "Montage");
  var animTab = tabs.add("tab", undefined, "Animer");
  var lookTab = tabs.add("tab", undefined, "Look");
  var settingsTab = tabs.add("tab", undefined, "Réglages");

  montageTab.orientation = "column";
  montageTab.alignChildren = ["fill", "fill"];
  animTab.orientation = "column";
  animTab.alignChildren = ["fill", "fill"];
  lookTab.orientation = "column";
  lookTab.alignChildren = ["fill", "fill"];
  settingsTab.orientation = "column";
  settingsTab.alignChildren = ["fill", "fill"];

  // Montage sub-tabs: Silence, Captions, Sounds
  var montageSub = montageTab.add("tabbedpanel");
  montageSub.alignChildren = ["fill", "fill"];
  montageSub.alignment = ["fill", "fill"];
  var silenceTab = montageSub.add("tab", undefined, "Silence");
  var captionTab = montageSub.add("tab", undefined, "Captions");
  var soundsTab = montageSub.add("tab", undefined, "Sounds");

  // Animer sub-tabs: Ease, Expressions, Text
  var animSub = animTab.add("tabbedpanel");
  animSub.alignChildren = ["fill", "fill"];
  animSub.alignment = ["fill", "fill"];
  var easeTab = animSub.add("tab", undefined, "Ease");
  var exprTab = animSub.add("tab", undefined, "Expressions");
  var textTab = animSub.add("tab", undefined, "Text");

  // Look sub-tabs: Background, Effects, Stroke
  var lookSub = lookTab.add("tabbedpanel");
  lookSub.alignChildren = ["fill", "fill"];
  lookSub.alignment = ["fill", "fill"];
  var bgTab = lookSub.add("tab", undefined, "Background");
  var effectsTab = lookSub.add("tab", undefined, "Effects");
  var strokeTab = lookSub.add("tab", undefined, "Stroke");

  // Réglages sub-tabs: Models, Helper & Setup, Presets Pack
  var settingsSub = settingsTab.add("tabbedpanel");
  settingsSub.alignChildren = ["fill", "fill"];
  settingsSub.alignment = ["fill", "fill"];
  var modelsTab = settingsSub.add("tab", undefined, "Models");
  var helperTab = settingsSub.add("tab", undefined, "Aide & connexion");
  var packTab = settingsSub.add("tab", undefined, "Pack de presets");

  // Restore and remember tab selection
  var savedMain = parseInt(setting("lastMainTab", "0"), 10);
  if (savedMain >= 0 && savedMain < tabs.children.length) tabs.selection = savedMain;
  var savedMontage = parseInt(setting("lastMontageTab", "0"), 10);
  if (savedMontage >= 0 && savedMontage < montageSub.children.length) montageSub.selection = savedMontage;
  var savedAnim = parseInt(setting("lastAnimTab", "0"), 10);
  if (savedAnim >= 0 && savedAnim < animSub.children.length) animSub.selection = savedAnim;
  var savedLook = parseInt(setting("lastLookTab", "0"), 10);
  if (savedLook >= 0 && savedLook < lookSub.children.length) lookSub.selection = savedLook;
  var savedSettings = parseInt(setting("lastSettingsTab", "0"), 10);
  if (savedSettings >= 0 && savedSettings < settingsSub.children.length) settingsSub.selection = savedSettings;

  tabs.onChange = function () {
    if (tabs.selection) save("lastMainTab", tabs.selection.index);
  };
  montageSub.onChange = function () {
    if (montageSub.selection) save("lastMontageTab", montageSub.selection.index);
  };
  animSub.onChange = function () {
    if (animSub.selection) save("lastAnimTab", animSub.selection.index);
  };
  lookSub.onChange = function () {
    if (lookSub.selection) save("lastLookTab", lookSub.selection.index);
  };
  settingsSub.onChange = function () {
    if (settingsSub.selection) save("lastSettingsTab", settingsSub.selection.index);
  };

  var statusRow = ui.add("group");
  statusRow.alignChildren = ["fill", "center"];
  statusRow.alignment = ["fill", "bottom"];
  statusRow.visible = !welcomeShown;
  var status = statusRow.add("statictext", undefined, "\u25cf " + tr("status.ready"));
  status.alignment = ["fill", "center"];
  var bar = statusRow.add("progressbar", undefined, 0, 100);
  bar.minimumSize = [80, 8];
  bar.alignment = ["right", "center"];
  bar.visible = false;

  function setStatusColor(control, rgba) {
    try {
      control.graphics.foregroundColor = colorPen(control.graphics, rgba, 1);
    } catch (e) {}
  }

  function say(text) {
    status.text = "\u25cf " + text;
    setStatusColor(status, [0.15, 0.75, 0.35, 1]);
  }

  function warn(text) {
    status.text = "\u25b2 " + text;
    setStatusColor(status, [0.95, 0.65, 0.15, 1]);
  }

  function fail(text) {
    status.text = "! " + text;
    setStatusColor(status, [0.95, 0.25, 0.25, 1]);
  }

  var DRAWABLES = [];
  function registerDraw(panel) {
    DRAWABLES.push(panel);
    return panel;
  }
  function redrawAll() {
    for (var i = 0; i < DRAWABLES.length; i++) {
      try { DRAWABLES[i].notify("onDraw"); } catch (e) {}
    }
    try { ui.layout.layout(true); } catch (e) {}
  }

  // Hosts whose column layout uses each child's preferred height (EffectCraft before the shared
  // `fill` layout) would push the status line below the pane as soon as the panel is docked shorter
  // than its content. Detect that once, then pin the tabbed panel to the pane height so every host
  // shows the same full-height screen; a host that already shares the spare height is left alone.
  var CHROME = 66; // margins (8 + 8) + header 22 + status row 16 + two 6 px gaps
  var heightPinned = false;
  ui.onResize = function () {
    var sz = ui.size;
    var w = sz && (sz.width !== undefined ? sz.width : sz[0]);
    var h = sz && (sz.height !== undefined ? sz.height : sz[1]);
    if (!(w > 0) || !(h > 0)) return;
    var th = Math.max(1, h - CHROME);
    if (!heightPinned && tabs.bounds[3] <= th + 1) return;
    heightPinned = true;
    tabs.preferredSize = [-1, th];
    try { ui.layout.layout(); } catch (e) {}
  };

  // Static controls are translated after they are built, so every screen follows the chosen language
  // without duplicating the layout code for each one.
  function localizeUI(root) {
    var kids = root.children || [];
    for (var i = 0; i < kids.length; i++) {
      var c = kids[i];
      if (c.type === "dropdownlist" && c.items && c.items.length) {
        if (!c._flowBaseItems) {
          c._flowBaseItems = [];
          for (var d = 0; d < c.items.length; d++) c._flowBaseItems.push(c.items[d].text);
        }
        var sel = c.selection ? c.selection.index : 0;
        c.removeAll();
        for (var b = 0; b < c._flowBaseItems.length; b++) c.add("item", trText(c._flowBaseItems[b]));
        if (c.items.length) c.selection = Math.max(0, Math.min(sel, c.items.length - 1));
      } else if (c.type === "statictext" || c.type === "button" || c.type === "checkbox" || c.type === "tab" || c.type === "panel") {
        // A control whose initial text is not a known label is dynamic (status, counters, model
        // info...). Mark it once so a later language switch never overwrites live content.
        if (!c._flowNoTranslate) {
          if (c._flowBase === undefined) {
            var baseText = c.text;
            if (typeof baseText !== "string" || !baseText) c._flowNoTranslate = true;
            else if (canTranslate(baseText)) c._flowBase = baseText;
            else c._flowNoTranslate = true;
          }
          if (c._flowBase !== undefined) c.text = trText(c._flowBase);
        }
      }
      localizeUI(c);
    }
  }

  function welcomeRetryLabel() {
    return welcomeCheck._flowRetry ? tr("welcome.retry") : tr("welcome.check");
  }

  function setWelcome(visible) {
    welcomeShown = !!visible;
    welcome.visible = welcomeShown;
    tabs.visible = !welcomeShown;
    statusRow.visible = !welcomeShown;
    if (welcomeShown) {
      welcomeCheck._flowRetry = false;
      welcomeCheck.text = welcomeRetryLabel();
      welcomeSkip.text = tr("welcome.skip");
      welcomeStatus.text = "";
    }
    try { ui.layout.layout(true); } catch (e) {}
  }

  welcomeCheck.onClick = function () {
    var r = helper({ op: "ping" });
    if (r && r.ok) {
      welcomeStatus.text = tr("welcome.ok");
      setStatusColor(welcomeStatus, [0.15, 0.75, 0.35, 1]);
      save("welcomeDone", "1");
      setWelcome(false);
      say(tr("welcome.ok"));
    } else {
      welcomeCheck._flowRetry = true;
      welcomeCheck.text = welcomeRetryLabel();
      welcomeStatus.text = tr("welcome.fail") + (r && r.error ? "\n" + r.error : "");
      setStatusColor(welcomeStatus, [0.95, 0.65, 0.15, 1]);
      redrawAll();
    }
  };
  welcomeSkip.onClick = function () {
    save("welcomeDone", "1");
    setWelcome(false);
    warn(tr("welcome.fail"));
  };

  function applyLanguage() {
    save("language", LANG);
    localizeUI(ui);
    if (typeof catLibraryRelabel === "function") catLibraryRelabel();
    welcomeCheck.text = welcomeRetryLabel();
    welcomeSkip.text = tr("welcome.skip");
    welcomeTitle.text = tr("welcome.title");
    welcomeBody.text = tr("welcome.body");
    if (/^(●|▲)/.test(status.text)) status.text = status.text.charAt(0) + " " + tr("status.ready");
    redrawAll();
  }

  function applyTheme() {
    save("theme", THEME);
    redrawAll();
  }

  langDrop.onChange = function () {
    if (!langDrop.selection) return;
    LANG = LANGS[langDrop.selection.index] || "fr";
    applyLanguage();
  };
  themeDrop.onChange = function () {
    THEME = themeDrop.selection.index === 1 ? "dark" : themeDrop.selection.index === 2 ? "light" : "auto";
    applyTheme();
  };

  function addBtn(parent, text, enText, isPrimary) {
    var b = parent.add("button", undefined, text);
    b._en = enText || text;
    b.alignment = ["fill", "center"];
    if (isPrimary) b.isPrimary = true;
    return b;
  }

  function row(parent, label) {
    var g = parent.add("group");
    g.alignChildren = ["left", "center"];
    g.alignment = ["fill", "top"];
    var l = g.add("statictext", undefined, label);
    l.minimumSize = [78, -1];
    l.alignment = ["left", "center"];
    return g;
  }

  function field(parent, label, value, width) {
    var g = row(parent, label);
    var e = g.add("edittext", undefined, String(value));
    e.alignment = ["fill", "center"];
    if (width) e.minimumSize = [width, -1];
    return e;
  }

  function slider(parent, label, value, lo, hi, onChange) {
    var g = row(parent, label);
    var s = g.add("slider", undefined, value, lo, hi);
    s.alignment = ["fill", "center"];
    s.minimumSize = [90, -1];
    var t = g.add("edittext", undefined, String(value));
    t.minimumSize = [46, -1];
    t.alignment = ["right", "center"];
    s.onChanging = function () {
      t.text = String(Math.round(s.value * 100) / 100);
      if (onChange) onChange(s.value);
    };
    t.onChange = function () {
      var v = clamp(num(t.text, s.value), lo, hi);
      s.value = v;
      t.text = String(v);
      if (onChange) onChange(v);
    };
    return { s: s, t: t, get: function () { return clamp(num(t.text, s.value), lo, hi); }, set: function (v) { s.value = v; t.text = String(Math.round(v * 100) / 100); } };
  }

  function dropdown(parent, label, items, index) {
    var g = row(parent, label);
    var d = g.add("dropdownlist", undefined, items);
    d.selection = clamp(index || 0, 0, items.length - 1);
    d.alignment = ["fill", "center"];
    d.minimumSize = [120, -1];
    return d;
  }

  function easingNames() {
    var n = [];
    for (var i = 0; i < EASINGS.length; i++) n.push(EASINGS[i].name);
    return n;
  }

  // ---- background jobs: poll the helper without blocking the UI

  var job = null;
  var pollTask = 0;

  function stopPolling() {
    if (pollTask) {
      try {
        app.cancelTask(pollTask);
      } catch (e) {}
    }
    pollTask = 0;
    bar.visible = false;
    job = null;
  }

  function startJob(request, label, onDone) {
    if (job) {
      fail("Another job is still running.");
      return;
    }
    var r = helper(request);
    if (!r.ok) {
      fail(r.error);
      return;
    }
    job = { id: r.job, label: label, onDone: onDone };
    bar.value = 0;
    bar.visible = true;
    say(label + "…");
    G.__flowPoll = poll;
    pollTask = app.scheduleTask("__flowPoll()", 500, true);
  }

  function poll() {
    if (!job) return;
    var r = helper({ op: "job.status", job: job.id });
    if (!r.ok) {
      var msg = r.error;
      stopPolling();
      fail(msg);
      return;
    }
    if (r.state === "running") {
      say(job.label + ": " + (r.note || "working") + " (" + fmt(r.elapsed || 0) + ")");
      if (typeof r.progress === "number") bar.value = Math.round(r.progress * 100);
      return;
    }
    var done = job.onDone;
    var label = job.label;
    stopPolling();
    if (r.state === "done") {
      say(label + ": done.");
      try {
        done(r.result);
      } catch (e) {
        fail(String(e));
      }
    } else {
      fail(label + ": " + (r.error || "failed"));
    }
  }

  // ================================================================== Ease tab

  easeTab.orientation = "column";
  easeTab.alignChildren = ["fill", "top"];
  var easeSelect = dropdown(easeTab, "Easing", easingNames(), 8);
  var easeCurve = easeTab.add("group");
  easeCurve.preferredSize = [-1, 90];
  easeCurve.alignment = ["fill", "top"];
  registerDraw(easeCurve);
  easeCurve.onDraw = function () {
    var g = easeCurve.graphics;
    var w = easeCurve.size[0], h = easeCurve.size[1];
    var C = palette();
    g.newPath();
    g.rectPath(0, 0, w, h);
    g.fillPath(colorBrush(g, C.bg));
    var f = easingFn(EASINGS[easeSelect.selection.index].id);
    var pen = colorPen(g, C.accent, 2);
    var minY = 0, maxY = 1, i, y;
    for (i = 0; i <= 60; i++) {
      y = f(i / 60);
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    var pad = 6;
    for (i = 0; i <= 60; i++) {
      var px = pad + (w - 2 * pad) * (i / 60);
      var py = h - pad - (h - 2 * pad) * ((f(i / 60) - minY) / (maxY - minY));
      if (i === 0) {
        g.newPath();
        g.moveTo(px, py);
      } else {
        g.lineTo(px, py);
      }
    }
    g.strokePath(pen);
  };
  easeSelect.onChange = function () {
    try {
      easeCurve.notify("onDraw");
    } catch (e) {}
  };

  var easeMode = dropdown(easeTab, "Mode", ["Between keyframes", "Intro (from a value)"], 0);
  var easeFrom = field(easeTab, "From (x,y or value)", "0", 110);
  var easeDelay = field(easeTab, "Delay (s)", "0", 60);
  var easeDur = field(easeTab, "Duration (s)", "0.6", 60);
  var easeButtons = easeTab.add("group");
  easeButtons.alignment = ["fill", "top"];
  var easeApply = addBtn(easeButtons, "Appliquer aux propriétés sélectionnées", "Apply to selected properties", true);
  var easeClear = addBtn(easeButtons, "Supprimer l'expression", "Remove expression", false);
  var easeHintText = easeTab.add("statictext", undefined, tr("easeHint"), { multiline: true });
  easeHintText.alignment = ["fill", "top"];

  easeApply.onClick = function () {
    var props = selectedProps();
    if (props.length === 0) return fail("Select one or more properties in the timeline first.");
    var id = EASINGS[easeSelect.selection.index].id;
    var intro = easeMode.selection.index === 1;
    var from = [];
    var parts = easeFrom.text.split(",");
    for (var i = 0; i < parts.length; i++) {
      var v = parseFloat(parts[i]);
      if (isFinite(v)) from.push(v);
    }
    var delay = Math.max(0, num(easeDelay.text, 0));
    var dur = Math.max(0.01, num(easeDur.text, 0.6));
    app.beginUndoGroup("Flow Ease");
    var n = 0;
    for (var k = 0; k < props.length; k++) {
      var pk = propKind(props[k]);
      if (!pk || pk.kind === "text") continue;
      if (!intro && props[k].numKeys < 2) continue;
      props[k].expression = intro ? introExpression(id, from, delay, dur) : betweenKeysExpression(id);
      n++;
    }
    app.endUndoGroup();
    if (n === 0) fail(intro ? "No number or vector property is selected." : "Selected properties need at least two keyframes.");
    else say("Applied " + EASINGS[easeSelect.selection.index].name + " to " + n + " propert" + (n === 1 ? "y" : "ies") + ".");
  };

  easeClear.onClick = function () {
    var props = selectedProps();
    app.beginUndoGroup("Flow Ease: remove");
    for (var i = 0; i < props.length; i++) props[i].expression = "";
    app.endUndoGroup();
    say("Removed expressions from " + props.length + " properties.");
  };

  // ================================================================== Expressions tab

  exprTab.orientation = "column";
  exprTab.alignChildren = ["fill", "top"];
  var exprSearch = field(exprTab, "Search", "", 150);
  var exprList = exprTab.add("listbox", undefined, [], { numberOfColumns: 1 });
  exprList.alignment = ["fill", "fill"];
  exprList.preferredSize = [-1, 120];
  var exprInfo = exprTab.add("statictext", undefined, "", { multiline: true });
  exprInfo.alignment = ["fill", "top"];
  exprInfo.preferredSize = [-1, 34];
  var exprParamBox = exprTab.add("group");
  exprParamBox.orientation = "column";
  exprParamBox.alignChildren = ["fill", "top"];
  var exprButtons = exprTab.add("group");
  exprButtons.alignment = ["fill", "top"];
  var exprApply = addBtn(exprButtons, "Appliquer l'expression", "Apply to selected property", true);
  var exprPick = addBtn(exprButtons, "Voir le code", "Show code", false);
  var exprHintText = exprTab.add("statictext", undefined, tr("exprHint"), { multiline: true });
  exprHintText.alignment = ["fill", "top"];
  var exprShown = [];
  var exprFields = [];

  function refreshExprList() {
    var q = exprSearch.text.toLowerCase();
    exprList.removeAll();
    exprShown = [];
    for (var i = 0; i < LIBRARY.length; i++) {
      var e = LIBRARY[i];
      if (q && (e.name + " " + e.kind + " " + e.info).toLowerCase().indexOf(q) < 0) continue;
      exprList.add("item", e.name + "   [" + e.kind + "]");
      exprShown.push(e);
    }
    if (exprList.items.length) exprList.selection = 0;
  }

  function showExprParams() {
    for (var c = exprParamBox.children.length - 1; c >= 0; c--) exprParamBox.remove(exprParamBox.children[c]);
    exprFields = [];
    var sel = exprList.selection;
    var entry = sel ? exprShown[sel.index] : null;
    exprInfo.text = entry ? entry.info : "";
    if (!entry) return;
    for (var i = 0; i < entry.params.length; i++) {
      var p = entry.params[i];
      exprFields.push({ id: p[0], ctl: slider(exprParamBox, p[1], p[2], p[3], p[4]) });
    }
    try {
      exprTab.layout.layout(true);
    } catch (e) {}
  }

  function currentExpression() {
    var sel = exprList.selection;
    if (!sel) return null;
    var entry = exprShown[sel.index];
    var params = {};
    for (var i = 0; i < exprFields.length; i++) params[exprFields[i].id] = exprFields[i].ctl.get();
    return { entry: entry, code: fillTemplate(entry.code, params) };
  }

  exprSearch.onChanging = refreshExprList;
  exprList.onChange = showExprParams;
  exprApply.onClick = function () {
    var cur = currentExpression();
    if (!cur) return fail("Pick an expression first.");
    var props = selectedProps();
    if (props.length === 0) return fail("Select a property in the timeline first.");
    app.beginUndoGroup("Flow Expression: " + cur.entry.name);
    var n = 0;
    for (var i = 0; i < props.length; i++) {
      if (!compatible(cur.entry, propKind(props[i]))) continue;
      props[i].expression = cur.code;
      n++;
    }
    app.endUndoGroup();
    if (n === 0) fail(cur.entry.name + " does not fit the selected property (it needs a " + (cur.entry.kind === "text" ? "Source Text" : cur.entry.kind === "scalar" ? "single-number" : "position/scale-like") + " property).");
    else say(cur.entry.name + " applied to " + n + " propert" + (n === 1 ? "y" : "ies") + ".");
  };
  exprPick.onClick = function () {
    var cur = currentExpression();
    if (cur) say(cur.code.length > 300 ? cur.code.substr(0, 300) + "…" : cur.code);
  };
  refreshExprList();
  showExprParams();

  // ================================================================== Silence tab

  silenceTab.orientation = "column";
  silenceTab.alignChildren = ["fill", "top"];

  var silHint = silenceTab.add("statictext", undefined, tr("silenceHint"), { multiline: true });
  silHint.preferredSize = [-1, 22];

  // Waveform & threshold preview
  var silWave = silenceTab.add("panel", undefined, tr("waveform"));
  silWave.preferredSize = [-1, 82];
  silWave.alignment = ["fill", "top"];
  registerDraw(silWave);
  silWave.onDraw = function () {
    var g = this.graphics;
    var sz = this.size;
    var w = sz[0] || 260, h = sz[1] || 82;
    var C = palette();
    // onDraw replaces the native panel frame, so the panel's own label is drawn here.
    g.newPath();
    g.rectPath(0, 0, w, h);
    g.fillPath(colorBrush(g, C.bg));
    g.drawString(tr("waveform"), colorPen(g, C.muted, 1), 10, 3);
    var top = 20, bottom = Math.max(top + 10, h - 8);
    if (!silLast || !silLast.result || !silLast.result.duration) {
      g.drawString(tr("silenceEmpty"), colorPen(g, C.muted, 1), 10, Math.floor(h / 2 + 2));
      return;
    }
    var res = silLast.result;
    var dur = res.duration;
    // Silent zones in red, speech in green, threshold line in orange. Each shape starts a new
    // path: `fillPath`/`strokePath` do not clear `currentPath` (see the draw notes in
    // docs/flow-studio.md).
    var brushCut = colorBrush(g, C.cut);
    var penBorder = colorPen(g, [0.9, 0.3, 0.3, 0.8], 1);
    for (var i = 0; i < res.silent.length; i++) {
      var s = res.silent[i];
      var x1 = Math.round((s.start / dur) * (w - 20)) + 10;
      var x2 = Math.round((s.end / dur) * (w - 20)) + 10;
      var bw = Math.max(2, x2 - x1);
      g.newPath();
      g.rectPath(x1, top, bw, bottom - top);
      g.fillPath(brushCut);
      g.strokePath(penBorder);
    }
    var penVoice = colorPen(g, C.voice, 1.5);
    for (var k = 0; k < res.keep.length; k++) {
      var kp = res.keep[k];
      var kx1 = Math.round((kp.start / dur) * (w - 20)) + 10;
      var kx2 = Math.round((kp.end / dur) * (w - 20)) + 10;
      var mid = Math.floor((top + bottom) / 2);
      var half = Math.floor((bottom - top) / 2 - 4);
      g.newPath();
      g.moveTo(kx1, mid - half);
      g.lineTo(kx2, mid - half);
      g.lineTo(kx2, mid + half);
      g.lineTo(kx1, mid + half);
      g.closePath();
      g.strokePath(penVoice);
    }
    var penT = colorPen(g, [1, 0.7, 0.2, 0.7], 1);
    g.newPath();
    var ty = Math.round(top + (bottom - top) * 0.75);
    g.moveTo(10, ty);
    g.lineTo(w - 10, ty);
    g.strokePath(penT);
  };

  var silSens = dropdown(silenceTab, "Sensibilité", ["Normale (Recommandé)", "Stricte (Garder plus de voix)", "Agressive (Couper un maximum)"], 0);
  silSens.onChange = function () {
    if (silSens.selection.index === 0) { silDb.set(-35); silMin.set(0.4); }
    else if (silSens.selection.index === 1) { silDb.set(-42); silMin.set(0.6); }
    else { silDb.set(-28); silMin.set(0.25); }
    save("silSens", silSens.selection.index);
  };

  var silMode = dropdown(silenceTab, "Action", ["Couper et raccorder (Ripple)", "Marqueurs seulement"], 0);
  silMode.onChange = function () { save("silMode", silMode.selection.index); };
  var silKeep = silenceTab.add("checkbox", undefined, "Conserver le calque original");
  silKeep.value = true;
  silKeep.onClick = function () { save("silKeep", silKeep.value ? "1" : "0"); };

  // Advanced mode (collapsible)
  var silAdvCheck = silenceTab.add("checkbox", undefined, "Mode avancé");
  silAdvCheck.value = false;
  var silAdvPanel = silenceTab.add("group");
  silAdvPanel.orientation = "column";
  silAdvPanel.alignChildren = ["fill", "top"];
  silAdvPanel.alignment = ["fill", "top"];
  silAdvPanel.visible = false;
  silAdvCheck.onClick = function () {
    silAdvPanel.visible = !!silAdvCheck.value;
    save("silAdvanced", silAdvCheck.value ? "1" : "0");
    try { ui.layout.layout(true); } catch (e) {}
  };

  var silEngine = dropdown(silAdvPanel, "Détecteur", ["Adaptatif (pièces bruyantes)", "Seuil fixe"], 0);
  silEngine.onChange = function () { save("silEngine", silEngine.selection.index); };
  var silDb = slider(silAdvPanel, "Seuil (dB)", -35, -70, -10, function (v) { save("silDb", v); });
  var silMin = slider(silAdvPanel, "Silence min (s)", 0.4, 0.1, 3, function (v) { save("silMin", v); });
  var silPadBefore = slider(silAdvPanel, "Marge avant (s)", 0.1, 0, 1, function (v) { save("silPadBefore", v); });
  var silPadAfter = slider(silAdvPanel, "Marge après (s)", 0.1, 0, 1, function (v) { save("silPadAfter", v); });

  (function restoreSilence() {
    var sens = parseInt(setting("silSens", "0"), 10);
    if (sens >= 0 && sens < 3) silSens.selection = sens;
    var mode = parseInt(setting("silMode", "0"), 10);
    if (mode >= 0 && mode < 2) silMode.selection = mode;
    silKeep.value = setting("silKeep", "1") !== "0";
    silAdvCheck.value = setting("silAdvanced", "0") === "1";
    silAdvPanel.visible = silAdvCheck.value;
    var engine = parseInt(setting("silEngine", "0"), 10);
    if (engine >= 0 && engine < 2) silEngine.selection = engine;
    silDb.set(clamp(num(setting("silDb", "-35"), -35), -70, -10));
    silMin.set(clamp(num(setting("silMin", "0.4"), 0.4), 0.1, 3));
    silPadBefore.set(clamp(num(setting("silPadBefore", "0.1"), 0.1), 0, 1));
    silPadAfter.set(clamp(num(setting("silPadAfter", "0.1"), 0.1), 0, 1));
  })();

  var silButtons = silenceTab.add("group");
  silButtons.alignment = ["fill", "top"];
  var silAnalyze = addBtn(silButtons, "Analyser les silences", "Analyze", true);
  var silApply = addBtn(silButtons, "Couper les silences", "Apply", false);
  silApply.enabled = false;
  var silResult = silenceTab.add("statictext", undefined, tr("silenceReady"), { multiline: true });
  silResult.preferredSize = [-1, 40];
  silResult.alignment = ["fill", "top"];
  var silLast = null;

  // Beat markers section (PARTIE 2, item 5)
  var beatGroup = silenceTab.add("panel", undefined, "Rythme & Beat (Musique)");
  beatGroup.orientation = "column";
  beatGroup.alignChildren = ["fill", "top"];
  beatGroup.alignment = ["fill", "top"];
  var beatHint = beatGroup.add("statictext", undefined, "Détecte le tempo de la musique et pose des repères de rythme.", { multiline: true });
  beatHint.preferredSize = [-1, 20];
  var beatButtons = beatGroup.add("group");
  beatButtons.alignment = ["fill", "top"];
  var beatBtn = addBtn(beatButtons, "Détecter le tempo & poser des marqueurs", "Detect Beats", false);
  var beatCutBtn = addBtn(beatButtons, "Couper sur le tempo", "Cut on Beats", false);

  function selectedFootageLayer() {
    var comp = activeComp();
    if (!comp || comp.selectedLayers.length === 0) return null;
    var l = comp.selectedLayers[0];
    var src = l.source;
    if (!(src instanceof FootageItem) || !src.mainSource || !src.mainSource.file) return null;
    return { layer: l, comp: comp, path: src.mainSource.file.fsName };
  }

  beatBtn.onClick = function () {
    var t = selectedFootageLayer();
    if (!t) return fail("Sélectionnez un calque audio ou vidéo pour le tempo.");
    startJob({ op: "beats.analyze", path: t.path }, "Détection du tempo", function (res) {
      var comp = t.comp;
      app.beginUndoGroup("Flow Beat Detection");
      var count = 0;
      var bpm = Math.round(res.bpm || 120);
      var beats = res.beats || [];
      for (var bi = 0; bi < beats.length; bi++) {
        var bt = t.layer.startTime + beats[bi];
        if (bt >= t.layer.inPoint && bt <= t.layer.outPoint) {
          var mv = new MarkerValue("Beat " + (count + 1) + " (" + bpm + " BPM)");
          try {
            comp.markerProperty.setValueAtTime(bt, mv);
          } catch (e) {
            try { t.layer.marker.setValueAtTime(bt, mv); } catch (e2) {}
          }
          count++;
        }
      }
      app.endUndoGroup();
      say(count + " marqueurs de beat posés (" + bpm + " BPM).");
    });
  };

  beatCutBtn.onClick = function () {
    var t = selectedFootageLayer();
    if (!t) return fail("Sélectionnez un calque à découper sur le tempo.");
    startJob({ op: "beats.analyze", path: t.path }, "Découpe sur le tempo", function (res) {
      if (!res.beats || !res.beats.length) return fail("Aucun battement détecté.");
      var comp = t.comp;
      var layer = t.layer;
      app.beginUndoGroup("Flow Cut on Beats");
      var cuts = 0;
      for (var i = 0; i < res.beats.length; i++) {
        var bt = layer.startTime + res.beats[i];
        if (bt > layer.inPoint + 0.1 && bt < layer.outPoint - 0.1) {
          var dup = layer.duplicate();
          dup.inPoint = bt;
          layer.outPoint = bt;
          cuts++;
          layer = dup;
        }
      }
      app.endUndoGroup();
      say(cuts + " coupes créées sur le rythme.");
    });
  };

  silAnalyze.onClick = function () {
    var t = selectedFootageLayer();
    if (!t) return fail("Select a layer made from a video or audio file.");
    startJob(
      {
        op: "silence.analyze",
        path: t.path,
        params: {
          engine: silEngine.selection.index === 0 ? "adaptive" : "fixed",
          thresholdDb: silDb.get(),
          minSilence: silMin.get(),
          padBefore: silPadBefore.get(),
          padAfter: silPadAfter.get()
        }
      },
      "Silence analysis",
      function (result) {
        silLast = { result: result, layerId: t.layer.index, path: t.path };
        var pct = result.duration > 0 ? Math.round((result.silentTotal / result.duration) * 100) : 0;
        silResult.text = result.silent.length + " silences, " + fmt(result.silentTotal) + " (" + pct + "%) can be removed of " + fmt(result.duration) + ". Threshold used: " + result.thresholdUsedDb + " dB, noise floor " + result.noiseFloorDb + " dB.";
        silApply.enabled = result.silent.length > 0;
        try { silWave.notify("onDraw"); } catch (e) {}
      }
    );
  };

  silApply.onClick = function () {
    var t = selectedFootageLayer();
    if (!t || !silLast || silLast.path !== t.path) return fail("Analyze the selected layer first.");
    var res = silLast.result;
    var layer = t.layer;
    var ls = layer.startTime;
    var lo = layer.inPoint - ls;
    var hi = layer.outPoint - ls;
    app.beginUndoGroup("Flow Silence");
    var i;
    if (silMode.selection.index === 1) {
      var n = 0;
      for (i = 0; i < res.silent.length; i++) {
        var s = res.silent[i];
        if (s.end < lo || s.start > hi) continue;
        layer.marker.setValueAtTime(s.start, new MarkerValue("silence " + s.start.toFixed(2) + "-" + s.end.toFixed(2) + "s"));
        n++;
      }
      app.endUndoGroup();
      return say("Added " + n + " silence markers.");
    }
    var cursor = layer.inPoint;
    var made = 0;
    for (i = 0; i < res.keep.length; i++) {
      var a = Math.max(res.keep[i].start, lo);
      var b = Math.min(res.keep[i].end, hi);
      if (b - a < 0.02) continue;
      var dup = layer.duplicate();
      if (!dup) continue;
      app.run("layer.timing", { comp: dup.__comp, layers: [dup.__id], start: cursor - a, in: cursor, out: cursor + (b - a) });
      dup.name = layer.name + " [" + (made + 1) + "]";
      cursor += b - a;
      made++;
    }
    if (silKeep.value) {
      layer.enabled = false;
      try {
        layer.audioEnabled = false;
      } catch (e) {}
    } else {
      layer.remove();
    }
    app.endUndoGroup();
    say("Cut into " + made + " clips: kept " + fmt(cursor - t.layer.inPoint) + " of " + fmt(res.duration) + " (gaps closed).");
  };

  // ================================================================== Captions tab

  var BUILTIN_STYLES = [
    { name: "Clean", fontFamily: "Inter", fontStyle: "Medium", fontSize: 54, uppercase: false, tracking: 0, lineSpacing: 1.2, fill: "#FFFFFF", stroke: "#000000", strokeWidth: 0, shadow: { color: "#000000", opacity: 60, angle: 135, distance: 4, softness: 8 }, position: { anchor: "bottom", margin: 0.12, offsetX: 0 }, align: "center", group: { maxChars: 32, maxWords: 7, maxDuration: 4, maxGap: 0.8 }, animation: { kind: "fade", duration: 0.15, easing: "outCubic" } },
    { name: "Bold Yellow", fontFamily: "Inter", fontStyle: "Bold", fontSize: 76, uppercase: true, tracking: 0, lineSpacing: 1.2, fill: "#FFE600", stroke: "#000000", strokeWidth: 9, shadow: null, position: { anchor: "bottom", margin: 0.12, offsetX: 0 }, align: "center", group: { maxChars: 20, maxWords: 3, maxDuration: 4, maxGap: 0.8 }, animation: { kind: "pop", duration: 0.18, easing: "outBack" } },
    { name: "Word Pop", fontFamily: "Inter", fontStyle: "Bold", fontSize: 110, uppercase: true, tracking: 0, lineSpacing: 1.2, fill: "#FFFFFF", stroke: "#000000", strokeWidth: 10, shadow: null, position: { anchor: "middle", margin: 0.12, offsetX: 0 }, align: "center", group: { maxChars: 20, maxWords: 1, maxDuration: 4, maxGap: 0.4 }, animation: { kind: "pop", duration: 0.14, easing: "outBack" } },
    { name: "Minimal", fontFamily: "Inter", fontStyle: "Regular", fontSize: 40, uppercase: false, tracking: 0, lineSpacing: 1.2, fill: "#FFFFFF", stroke: "#000000", strokeWidth: 0, shadow: null, position: { anchor: "bottom", margin: 0.08, offsetX: 0 }, align: "center", group: { maxChars: 44, maxWords: 9, maxDuration: 4, maxGap: 0.8 }, animation: { kind: "none", duration: 0.15, easing: "outCubic" } },
    { name: "Subtitle Outline", fontFamily: "Inter", fontStyle: "SemiBold", fontSize: 58, uppercase: false, tracking: 0, lineSpacing: 1.2, fill: "#FFFFFF", stroke: "#000000", strokeWidth: 6, shadow: null, position: { anchor: "bottom", margin: 0.12, offsetX: 0 }, align: "center", group: { maxChars: 32, maxWords: 7, maxDuration: 4, maxGap: 0.8 }, animation: { kind: "slideUp", duration: 0.2, easing: "outCubic" } },
    { name: "Arabic Clean", fontFamily: "Noto Sans Arabic", fontStyle: "Regular", fontSize: 56, uppercase: false, tracking: 0, lineSpacing: 1.2, fill: "#FFFFFF", stroke: "#000000", strokeWidth: 5, shadow: null, position: { anchor: "bottom", margin: 0.12, offsetX: 0 }, align: "center", group: { maxChars: 32, maxWords: 7, maxDuration: 4, maxGap: 0.8 }, animation: { kind: "fade", duration: 0.15, easing: "outCubic" } },
    { name: "Hormozi", fontFamily: "Inter", fontStyle: "Bold", fontSize: 120, uppercase: true, tracking: 0, lineSpacing: 1.2, fill: "#FFE600", stroke: "#000000", strokeWidth: 14, shadow: null, position: { anchor: "middle", margin: 0.12, offsetX: 0 }, align: "center", group: { maxChars: 20, maxWords: 1, maxDuration: 4, maxGap: 0.4 }, animation: { kind: "pop", duration: 0.12, easing: "outBack" } },
    { name: "Karaoke", fontFamily: "Inter", fontStyle: "SemiBold", fontSize: 64, uppercase: false, tracking: 0, lineSpacing: 1.2, fill: "#FFFFFF", stroke: "#000000", strokeWidth: 7, shadow: null, position: { anchor: "bottom", margin: 0.1, offsetX: 0 }, align: "center", group: { maxChars: 30, maxWords: 5, maxDuration: 4, maxGap: 0.8 }, animation: { kind: "none", duration: 0.15, easing: "outCubic" } }
  ];
  var userStyles = [];

  function cloneStyle(s) {
    return JSON.parse(JSON.stringify(s));
  }

  function hexToUnit(hex, fallback) {
    var m = /^#?([0-9a-fA-F]{6})([0-9a-fA-F]{2})?$/.exec(String(hex).replace(/\s/g, ""));
    if (!m) return fallback;
    var h = m[1];
    return [parseInt(h.substr(0, 2), 16) / 255, parseInt(h.substr(2, 2), 16) / 255, parseInt(h.substr(4, 2), 16) / 255];
  }

  function validHex(hex) {
    return /^#?([0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(String(hex).replace(/\s/g, ""));
  }

  captionTab.orientation = "column";
  captionTab.alignChildren = ["fill", "top"];

  var capHint = captionTab.add("statictext", undefined, tr("captionsHint"), { multiline: true });
  capHint.preferredSize = [-1, 20];

  var capLang = dropdown(captionTab, "Language", ["Auto-detect", "Français (fr)", "العربية (ar)", "English (en)", "Español (es)", "Deutsch (de)"], 0);
  var LANG_CODES = ["auto", "fr", "ar", "en", "es", "de"];
  var capModel = dropdown(captionTab, "Model", ["Whisper Small (recommended)", "Whisper Base", "Whisper Tiny", "Whisper Large v3 Turbo"], 0);
  var MODEL_IDS = ["whisper-small", "whisper-base", "whisper-tiny", "whisper-large-v3-turbo"];

  var capKaraoke = dropdown(captionTab, "Karaoké", ["Désactivé (Classique)", "Hormozi (Pop jaune)", "Word Pop (Échelle)", "Karaoke (Surlignage)"], 0);
  capKaraoke._en = "Karaoke Mode";
  var savedKaraoke = parseInt(setting("capKaraoke", "0"), 10);
  if (savedKaraoke >= 0 && savedKaraoke < 4) capKaraoke.selection = savedKaraoke;
  capKaraoke.onChange = function () {
    if (capKaraoke.selection) save("capKaraoke", capKaraoke.selection.index);
  };

  var capButtons = captionTab.add("group");
  capButtons.alignment = ["fill", "top"];
  var capGenerate = addBtn(capButtons, "Générer depuis le calque", "Generate from selected layer", true);
  var capSrtPath = field(captionTab, tr("captionFile"), "", 150);
  var capImport = addBtn(captionTab, "Importer un fichier de sous-titres", "Import captions from file", false);

  var styleBox = captionTab.add("panel", undefined, tr("captionStyle"));
  styleBox.orientation = "column";
  styleBox.alignChildren = ["fill", "top"];

  var stPreview = styleBox.add("panel", undefined, tr("stylePreview"));
  stPreview.preferredSize = [-1, 54];
  stPreview.alignment = ["fill", "top"];
  registerDraw(stPreview);
  stPreview.onDraw = function () {
    var g = this.graphics;
    var sz = this.size;
    var w = sz[0] || 260, h = sz[1] || 54;
    var C = palette();
    g.newPath();
    g.rectPath(0, 0, w, h);
    g.fillPath(colorBrush(g, C.bg));
    g.drawString(tr("stylePreview"), colorPen(g, C.muted, 1), 10, 3);
    var st = readStyle();
    var sample = st.uppercase ? "SOUS-TITRE FLOW" : "Sous-titre Flow";
    var col = hexToUnit(st.fill, [1, 1, 1]);
    var ty = Math.floor(h / 2 - 2);
    if (st.shadow) {
      g.drawString(sample, colorPen(g, [0, 0, 0, 0.8], 1), Math.floor(w / 2 - 78) + 2, ty + 2);
    }
    g.drawString(sample, colorPen(g, [col[0], col[1], col[2], 1], 1), Math.floor(w / 2 - 78), ty);
  };

  var stGridSel = 0;
  var stGrid = styleBox.add("panel", undefined, tr("stylesClick"));
  stGrid.orientation = "column";
  stGrid.alignChildren = ["fill", "top"];
  stGrid.alignment = ["fill", "top"];
  stGrid.margins = [6, 20, 6, 6];
  stGrid.spacing = 4;
  var stCells = [];
  for (var stRow = 0; stRow < 2; stRow++) {
    var stRowG = stGrid.add("group");
    stRowG.alignment = ["fill", "center"];
    stRowG.alignChildren = ["fill", "center"];
    for (var stCol = 0; stCol < 4; stCol++) {
      var cell = stRowG.add("button", undefined, "");
      cell.alignment = ["fill", "center"];
      cell.preferredSize = [120, 36];
      cell._styleIndex = stRow * 4 + stCol;
      cell.onDraw = function () {
        var g = this.graphics;
        var sz = this.size;
        var w = sz[0] || 120, h = sz[1] || 36;
        var all = allStyles();
        var C = palette();
        var idx = this._styleIndex;
        g.newPath();
        g.rectPath(0, 0, w, h);
        g.fillPath(colorBrush(g, idx === stGridSel ? C.cellHi : C.cell));
        if (idx < all.length) {
          var st = all[idx];
          var col = hexToUnit(st.fill, [1, 1, 1]);
          var sample = String(st.uppercase ? "TEXTE" : "Texte");
          g.drawString(sample, colorPen(g, [col[0], col[1], col[2], 1], 1), 6, 2);
          g.drawString(String(st.name).substr(0, 18), colorPen(g, C.text, 1), 6, h - 14);
        }
      };
      cell.onClick = function () {
        var all = allStyles();
        if (this._styleIndex >= all.length) return;
        stGridSel = this._styleIndex;
        if (stPreset && stPreset.items.length > stGridSel) stPreset.selection = stGridSel;
        writeStyle(all[stGridSel]);
        try { stGrid.notify("onDraw"); stPreview.notify("onDraw"); } catch (e) {}
      };
      stCells.push(cell);
    }
  }

  function refreshStyleGrid(select) {
    if (select !== undefined) stGridSel = select;
    for (var i = 0; i < stCells.length; i++) {
      stCells[i]._styleIndex = i;
      try { stCells[i].notify("onDraw"); } catch (e) {}
    }
  }

  var stPreset = dropdown(styleBox, "Preset", ["Clean"], 0);
  // The detailed style fields stay collapsed: a preset plus the preview is all most edits need.
  var stAdvCheck = styleBox.add("checkbox", undefined, tr("advanced"));
  var stAdv = styleBox.add("group");
  stAdv.orientation = "column";
  stAdv.alignChildren = ["fill", "top"];
  stAdv.alignment = ["fill", "top"];
  var stFont = field(stAdv, "Font family", "Inter", 150);
  var stFontStyle = field(stAdv, "Font style", "Medium", 90);
  var stSize = slider(stAdv, "Size (px @1080p)", 54, 12, 300);
  var stFill = field(stAdv, "Text colour", "#FFFFFF", 90);
  var stStroke = field(stAdv, "Stroke colour", "#000000", 90);
  var stStrokeW = slider(stAdv, "Stroke width", 0, 0, 40);
  var stShadow = stAdv.add("checkbox", undefined, "Drop shadow");
  var stUpper = stAdv.add("checkbox", undefined, "UPPERCASE");
  var stAnchor = dropdown(stAdv, "Position", ["Top", "Middle", "Bottom"], 2);
  var stMargin = slider(stAdv, "Edge margin (%)", 12, 0, 40);
  var stAnim = dropdown(stAdv, "Animation", ["None", "Fade", "Pop", "Slide up"], 1);
  var stAnimDur = slider(stAdv, "Animation (s)", 0.15, 0, 1);
  var stEasing = dropdown(stAdv, tr("easing"), easingNames(), 8);
  var stWords = slider(stAdv, "Max words / line", 7, 1, 14);
  var stChars = slider(stAdv, "Max characters", 32, 8, 80);
  var stName = field(stAdv, "Save as", "My style", 130);
  var stButtons = stAdv.add("group");
  stButtons.alignment = ["fill", "top"];
  var stSave = addBtn(stButtons, "Enregistrer le style", "Save preset", false);
  var stDelete = addBtn(stButtons, "Supprimer", "Delete", false);
  stAdvCheck.value = setting("capAdvanced", "0") === "1";
  stAdv.visible = stAdvCheck.value;
  stAdvCheck.onChange = function () {
    stAdv.visible = stAdvCheck.value;
    save("capAdvanced", stAdvCheck.value ? "1" : "0");
    try { ui.layout.layout(true); } catch (e) {}
  };

  var capActions = captionTab.add("group");
  capActions.alignment = ["fill", "top"];
  var capCreate = addBtn(capActions, "Créer les calques de texte", "Create text layers", false);
  var capRestyle = addBtn(capActions, "Re-styliser tous les sous-titres", "Restyle all captions", false);
  var capExport = addBtn(capActions, "Exporter SRT", "Export SRT", false);
  var capExportAss = addBtn(capActions, "Exporter ASS", "Export ASS", false);
  var capHelp = captionTab.add("statictext", undefined, tr("captionsSteps"), { multiline: true });
  capHelp.alignment = ["fill", "top"];
  var lastLines = null;

  var ANCHORS = ["top", "middle", "bottom"];
  var ANIMS = ["none", "fade", "pop", "slideUp"];

  function readStyle() {
    return {
      name: stName.text || "Custom",
      fontFamily: stFont.text || "Inter",
      fontStyle: stFontStyle.text || "Regular",
      fontSize: stSize.get(),
      uppercase: !!stUpper.value,
      tracking: 0,
      lineSpacing: 1.2,
      fill: validHex(stFill.text) ? stFill.text : "#FFFFFF",
      stroke: validHex(stStroke.text) ? stStroke.text : "#000000",
      strokeWidth: stStrokeW.get(),
      shadow: stShadow.value ? { color: "#000000", opacity: 60, angle: 135, distance: 4, softness: 8 } : null,
      position: { anchor: ANCHORS[stAnchor.selection.index], margin: stMargin.get() / 100, offsetX: 0 },
      align: "center",
      group: { maxChars: Math.round(stChars.get()), maxWords: Math.round(stWords.get()), maxDuration: 4, maxGap: 0.8 },
      animation: { kind: ANIMS[stAnim.selection.index], duration: stAnimDur.get(), easing: EASINGS[stEasing.selection.index].id }
    };
  }

  function writeStyle(s) {
    stFont.text = s.fontFamily;
    stFontStyle.text = s.fontStyle;
    stSize.set(s.fontSize);
    stFill.text = s.fill;
    stStroke.text = s.stroke;
    stStrokeW.set(s.strokeWidth);
    stShadow.value = !!s.shadow;
    stUpper.value = !!s.uppercase;
    stAnchor.selection = Math.max(0, ANCHORS.indexOf(s.position.anchor));
    stMargin.set(s.position.margin * 100);
    stAnim.selection = Math.max(0, ANIMS.indexOf(s.animation.kind));
    stAnimDur.set(s.animation.duration);
    for (var i = 0; i < EASINGS.length; i++) if (EASINGS[i].id === s.animation.easing) stEasing.selection = i;
    stWords.set(s.group.maxWords);
    stChars.set(s.group.maxChars);
    stName.text = s.name;
  }

  function allStyles() {
    return BUILTIN_STYLES.concat(userStyles);
  }

  function refreshStyleList(select) {
    stPreset.removeAll();
    stPreset._flowBaseItems = null;
    var all = allStyles();
    for (var i = 0; i < all.length; i++) stPreset.add("item", all[i].name + (i >= BUILTIN_STYLES.length ? "  (mine)" : ""));
    stPreset.selection = clamp(select || 0, 0, all.length - 1);
    stGridSel = stPreset.selection.index;
    refreshStyleGrid(stGridSel);
  }

  function loadUserStyles() {
    var r = helper({ op: "styles.list" });
    userStyles = r.ok && r.user ? r.user : [];
  }

  stPreset.onChange = function () {
    if (stPreset.selection) {
      stGridSel = stPreset.selection.index;
      writeStyle(allStyles()[stGridSel]);
      refreshStyleGrid(stGridSel);
    }
  };
  stSave.onClick = function () {
    var r = helper({ op: "styles.save", style: readStyle() });
    if (!r.ok) return fail(r.error);
    loadUserStyles();
    var all = allStyles();
    var idx = 0;
    for (var i = 0; i < all.length; i++) if (all[i].name === stName.text) idx = i;
    refreshStyleList(idx);
    say("Saved style “" + stName.text + "”.");
  };
  stDelete.onClick = function () {
    var i = stPreset.selection ? stPreset.selection.index : 0;
    if (i < BUILTIN_STYLES.length) return fail("Built-in presets can't be deleted.");
    var r = helper({ op: "styles.delete", name: userStyles[i - BUILTIN_STYLES.length].name });
    if (!r.ok) return fail(r.error);
    loadUserStyles();
    refreshStyleList(0);
    writeStyle(BUILTIN_STYLES[0]);
    say("Style deleted.");
  };
  refreshStyleList(0);
  writeStyle(BUILTIN_STYLES[0]);

  function sourceOffset() {
    var t = selectedFootageLayer();
    return t ? t.layer.startTime : 0;
  }

  capGenerate.onClick = function () {
    var t = selectedFootageLayer();
    if (!t) return fail("Select a layer made from a video or audio file.");
    var st = readStyle();
    startJob(
      { op: "captions.transcribe", path: t.path, model: MODEL_IDS[capModel.selection.index], language: LANG_CODES[capLang.selection.index], group: st.group },
      "Transcription",
      function (result) {
        lastLines = { lines: result.lines, offset: t.layer.startTime };
        say(result.lines.length + " captions ready. Adjust the style, then Create text layers.");
      }
    );
  };

  capImport.onClick = function () {
    var p = capSrtPath.text.replace(/^\s+|\s+$/g, "");
    if (!p) return fail("Type the path of an .srt or .vtt file.");
    var r = helper({ op: "captions.load", path: p });
    if (!r.ok) return fail(r.error);
    lastLines = { lines: r.lines, offset: 0 };
    say(r.lines.length + " captions imported. Create text layers when ready.");
  };

  function applyTextStyle(td, st, k, rtl) {
    td.font = st.fontFamily;
    try {
      td.fontStyle = st.fontStyle;
    } catch (e) {}
    td.fontSize = st.fontSize * k;
    td.applyFill = true;
    td.fillColor = hexToUnit(st.fill, [1, 1, 1]);
    td.applyStroke = st.strokeWidth > 0;
    if (st.strokeWidth > 0) {
      td.strokeColor = hexToUnit(st.stroke, [0, 0, 0]);
      td.strokeWidth = st.strokeWidth * k;
      td.strokeOverFill = false;
    }
    try {
      td.justification = rtl ? ParagraphJustification.RIGHT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY;
    } catch (e) {
      td.justification = ParagraphJustification.CENTER_JUSTIFY;
    }
  }

  function placeCaption(layer, comp, st, k, rtl) {
    var w = comp.width, h = comp.height;
    var y;
    if (st.position.anchor === "top") y = h * st.position.margin + st.fontSize * k;
    else if (st.position.anchor === "middle") y = h / 2 + st.fontSize * k * 0.35;
    else y = h * (1 - st.position.margin);
    var x = rtl ? w * (1 - st.position.margin) : w / 2 + st.position.offsetX * w;
    layer.transform.position.setValue([x, y]);
  }

  function animateCaption(layer, st, k) {
    var a = st.animation;
    if (a.kind === "none" || a.duration <= 0) return;
    var head = easingSource(a.easing) + "var d=" + a.duration + ";var t=Math.min(1,Math.max(0,(time-inPoint)/d));var o=Math.min(1,Math.max(0,(outPoint-time)/d));";
    layer.transform.opacity.expression = head + "Math.min(100,100*E(t))*Math.min(1,o*1.0);";
    if (a.kind === "pop") layer.transform.scale.expression = head + "var s=100*(0.5+0.5*E(t));[s,s];";
    if (a.kind === "slideUp") layer.transform.position.expression = head + "var v=value.slice();v[1]+=(1-E(t))*" + 40 * k + ";v;";
  }

  function lineText(line) {
    var text = "";
    for (var w = 0; w < line.words.length; w++) text += (w ? " " : "") + line.words[w].text;
    return text;
  }

  function addCaptionText(comp, text, st, k, start, end, comment, rtl, name, centerFragment) {
    var td = new TextDocument(text);
    applyTextStyle(td, st, k, rtl);
    if (centerFragment) {
      try { td.justification = ParagraphJustification.CENTER_JUSTIFY; } catch (e) {}
    }
    var layer = comp.layers.addText(td);
    layer.name = name;
    layer.comment = comment;
    layer.inPoint = start;
    layer.outPoint = Math.max(end, start + 0.05);
    return layer;
  }

  function karaokeLook(st, mode) {
    var s = cloneStyle(st);
    s.uppercase = true;
    s.fontStyle = "Bold";
    s.animation = { kind: "none", duration: 0, easing: "outCubic" };
    if (mode === 1) {
      s.fill = "#FFE600";
      s.stroke = "#000000";
      s.strokeWidth = Math.max(8, st.strokeWidth);
      s.fontSize = 110;
      s.position = { anchor: "middle", margin: 0.12, offsetX: 0 };
    } else if (mode === 2) {
      s.fill = "#FFFFFF";
      s.stroke = "#000000";
      s.strokeWidth = Math.max(9, st.strokeWidth);
      s.fontSize = 120;
      s.position = { anchor: "middle", margin: 0.12, offsetX: 0 };
    } else {
      s.strokeWidth = Math.max(4, st.strokeWidth);
    }
    return s;
  }

  function cuePop(layer, mode, rtl) {
    var from = mode === 2 ? 35 : 72;
    var src = easingSource("outBack");
    layer.transform.scale.expression = src + "var d=0.13;var t=Math.min(1,Math.max(0,(time-inPoint)/d));var s=" + from + "+" + (100 - from) + "*E(t);[s,s];";
    if (mode === 1) {
      layer.transform.position.expression = src + "var d=0.16;var t=Math.min(1,Math.max(0,(time-inPoint)/d));var v=value.slice();v[1]+=(1-E(t))*" + (rtl ? 24 : 34) + ";v;";
    }
  }

  function buildKaraoke(comp, plan, st, k, offset, mode) {
    var look = karaokeLook(st, mode);
    var made = 0;
    for (var i = 0; i < plan.lines.length; i++) {
      var line = plan.lines[i];
      var rtl = isArabic(line.text || "");
      var lineStart = offset + line.start;
      var lineEnd = offset + Math.max(line.end, line.start + 0.05);
      if (plan.showLine) {
        var base = addCaptionText(comp, line.text, look, k, lineStart, lineEnd, "flow:caption:karaoke:line", rtl, "Karaoke line: " + String(line.text).substr(0, 22), false);
        base.transform.opacity.setValue(32);
        placeCaption(base, comp, look, k, rtl);
        made++;
      }
      for (var w = 0; w < line.words.length; w++) {
        var cue = line.words[w];
        var a = offset + cue.start;
        var b = Math.max(offset + cue.end, a + 0.05);
        var word = addCaptionText(comp, cue.text, look, k, a, b, mode === 1 ? "flow:caption:karaoke:hormozi" : mode === 2 ? "flow:caption:karaoke:wordpop" : "flow:caption:karaoke:word", rtl, "Karaoke: " + cue.text.substr(0, 22), true);
        if (mode === 3) {
          var wp = comp.width / 2 + (cue.xEm + cue.widthEm / 2) * look.fontSize * k;
          var wy = comp.height * (1 - look.position.margin);
          if (look.position.anchor === "top") wy = comp.height * look.position.margin + look.fontSize * k;
          if (look.position.anchor === "middle") wy = comp.height / 2 + look.fontSize * k * 0.35;
          word.transform.position.setValue([wp, wy]);
        } else {
          placeCaption(word, comp, look, k, rtl);
        }
        cuePop(word, mode, rtl);
        made++;
      }
    }
    return made;
  }

  capCreate.onClick = function () {
    var comp = activeComp();
    if (!comp) return fail("Open a composition first.");
    if (!lastLines) return fail("Generate or import captions first.");
    var st = readStyle();
    var k = comp.height / 1080;
    var offset = lastLines.offset;
    var mode = capKaraoke.selection ? capKaraoke.selection.index : 0;
    var allText = "";
    for (var t = 0; t < lastLines.lines.length; t++) allText += lineText(lastLines.lines[t]) + " ";
    var rtl = isArabic(allText);

    if (mode > 0) {
      var names = ["normal", "hormozi", "wordPop", "karaoke"];
      var plan = helper({ op: "karaoke.plan", lines: lastLines.lines, options: { preset: names[mode], fontSize: st.fontSize, uppercase: st.uppercase, rtl: rtl, tail: 0.06 } });
      if (plan && plan.ok && plan.lines) {
        app.beginUndoGroup("Flow Karaoke");
        var made = 0;
        try {
          made = buildKaraoke(comp, plan, st, k, offset, mode);
        } catch (e) {
          app.endUndoGroup();
          return fail("Karaoke: " + e);
        }
        app.endUndoGroup();
        say(made + " karaoke layers created (" + (mode === 1 ? "Hormozi" : mode === 2 ? "Word Pop" : "highlight") + "). Export ASS for a portable karaoke file.");
        return;
      }
      warn("Karaoke plan unavailable; creating whole-line captions instead. " + (plan && plan.error ? plan.error : ""));
    }

    app.beginUndoGroup("Flow Captions");
    var n = 0;
    for (var i = 0; i < lastLines.lines.length; i++) {
      var line = lastLines.lines[i];
      var text = lineText(line);
      if (st.uppercase) text = text.toUpperCase();
      var layer = addCaptionText(comp, text, st, k, offset + line.start, offset + Math.max(line.end, line.start + 0.05), "flow:caption", rtl, "Caption: " + text.substr(0, 28), false);
      placeCaption(layer, comp, st, k, rtl);
      animateCaption(layer, st, k);
      n++;
    }
    app.endUndoGroup();
    say("Created " + n + " caption layers. Change the style and press Restyle all to update them.");
  };

  capRestyle.onClick = function () {
    var comp = activeComp();
    if (!comp) return fail("Open a composition first.");
    var st = readStyle();
    var k = comp.height / 1080;
    app.beginUndoGroup("Flow Captions: restyle");
    var n = 0;
    for (var i = 1; i <= comp.numLayers; i++) {
      var layer = comp.layer(i);
      if (layer.comment && layer.comment.indexOf("flow:caption") !== 0) continue;
      if (layer.comment && layer.comment.indexOf("flow:caption:karaoke") === 0) continue;
      var srcProp = layer.property("Source Text");
      if (!srcProp) continue;
      var cur = srcProp.value;
      var text = st.uppercase ? String(cur.text).toUpperCase() : String(cur.text);
      var rtl = isArabic(text);
      var td = new TextDocument(text);
      applyTextStyle(td, st, k, rtl);
      srcProp.setValue(td);
      layer.transform.opacity.expression = "";
      layer.transform.scale.expression = "";
      layer.transform.position.expression = "";
      placeCaption(layer, comp, st, k, rtl);
      animateCaption(layer, st, k);
      n++;
    }
    app.endUndoGroup();
    say(n ? "Restyled " + n + " captions." : "No Flow caption layers in this composition.");
  };

  capExport.onClick = function () {
    if (!lastLines) return fail("Generate or import captions first.");
    var r = helper({ op: "captions.export", lines: lastLines.lines, format: "srt", name: "captions" });
    if (!r.ok) return fail(r.error);
    say("Saved " + r.path);
  };

  capExportAss.onClick = function () {
    if (!lastLines) return fail("Generate or import captions first.");
    var isKaraoke = capKaraoke.selection && capKaraoke.selection.index > 0;
    var fmt = isKaraoke ? "ass_karaoke" : "ass";
    var r = helper({ op: "captions.export", lines: lastLines.lines, format: fmt, name: "captions" });
    if (!r.ok) return fail(r.error);
    say("Saved ASS: " + r.path);
  };

  // ================================================================== Stroke tab

  var STROKE_ID = "org.effectcraft.example.stroke";
  strokeTab.orientation = "column";
  strokeTab.alignChildren = ["fill", "top"];
  var STROKE_PRESETS = [
    { name: "Outline", color: "#FFFFFF", thickness: 6, blur: 0, softness: 0 },
    { name: "Sticker", color: "#FFFFFF", thickness: 16, blur: 0, softness: 0 },
    { name: "Neon glow", color: "#35E0FF", thickness: 8, blur: 24, softness: 30 },
    { name: "Soft halo", color: "#FFFFFF", thickness: 12, blur: 30, softness: 60 },
    { name: "Subtitle outline", color: "#000000", thickness: 5, blur: 0, softness: 0 }
  ];
  var stkPreset = dropdown(strokeTab, "Preset", (function () { var n = []; for (var i = 0; i < STROKE_PRESETS.length; i++) n.push(STROKE_PRESETS[i].name); return n; })(), 0);
  var stkColor = field(strokeTab, "Stroke color", "#FFFFFF", 90);
  var stkThick = slider(strokeTab, "Thickness (px)", 6, 0, 200);
  var stkBlur = slider(strokeTab, "Blur", 0, 0, 100);
  var stkSoft = slider(strokeTab, "Softness", 0, 0, 100);
  var stkButtons = strokeTab.add("group");
  stkButtons.alignment = ["fill", "top"];
  var stkApply = addBtn(stkButtons, "Appliquer le contour", "Apply to selected layers", true);
  var stkIn = addBtn(stkButtons, "Animer l'apparition", "Animate in", false);
  var stkNote = strokeTab.add("statictext", undefined, "Nécessite le plug-in Stroke (" + STROKE_ID + ") dans votre dossier Plug-ins.", { multiline: true });
  stkNote.alignment = ["fill", "top"];
  stkNote.preferredSize = [-1, 34];

  stkPreset.onChange = function () {
    var p = STROKE_PRESETS[stkPreset.selection.index];
    stkColor.text = p.color;
    stkThick.set(p.thickness);
    stkBlur.set(p.blur);
    stkSoft.set(p.softness);
  };

  function findStrokeEffect(layer) {
    var fx = layer.property("ADBE Effect Parade");
    for (var i = fx.numProperties; i >= 1; i--) {
      var g = fx.property(i);
      if (g.name === "Stroke" || g.matchName === STROKE_ID) return g;
    }
    return null;
  }

  function setStroke(group) {
    var color = hexToUnit(stkColor.text, [1, 1, 1]);
    var names = ["Stroke Color", "Thickness", "Blur", "Softness"];
    var values = [[color[0], color[1], color[2], 1], stkThick.get(), stkBlur.get(), stkSoft.get()];
    for (var i = 0; i < names.length; i++) {
      var p = group.property(names[i]) || group.property(i + 1);
      if (p) p.setValue(values[i]);
    }
  }

  function applyStroke(animateIn) {
    var comp = activeComp();
    if (!comp || comp.selectedLayers.length === 0) return fail("Select one or more layers first.");
    app.beginUndoGroup("Flow Stroke");
    var n = 0;
    try {
      for (var i = 0; i < comp.selectedLayers.length; i++) {
        var layer = comp.selectedLayers[i];
        var g = findStrokeEffect(layer);
        if (!g) {
          app.run("effect.apply", { comp: layer.__comp, layers: [layer.__id], effect: STROKE_ID });
          g = findStrokeEffect(layer);
        }
        if (!g) throw new Error("The Stroke effect could not be added: is the plug-in installed?");
        setStroke(g);
        if (animateIn) {
          var t = g.property("Thickness") || g.property(2);
          var end = stkThick.get();
          t.setValueAtTime(layer.inPoint, 0);
          t.setValueAtTime(layer.inPoint + 0.4, end);
          t.expression = easingSource("outCubic") + "if(numKeys<2){value;}else{var a=key(1),b=key(2);var p=Math.min(1,Math.max(0,(time-a.time)/(b.time-a.time)));a.value+(b.value-a.value)*E(p);}";
        }
        n++;
      }
    } catch (e) {
      app.endUndoGroup();
      return fail(String(e.message || e));
    }
    app.endUndoGroup();
    say("Stroke applied to " + n + " layer" + (n === 1 ? "" : "s") + ".");
  }
  stkApply.onClick = function () { applyStroke(false); };
  stkIn.onClick = function () { applyStroke(true); };

  // ================================================================== Models tab

  modelsTab.orientation = "column";
  modelsTab.alignChildren = ["fill", "top"];
  var modPort = field(modelsTab, "Helper port", String(Math.round(num(setting("port", DEFAULT_PORT), DEFAULT_PORT))), 60);
  var modConnect = addBtn(modelsTab, "Connecter / Actualiser", "Connect / refresh", true);
  var modList = modelsTab.add("listbox", undefined, []);
  modList.alignment = ["fill", "fill"];
  modList.preferredSize = [-1, 100];
  var modButtons = modelsTab.add("group");
  modButtons.alignment = ["fill", "top"];
  var modInstall = addBtn(modButtons, "Installer", "Install", false);
  var modVerify = addBtn(modButtons, "Vérifier", "Verify", false);
  var modRemove = addBtn(modButtons, "Désinstaller", "Remove", false);
  var modWhisper = field(modelsTab, "whisper-cli path", "", 170);
  var modSave = addBtn(modelsTab, "Enregistrer le chemin whisper-cli", "Save whisper-cli path", false);
  var modInfo = modelsTab.add("statictext", undefined, "Models are free and open source (MIT). They are downloaded on demand and checked with SHA-256; nothing is bundled.", { multiline: true });
  modInfo.preferredSize = [-1, 50];
  var modelRows = [];

  function refreshModels() {
    save("port", Math.round(num(modPort.text, DEFAULT_PORT)));
    var r = helper({ op: "models.list" });
    if (!r.ok) return fail(r.error);
    modList.removeAll();
    modelRows = r.models;
    for (var i = 0; i < r.models.length; i++) {
      var m = r.models[i];
      modList.add("item", m.name + "  (" + m.sizeMb + " MB)  " + (m.installed ? "✔ installed" : "not installed"));
    }
    if (modList.items.length) modList.selection = 0;
    var c = helper({ op: "config.get" });
    if (c.ok && c.whisperCli) modWhisper.text = c.whisperCli;
    loadUserStyles();
    refreshStyleList(0);
    writeStyle(BUILTIN_STYLES[0]);
    say(c.ok && c.whisperCliError ? "Connected. " + c.whisperCliError : "Connected to the Flow helper.");
  }

  function selectedModel() {
    return modList.selection ? modelRows[modList.selection.index] : null;
  }

  modConnect.onClick = refreshModels;
  modInstall.onClick = function () {
    var m = selectedModel();
    if (!m) return fail("Pick a model.");
    startJob({ op: "models.install", id: m.id }, "Installing " + m.name, function (res) {
      say("Installed (" + res.check.verification + "). " + (res.check.note || ""));
      refreshModels();
    });
  };
  modVerify.onClick = function () {
    var m = selectedModel();
    if (!m) return fail("Pick a model.");
    var r = helper({ op: "models.verify", id: m.id });
    if (!r.ok) return fail(r.error);
    say(m.name + ": " + r.verification + " (" + r.sha256.substr(0, 12) + "…)");
  };
  modRemove.onClick = function () {
    var m = selectedModel();
    if (!m) return fail("Pick a model.");
    var r = helper({ op: "models.remove", id: m.id });
    if (!r.ok) return fail(r.error);
    refreshModels();
  };
  modSave.onClick = function () {
    var r = helper({ op: "config.set", whisperCli: modWhisper.text });
    if (!r.ok) return fail(r.error);
    say(r.whisperCli ? "whisper-cli found." : r.whisperCliError || "Saved.");
  };

  // Helper & Setup Tab
  helperTab.orientation = "column";
  helperTab.alignChildren = ["fill", "top"];
  var hlpTitle = helperTab.add("statictext", undefined, tr("helperTitle"));
  var hlpStatusText = helperTab.add("statictext", undefined, "État : Prêt à vérifier.", { multiline: true });
  hlpStatusText.preferredSize = [-1, 24];
  var hlpGuide = helperTab.add("statictext", undefined, tr("helperGuide"), { multiline: true });
  hlpGuide.preferredSize = [-1, 90];
  var hlpRow = helperTab.add("group");
  hlpRow.alignment = ["fill", "top"];
  var hlpCheckBtn = addBtn(hlpRow, "Tester la connexion / Réessayer", "Connect / refresh", true);
  var hlpWelcomeBtn = helperTab.add("button", undefined, "Revoir l'aide de démarrage");
  hlpWelcomeBtn.alignment = ["fill", "center"];
  hlpWelcomeBtn.onClick = function () { setWelcome(true); };
  hlpCheckBtn.onClick = function () {
    var r = helper({ op: "models.list" });
    if (r && r.ok) {
      hlpStatusText.text = "● Connecté avec succès au helper Flow Studio.";
      try {
        hlpStatusText.graphics.foregroundColor = hlpStatusText.graphics.newPen(hlpStatusText.graphics.PenType.SOLID_COLOR, [0.15, 0.75, 0.35, 1], 1);
      } catch (e) {}
      say("Helper connecté.");
    } else {
      hlpStatusText.text = "! Connexion impossible : " + (r ? r.error : "helper injoignable");
      try {
        hlpStatusText.graphics.foregroundColor = hlpStatusText.graphics.newPen(hlpStatusText.graphics.PenType.SOLID_COLOR, [0.95, 0.25, 0.25, 1], 1);
      } catch (e) {}
      fail("Helper non joignable.");
    }
  };

  // Preset pack: one JSON file for text animations, backgrounds, caption styles and panel settings.
  packTab.orientation = "column";
  packTab.alignChildren = ["fill", "top"];
  var packDesc = packTab.add("statictext", undefined, tr("packHint"), { multiline: true });
  packDesc.preferredSize = [-1, 48];
  var packBtns = packTab.add("group");
  packBtns.alignment = ["fill", "top"];
  var packExportBtn = addBtn(packBtns, "Exporter le pack complet", "Export pack", true);
  var packImportBtn = addBtn(packBtns, "Importer un pack", "Import pack", false);
  var packPathRow = packTab.add("group");
  packPathRow.alignment = ["fill", "top"];
  packPathRow.alignChildren = ["fill", "center"];
  var packPath = packPathRow.add("edittext", undefined, "");
  packPath.alignment = ["fill", "center"];
  packPath.minimumSize = [160, -1];
  var packLoadBtn = addBtn(packPathRow, "Charger ce fichier", "Load this file", false);
  packLoadBtn.minimumSize = [110, -1];
  var packBox = packTab.add("edittext", undefined, "", { multiline: true });
  packBox.alignment = ["fill", "fill"];
  packBox.preferredSize = [-1, 130];
  var packHelp = packTab.add("statictext", undefined, tr("packHelp"), { multiline: true });
  packHelp.alignment = ["fill", "top"];

  function flowPack() {
    var textP = [];
    var bgP = [];
    try { textP = JSON.parse(setting("textPresets", "[]")); } catch (e) {}
    try { bgP = JSON.parse(setting("bgPresets", "[]")); } catch (e) {}
    return {
      schema: 1,
      app: "Flow Studio",
      text: textP,
      backgrounds: bgP,
      captionStyles: userStyles,
      settings: {
        language: LANG,
        theme: THEME,
        port: Math.round(num(setting("port", DEFAULT_PORT), DEFAULT_PORT)),
        lastMainTab: Math.round(num(setting("lastMainTab", "0"), 0)),
        lastLibCategory: Math.round(num(setting("lastLibCat", "0"), 0))
      }
    };
  }

  function applyPack(p, summary) {
    if (!p || typeof p !== "object") return fail("Ce fichier n'est pas un pack Flow Studio.");
    if (p.text && p.text instanceof Array) {
      save("textPresets", JSON.stringify(p.text));
      loadUserText();
      refreshTextList();
    }
    if (p.backgrounds && p.backgrounds instanceof Array) {
      save("bgPresets", JSON.stringify(p.backgrounds));
      loadUserBg();
      refreshBgList();
    }
    var styles = p.captionStyles || p.styles || [];
    var saved = 0;
    for (var s = 0; s < styles.length; s++) {
      var r = helper({ op: "styles.save", style: styles[s] });
      if (r && r.ok) saved++;
    }
    if (saved) {
      loadUserStyles();
      refreshStyleList(0);
    }
    var st = p.settings || {};
    if (st && typeof st === "object") {
      if (LANGS.indexOf(st.language) >= 0) { LANG = st.language; langDrop.selection = LANGS.indexOf(LANG); save("language", LANG); }
      if (["auto", "dark", "light"].indexOf(st.theme) >= 0) { THEME = st.theme; themeDrop.selection = THEME === "dark" ? 1 : THEME === "light" ? 2 : 0; save("theme", THEME); }
      var port = Math.round(num(st.port, -1));
      if (port > 0 && port <= 65535) save("port", port);
      localizeUI(ui);
      redrawAll();
    }
    var n = summary || {};
    say("Pack importé : " + (n.text || 0) + " animation(s), " + (n.backgrounds || 0) + " fond(s), " + (n.captionStyles || saved || 0) + " style(s).");
  }

  packExportBtn.onClick = function () {
    var pData = flowPack();
    var res = helper({ op: "pack.save", pack: pData, name: "flow-studio-presets" });
    if (!res || !res.ok) {
      packBox.text = JSON.stringify(pData, null, 2);
      return warn("Le helper n'a pas pu écrire le fichier. Le JSON est affiché dans la zone : copiez-le.");
    }
    packBox.text = res.json || JSON.stringify(pData, null, 2);
    packPath.text = res.path || "";
    var s = res.summary || {};
    say("Pack exporté (" + (s.text || 0) + " animations, " + (s.backgrounds || 0) + " fonds, " + (s.captionStyles || 0) + " styles) : " + (res.path || ""));
  };

  function importPackText(raw) {
    var txt = String(raw).replace(/^\s+|\s+$/g, "");
    if (!txt) return fail("Collez le JSON du pack ou indiquez le chemin d'un fichier.");
    var res = txt.charAt(0) === "{" ? helper({ op: "pack.import", json: txt }) : helper({ op: "pack.load", path: txt });
    if (!res || !res.ok) return fail(res && res.error ? res.error : "Pack invalide.");
    if (res.json) packBox.text = res.json;
    if (res.path) packPath.text = res.path;
    applyPack(res.pack || res.data || {}, res.summary);
  }

  packImportBtn.onClick = function () {
    importPackText(packBox.text || packPath.text);
  };
  packLoadBtn.onClick = function () {
    importPackText(packPath.text);
  };

  // ================================================================== Text tab

  // A text animation is data: which unit it moves (letters, words or lines), the starting state
  // each unit animates away from, and the timing. Built-ins and your own presets share this shape,
  // so a built-in is just a starting point you can edit and save under your own name.
  var TEXT_BUILTIN = [
    { name: "Fade Up", unit: "chars", opacity: 0, position: [0, 40], easing: "outCubic", duration: 0.8, smooth: 100 },
    { name: "Pop In", unit: "chars", opacity: 0, scale: 0, easing: "outBack", duration: 0.7, smooth: 100 },
    { name: "Typewriter", unit: "chars", opacity: 0, easing: "linear", duration: 1.2, smooth: 0 },
    { name: "Blur Reveal", unit: "chars", opacity: 0, blur: 30, easing: "outQuad", duration: 1, smooth: 100 },
    { name: "Words Slide", unit: "words", opacity: 0, position: [-60, 0], easing: "outExpo", duration: 0.9, smooth: 100 },
    { name: "Drop Bounce", unit: "chars", opacity: 0, position: [0, -120], easing: "outBounce", duration: 1, smooth: 100 },
    { name: "Spin Words", unit: "words", opacity: 0, rotation: -90, scale: 40, easing: "outBack", duration: 0.9, smooth: 100 },
    { name: "Tracking In", unit: "lines", opacity: 0, tracking: 40, easing: "outCubic", duration: 1.2, smooth: 100 },
    { name: "Line Rise", unit: "lines", opacity: 0, position: [0, 70], easing: "outQuart", duration: 0.9, smooth: 100 },
    { name: "Random Fade", unit: "chars", opacity: 0, easing: "linear", duration: 1.2, smooth: 100, random: true }
  ];
  var TEXT_UNITS = ["chars", "words", "lines"];
  var TEXT_UNIT_NAMES = ["Letters", "Words", "Lines"];
  var BASED_ON = { chars: 1, words: 3, lines: 4 };
  var userText = [];

  function optNum(v, lo, hi) {
    if (v === null || v === undefined || v === "") return null;
    var n = typeof v === "number" ? v : num(v, NaN);
    return isFinite(n) ? clamp(n, lo, hi) : null;
  }

  // Anything that comes from settings or a pasted import is checked here, field by field.
  function cleanText(p) {
    if (!p || typeof p !== "object") return null;
    var name = String(p.name === undefined ? "" : p.name).replace(/[^\w \-.()؀-ۿÀ-ɏ]/g, "").substr(0, 40);
    if (!name) return null;
    var unit = TEXT_UNITS.indexOf(p.unit) >= 0 ? p.unit : "chars";
    var easing = easingById(String(p.easing)).id;
    var out = { name: name, unit: unit, easing: easing, duration: clamp(optNum(p.duration, 0.05, 20) || 0.8, 0.05, 20), smooth: clamp(optNum(p.smooth, 0, 100) === null ? 100 : optNum(p.smooth, 0, 100), 0, 100), random: p.random === true };
    var o = optNum(p.opacity, 0, 100), s = optNum(p.scale, 0, 1000), r = optNum(p.rotation, -3600, 3600), b = optNum(p.blur, 0, 500), t = optNum(p.tracking, -500, 500);
    if (o !== null) out.opacity = o;
    if (s !== null) out.scale = s;
    if (r !== null) out.rotation = r;
    if (b !== null) out.blur = b;
    if (t !== null) out.tracking = t;
    if (p.position && p.position.length === 2) {
      var px = optNum(p.position[0], -10000, 10000), py = optNum(p.position[1], -10000, 10000);
      if (px !== null && py !== null && (px !== 0 || py !== 0)) out.position = [px, py];
    }
    return out;
  }

  function loadUserText() {
    userText = [];
    try {
      var arr = JSON.parse(setting("textPresets", "[]"));
      for (var i = 0; i < arr.length; i++) {
        var c = cleanText(arr[i]);
        if (c) userText.push(c);
      }
    } catch (e) {}
  }

  function saveUserText() {
    save("textPresets", JSON.stringify(userText));
  }

  function allText() {
    var out = [];
    for (var i = 0; i < TEXT_BUILTIN.length; i++) out.push(TEXT_BUILTIN[i]);
    for (var j = 0; j < userText.length; j++) out.push(userText[j]);
    return out;
  }

  function putIn(list, item) {
    for (var i = 0; i < list.length; i++) {
      if (list[i].name === item.name) {
        list[i] = item;
        return;
      }
    }
    list.push(item);
  }

  textTab.orientation = "column";
  textTab.alignChildren = ["fill", "top"];
  var txList = textTab.add("dropdownlist", undefined, ["-"]);
  txList.minimumSize = [160, -1];
  var txUnit = dropdown(textTab, "Animate", TEXT_UNIT_NAMES, 0);
  var txEase = dropdown(textTab, "Easing", easingNames(), 0);
  var txDur = field(textTab, "Duration (s)", "0.8", 60);
  var txDelay = field(textTab, "Delay (s)", "0", 60);
  var txSmooth = slider(textTab, "Softness", 100, 0, 100);
  var txRandom = textTab.add("checkbox", undefined, "Random order");
  var txFromBox = textTab.add("panel", undefined, "Start state (empty = not animated)");
  txFromBox.orientation = "column";
  txFromBox.alignChildren = ["left", "top"];
  var txOpacity = field(txFromBox, "Opacity %", "0", 60);
  var txPosX = field(txFromBox, "Offset X px", "", 60);
  var txPosY = field(txFromBox, "Offset Y px", "", 60);
  var txScale = field(txFromBox, "Scale %", "", 60);
  var txRot = field(txFromBox, "Rotation °", "", 60);
  var txBlur = field(txFromBox, "Blur px", "", 60);
  var txTrack = field(txFromBox, "Tracking", "", 60);
  var txButtons = textTab.add("group");
  txButtons.alignment = ["fill", "top"];
  var txApply = addBtn(txButtons, "Appliquer au texte sélectionné", "Apply to selected text", true);
  var txRemove = addBtn(txButtons, "Supprimer l'animation Flow", "Remove Flow animation", false);
  var txHintText = textTab.add("statictext", undefined, tr("textHint"), { multiline: true });
  txHintText.alignment = ["fill", "top"];
  var txName = field(textTab, "My preset name", "", 150);
  var txSaveRow = textTab.add("group");
  txSaveRow.alignment = ["fill", "top"];
  var txSave = addBtn(txSaveRow, "Enregistrer dans mes presets", "Save as my preset", false);
  var txDelete = addBtn(txSaveRow, "Supprimer mon preset", "Delete my preset", false);
  var txIoRow = textTab.add("group");
  txIoRow.alignment = ["fill", "top"];
  var txExport = addBtn(txIoRow, "Exporter mes presets", "Export my presets", false);
  var txImport = addBtn(txIoRow, "Importer", "Import", false);
  var txIo = textTab.add("edittext", undefined, "", { multiline: true });
  txIo.alignment = ["fill", "top"];
  txIo.preferredSize = [-1, 50];

  function indexOfEasing(id) {
    for (var i = 0; i < EASINGS.length; i++) if (EASINGS[i].id === id) return i;
    return 0;
  }

  function refreshTextList(selectName) {
    var all = allText();
    txList.removeAll();
    txList._flowBaseItems = null;
    var pick = 0;
    for (var i = 0; i < all.length; i++) {
      txList.add("item", (i >= TEXT_BUILTIN.length ? "★ " : "") + all[i].name);
      if (all[i].name === selectName) pick = i;
    }
    txList.selection = pick;
    showText(all[pick]);
  }

  function showText(p) {
    if (!p) return;
    txUnit.selection = Math.max(0, TEXT_UNITS.indexOf(p.unit));
    txEase.selection = indexOfEasing(p.easing);
    txDur.text = String(p.duration);
    txSmooth.set(p.smooth);
    txRandom.value = p.random === true;
    txOpacity.text = p.opacity === undefined ? "" : String(p.opacity);
    txPosX.text = p.position ? String(p.position[0]) : "";
    txPosY.text = p.position ? String(p.position[1]) : "";
    txScale.text = p.scale === undefined ? "" : String(p.scale);
    txRot.text = p.rotation === undefined ? "" : String(p.rotation);
    txBlur.text = p.blur === undefined ? "" : String(p.blur);
    txTrack.text = p.tracking === undefined ? "" : String(p.tracking);
    txName.text = p.name;
  }

  function readText(name) {
    var px = optNum(txPosX.text, -10000, 10000), py = optNum(txPosY.text, -10000, 10000);
    return cleanText({
      name: name || txName.text || "Custom",
      unit: TEXT_UNITS[txUnit.selection.index],
      easing: EASINGS[txEase.selection.index].id,
      duration: num(txDur.text, 0.8),
      smooth: txSmooth.get(),
      random: txRandom.value === true,
      opacity: txOpacity.text,
      position: px === null && py === null ? null : [px || 0, py || 0],
      scale: txScale.text,
      rotation: txRot.text,
      blur: txBlur.text,
      tracking: txTrack.text
    });
  }

  txList.onChange = function () {
    if (txList.selection) showText(allText()[txList.selection.index]);
  };

  function textLayers() {
    var comp = activeComp();
    var out = [];
    if (!comp) return out;
    for (var i = 0; i < comp.selectedLayers.length; i++) {
      var l = comp.selectedLayers[i];
      if (l.property("ADBE Text Properties")) out.push(l);
    }
    return out;
  }

  function clearFlowAnimators(layer) {
    var anims = layer.property("ADBE Text Properties").property("ADBE Text Animators");
    for (var i = anims.numProperties; i >= 1; i--) {
      if (String(anims.property(i).name).indexOf("Flow: ") === 0) anims.property(i).remove();
    }
  }

  // Each unit starts in the "from" state and settles to normal as the selector's Start runs 0 -> 100.
  function addTextAnimation(layer, p, delay) {
    var anims = layer.property("ADBE Text Properties").property("ADBE Text Animators");
    var a = anims.addProperty("ADBE Text Animator");
    a.name = "Flow: " + p.name;
    var props = a.property("ADBE Text Animator Properties");
    function add(match, value) {
      var q = props.addProperty(match);
      q.setValue(value);
    }
    if (p.opacity !== undefined) add("ADBE Text Opacity", p.opacity);
    if (p.position) add("ADBE Text Position 3D", [p.position[0], p.position[1], 0]);
    if (p.scale !== undefined) add("ADBE Text Scale 3D", [p.scale, p.scale, p.scale]);
    if (p.rotation !== undefined) add("ADBE Text Rotation", p.rotation);
    if (p.blur !== undefined) add("ADBE Text Blur", [p.blur, p.blur]);
    if (p.tracking !== undefined) add("ADBE Text Tracking Amount", p.tracking);
    var sel = a.property("ADBE Text Selectors").addProperty("ADBE Text Selector");
    sel.property("ADBE Text Percent Start").expression =
      easingSource(p.easing) + "var d=" + p.duration + ";var t=Math.min(1,Math.max(0,(time-inPoint-" + delay + ")/Math.max(0.0001,d)));100*E(t);";
    sel.property("ADBE Text Percent End").setValue(100);
    var adv = sel.property("advanced");
    adv.property("basedOn").setValue(BASED_ON[p.unit]);
    adv.property("easeHigh").setValue(0);
    adv.property("easeLow").setValue(0);
    adv.property("smoothness").setValue(p.smooth);
    adv.property("randomize").setValue(p.random ? 1 : 0);
    return a;
  }

  txApply.onClick = function () {
    var layers = textLayers();
    if (!layers.length) return fail("Select one or more text layers first.");
    var p = readText(txList.selection ? allText()[txList.selection.index].name : "Custom");
    if (!p) return fail("The animation is not valid.");
    var delay = Math.max(0, num(txDelay.text, 0));
    app.beginUndoGroup("Flow Text: " + p.name);
    try {
      for (var i = 0; i < layers.length; i++) {
        clearFlowAnimators(layers[i]);
        addTextAnimation(layers[i], p, delay);
      }
    } catch (e) {
      app.endUndoGroup();
      return fail("Could not animate the text: " + e);
    }
    app.endUndoGroup();
    say("Applied " + p.name + " to " + layers.length + " text layer" + (layers.length === 1 ? "" : "s") + ".");
  };

  txRemove.onClick = function () {
    var layers = textLayers();
    if (!layers.length) return fail("Select one or more text layers first.");
    app.beginUndoGroup("Flow Text: remove");
    for (var i = 0; i < layers.length; i++) clearFlowAnimators(layers[i]);
    app.endUndoGroup();
    say("Removed Flow animations.");
  };

  txSave.onClick = function () {
    var name = String(txName.text).replace(/^\s+|\s+$/g, "");
    if (!name) return fail("Type a name for your preset.");
    for (var i = 0; i < TEXT_BUILTIN.length; i++) if (TEXT_BUILTIN[i].name === name) return fail("That name belongs to a built-in preset. Pick another.");
    var p = readText(name);
    if (!p) return fail("The animation is not valid.");
    putIn(userText, p);
    saveUserText();
    refreshTextList(p.name);
    say("Saved your text animation \"" + p.name + "\".");
  };

  txDelete.onClick = function () {
    var i = txList.selection ? txList.selection.index - TEXT_BUILTIN.length : -1;
    if (i < 0 || i >= userText.length) return fail("Pick one of your own presets (★) to delete.");
    var gone = userText[i].name;
    userText.splice(i, 1);
    saveUserText();
    refreshTextList();
    say("Deleted \"" + gone + "\".");
  };

  txExport.onClick = function () {
    txIo.text = JSON.stringify(userText);
    say(userText.length + " preset" + (userText.length === 1 ? "" : "s") + " in the box. Copy it to share or back up.");
  };

  txImport.onClick = function () {
    var data;
    try {
      data = JSON.parse(txIo.text);
    } catch (e) {
      return fail("The box does not hold valid JSON.");
    }
    if (!(data instanceof Array)) data = [data];
    var n = 0;
    for (var i = 0; i < data.length && i < 200; i++) {
      var c = cleanText(data[i]);
      var builtin = false;
      for (var b = 0; c && b < TEXT_BUILTIN.length; b++) if (TEXT_BUILTIN[b].name === c.name) builtin = true;
      if (c && !builtin) {
        putIn(userText, c);
        n++;
      }
    }
    saveUserText();
    refreshTextList();
    say("Imported " + n + " text animation" + (n === 1 ? "" : "s") + ".");
  };

  loadUserText();
  refreshTextList();

  // ================================================================== Background tab

  var BG_BUILTIN = [
    { name: "Sunset", kind: "linear", colors: ["#FF512F", "#DD2476", "#6A11CB", "#2575FC"], angle: 45, anim: "none", speed: 30 },
    { name: "Ocean", kind: "linear", colors: ["#0F2027", "#2C5364", "#00C6FF", "#0072FF"], angle: 90, anim: "rotate", speed: 20 },
    { name: "Aurora", kind: "four", colors: ["#00F5A0", "#00D9F5", "#7F00FF", "#E100FF"], angle: 0, anim: "drift", speed: 40 },
    { name: "Neon Night", kind: "four", colors: ["#0B0B2B", "#FF00C8", "#00E5FF", "#1A0033"], angle: 0, anim: "drift", speed: 50 },
    { name: "Spotlight", kind: "radial", colors: ["#FFFFFF", "#101018", "#101018", "#101018"], angle: 0, anim: "pulse", speed: 60 },
    { name: "Mint Fresh", kind: "linear", colors: ["#A8FF78", "#78FFD6", "#78FFD6", "#78FFD6"], angle: 135, anim: "none", speed: 30 },
    { name: "Candy", kind: "four", colors: ["#FFB6B9", "#FAE3D9", "#BBDED6", "#8AC6D1"], angle: 0, anim: "drift", speed: 30 },
    { name: "Gold", kind: "linear", colors: ["#F7971E", "#FFD200", "#FFD200", "#FFD200"], angle: 0, anim: "none", speed: 30 },
    { name: "Midnight", kind: "radial", colors: ["#2B3A67", "#0A0A14", "#0A0A14", "#0A0A14"], angle: 0, anim: "pulse", speed: 30 },
    { name: "Fire", kind: "linear", colors: ["#F12711", "#F5AF19", "#F5AF19", "#F5AF19"], angle: 90, anim: "rotate", speed: 15 }
  ];
  var BG_KINDS = ["linear", "radial", "four"];
  var BG_KIND_NAMES = ["Linear", "Radial", "4 colors"];
  var BG_ANIMS = ["none", "rotate", "pulse", "drift"];
  var BG_ANIM_NAMES = ["Still", "Rotate (linear)", "Pulse (radial)", "Drift (4 colors / any)"];
  var userBg = [];

  function cleanBg(p) {
    if (!p || typeof p !== "object") return null;
    var name = String(p.name === undefined ? "" : p.name).replace(/[^\w \-.()؀-ۿÀ-ɏ]/g, "").substr(0, 40);
    if (!name || !(p.colors instanceof Array)) return null;
    var colors = [];
    for (var i = 0; i < 4; i++) {
      var c = p.colors[i === 0 || p.colors[i] === undefined ? i : i];
      if (c === undefined) c = colors.length ? colors[colors.length - 1] : "#000000";
      if (!validHex(c)) return null;
      var h = String(c).replace(/\s/g, "");
      colors.push("#" + h.replace("#", "").substr(0, 6).toUpperCase());
    }
    return {
      name: name,
      kind: BG_KINDS.indexOf(p.kind) >= 0 ? p.kind : "linear",
      colors: colors,
      angle: clamp(optNum(p.angle, -3600, 3600) || 0, -3600, 3600),
      anim: BG_ANIMS.indexOf(p.anim) >= 0 ? p.anim : "none",
      speed: clamp(optNum(p.speed, 0, 360) === null ? 30 : optNum(p.speed, 0, 360), 0, 360)
    };
  }

  function loadUserBg() {
    userBg = [];
    try {
      var arr = JSON.parse(setting("bgPresets", "[]"));
      for (var i = 0; i < arr.length; i++) {
        var c = cleanBg(arr[i]);
        if (c) userBg.push(c);
      }
    } catch (e) {}
  }

  function saveUserBg() {
    save("bgPresets", JSON.stringify(userBg));
  }

  function allBg() {
    var out = [];
    for (var i = 0; i < BG_BUILTIN.length; i++) out.push(BG_BUILTIN[i]);
    for (var j = 0; j < userBg.length; j++) out.push(userBg[j]);
    return out;
  }

  bgTab.orientation = "column";
  bgTab.alignChildren = ["fill", "top"];
  var bgList = bgTab.add("dropdownlist", undefined, ["-"]);
  bgList.minimumSize = [160, -1];
  var bgKind = dropdown(bgTab, "Type", BG_KIND_NAMES, 0);
  var bgC1 = field(bgTab, "Color 1", "#FF512F", 90);
  var bgC2 = field(bgTab, "Color 2", "#DD2476", 90);
  var bgC3 = field(bgTab, "Color 3 (4 colors)", "#6A11CB", 90);
  var bgC4 = field(bgTab, "Color 4 (4 colors)", "#2575FC", 90);
  var bgAngle = slider(bgTab, "Angle (linear)", 45, -360, 360);
  var bgAnim = dropdown(bgTab, "Motion", BG_ANIM_NAMES, 0);
  var bgSpeed = slider(bgTab, "Speed", 30, 0, 360);
  var bgButtons = bgTab.add("group");
  bgButtons.alignment = ["fill", "top"];
  var bgApply = addBtn(bgButtons, "Ajouter le fond dégradé", "Add background", true);
  var bgUpdate = addBtn(bgButtons, "Mettre à jour la sélection", "Update selected", false);
  var bgHintText = bgTab.add("statictext", undefined, tr("bgHint"), { multiline: true });
  bgHintText.alignment = ["fill", "top"];
  var bgName = field(bgTab, "My preset name", "", 150);
  var bgSaveRow = bgTab.add("group");
  bgSaveRow.alignment = ["fill", "top"];
  var bgSave = addBtn(bgSaveRow, "Enregistrer dans mes presets", "Save as my preset", false);
  var bgDelete = addBtn(bgSaveRow, "Supprimer mon preset", "Delete my preset", false);
  var bgIoRow = bgTab.add("group");
  bgIoRow.alignment = ["fill", "top"];
  var bgExport = addBtn(bgIoRow, "Exporter mes presets", "Export my presets", false);
  var bgImport = addBtn(bgIoRow, "Importer", "Import", false);
  var bgIo = bgTab.add("edittext", undefined, "", { multiline: true });
  bgIo.alignment = ["fill", "top"];
  bgIo.preferredSize = [-1, 50];

  function refreshBgList(selectName) {
    var all = allBg();
    bgList.removeAll();
    bgList._flowBaseItems = null;
    var pick = 0;
    for (var i = 0; i < all.length; i++) {
      bgList.add("item", (i >= BG_BUILTIN.length ? "★ " : "") + all[i].name);
      if (all[i].name === selectName) pick = i;
    }
    bgList.selection = pick;
    showBg(all[pick]);
  }

  function showBg(p) {
    if (!p) return;
    bgKind.selection = Math.max(0, BG_KINDS.indexOf(p.kind));
    bgC1.text = p.colors[0];
    bgC2.text = p.colors[1];
    bgC3.text = p.colors[2];
    bgC4.text = p.colors[3];
    bgAngle.set(p.angle);
    bgAnim.selection = Math.max(0, BG_ANIMS.indexOf(p.anim));
    bgSpeed.set(p.speed);
    bgName.text = p.name;
  }

  function readBg(name) {
    return cleanBg({
      name: name || bgName.text || "Custom",
      kind: BG_KINDS[bgKind.selection.index],
      colors: [bgC1.text, bgC2.text, bgC3.text, bgC4.text],
      angle: bgAngle.get(),
      anim: BG_ANIMS[bgAnim.selection.index],
      speed: bgSpeed.get()
    });
  }

  bgList.onChange = function () {
    if (bgList.selection) showBg(allBg()[bgList.selection.index]);
  };

  function rgba(hex) {
    var c = hexToUnit(hex, [0, 0, 0]);
    return [c[0], c[1], c[2], 1];
  }

  // Sets the gradient effect on `layer` (a comp-sized solid) and its motion expressions.
  function paintGradient(layer, p, w, h) {
    var fx = layer.property("ADBE Effect Parade");
    while (fx.numProperties > 0) fx.property(1).remove();
    var cx = w / 2, cy = h / 2;
    var sp = p.speed * Math.PI / 180;
    var rad = p.angle * Math.PI / 180;
    var amp = 0.08 * Math.min(w, h);
    if (p.kind === "four") {
      var g = fx.addProperty("ADBE 4ColorGradient");
      g.name = "Flow Gradient";
      var grp = g.property(1);
      var pts = [[0.12 * w, 0.12 * h], [0.88 * w, 0.12 * h], [0.12 * w, 0.88 * h], [0.88 * w, 0.88 * h]];
      for (var i = 0; i < 4; i++) {
        grp.property(2 * i + 1).setValue(pts[i]);
        grp.property(2 * i + 2).setValue(rgba(p.colors[i]));
        if (p.anim !== "none" && p.speed > 0) {
          grp.property(2 * i + 1).expression = "var s=" + sp + ";var a=" + amp + ";[value[0]+a*Math.sin(time*s+" + i * 1.7 + "),value[1]+a*Math.cos(time*s*0.8+" + i * 2.3 + ")];";
        }
      }
      return;
    }
    var r = fx.addProperty("ADBE Ramp");
    r.name = "Flow Gradient";
    var radial = p.kind === "radial";
    r.property("Start Color").setValue(rgba(p.colors[0]));
    r.property("End Color").setValue(rgba(p.colors[1]));
    r.property("Ramp Shape").setValue(radial ? 2 : 1);
    var reach = 0.5 * Math.sqrt(w * w + h * h);
    var half = (Math.abs(w * Math.cos(rad)) + Math.abs(h * Math.sin(rad))) / 2;
    if (radial) {
      r.property("Start of Ramp").setValue([cx, cy]);
      r.property("End of Ramp").setValue([cx + reach, cy]);
    } else {
      r.property("Start of Ramp").setValue([cx - half * Math.cos(rad), cy - half * Math.sin(rad)]);
      r.property("End of Ramp").setValue([cx + half * Math.cos(rad), cy + half * Math.sin(rad)]);
    }
    if (p.anim === "none" || p.speed <= 0) return;
    var startP = r.property("Start of Ramp"), endP = r.property("End of Ramp");
    if (p.anim === "rotate" && !radial) {
      var common = "var a=" + rad + "+time*" + sp + ";var hf=(Math.abs(" + w + "*Math.cos(a))+Math.abs(" + h + "*Math.sin(a)))/2;";
      startP.expression = common + "[" + cx + "-hf*Math.cos(a)," + cy + "-hf*Math.sin(a)];";
      endP.expression = common + "[" + cx + "+hf*Math.cos(a)," + cy + "+hf*Math.sin(a)];";
    } else if (p.anim === "pulse" && radial) {
      endP.expression = "var k=1+0.25*Math.sin(time*" + sp + ");[" + cx + "+" + reach + "*k," + cy + "];";
    } else {
      var drift = "var s=" + sp + ";var a=" + amp + ";[value[0]+a*Math.sin(time*s),value[1]+a*Math.cos(time*s*0.8)];";
      startP.expression = drift;
      endP.expression = drift;
    }
  }

  function isFlowBg(layer) {
    return layer && layer.comment === "flow:bg";
  }

  bgApply.onClick = function () {
    var comp = activeComp();
    if (!comp) return fail("Open a composition first.");
    var p = readBg(bgList.selection ? allBg()[bgList.selection.index].name : "Custom");
    if (!p) return fail("A colour is not valid. Use hex like #FF8800.");
    app.beginUndoGroup("Flow Background: " + p.name);
    var layer = comp.layers.addSolid([0, 0, 0], "Flow BG: " + p.name, comp.width, comp.height, comp.pixelAspect, comp.duration);
    layer.comment = "flow:bg";
    layer.moveToEnd();
    paintGradient(layer, p, comp.width, comp.height);
    app.endUndoGroup();
    say("Added the \"" + p.name + "\" background at the bottom of the layer stack.");
  };

  bgUpdate.onClick = function () {
    var comp = activeComp();
    if (!comp) return fail("Open a composition first.");
    var n = 0;
    var p = readBg(bgList.selection ? allBg()[bgList.selection.index].name : "Custom");
    if (!p) return fail("A colour is not valid. Use hex like #FF8800.");
    app.beginUndoGroup("Flow Background: update");
    for (var i = 0; i < comp.selectedLayers.length; i++) {
      var l = comp.selectedLayers[i];
      if (!isFlowBg(l)) continue;
      paintGradient(l, p, comp.width, comp.height);
      l.name = "Flow BG: " + p.name;
      n++;
    }
    app.endUndoGroup();
    if (!n) return fail("Select a layer made by Add background first.");
    say("Updated " + n + " background" + (n === 1 ? "" : "s") + ".");
  };

  bgSave.onClick = function () {
    var name = String(bgName.text).replace(/^\s+|\s+$/g, "");
    if (!name) return fail("Type a name for your preset.");
    for (var i = 0; i < BG_BUILTIN.length; i++) if (BG_BUILTIN[i].name === name) return fail("That name belongs to a built-in preset. Pick another.");
    var p = readBg(name);
    if (!p) return fail("A colour is not valid. Use hex like #FF8800.");
    putIn(userBg, p);
    saveUserBg();
    refreshBgList(p.name);
    say("Saved your gradient \"" + p.name + "\".");
  };

  bgDelete.onClick = function () {
    var i = bgList.selection ? bgList.selection.index - BG_BUILTIN.length : -1;
    if (i < 0 || i >= userBg.length) return fail("Pick one of your own presets (★) to delete.");
    var gone = userBg[i].name;
    userBg.splice(i, 1);
    saveUserBg();
    refreshBgList();
    say("Deleted \"" + gone + "\".");
  };

  bgExport.onClick = function () {
    bgIo.text = JSON.stringify(userBg);
    say(userBg.length + " gradient" + (userBg.length === 1 ? "" : "s") + " in the box. Copy it to share or back up.");
  };

  bgImport.onClick = function () {
    var data;
    try {
      data = JSON.parse(bgIo.text);
    } catch (e) {
      return fail("The box does not hold valid JSON.");
    }
    if (!(data instanceof Array)) data = [data];
    var n = 0;
    for (var i = 0; i < data.length && i < 200; i++) {
      var c = cleanBg(data[i]);
      var builtin = false;
      for (var b = 0; c && b < BG_BUILTIN.length; b++) if (BG_BUILTIN[b].name === c.name) builtin = true;
      if (c && !builtin) {
        putIn(userBg, c);
        n++;
      }
    }
    saveUserBg();
    refreshBgList();
    say("Imported " + n + " gradient" + (n === 1 ? "" : "s") + ".");
  };

  loadUserBg();
  refreshBgList();

  // ================================================================== Effects tab

  // Every effect is built from EffectCraft's own effects, named "Flow: ...", and driven by an
  // expression over a time window, so nothing is baked: change Strength and apply again, or remove them.
  var FX_TIMES = ["Layer start", "Playhead", "Layer end"];
  var fxCache = {};

  function fxWindow(t0, d, easingId) {
    return easingSource(easingId) + "var t0=" + t0 + ";var d=" + d + ";var p=Math.min(1,Math.max(0,(time-t0)/d));var on=(time>=t0&&time<=t0+d);";
  }

  function fxAdd(layer, match, label) {
    var fx = layer.property("ADBE Effect Parade").addProperty(match);
    fx.name = "Flow: " + label;
    return fx;
  }

  var FX = [
    { name: "Shake", when: 1, make: function (l, k, t0, d, e) {
      var f = fxAdd(l, "ADBE Geometry2", "Shake");
      f.property("Position").expression = fxWindow(t0, d, e) + "var a=on?(1-p):0;var w=wiggle(14,100);[value[0]+(w[0]-value[0])*a*" + k + ",value[1]+(w[1]-value[1])*a*" + k + "];";
    } },
    { name: "Zoom Punch", when: 1, make: function (l, k, t0, d, e) {
      var f = fxAdd(l, "ADBE Geometry2", "Zoom Punch");
      f.property("Scale Height").expression = fxWindow(t0, d, e) + "100+(on?60*" + k + "*(1-E(p)):0);";
    } },
    { name: "Flash", when: 1, make: function (l, k, t0, d, e) {
      var f = fxAdd(l, "ADBE Exposure2", "Flash");
      f.property("Master").property("Exposure").expression = fxWindow(t0, d, e) + "on?4*" + k + "*(1-E(p)):0;";
    } },
    { name: "Strobe", when: 1, make: function (l, k, t0, d, e) {
      var f = fxAdd(l, "ADBE Exposure2", "Strobe");
      f.property("Master").property("Exposure").expression = fxWindow(t0, d, e) + "(on&&Math.floor((time-t0)*14)%2===0)?2.5*" + k + ":0;";
    } },
    { name: "Glow Pop", when: 1, make: function (l, k, t0, d, e) {
      var f = fxAdd(l, "ADBE Glo2", "Glow Pop");
      f.property("Glow Radius").setValue(60);
      f.property("Glow Intensity").expression = fxWindow(t0, d, e) + "0.3+(on?3*" + k + "*(1-E(p)):0);";
    } },
    { name: "Blur In", when: 0, make: function (l, k, t0, d, e) {
      var f = fxAdd(l, "ADBE Gaussian Blur 2", "Blur In");
      f.property("Blurriness").expression = fxWindow(t0, d, e) + "80*" + k + "*(1-E(p));";
    } },
    { name: "Blur Out", when: 2, make: function (l, k, t0, d, e) {
      var f = fxAdd(l, "ADBE Gaussian Blur 2", "Blur Out");
      f.property("Blurriness").expression = fxWindow(t0, d, e) + "80*" + k + "*E(p);";
    } },
    { name: "Fade In", when: 0, make: function (l, k, t0, d, e) {
      var f = fxAdd(l, "ADBE Geometry2", "Fade In");
      f.property("Opacity").expression = fxWindow(t0, d, e) + "100*E(p);";
    } },
    { name: "Fade Out", when: 2, make: function (l, k, t0, d, e) {
      var f = fxAdd(l, "ADBE Geometry2", "Fade Out");
      f.property("Opacity").expression = fxWindow(t0, d, e) + "100*(1-E(p));";
    } },
    { name: "Pixel Reveal", when: 0, make: function (l, k, t0, d, e) {
      var f = fxAdd(l, "ADBE Mosaic", "Pixel Reveal");
      var code = fxWindow(t0, d, e) + "p>=1?4000:Math.max(2,Math.round(8*Math.pow(300/8,E(p))));";
      f.property("Horizontal Blocks").expression = code;
      f.property("Vertical Blocks").expression = code;
    } },
    { name: "Glitch", when: 1, make: function (l, k, t0, d, e) {
      var f = fxAdd(l, "ADBE Offset", "Glitch");
      f.property("Shift Center To").expression = fxWindow(t0, d, e) +
        "var s=Math.floor(time*16);var r=Math.abs(Math.sin(s*12.9898)*43758.5453)%1;var r2=Math.abs(Math.sin(s*78.233)*12345.678)%1;" +
        "(on&&r>0.4)?[value[0]+(r2-0.5)*500*" + k + ",value[1]+(r-0.7)*60*" + k + "]:value;";
    } },
    { name: "Old Film", when: 0, make: function (l, k) {
      var t = fxAdd(l, "ADBE Tint", "Old Film tint");
      t.property("Map Black To").setValue([0.17, 0.1, 0.05, 1]);
      t.property("Map White To").setValue([0.96, 0.89, 0.76, 1]);
      t.property("Amount to Tint").setValue(100 * k);
      fxAdd(l, "ADBE Noise", "Old Film grain").property("Amount of Noise").setValue(14 * k);
    } },
    { name: "Teal & Orange", when: 0, make: function (l, k) {
      var f = fxAdd(l, "ADBE Tritone", "Teal & Orange");
      f.property("Highlights").setValue([1, 0.69, 0.44, 1]);
      f.property("Midtones").setValue([0.5, 0.5, 0.5, 1]);
      f.property("Shadows").setValue([0.06, 0.3, 0.36, 1]);
      f.property("Blend With Original").setValue(100 * (1 - k));
    } },
    { name: "Heat Wave", when: 0, make: function (l, k) {
      var f = fxAdd(l, "ADBE Wave Warp", "Heat Wave");
      f.property("Wave Height").setValue(30 * k);
      f.property("Wave Width").setValue(90);
      f.property("Wave Speed").setValue(1.2);
    } },
    { name: "Echo Trail", when: 0, make: function (l, k) {
      var f = fxAdd(l, "ADBE Echo", "Echo Trail");
      f.property("Echo Time (seconds)").setValue(-0.05);
      f.property("Number Of Echoes").setValue(Math.max(2, Math.round(8 * k)));
      f.property("Starting Intensity").setValue(0.8);
      f.property("Decay").setValue(0.6);
    } },
    { name: "Vibrance Pop", when: 0, make: function (l, k) {
      fxAdd(l, "ADBE Vibrance", "Vibrance Pop").property("Vibrance").setValue(80 * k);
    } }
  ];

  var fxNames = [];
  for (var fi = 0; fi < FX.length; fi++) fxNames.push(FX[fi].name);
  effectsTab.orientation = "column";
  effectsTab.alignChildren = ["fill", "top"];
  var fxPick = dropdown(effectsTab, "Effect", fxNames, 0);
  var fxStrength = slider(effectsTab, "Strength", 60, 0, 100);
  var fxDur = field(effectsTab, "Duration (s)", "0.5", 60);
  var fxWhen = dropdown(effectsTab, "Starts at", FX_TIMES, 1);
  var fxEase = dropdown(effectsTab, "Easing", easingNames(), indexOfEasing("outCubic"));
  var fxButtons = effectsTab.add("group");
  fxButtons.alignment = ["fill", "top"];
  var fxApply = addBtn(fxButtons, "Appliquer l'effet", "Apply effect", true);
  var fxRemove = addBtn(fxButtons, "Supprimer les effets Flow", "Remove Flow effects", false);
  var fxNote = effectsTab.add("statictext", undefined, "Effects are named \"Flow: …\" and driven by expressions over the time window, so you can tweak them in the timeline.", { multiline: true });
  fxNote.alignment = ["fill", "top"];
  fxNote.preferredSize = [-1, 40];
  fxPick.onChange = function () {
    if (fxPick.selection) fxWhen.selection = FX[fxPick.selection.index].when;
  };

  function fxLayers() {
    var comp = activeComp();
    return comp ? comp.selectedLayers : [];
  }

  function clearFlowEffects(layer, only) {
    var parade = layer.property("ADBE Effect Parade");
    if (!parade) return 0;
    var n = 0;
    for (var i = parade.numProperties; i >= 1; i--) {
      var nm = String(parade.property(i).name);
      if (nm.indexOf("Flow: ") === 0 && (!only || nm.indexOf("Flow: " + only) === 0)) {
        parade.property(i).remove();
        n++;
      }
    }
    return n;
  }

  fxApply.onClick = function () {
    var comp = activeComp();
    var layers = fxLayers();
    if (!comp || !layers.length) return fail("Select one or more layers first.");
    var fx = FX[fxPick.selection.index];
    var k = fxStrength.get() / 100;
    var d = Math.max(0.05, num(fxDur.text, 0.5));
    var ease = EASINGS[fxEase.selection.index].id;
    var when = fxWhen.selection.index;
    app.beginUndoGroup("Flow Effect: " + fx.name);
    try {
      for (var i = 0; i < layers.length; i++) {
        var l = layers[i];
        var t0 = when === 0 ? l.inPoint : when === 1 ? comp.time : Math.max(0, l.outPoint - d);
        clearFlowEffects(l, fx.name);
        fx.make(l, k, Math.round(t0 * 1000) / 1000, d, ease);
      }
    } catch (e) {
      app.endUndoGroup();
      return fail("Could not apply " + fx.name + ": " + e);
    }
    app.endUndoGroup();
    say(fx.name + " applied to " + layers.length + " layer" + (layers.length === 1 ? "" : "s") + ".");
  };

  fxRemove.onClick = function () {
    var layers = fxLayers();
    if (!layers.length) return fail("Select one or more layers first.");
    var n = 0;
    app.beginUndoGroup("Flow Effects: remove");
    for (var i = 0; i < layers.length; i++) n += clearFlowEffects(layers[i], "");
    app.endUndoGroup();
    say("Removed " + n + " Flow effect" + (n === 1 ? "" : "s") + ".");
  };

  // ================================================================== Sounds tab

  var sfxItems = [];
  var sfxImported = {};
  soundsTab.orientation = "column";
  soundsTab.alignChildren = ["fill", "top"];
  var sfxSource = dropdown(soundsTab, "Library", ["Built-in (original)", "My sounds folder"], 0);
  var sfxFolder = field(soundsTab, "My folder", setting("sfxFolder", ""), 170);
  var sfxScan = addBtn(soundsTab, "Scanner mon dossier", "Scan my folder", false);
  var sfxList = soundsTab.add("listbox", undefined, []);
  sfxList.alignment = ["fill", "fill"];
  sfxList.preferredSize = [-1, 130];
  var sfxLevel = field(soundsTab, "Level (dB)", "0", 60);
  var sfxButtons = soundsTab.add("group");
  sfxButtons.alignment = ["fill", "top"];
  var sfxAtHead = addBtn(sfxButtons, "Ajouter à la tête de lecture", "Add at playhead", true);
  var sfxAtLayers = addBtn(sfxButtons, "Ajouter aux calques sélectionnés", "Add at selected layers", false);
  var sfxNote = soundsTab.add("statictext", undefined, "The built-in sounds are generated on your computer (original, no licence). Famous branded sounds are other people's recordings: put the ones you own in your folder and scan it.", { multiline: true });
  sfxNote.alignment = ["fill", "top"];
  sfxNote.preferredSize = [-1, 60];

  function sfxFill(items) {
    sfxItems = items;
    sfxList.removeAll();
    for (var i = 0; i < items.length; i++) sfxList.add("item", items[i].label);
    if (items.length) sfxList.selection = 0;
  }

  function sfxLoadBuiltin() {
    var r = helper({ op: "sfx.install" });
    if (!r.ok) return fail(r.error);
    var l = helper({ op: "sfx.list" });
    if (!l.ok) return fail(l.error);
    var items = [];
    for (var i = 0; i < l.items.length; i++) {
      var it = l.items[i];
      items.push({ label: it.category + " · " + it.name + " (" + it.seconds + "s)", name: it.name, path: it.path });
    }
    sfxFill(items);
    say(items.length + " built-in sounds ready in " + l.dir);
  }

  function sfxLoadFolder() {
    var folder = String(sfxFolder.text).replace(/^\s+|\s+$/g, "");
    if (!folder) return fail("Type the folder that holds your sounds.");
    var r = helper({ op: "sfx.scan", folder: folder });
    if (!r.ok) return fail(r.error);
    save("sfxFolder", folder);
    var items = [];
    for (var i = 0; i < r.items.length; i++) items.push({ label: r.items[i].name, name: r.items[i].name, path: r.items[i].path });
    sfxFill(items);
    say(items.length + " sound" + (items.length === 1 ? "" : "s") + " found in your folder.");
  }

  sfxSource.onChange = function () {
    if (sfxSource.selection.index === 0) sfxLoadBuiltin();
    else if (sfxFolder.text) sfxLoadFolder();
    else sfxFill([]);
  };
  sfxScan.onClick = function () {
    sfxSource.selection = 1;
    sfxLoadFolder();
  };

  function sfxFootage(path) {
    var cached = sfxImported[path];
    try {
      if (cached && cached.name) return cached;
    } catch (e) {}
    var item = app.project.importFile(new ImportOptions(new File(path)));
    sfxImported[path] = item;
    return item;
  }

  function sfxPlace(comp, entry, at) {
    var layer = comp.layers.add(sfxFootage(entry.path));
    layer.startTime = Math.max(0, at);
    layer.name = "SFX: " + entry.name;
    layer.comment = "flow:sfx";
    var db = num(sfxLevel.text, 0);
    if (db !== 0) {
      try {
        layer.property("ADBE Audio Group").property("ADBE Audio Levels").setValue([db, db]);
      } catch (e) {}
    }
    return layer;
  }

  function sfxCurrent() {
    return sfxList.selection ? sfxItems[sfxList.selection.index] : null;
  }

  sfxAtHead.onClick = function () {
    var comp = activeComp();
    var entry = sfxCurrent();
    if (!comp) return fail("Open a composition first.");
    if (!entry) return fail("Pick a sound first.");
    app.beginUndoGroup("Flow Sound");
    try {
      sfxPlace(comp, entry, comp.time);
    } catch (e) {
      app.endUndoGroup();
      return fail("Could not add the sound: " + e);
    }
    app.endUndoGroup();
    say("Added \"" + entry.name + "\" at " + fmt(comp.time) + ".");
  };

  sfxAtLayers.onClick = function () {
    var comp = activeComp();
    var entry = sfxCurrent();
    if (!comp || !comp.selectedLayers.length) return fail("Select one or more layers first.");
    if (!entry) return fail("Pick a sound first.");
    var starts = [];
    for (var i = 0; i < comp.selectedLayers.length; i++) starts.push(comp.selectedLayers[i].inPoint);
    app.beginUndoGroup("Flow Sounds");
    try {
      for (var j = 0; j < starts.length; j++) sfxPlace(comp, entry, starts[j]);
    } catch (e) {
      app.endUndoGroup();
      return fail("Could not add the sound: " + e);
    }
    app.endUndoGroup();
    say("Added \"" + entry.name + "\" at the start of " + starts.length + " layer" + (starts.length === 1 ? "" : "s") + ".");
  };

  // ================================================================== Library tab

  // One place, like DaVinci Resolve's Effects Library: pick a title, effect, transition,
  // generator or sound and it goes to the timeline. Every item reuses the modules above.
  var LIB_CATS = ["Titles", "Effects", "Transitions", "Generators", "Audio", "Favorites ★", "AE Scripts", "Catalogue"];
  var libSounds = [];
  var libShown = [];

  function libCtx() {
    var comp = activeComp();
    if (!comp) throw new Error("Open a composition first.");
    return { comp: comp, layers: comp.selectedLayers, dur: Math.max(0.05, num(libDur.text, 0.5)), side: libSide.selection ? libSide.selection.index : 0, k: libStrength.get() / 100 };
  }

  function needLayers(ctx) {
    if (!ctx.layers.length) throw new Error("Select one or more layers first.");
  }

  // ---- Transitions: r goes 0 (hidden) to 1 (shown) over the window, at the start or the end of a layer.
  function trAdd(label, build) {
    return {
      name: label,
      run: function (ctx) {
        needLayers(ctx);
        var sides = ctx.side === 0 ? [false] : ctx.side === 1 ? [true] : [false, true];
        for (var i = 0; i < ctx.layers.length; i++) {
          var l = ctx.layers[i];
          for (var s = 0; s < sides.length; s++) {
            var out = sides[s];
            var t0 = out ? Math.max(0, l.outPoint - ctx.dur) : l.inPoint;
            var tag = label + (out ? " out" : " in");
            clearFlowEffects(l, tag);
            var head = fxWindow(Math.round(t0 * 1000) / 1000, ctx.dur, "inOutCubic") + "var r=" + (out ? "1-E(p)" : "E(p)") + ";";
            build(l, head, tag, ctx);
          }
        }
        return label + " added to " + ctx.layers.length + " layer" + (ctx.layers.length === 1 ? "" : "s") + ".";
      }
    };
  }

  function trFade(l, head, tag) {
    fxAdd(l, "ADBE Geometry2", tag).property("Opacity").expression = head + "100*r;";
  }

  var TRANSITIONS = [
    trAdd("Cross Dissolve", function (l, h, tag) { trFade(l, h, tag); }),
    trAdd("Dip to Black", function (l, h, tag) { fxAdd(l, "ADBE Exposure2", tag).property("Master").property("Exposure").expression = h + "-10*(1-r);"; }),
    trAdd("Dip to White", function (l, h, tag) { fxAdd(l, "ADBE Exposure2", tag).property("Master").property("Exposure").expression = h + "10*(1-r);"; }),
    trAdd("Blur Dissolve", function (l, h, tag) {
      fxAdd(l, "ADBE Gaussian Blur 2", tag + " blur").property("Blurriness").expression = h + "100*(1-r);";
      trFade(l, h, tag);
    }),
    trAdd("Flash Through", function (l, h, tag) {
      fxAdd(l, "ADBE Exposure2", tag).property("Master").property("Exposure").expression = h + "6*Math.sin(Math.PI*r);";
      fxAdd(l, "ADBE Geometry2", tag + " cut").property("Opacity").expression = h + "r>0.5?100:0;";
    }),
    trAdd("Pixelate Dissolve", function (l, h, tag) {
      var f = fxAdd(l, "ADBE Mosaic", tag);
      var code = h + "r>=1?4000:Math.max(2,Math.round(6*Math.pow(300/6,r)));";
      f.property("Horizontal Blocks").expression = code;
      f.property("Vertical Blocks").expression = code;
      trFade(l, h, tag + " fade");
    }),
    trAdd("Glitch", function (l, h, tag) {
      fxAdd(l, "ADBE Offset", tag).property("Shift Center To").expression = h +
        "var s=Math.floor(time*16);var a=Math.abs(Math.sin(s*12.9898)*43758.5453)%1;var b=Math.abs(Math.sin(s*78.233)*12345.678)%1;r<1?[value[0]+(b-0.5)*600*(1-r),value[1]+(a-0.5)*60*(1-r)]:value;";
      fxAdd(l, "ADBE Geometry2", tag + " cut").property("Opacity").expression = h + "r<=0?0:(r>=1?100:(Math.floor(time*16)%2?100:30));";
    }),
    trAdd("Zoom In", function (l, h, tag) {
      fxAdd(l, "ADBE Geometry2", tag).property("Scale Height").expression = h + "100+250*(1-r);";
      trFade(l, h, tag + " fade");
    }),
    trAdd("Zoom Out", function (l, h, tag) {
      fxAdd(l, "ADBE Geometry2", tag).property("Scale Height").expression = h + "30+70*r;";
      trFade(l, h, tag + " fade");
    }),
    trAdd("Spin", function (l, h, tag) {
      var f = fxAdd(l, "ADBE Geometry2", tag);
      f.property("Rotation").expression = h + "-180*(1-r);";
      f.property("Scale Height").expression = h + "30+70*r;";
      f.property("Opacity").expression = h + "100*r;";
    })
  ];
  (function () {
    var dirs = [["Left", 1, 0], ["Right", -1, 0], ["Up", 0, 1], ["Down", 0, -1]];
    for (var i = 0; i < dirs.length; i++) {
      (function (d) {
        TRANSITIONS.push(trAdd("Slide " + d[0], function (l, h, tag, ctx) {
          var w = ctx.comp.width, hh = ctx.comp.height;
          fxAdd(l, "ADBE Geometry2", tag).property("Position").expression = h + "[value[0]+" + d[1] * w + "*(1-r),value[1]+" + d[2] * hh + "*(1-r)];";
        }));
      })(dirs[i]);
    }
    var wipes = [["Wipe to Left", 90], ["Wipe to Right", 270], ["Wipe Down", 0], ["Wipe Up", 180]];
    for (var j = 0; j < wipes.length; j++) {
      (function (w) {
        TRANSITIONS.push(trAdd(w[0], function (l, h, tag) {
          var f = fxAdd(l, "ADBE Linear Wipe", tag);
          f.property("Wipe Angle").setValue(w[1]);
          f.property("Feather").setValue(10);
          f.property("Transition Completion").expression = h + "100*(1-r);";
        }));
      })(wipes[j]);
    }
  })();

  // ---- Titles: a text layer at the playhead, with an animation.
  var TITLE_STYLES = [
    { name: "Lower Third", text: "NAME\rTitle or role", size: 64, x: 0.08, y: 0.82, left: true, anim: "Line Rise" },
    { name: "Lower Third Bold", text: "BIG NAME\rSubtitle", size: 80, x: 0.08, y: 0.8, left: true, anim: "Words Slide", color: [1, 0.85, 0.1] },
    { name: "Subtitle Bar", text: "A short subtitle line", size: 54, x: 0.5, y: 0.9, anim: "Fade Up" },
    { name: "Heading", text: "BIG HEADING", size: 160, x: 0.5, y: 0.5, anim: "Pop In" }
  ];

  function titleAnim(name) {
    var all = allText();
    for (var i = 0; i < all.length; i++) if (all[i].name === name) return all[i];
    return all[0];
  }

  function titleRun(text, size, fx, fy, left, color, animName) {
    return function (ctx) {
      var comp = ctx.comp, k = comp.height / 1080;
      var td = new TextDocument(text);
      td.fontSize = size * k;
      td.fillColor = color || [1, 1, 1];
      td.applyFill = true;
      td.justification = left ? ParagraphJustification.LEFT_JUSTIFY : ParagraphJustification.CENTER_JUSTIFY;
      var layer = comp.layers.addText(td);
      layer.name = "Title: " + String(text).replace(/\r/g, " ").substr(0, 24);
      layer.comment = "flow:title";
      layer.transform.position.setValue([comp.width * fx, comp.height * fy]);
      layer.inPoint = comp.time;
      layer.outPoint = Math.min(comp.duration, comp.time + 4);
      if (animName) addTextAnimation(layer, titleAnim(animName), 0);
      return "Title \"" + layer.name + "\" added at the playhead.";
    };
  }

  function libTitles() {
    var out = [];
    var all = allText();
    for (var i = 0; i < all.length; i++) out.push({ cat: "Titles", name: all[i].name + (i >= TEXT_BUILTIN.length ? " ★mine" : ""), sub: "text · " + all[i].unit, run: titleRun("SAMPLE TEXT", 110, 0.5, 0.5, false, null, all[i].name) });
    for (var j = 0; j < TITLE_STYLES.length; j++) {
      var t = TITLE_STYLES[j];
      out.push({ cat: "Titles", name: t.name, sub: "title", run: titleRun(t.text, t.size, t.x, t.y, t.left === true, t.color, t.anim) });
    }
    return out;
  }

  // ---- Effects: on the selected layers, or on a new adjustment layer when nothing is selected.
  function libEffects() {
    var out = [];
    for (var i = 0; i < FX.length; i++) {
      (function (fx) {
        out.push({
          cat: "Effects",
          name: fx.name,
          sub: "effect",
          run: function (ctx) {
            var comp = ctx.comp;
            var layers = [];
            for (var a = 0; a < ctx.layers.length; a++) layers.push(ctx.layers[a]);
            var made = false;
            if (!layers.length) {
              var adj = comp.layers.addSolid([1, 1, 1], "Flow Adjustment: " + fx.name, comp.width, comp.height, comp.pixelAspect, comp.duration);
              adj.adjustmentLayer = true;
              adj.comment = "flow:adjustment";
              adj.inPoint = comp.time;
              layers.push(adj);
              made = true;
            }
            for (var b = 0; b < layers.length; b++) {
              var l = layers[b];
              var t0 = fx.when === 0 ? l.inPoint : fx.when === 1 ? comp.time : Math.max(0, l.outPoint - ctx.dur);
              clearFlowEffects(l, fx.name);
              fx.make(l, ctx.k, Math.round(t0 * 1000) / 1000, ctx.dur, "outCubic");
            }
            return fx.name + (made ? " added on a new adjustment layer." : " applied to " + layers.length + " layer" + (layers.length === 1 ? "" : "s") + ".");
          }
        });
      })(FX[i]);
    }
    return out;
  }

  // ---- Generators.
  function libGenerators() {
    var out = [];
    function solid(name, color, ramp) {
      return {
        cat: "Generators",
        name: name,
        sub: "generator",
        run: function (ctx) {
          var comp = ctx.comp;
          var l = comp.layers.addSolid(color, name, comp.width, comp.height, comp.pixelAspect, Math.min(5, comp.duration));
          l.comment = "flow:generator";
          l.inPoint = comp.time;
          l.outPoint = Math.min(comp.duration, comp.time + 5);
          if (ramp) paintGradient(l, ramp, comp.width, comp.height);
          return name + " added at the playhead.";
        }
      };
    }
    var colorHex = validHex(libColor.text) ? libColor.text : "#4DA6C8";
    out.push(solid("Solid Color", hexToUnit(colorHex, [0.3, 0.65, 0.78])));
    out.push(solid("Black", [0, 0, 0]));
    out.push(solid("White", [1, 1, 1]));
    out.push(solid("Grey Scale", [0, 0, 0], cleanBg({ name: "Grey Scale", kind: "linear", colors: ["#000000", "#FFFFFF", "#FFFFFF", "#FFFFFF"], angle: 0, anim: "none", speed: 0 })));
    var all = allBg();
    for (var i = 0; i < all.length; i++) {
      (function (p) {
        out.push({
          cat: "Generators",
          name: p.name + (all.indexOf(p) >= BG_BUILTIN.length ? " ★mine" : ""),
          sub: "gradient · " + p.kind,
          run: function (ctx) {
            var comp = ctx.comp;
            var layer = comp.layers.addSolid([0, 0, 0], "Flow BG: " + p.name, comp.width, comp.height, comp.pixelAspect, comp.duration);
            layer.comment = "flow:bg";
            layer.moveToEnd();
            paintGradient(layer, p, comp.width, comp.height);
            return p.name + " background added at the bottom.";
          }
        });
      })(all[i]);
    }
    return out;
  }

  // ---- Audio: sounds from the helper, and level tools for the selected layers.
  function audioLevels(layer) {
    return layer.property("ADBE Audio Group").property("ADBE Audio Levels");
  }

  function libAudioTool(name, sub, expr) {
    return {
      cat: "Audio",
      name: name,
      sub: sub,
      run: function (ctx) {
        needLayers(ctx);
        var n = 0;
        for (var i = 0; i < ctx.layers.length; i++) {
          var l = ctx.layers[i];
          if (!l.hasAudio) continue;
          audioLevels(l).expression = expr(ctx.dur, l);
          n++;
        }
        if (!n) throw new Error("None of the selected layers has audio.");
        return name + " set on " + n + " layer" + (n === 1 ? "" : "s") + ".";
      }
    };
  }

  function libAudio() {
    var out = [
      libAudioTool("Audio Fade In", "level", function (d) { return "var t=Math.min(1,Math.max(0,(time-inPoint)/" + d + "));[value[0]-60*(1-t),value[1]-60*(1-t)];"; }),
      libAudioTool("Audio Fade Out", "level", function (d) { return "var t=Math.min(1,Math.max(0,(outPoint-time)/" + d + "));[value[0]-60*(1-t),value[1]-60*(1-t)];"; }),
      libAudioTool("Lower by 12 dB", "level", function () { return "[value[0]-12,value[1]-12];"; }),
      libAudioTool("Boost by 6 dB", "level", function () { return "[value[0]+6,value[1]+6];"; }),
      libAudioTool("Mute", "level", function () { return "[-100,-100];"; })
    ];
    for (var i = 0; i < libSounds.length; i++) {
      (function (s) {
        out.push({
          cat: "Audio",
          name: s.name,
          sub: s.category,
          run: function (ctx) {
            sfxPlace(ctx.comp, { name: s.name, path: s.path }, ctx.comp.time);
            return "Sound \"" + s.name + "\" added at the playhead.";
          }
        });
      })(libSounds[i]);
    }
    return out;
  }

  function libLoadSounds() {
    if (libSounds.length) return;
    var r = helper({ op: "sfx.install" });
    var l = r.ok ? helper({ op: "sfx.list" }) : r;
    if (!l.ok) return;
    libSounds = [];
    for (var i = 0; i < l.items.length; i++) libSounds.push({ name: l.items[i].name, category: l.items[i].category, path: l.items[i].path });
  }

  // ---- AE Utility Scripts (PARTIE 2, item 6)
  function libScripts() {
    return [
      {
        cat: "AE Scripts",
        name: "Auto Nulls",
        sub: "tool",
        run: function (ctx) {
          var comp = ctx.comp;
          var sel = comp.selectedLayers;
          if (!sel.length) throw new Error("Sélectionnez au moins un calque.");
          var nullLayer = comp.layers.addNull();
          nullLayer.name = "Auto Null";
          nullLayer.inPoint = comp.time;
          nullLayer.outPoint = comp.duration;
          var avgX = 0, avgY = 0;
          for (var i = 0; i < sel.length; i++) {
            var pos = sel[i].transform.position.value;
            avgX += pos[0]; avgY += pos[1];
          }
          nullLayer.transform.position.setValue([avgX / sel.length, avgY / sel.length]);
          for (var j = 0; j < sel.length; j++) {
            sel[j].parent = nullLayer;
          }
          return "Auto Null créé et lié à " + sel.length + " calques.";
        }
      },
      {
        cat: "AE Scripts",
        name: "Text Exploder",
        sub: "tool",
        run: function (ctx) {
          var comp = ctx.comp;
          var sel = comp.selectedLayers;
          if (!sel.length) throw new Error("Sélectionnez un calque de texte.");
          var target = null;
          for (var i = 0; i < sel.length; i++) {
            if (sel[i].property("Source Text")) { target = sel[i]; break; }
          }
          if (!target) throw new Error("Aucun calque de texte sélectionné.");
          var origDoc = target.property("Source Text").value;
          var words = String(origDoc.text).split(/\s+/);
          if (!words.length) throw new Error("Le texte est vide.");
          var basePos = target.transform.position.value;
          var created = 0;
          for (var w = 0; w < words.length; w++) {
            if (!words[w]) continue;
            var nd = new TextDocument(words[w]);
            nd.fontSize = origDoc.fontSize;
            nd.font = origDoc.font;
            nd.fillColor = origDoc.fillColor;
            nd.applyFill = true;
            var wl = comp.layers.addText(nd);
            wl.name = "Word: " + words[w];
            wl.inPoint = target.inPoint;
            wl.outPoint = target.outPoint;
            wl.transform.position.setValue([basePos[0] + (w - words.length / 2) * (origDoc.fontSize * 1.5), basePos[1]]);
            created++;
          }
          target.enabled = false;
          return "Texte explosé en " + created + " calques de mots.";
        }
      },
      {
        cat: "AE Scripts",
        name: "Trim Path",
        sub: "tool",
        run: function (ctx) {
          var comp = ctx.comp;
          var sel = comp.selectedLayers;
          var n = 0;
          for (var i = 0; i < sel.length; i++) {
            var l = sel[i];
            try {
              var contents = l.property("Contents") || l.property("ADBE Root Vectors Group");
              if (contents) {
                var trim = contents.addProperty("ADBE Vector Filter - Trim");
                if (trim) {
                  trim.property("ADBE Vector Trim End").setValueAtTime(comp.time, 0);
                  trim.property("ADBE Vector Trim End").setValueAtTime(comp.time + 1, 100);
                  n++;
                }
              }
            } catch (e) {}
          }
          if (!n) {
            var shape = comp.layers.addShape();
            shape.name = "Trim Path Shape";
            shape.inPoint = comp.time;
            shape.outPoint = comp.time + 3;
            return "Calque de forme créé avec tracé animé.";
          }
          return "Trim Path ajouté sur " + n + " calque(s).";
        }
      },
      {
        cat: "AE Scripts",
        name: "Anchor Snap",
        sub: "tool",
        run: function (ctx) {
          var comp = ctx.comp;
          var sel = comp.selectedLayers;
          if (!sel.length) throw new Error("Sélectionnez au moins un calque.");
          for (var i = 0; i < sel.length; i++) {
            var l = sel[i];
            var r = [0, 0, 1920, 1080];
            try {
              if (l.sourceRectAtTime) {
                var sr = l.sourceRectAtTime(comp.time, false);
                r = [sr.left, sr.top, sr.width, sr.height];
              }
            } catch (e) {}
            var centerAnchor = [r[0] + r[2] / 2, r[1] + r[3] / 2];
            var curAnchor = l.transform.anchorPoint.value;
            var dx = centerAnchor[0] - curAnchor[0];
            var dy = centerAnchor[1] - curAnchor[1];
            if (l.transform.anchorPoint.numKeys > 0) {
              l.transform.anchorPoint.setValueAtTime(comp.time, centerAnchor);
            } else {
              l.transform.anchorPoint.setValue(centerAnchor);
            }
            var curPos = l.transform.position.value;
            var newPos = [curPos[0] + dx, curPos[1] + dy];
            if (l.transform.position.numKeys > 0) {
              l.transform.position.setValueAtTime(comp.time, newPos);
            } else {
              l.transform.position.setValue(newPos);
            }
          }
          return "Point d'ancrage centré sur " + sel.length + " calque(s).";
        }
      },
      {
        cat: "AE Scripts",
        name: "Bounce",
        sub: "tool",
        run: function (ctx) {
          var comp = ctx.comp;
          var sel = comp.selectedLayers;
          if (!sel.length) throw new Error("Sélectionnez au moins un calque.");
          var bounceCode = "n = 0;\nif (numKeys > 0) {\n  n = nearestKey(time).index;\n  if (key(n).time > time) n--;\n}\nif (n == 0) {\n  t = 0;\n} else {\n  t = time - key(n).time;\n}\nif (n > 0 && t < 1) {\n  v = velocityAtTime(key(n).time - 0.001);\n  amp = 0.05;\n  freq = 4.0;\n  decay = 8.0;\n  value + v * amp * Math.sin(freq * t * 2 * Math.PI) / Math.exp(decay * t);\n} else {\n  value;\n}";
          for (var i = 0; i < sel.length; i++) {
            sel[i].transform.position.expression = bounceCode;
            sel[i].transform.scale.expression = bounceCode;
          }
          return "Expression Bounce appliquée sur " + sel.length + " calque(s).";
        }
      },
      {
        cat: "AE Scripts",
        name: "Sequence Layers",
        sub: "tool",
        run: function (ctx) {
          var comp = ctx.comp;
          var sel = comp.selectedLayers;
          if (sel.length < 2) throw new Error("Sélectionnez au moins 2 calques à séquencer.");
          var step = 0.2;
          for (var i = 0; i < sel.length; i++) {
            var l = sel[i];
            var shift = i * step;
            var dur = l.outPoint - l.inPoint;
            l.startTime += shift;
            l.inPoint += shift;
            l.outPoint = l.inPoint + dur;
          }
          return sel.length + " calques décalés de 0.2s en séquence.";
        }
      }
    ];
  }

  function libItems(cat) {
    if (cat === 0) return libTitles();
    if (cat === 1) return libEffects();
    if (cat === 2) {
      var t = [];
      for (var i = 0; i < TRANSITIONS.length; i++) t.push({ cat: "Transitions", name: TRANSITIONS[i].name, sub: "transition", run: TRANSITIONS[i].run });
      return t;
    }
    if (cat === 3) return libGenerators();
    if (cat === 4) return libAudio();
    if (cat === 6) return libScripts();
    if (cat === CAT_LIB_INDEX) return catLibraryItems();
    var favs = libFavorites();
    var all = [].concat(libTitles(), libEffects(), libItems(2), libGenerators(), libAudio(), libScripts(), CAT_LIB_INDEX >= 0 ? libItems(CAT_LIB_INDEX) : []);
    var out = [];
    for (var j = 0; j < all.length; j++) if (favs[all[j].cat + "|" + all[j].name]) out.push(all[j]);
    return out;
  }

  function libFavorites() {
    try {
      var arr = JSON.parse(setting("libFavorites", "[]"));
      var map = {};
      for (var i = 0; i < arr.length; i++) map[String(arr[i])] = true;
      return map;
    } catch (e) {
      return {};
    }
  }

  libraryTab.orientation = "column";
  libraryTab.alignChildren = ["fill", "top"];
  var libTop = libraryTab.add("group");
  libTop.alignment = ["fill", "top"];
  var libCat = libTop.add("dropdownlist", undefined, LIB_CATS);
  libCat.selection = 0;
  var libSearch = libTop.add("edittext", undefined, "");
  libSearch.alignment = ["fill", "center"];
  libSearch.minimumSize = [90, -1];



  // // <flow-catalog-ui>
  // Generated from flow-install/src/catalog-ui.jsx by scripts/build_catalog.py. Do not edit by hand.
// ================================================================== Catalogue screens
//
// The catalogue lives inside the Library tab, so the panel keeps its five tabs. The kind and
// family dropdowns narrow 499 presets down to a handful of cards; the search box also matches
// families and tags. A card is greyed when a native effect it needs is missing, and a click
// explains why instead of failing halfway through an apply.

var CAT_LIB_INDEX = -1;
for (var catLibScan = 0; catLibScan < LIB_CATS.length; catLibScan++) {
  if (LIB_CATS[catLibScan] === "Catalogue") CAT_LIB_INDEX = catLibScan;
}

var libFilters = libraryTab.add("group");
libFilters.orientation = "column";
libFilters.alignChildren = ["fill", "top"];
libFilters.alignment = ["fill", "top"];
libFilters.visible = false;
var libKind = libFilters.add("dropdownlist", undefined, ["-"]);
libKind.alignment = ["fill", "top"];
var libFamily = libFilters.add("dropdownlist", undefined, ["-"]);
libFamily.alignment = ["fill", "top"];

function catLibraryKindKey() {
  var idx = libKind && libKind.selection ? libKind.selection.index : 0;
  if (idx >= 2 && idx - 2 < CAT_KIND_KEYS.length) return CAT_KIND_KEYS[idx - 2];
  return "";
}

function catRefreshFamilies(keep) {
  if (!libFamily) return;
  var wanted = keep || "";
  libFamily.removeAll();
  libFamily.add("item", catTr("allFamilies"));
  var key = catLibraryKindKey();
  if (key) {
    var fams = catFamilies(key);
    for (var i = 0; i < fams.length; i++) libFamily.add("item", fams[i]);
  }
  var pick = 0;
  for (var j = 0; j < libFamily.items.length; j++) {
    if (String(libFamily.items[j].text) === wanted) pick = j;
  }
  libFamily.selection = pick;
}

function catLibraryRelabel() {
  if (!libKind || !libFamily) return;
  var kindPick = libKind.selection ? libKind.selection.index : 0;
  var familyPick = libFamily.selection ? libFamily.selection.text : "";
  libKind.removeAll();
  libKind.add("item", catTr("allKinds"));
  libKind.add("item", catTr("recent"));
  for (var i = 0; i < CAT_KIND_KEYS.length; i++) libKind.add("item", catKindLabel(CAT_KIND_KEYS[i]));
  libKind.selection = Math.max(0, Math.min(kindPick, libKind.items.length - 1));
  catRefreshFamilies(familyPick);
}

function catRecentItems() {
  var ids = [];
  try { ids = JSON.parse(setting("catRecent", "[]")); } catch (e) { ids = []; }
  var out = [];
  for (var i = 0; i < ids.length; i++) {
    var item = catById(String(ids[i]));
    if (item) out.push(item);
  }
  return out;
}

function catRemember(id) {
  var ids = [];
  try { ids = JSON.parse(setting("catRecent", "[]")); } catch (e) { ids = []; }
  var out = [String(id)];
  for (var i = 0; i < ids.length && out.length < 24; i++) {
    if (String(ids[i]) !== String(id)) out.push(String(ids[i]));
  }
  save("catRecent", JSON.stringify(out));
}

function catLibraryItem(item) {
  var state = catEnabled(item);
  return {
    cat: "Catalogue",
    name: item.name,
    sub: catKindLabel(item.kind) + " - " + (item.family || ""),
    tags: (item.tags || []).join(" "),
    catalogId: item.id,
    disabled: !state.ok,
    disabledReason: state.reason,
    run: function (ctx) { return catApplyItem(item, ctx); }
  };
}

function catLibraryItems() {
  var idx = libKind && libKind.selection ? libKind.selection.index : 0;
  var list;
  if (idx === 0) list = catAll();
  else if (idx === 1) list = catRecentItems();
  else {
    var key = catLibraryKindKey();
    list = key ? catItems(key) : [];
  }
  var family = libFamily && libFamily.selection && libFamily.selection.index > 0 ? String(libFamily.selection.text) : "";
  var out = [];
  for (var i = 0; i < list.length; i++) {
    if (family && String(list[i].family || "") !== family) continue;
    out.push(catLibraryItem(list[i]));
  }
  return out;
}

function catRemoveSelected() {
  var it = libSelectedItem();
  if (!it || !it.catalogId) return fail(catTr("nothing"));
  var item = catById(it.catalogId);
  if (!item) return fail(catTr("nothing"));
  var comp = activeComp();
  if (!comp) return fail(catTr("openComp"));
  app.beginUndoGroup("Flow: remove " + it.name);
  var n;
  try {
    n = catRemoveItem(item, comp, comp.selectedLayers);
  } catch (e) {
    app.endUndoGroup();
    return fail(String(e.message || e));
  }
  app.endUndoGroup();
  if (!n) return say(catTr("nothing"));
  say(catTr("removed") + " (" + n + ").");
}

function catLibraryFilters(on) {
  if (!libFilters) return;
  libFilters.visible = !!on;
  try { libraryTab.layout.layout(true); } catch (e) {}
}

libKind.onChange = function () {
  catRefreshFamilies("");
  libRefresh();
};
libFamily.onChange = function () {
  libRefresh();
};
catLibraryRelabel();
  // // </flow-catalog-ui>

  var libPreview = libraryTab.add("panel", undefined, tr("preview"));
  libPreview.preferredSize = [-1, 62];
  libPreview.alignment = ["fill", "top"];
  registerDraw(libPreview);
  libPreview.onDraw = function () {
    var g = this.graphics;
    var sz = this.size;
    var w = sz[0] || 260, h = sz[1] || 62;
    var C = palette();
    g.newPath();
    g.rectPath(0, 0, w, h);
    g.fillPath(colorBrush(g, C.bg));
    // onDraw replaces the native panel frame, so the panel's own label is drawn here.
    g.drawString(tr("preview"), colorPen(g, C.muted, 1), 12, 3);
    var it = libSelectedItem();
    if (!it) {
      g.drawString(tr("previewEmpty"), colorPen(g, C.muted, 1), 15, Math.floor(h / 2 + 2));
      return;
    }
    g.drawString("[" + it.cat + "] " + it.name, colorPen(g, C.accent, 1), 12, 20);
    g.drawString(it.sub, colorPen(g, C.text, 1), 12, 37);
    if (it.disabled) g.drawString(String(it.disabledReason || "").substr(0, 44), colorPen(g, C.muted, 1), 12, 52);
    var swW = 28, swH = 28;
    var swX = w - swW - 12, swY = 18;
    var colB = it.cat === "Catalogue" ? [0.36, 0.88, 1, 1] : it.cat === "Titles" || it.cat === "Generators" ? [0.25, 0.6, 0.95, 1] : it.cat === "Transitions" ? [0.95, 0.5, 0.2, 1] : it.cat === "Audio" ? [0.2, 0.8, 0.5, 1] : [0.7, 0.4, 0.9, 1];
    g.newPath();
    g.rectPath(swX, swY, swW, swH);
    g.fillPath(colorBrush(g, colB));
  };

  var LIB_PAGE = 6;
  var libPage = 0;
  var libSel = 0;
  var libCells = [];
  var libGridPanel = libraryTab.add("panel");
  libGridPanel.orientation = "column";
  libGridPanel.alignChildren = ["fill", "top"];
  libGridPanel.alignment = ["fill", "top"];
  libGridPanel.margins = [6, 20, 6, 6];
  libGridPanel.spacing = 4;
  libGridPanel.preferredSize = [-1, 190];
  for (var libRow = 0; libRow < 3; libRow++) {
    var libRowG = libGridPanel.add("group");
    libRowG.alignment = ["fill", "center"];
    libRowG.alignChildren = ["fill", "center"];
    for (var libCol = 0; libCol < 2; libCol++) {
      var libCell = libRowG.add("button", undefined, "");
      libCell.alignment = ["fill", "center"];
      libCell.preferredSize = [140, 52];
      libCell._itemIndex = -1;
      libCell.onDraw = function () {
        var g = this.graphics;
        var sz = this.size;
        var w = sz[0] || 140, h = sz[1] || 52;
        var C = palette();
        var idx = this._itemIndex;
        var it = idx >= 0 && idx < libShown.length ? libShown[idx] : null;
        g.newPath();
        g.rectPath(0, 0, w, h);
        g.fillPath(colorBrush(g, idx === libSel ? C.cellHi : C.cell));
        if (!it) return;
        var favs = libFavorites();
        var colB = it.cat === "Catalogue" ? [0.36, 0.88, 1, 1] : it.cat === "Titles" || it.cat === "Generators" ? [0.25, 0.6, 0.95, 1] : it.cat === "Transitions" ? [0.95, 0.5, 0.2, 1] : it.cat === "Audio" ? [0.2, 0.8, 0.5, 1] : [0.7, 0.4, 0.9, 1];
        g.newPath();
        g.rectPath(6, 8, 28, 28);
        g.fillPath(colorBrush(g, colB));
        g.drawString(String(it.name).substr(0, 20), colorPen(g, it.disabled ? C.muted : C.text, 1), 40, 8);
        g.drawString(String(it.sub || "").substr(0, 22), colorPen(g, C.muted, 1), 40, 26);
        if (it.disabled) g.drawString("!", colorPen(g, C.muted, 1), w - 16, h - 16);
        if (favs[it.cat + "|" + it.name]) g.drawString("★", colorPen(g, [1, 0.8, 0.2, 1], 1), w - 16, 8);
      };
      libCell.onClick = function () {
        var idx = this._itemIndex;
        if (idx < 0 || idx >= libShown.length) return;
        var now = new Date().getTime();
        var again = this._lastClick && this._lastIndex === idx && now - this._lastClick < 450;
        this._lastClick = now;
        this._lastIndex = idx;
        libSel = idx;
        try { libPreview.notify("onDraw"); } catch (e) {}
        if (again) libRun();
      };
      libCells.push(libCell);
    }
  }

  var libPager = libraryTab.add("group");
  libPager.alignment = ["fill", "center"];
  libPager.alignChildren = ["fill", "center"];
  var libPrev = libPager.add("button", undefined, "‹ Précédent");
  var libPageLabel = libPager.add("statictext", undefined, "1 / 1");
  libPageLabel.alignment = ["center", "center"];
  var libNext = libPager.add("button", undefined, "Suivant ›");
  libPrev.minimumSize = [86, -1];
  libNext.minimumSize = [86, -1];

  var libDur = field(libraryTab, "Duration (s)", "0.5", 60);
  var libSide = dropdown(libraryTab, "Transition at", ["Start of layer", "End of layer", "Both"], 0);
  var libStrength = slider(libraryTab, "Effect strength", 60, 0, 100);
  var libColor = field(libraryTab, "Solid colour", "#4DA6C8", 90);
  var libButtons = libraryTab.add("group");
  libButtons.alignment = ["fill", "top"];
  var libAdd = addBtn(libButtons, "Ajouter à la timeline", "Add to timeline", true);
  var libStar = addBtn(libButtons, "★ Favori", "★ Favorite", false);
  var libRemove = addBtn(libButtons, "Retirer", "Remove", false);
  libRemove.visible = false;
  var libHelp = libraryTab.add("statictext", undefined, tr("libraryHelp"), { multiline: true });
  libHelp.alignment = ["fill", "top"];

  function libSelectedItem() {
    return libSel >= 0 && libSel < libShown.length ? libShown[libSel] : null;
  }

  function libRefreshCells() {
    var count = libShown.length;
    var pages = Math.max(1, Math.ceil(count / LIB_PAGE));
    if (libPage >= pages) libPage = pages - 1;
    if (libPage < 0) libPage = 0;
    for (var i = 0; i < libCells.length; i++) {
      libCells[i]._itemIndex = libPage * LIB_PAGE + i;
      try { libCells[i].notify("onDraw"); } catch (e) {}
    }
    libPageLabel.text = (libPage + 1) + " / " + pages;
    libPager.visible = count > LIB_PAGE;
    try { libPreview.notify("onDraw"); } catch (e) {}
  }

  function libRefresh() {
    var cat = libCat.selection ? libCat.selection.index : 0;
    if (cat === 4 || cat === 5) libLoadSounds();
    catLibraryFilters(cat === CAT_LIB_INDEX);
    if (libRemove) libRemove.visible = cat === CAT_LIB_INDEX;
    var q = String(libSearch.text).toLowerCase();
    var items = libItems(cat);
    libShown = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (q && (it.name + " " + it.sub + " " + (it.tags || "")).toLowerCase().indexOf(q) < 0) continue;
      libShown.push(it);
    }
    libPage = 0;
    libSel = 0;
    libRefreshCells();
    save("lastLibCat", cat);
    say(libShown.length + " élément" + (libShown.length === 1 ? "" : "s") + " dans " + LIB_CATS[cat] + ".");
  }

  function libRun() {
    var it = libSelectedItem();
    if (!it) return fail("Choisissez un élément d'abord.");
    var ctx;
    try {
      ctx = libCtx();
    } catch (e) {
      return fail(String(e.message || e));
    }
    // A catalogue card is greyed from the selection at refresh time. Recheck against the live
    // selection so a card that just became valid is not blocked by a stale disabled flag.
    if (it.catalogId) {
      var item = catById(it.catalogId);
      var state = item ? catEnabled(item, ctx.layers) : { ok: false, reason: catTr("unavailable") };
      if (!state.ok) return fail(state.reason);
    } else if (it.disabled) {
      return fail(it.disabledReason || catTr("unavailable"));
    }
    app.beginUndoGroup("Flow Library: " + it.name);
    var msg;
    try {
      msg = it.run(ctx);
    } catch (e2) {
      app.endUndoGroup();
      return fail(String(e2.message || e2));
    }
    app.endUndoGroup();
    if (it.catalogId) catRemember(it.catalogId);
    say(msg);
  }

  function libToggleStar() {
    var it = libSelectedItem();
    if (!it) return fail("Choisissez un élément d'abord.");
    var favs = libFavorites();
    var key = it.cat + "|" + it.name;
    if (favs[key]) delete favs[key];
    else favs[key] = true;
    var arr = [];
    for (var k in favs) arr.push(k);
    save("libFavorites", JSON.stringify(arr));
    var keep = libSel;
    libRefresh();
    libSel = Math.min(keep, Math.max(0, libShown.length - 1));
    libRefreshCells();
  }

  var savedLibCat = parseInt(setting("lastLibCat", "0"), 10);
  if (savedLibCat >= 0 && savedLibCat < LIB_CATS.length) libCat.selection = savedLibCat;
  libCat.onChange = libRefresh;
  libSearch.onChanging = libRefresh;
  libAdd.onClick = libRun;
  libStar.onClick = libToggleStar;
  libRemove.onClick = catRemoveSelected;
  libPrev.onClick = function () { if (libPage > 0) { libPage--; libSel = libPage * LIB_PAGE; libRefreshCells(); } };
  libNext.onClick = function () { if ((libPage + 1) * LIB_PAGE < libShown.length) { libPage++; libSel = libPage * LIB_PAGE; libRefreshCells(); } };
  libRefresh();

  // ------------------------------------------------------------------ show

  welcomeTitle._flowBase = "welcome.title";
  welcomeBody._flowBase = "welcome.body";
  welcomeCheck._flowBase = "welcome.check";
  welcomeSkip._flowBase = "welcome.skip";
  localizeUI(ui);
  welcomeTitle.text = tr("welcome.title");
  welcomeBody.text = tr("welcome.body");
  welcomeCheck.text = welcomeRetryLabel();
  welcomeSkip.text = tr("welcome.skip");
  redrawAll();

  if (ui instanceof Window) {
    ui.show();
  } else {
    ui.layout.layout(true);
  }
  // A small handle for other scripts and for tests.
  G.__flowStudio = {
    version: 3,
    ui: ui,
    easings: EASINGS,
    library: LIBRARY,
    easingFn: easingFn,
    fillTemplate: fillTemplate,
    compatible: compatible,
    propKind: propKind,
    poll: poll,
    status: function () { return status.text; },
    fx: FX,
    transitions: TRANSITIONS,
    libItems: libItems,
    libRefresh: libRefresh,
    libRun: libRun,
    libShown: function () { return libShown; },
    libSelect: function (index) {
      if (index < 0 || index >= libShown.length) return false;
      libSel = index;
      libPage = Math.floor(index / LIB_PAGE);
      libRefreshCells();
      return true;
    },
    libSelected: function () { return libSelectedItem(); },
    libPages: function () { return Math.max(1, Math.ceil(libShown.length / LIB_PAGE)); },
    libPage: function () { return libPage; },
    setLanguage: function (lang) {
      if (LANGS.indexOf(lang) < 0) return false;
      LANG = lang;
      langDrop.selection = LANGS.indexOf(lang);
      applyLanguage();
      return true;
    },
    setTheme: function (theme) {
      if (["auto", "dark", "light"].indexOf(theme) < 0) return false;
      THEME = theme;
      themeDrop.selection = theme === "dark" ? 1 : theme === "light" ? 2 : 0;
      applyTheme();
      return true;
    },
    language: function () { return LANG; },
    theme: function () { return THEME; },
    tr: tr,
    showWelcome: function (visible) { setWelcome(visible !== false); },
    welcome: welcome,
    welcomeVisible: function () { return welcomeShown; },
    libCat: libCat,
    libCategories: function () { return LIB_CATS.slice(); },
    libCategory: function (name) {
      var idx = LIB_CATS.indexOf(name);
      if (idx < 0) return false;
      libCat.selection = idx;
      libRefresh();
      return true;
    },
    catalog: function () {
      return { total: FLOW_CATALOG.total, counts: FLOW_CATALOG.counts, kinds: CAT_KIND_KEYS.slice(), native: FLOW_NATIVE_IDS.length };
    },
    catalogById: catById,
    catalogAll: catAll,
    catalogItems: catItems,
    catalogEnabled: catEnabled,
    catalogApply: catApplyItem,
    catalogRemove: catRemoveItem,
    catalogCard: catLibraryItem,
    catalogRemember: catRemember,
    catalogRecent: catRecentItems,
    catalogFamilies: catFamilies,
    catalogHasFx: catHasFx,
    catalogCanRemap: catCanRemap,
    catalogNeedsRemap: catNeedsRemap,
    catalogKind: function (index) {
      if (!libKind || index < 0 || index >= libKind.items.length) return false;
      libKind.selection = index;
      catRefreshFamilies("");
      libRefresh();
      return true;
    },
    catalogFamily: function (index) {
      if (!libFamily || index < 0 || index >= libFamily.items.length) return false;
      libFamily.selection = index;
      libRefresh();
      return true;
    },
    catalogRefresh: catRefreshFamilies,
    styleCount: function () { return allStyles().length; },
    styleIndex: function () { return stGridSel; },
    lastPackPath: function () { return packPath.text; },
    lastPackJson: function () { return packBox.text; },
    sfxFolder: sfxFolder,
    loadSounds: sfxLoadBuiltin,
    textBuiltin: TEXT_BUILTIN,
    bgBuiltin: BG_BUILTIN,
    addTextAnimation: addTextAnimation,
    paintGradient: paintGradient,
    cleanText: cleanText,
    cleanBg: cleanBg,
    setCaptions: function (lines, offset) { lastLines = { lines: lines, offset: offset || 0 }; },
    mainTabs: tabs,
    montageSub: montageSub,
    animSub: animSub,
    lookSub: lookSub,
    settingsSub: settingsSub,
    silLast: function () { return silLast; },
    lastLines: function () { return lastLines; }
  };
})(this);
