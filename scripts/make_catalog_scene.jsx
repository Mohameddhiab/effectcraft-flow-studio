// Builds one composition per catalogue transition (55) and effect (70) on the main catalogue,
// using the panel's own catalogApply, and saves target/catalog-scene.ecproj.
// Run through scripts/build_render_steps.js; nothing here is shipped.
(function () {
  var F = $.global.__flowStudio;
  if (!F) return "panel missing";
  var proj = app.project;

  function slug(s) {
    return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  }
  function selectOnly(comp, layer) {
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
    layer.selected = true;
  }
  // A pre-composition with four coloured quadrants: enough edges, flat areas and colour for crop,
  // blur, glow, edge, pixel and grade effects to show something.
  function plate(comp, colors, label) {
    var inner = proj.items.addComp("Plate " + comp.name + (label || ""), comp.width, comp.height, 1, 4, 30);
    colors = colors || [[0.85, 0.12, 0.16], [0.1, 0.72, 0.35], [0.12, 0.4, 0.9], [0.95, 0.8, 0.2]];
    var w = comp.width / 2, h = comp.height / 2;
    for (var i = 0; i < 4; i++) {
      var s = inner.layers.addSolid(colors[i], "Quadrant " + (i + 1), w, h, 1, 4);
      s.transform.position.setValue([comp.width / 2 + (i % 2 ? w / 2 : -w / 2), comp.height / 2 + (i < 2 ? -h / 2 : h / 2)]);
    }
    var layer = comp.layers.add(inner);
    layer.name = label || "Plate";
    return layer;
  }

  var errors = [];
  var trs = F.catalogItems("transitions");
  for (var i = 0; i < trs.length; i++) {
    var t = trs[i];
    var c = proj.items.addComp("TR " + slug(t.name), 320, 180, 1, 4, 30);
    // Two distinct textured plates: a flat colour cannot show a zoom, roll, mask or glitch.
    plate(c, [[0.85, 0.12, 0.16], [0.55, 0.1, 0.35], [0.95, 0.45, 0.1], [0.7, 0.2, 0.2]], "Base");
    var inc = plate(c, [[0.1, 0.72, 0.35], [0.1, 0.45, 0.75], [0.55, 0.85, 0.2], [0.15, 0.6, 0.5]], "Incoming");
    selectOnly(c, inc);
    try {
      F.catalogApply(t, { comp: c, layers: [inc], side: 0 });
    } catch (e) {
      errors.push("TR " + t.name + ": " + e);
    }
  }

  var fxs = F.catalogItems("effects");
  for (var j = 0; j < fxs.length; j++) {
    var fx = fxs[j];
    var fc = proj.items.addComp("FX " + slug(fx.name), 320, 480, 1, 4, 30);
    var p = plate(fc);
    selectOnly(fc, p);
    try {
      F.catalogApply(fx, { comp: fc, layers: [p] });
    } catch (e2) {
      errors.push("FX " + fx.name + ": " + e2);
    }
  }

  // Reference frame: the same plate with no effect, so the checker can prove an effect changed it.
  var bc = proj.items.addComp("BASE plate", 320, 480, 1, 4, 30);
  plate(bc);

  app.run("file.saveAs", { path: "target/catalog-scene.ecproj" });
  return "built " + (trs.length + fxs.length) + " comps" + (errors.length ? " ERRORS: " + errors.join(" | ") : "");
})();
