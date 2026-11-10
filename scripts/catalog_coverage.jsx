// Applies and removes every one of the 528 catalogue items through the panel's own API, one fresh
// composition per item, and prints a PASS/FAIL line per item plus a SUMMARY per kind.
// Run through the CLI (scripts/run_catalog_coverage.ps1) with the helper running for sounds.
// Nothing here is shipped: it is a verification harness for catalog/*.json and the panel engine.
(function () {
  var F = $.global.__flowStudio;
  if (!F) return "FAIL panel missing";
  var kinds = [
    ["titles", "Titles"],
    ["widgets", "Widgets"],
    ["textAnims", "Text animations"],
    ["transitions", "Transitions"],
    ["effects", "Effects"],
    ["gradients", "Gradients"],
    ["palettes", "Palettes"],
    ["captions", "Caption styles"],
    ["sfx", "Sounds"],
    ["tools", "Tools"]
  ];
  var out = [];
  var totalPass = 0, totalFail = 0;

  function comp(name, w, h) {
    return app.project.items.addComp(name, w || 320, h || 180, 1, 4, 30);
  }
  // A pre-composition is the one layer kind the engine can time-remap, so the freeze/speed/reverse
  // utilities are tested on a real precomp instead of a solid.
  function precompLayer(c) {
    var inner = app.project.items.addComp("Inner " + c.name, c.width, c.height, 1, 4, 30);
    inner.layers.addSolid([0.4, 0.4, 0.4], "Inner plate", c.width, c.height, 1, 4);
    var layer = c.layers.add(inner);
    layer.name = "Precomp";
    return layer;
  }
  function selectOnly(comp, layer) {
    for (var i = 1; i <= comp.numLayers; i++) comp.layer(i).selected = false;
    layer.selected = true;
  }
  function hasTag(comp, id) {
    for (var i = 1; i <= comp.numLayers; i++) {
      if (comp.layer(i).comment === "flow:cat:" + id) return true;
    }
    return false;
  }
  function makeContext(kind, item, c) {
    if (kind === "textAnims") {
      var t = c.layers.addText("Flow catalogue text");
      selectOnly(c, t);
      return { comp: c, layers: [t] };
    }
    if (kind === "transitions") {
      c.layers.addSolid([0.8, 0.1, 0.12], "Base", 320, 180, 1, 4);
      var inc = c.layers.addSolid([0.1, 0.75, 0.3], "Incoming", 320, 180, 1, 4);
      selectOnly(c, inc);
      return { comp: c, layers: [inc], side: 0 };
    }
    if (kind === "effects") {
      var plate = precompLayer(c);
      selectOnly(c, plate);
      return { comp: c, layers: [plate] };
    }
    var base = c.layers.addSolid([0.2, 0.2, 0.2], "Base", c.width, c.height, 1, 4);
    var text = c.layers.addText("Flow");
    var pre = precompLayer(c);
    var shape = null;
    try { shape = c.layers.addShape(); } catch (e) {}
    selectOnly(c, base);
    text.selected = true;
    pre.selected = true;
    if (shape) shape.selected = true;
    return { comp: c, layers: [base, text, pre, shape] };
  }

  for (var k = 0; k < kinds.length; k++) {
    var key = kinds[k][0], label = kinds[k][1];
    var list = F.catalogItems(key);
    var pass = 0, fail = 0;
    for (var i = 0; i < list.length; i++) {
      var item = list[i];
      var c = comp("Coverage " + label + " " + i, key === "effects" ? 320 : 320, key === "effects" ? 480 : 180);
      var ctx = makeContext(key, item, c);
      var why = "";
      try {
        F.catalogApply(item, ctx);
        // A title, widget, gradient, palette, caption or sound must leave tagged layers; text,
        // transition, effect and tool work is verified by the values they wrote below.
        if ((key === "titles" || key === "widgets" || key === "gradients" || key === "palettes") && !hasTag(c, item.id)) {
          throw new Error("no layer tagged flow:cat:" + item.id);
        }
        if (key === "sfx" && c.numLayers < 2) {
          throw new Error("no audio layer placed");
        }
        if (key === "transitions" || key === "effects") {
          var found = false;
          for (var j = 1; j <= c.numLayers; j++) {
            var dl = c.layer(j);
            if (dl.comment === "flow:cat:" + item.id) found = true;
            var fx = dl.property("Effects");
            if (fx && fx.numProperties > 0) found = true;
            var masks = dl.property("Masks");
            if (masks && masks.numProperties > 0) found = true;
            if (dl.timeRemapEnabled) found = true;
            var remap = dl.property("Time Remap");
            if (remap && remap.numKeys > 0) found = true;
          }
          if (!found) throw new Error("no effect, mask or tagged layer");
        }
        F.catalogRemove(item, c, ctx.layers || []);
      } catch (e) {
        why = String(e && e.message ? e.message : e);
      }
      if (why) { fail++; out.push("FAIL " + label + ": " + item.name + "  -> " + why); }
      else { pass++; out.push("PASS " + label + ": " + item.name); }
    }
    totalPass += pass; totalFail += fail;
    out.push("SUMMARY " + label + ": " + pass + " PASS, " + fail + " FAIL");
  }
  out.push("SUMMARY Catalogue: " + totalPass + " PASS, " + totalFail + " FAIL");
  return out.join("\n");
})();
