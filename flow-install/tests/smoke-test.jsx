// Headless smoke test of the Flow Studio panel in EffectCraft's real script engine.
// Run (the helper must be running on port 9890, WAV_PATH must exist):
//   cat "extensions/scriptui-panels/Flow Studio.jsx" flow-install/tests/smoke-test.jsx > /tmp/flow-all.jsx
//   effectcraft-cli script /tmp/flow-all.jsx --empty --json
var WAV_PATH = (function () {
  var candidates = ["/tmp/speech.wav", "target/speech.wav", "target\\speech.wav", "../target/speech.wav"];
  for (var i = 0; i < candidates.length; i++) {
    var f = new File(candidates[i]);
    if (f.exists) return f.fsName || candidates[i];
  }
  return "target/speech.wav";
})();
var __results = [];
function check(name, ok, detail) {
  __results.push((ok ? "PASS " : "FAIL ") + name + (ok ? "" : "  -> " + detail));
}
function near(a, b, tol) {
  return Math.abs(a - b) <= (tol || 0.02);
}
function all(c, type, acc) {
  acc = acc || [];
  if (c.type === type) acc.push(c);
  var kids = c.children || [];
  for (var i = 0; i < kids.length; i++) all(kids[i], type, acc);
  return acc;
}
function button(text) {
  var b = all($.global.__flowStudio.ui, "button");
  for (var i = 0; i < b.length; i++) if (b[i].text === text || b[i]._en === text) return b[i];
  throw new Error("no button " + text);
}
function pump(n) {
  for (var i = 0; i < (n || 4000); i++) {
    var st = $.global.__flowStudio.status();
    $.global.__flowStudio.poll();
    if (/done\.|^! /.test($.global.__flowStudio.status())) return;
  }
}

(function () {
  var F = $.global.__flowStudio;
  check("panel builds", !!F && !!F.ui, "no handle");
  check("37 easings", F.easings.length === 37, F.easings.length);

  // ---- v3 shell: welcome screen, then a deterministic English UI for label lookups
  F.showWelcome(true);
  var welcomeBtns = all(F.welcome, "button");
  check("welcome screen is shown", F.welcomeVisible() === true, F.welcomeVisible());
  check("welcome has exactly 2 actions", welcomeBtns.length === 2, welcomeBtns.length);
  check("welcome hides the workspace", F.mainTabs.visible === false, F.mainTabs.visible);
  F.showWelcome(false);
  check("welcome can be skipped", F.welcomeVisible() === false && F.mainTabs.visible === true, F.welcomeVisible());

  check("switch to English", F.setLanguage("en") === true && F.language() === "en", F.language());
  check("English tab labels", F.mainTabs.children[0].text === "Library" && F.mainTabs.children[4].text === "Settings", F.mainTabs.children[0].text + "/" + F.mainTabs.children[4].text);
  check("English welcome title", F.welcome.children[0].text === "Welcome to Flow Studio", F.welcome.children[0].text);

  var comp = app.project.items.addComp("Test", 1920, 1080, 1, 8, 30);
  app.run("comp.open", { comp: comp.__id });
  var solid = comp.layers.addSolid([1, 0, 0], "S", 1920, 1080, 1, 8);

  // ---- Ease: between keyframes
  var pos = solid.transform.position;
  pos.setValueAtTime(0, [100, 100]);
  pos.setValueAtTime(2, [500, 300]);
  pos.selected = true;
  var drops = all(F.ui, "dropdownlist");
  var ease = dropWith("Linear");
  for (var i = 0; i < F.easings.length; i++) if (F.easings[i].id === "outCubic") ease.selection = i;
  button("Apply to selected properties").onClick();
  var v = pos.valueAtTime(1, false);
  check("ease between keys (outCubic @50% = 87.5%)", near(v[0], 450, 1) && near(v[1], 275, 1), JSON.stringify(v) + " " + F.status());
  var vEnd = pos.valueAtTime(2, false);
  check("ease reaches the last key", near(vEnd[0], 500, 0.5), JSON.stringify(vEnd));
  button("Remove expression").onClick();
  check("expression removed", pos.expression === "", pos.expression);

  // ---- Expression library: every entry evaluates to sane values
  var scale = solid.transform.scale, rot = solid.transform.rotation, op = solid.transform.opacity;
  var tl = comp.layers.addText("Hello Flow");
  var txt = tl.property("Source Text");
  F.library.forEach(function (e) {
    var params = {};
    e.params.forEach(function (p) { params[p[0]] = p[2]; });
    var code = F.fillTemplate(e.code, params);
    var prop = e.kind === "pos" ? pos : e.kind === "scale" ? scale : e.kind === "scalar" ? (e.id === "pulse" || e.id === "stagger" ? op : rot) : e.kind === "text" ? txt : pos;
    prop.expression = code;
    var ok = true, why = "", sample = "";
    [0, 0.5, 1.3, 3].forEach(function (t) {
      try {
        var val = prop.valueAtTime(t, false);
        sample = JSON.stringify(val && val.text !== undefined ? val.text : val);
        if (typeof val === "number") ok = ok && isFinite(val);
        else if (val instanceof Array) val.forEach(function (x) { ok = ok && typeof x === "number" && isFinite(x); });
        else if (val && val.text !== undefined) ok = ok && typeof val.text === "string";
        else ok = ok && typeof val === "string";
      } catch (err) {
        ok = false;
        why = String(err);
      }
    });
    if (prop.expressionError) {
      ok = false;
      why = prop.expressionError;
    }
    check("library: " + e.name, ok, why + " " + sample);
    prop.expression = "";
  });

  // ---- Silence
  var item = app.project.importFile(new ImportOptions(new File(WAV_PATH)));
  var alayer = comp.layers.add(item);
  alayer.selected = true;
  solid.selected = false;
  // Named detection profiles (data, not a model): each sets the detector and timings.
  var profDrop = dropWith("Standard");
  check("4 silence profiles", profDrop.items.length === 4 && profDrop.items[3].text === "Musique", profDrop.items.length);
  pick("Podcast");
  var pp = F.silenceParams();
  check("Podcast profile sets adaptive -33 dB / 0.35 s", pp.profile === 1 && pp.engine === 0 && pp.thresholdDb === -33 && pp.minSilence === 0.35 && pp.padBefore === 0.08 && pp.padAfter === 0.08, JSON.stringify(pp));
  pick("Musique");
  var mp = F.silenceParams();
  check("Musique profile sets fixed -45 dB / 1.0 s", mp.profile === 3 && mp.engine === 1 && mp.thresholdDb === -45 && mp.minSilence === 1.0 && mp.padBefore === 0.05 && mp.padAfter === 0.2, JSON.stringify(mp));
  pick("Standard");
  var sp2 = F.silenceParams();
  check("Standard profile restores adaptive -35 dB / 0.4 s", sp2.profile === 0 && sp2.engine === 0 && sp2.thresholdDb === -35 && sp2.minSilence === 0.4, JSON.stringify(sp2));
  button("Analyze").onClick();
  pump();
  check("silence analysis finished", /done\./.test(F.status()), F.status());
  var before = comp.numLayers;
  button("Apply").onClick();
  var pieces = [];
  for (var li = 1; li <= comp.numLayers; li++) if (/^speech.*\[\d+\]$/.test(comp.layer(li).name)) pieces.push(comp.layer(li));
  pieces.sort(function (a, b) { return a.inPoint - b.inPoint; });
  check("silence cut makes 2 clips", pieces.length === 2, pieces.length + " " + F.status());
  if (pieces.length === 2) {
    check("clip 1 timing 0..1.4", near(pieces[0].inPoint, 0, 0.04) && near(pieces[0].outPoint, 1.4, 0.04), pieces[0].inPoint + ".." + pieces[0].outPoint);
    check("clip 2 timing 1.4..2.6", near(pieces[1].inPoint, 1.4, 0.04) && near(pieces[1].outPoint, 2.6, 0.04), pieces[1].inPoint + ".." + pieces[1].outPoint);
    check("clip 2 source alignment (startTime = -2.0)", near(pieces[1].startTime, -2.0, 0.04), pieces[1].startTime);
  }
  check("original disabled", alayer.enabled === false, alayer.enabled);

  // ---- Captions
  var words = [["Bonjour", 0.5, 1.0], ["tout", 1.0, 1.3], ["le", 1.3, 1.4], ["monde", 1.4, 2.0]];
  var line = { start: 0.5, end: 2.0, words: words.map(function (w) { return { text: w[0], start: w[1], end: w[2] }; }) };
  F.setCaptions([line, { start: 3, end: 4, words: [{ text: "Salut", start: 3, end: 4 }] }], 0);
  var before2 = comp.numLayers;
  button("Create text layers").onClick();
  var caps = [];
  for (var ci = 1; ci <= comp.numLayers; ci++) if (comp.layer(ci).comment === "flow:caption") caps.push(comp.layer(ci));
  caps.sort(function (a, b) { return a.inPoint - b.inPoint; });
  check("2 caption layers", caps.length === 2, caps.length + " " + F.status());
  if (caps.length === 2) {
    var doc = caps[0].property("Source Text").value;
    check("caption text", doc.text === "Bonjour tout le monde", doc.text);
    check("caption timing", near(caps[0].inPoint, 0.5, 0.04) && near(caps[0].outPoint, 2.0, 0.04), caps[0].inPoint + ".." + caps[0].outPoint);
    check("caption font size", near(doc.fontSize, 54, 0.5), doc.fontSize);
    check("caption position (bottom)", near(caps[0].transform.position.value[1], 1080 * 0.88, 2), JSON.stringify(caps[0].transform.position.value));
    check("fade-in expression ends at 100%", near(caps[0].transform.opacity.valueAtTime(1.0, false), 100, 0.5), caps[0].transform.opacity.valueAtTime(1.0, false));
    check("fade-in starts at 0%", caps[0].transform.opacity.valueAtTime(0.5, false) < 5, caps[0].transform.opacity.valueAtTime(0.5, false));
  }
  // change the style and restyle
  var edits = all(F.ui, "edittext");
  var fill = null, size = null;
  edits.forEach(function (e) { if (e.text === "#FFFFFF" && !fill) fill = e; });
  fill.text = "#FF0000";
  var sizeField = null;
  edits.forEach(function (e) { if (e.text === "54") sizeField = e; });
  sizeField.text = "80";
  sizeField.onChange();
  button("Restyle all captions").onClick();
  var doc2 = caps[0].property("Source Text").value;
  check("restyle size 80", near(doc2.fontSize, 80, 0.5), doc2.fontSize);
  check("restyle colour red", near(doc2.fillColor[0], 1, 0.02) && near(doc2.fillColor[1], 0, 0.02), JSON.stringify(doc2.fillColor));

  // ---- Stroke without the plug-in: a clear message, no crash
  solid.selected = true;
  alayer.selected = false;
  button("Apply to selected layers").onClick();
  check("stroke without plug-in reports an error", /^! /.test(F.status()), F.status());

  // ---- Text animations (built-in, edited, saved as mine, exported, imported, deleted)
  function dropWith(label) {
    var d = all(F.ui, "dropdownlist");
    for (var i = 0; i < d.length; i++) {
      var items = d[i].items || [];
      for (var j = 0; j < items.length; j++) if (items[j].text === label || items[j].text === "★ " + label) return d[i];
    }
    throw new Error("no dropdown with " + label);
  }
  function pick(label) {
    var d = dropWith(label);
    for (var j = 0; j < d.items.length; j++) if (d.items[j].text === label || d.items[j].text === "★ " + label) d.selection = j;
    if (d.onChange) d.onChange();
  }
  function buttonNth(text, n) {
    var b = all(F.ui, "button"), k = 0;
    for (var i = 0; i < b.length; i++) if ((b[i].text === text || b[i]._en === text) && k++ === n) return b[i];
    throw new Error("no button " + text + " #" + n);
  }
  function editWith(text, n) {
    var e = all(F.ui, "edittext"), k = 0;
    for (var i = 0; i < e.length; i++) if (e[i].text === text && k++ === (n || 0)) return e[i];
    throw new Error("no edittext " + text);
  }
  check("10 built-in text animations", F.textBuiltin.length === 10, F.textBuiltin.length);
  check("10 built-in gradients", F.bgBuiltin.length === 10, F.bgBuiltin.length);

  var tx = comp.layers.addText("Hello Flow World");
  for (var li = 1; li <= comp.numLayers; li++) comp.layer(li).selected = false;
  tx.selected = true;
  pick("Fade Up");
  button("Apply to selected text").onClick();
  var animators = tx.property("ADBE Text Properties").property("ADBE Text Animators");
  check("text animator created", animators.numProperties === 1 && animators.property(1).name === "Flow: Fade Up", F.status());
  var startP = animators.property(1).property("ADBE Text Selectors").property(1).property("ADBE Text Percent Start");
  check("reveal starts at 0", near(startP.valueAtTime(tx.inPoint, false), 0, 0.5), startP.valueAtTime(tx.inPoint, false));
  check("reveal ends at 100", near(startP.valueAtTime(tx.inPoint + 5, false), 100, 0.5), startP.valueAtTime(tx.inPoint + 5, false));
  check("reveal eased (outCubic mid > 50)", startP.valueAtTime(tx.inPoint + 0.4, false) > 80, startP.valueAtTime(tx.inPoint + 0.4, false));
  var animProps = animators.property(1).property("ADBE Text Animator Properties");
  check("starts transparent and lower", near(animProps.property("ADBE Text Opacity").value, 0, 0.1) && near(animProps.property("ADBE Text Position 3D").value[1], 40, 0.1), "n=" + animProps.numProperties);
  button("Apply to selected text").onClick();
  check("re-apply does not stack animators", animators.numProperties === 1, animators.numProperties);

  pick("Words Slide");
  button("Apply to selected text").onClick();
  var selW = animators.property(1).property("ADBE Text Selectors").property(1).property("advanced").property("basedOn");
  check("words preset is based on words", animators.property(1).name === "Flow: Words Slide" && selW.value === 3, selW.value);
  pick("Random Fade");
  button("Apply to selected text").onClick();
  var rnd = animators.property(1).property("ADBE Text Selectors").property(1).property("advanced").property("randomize");
  check("random preset randomizes", rnd.value === 1, rnd.value);

  button("Remove Flow animation").onClick();
  check("remove clears Flow animators", animators.numProperties === 0, animators.numProperties);

  // my own: edit a built-in, save under my name
  pick("Pop In");
  editWith("Pop In").text = "My Wave";
  editWith("0", 0);
  button("Save as my preset").onClick();
  var stored = app.settings.getSetting("Flow Studio", "textPresets");
  check("my text preset is stored", stored.indexOf("My Wave") >= 0, stored);
  check("my preset keeps the built-in's scale", JSON.parse(stored)[0].scale === 0, stored);
  var listed = false;
  var td = dropWith("My Wave");
  for (var q = 0; q < td.items.length; q++) if (td.items[q].text === "★ My Wave") listed = true;
  check("my preset is listed with a star", listed, "");
  button("Apply to selected text").onClick();
  check("my preset applies", animators.numProperties === 1 && animators.property(1).name === "Flow: My Wave", F.status());
  button("Remove Flow animation").onClick();
  editWith("My Wave").text = "Fade Up";
  button("Save as my preset").onClick();
  check("cannot overwrite a built-in name", /^! /.test(F.status()), F.status());
  pick("My Wave");
  buttonNth("Export my presets", 0).onClick();
  var box = all(F.ui, "edittext").filter(function (e) { return /^\[\{"name":"My Wave"/.test(e.text); })[0];
  check("export shows JSON", !!box, F.status());
  box.text = '[{"name":"Hostile <b>","unit":"evil","duration":"abc","scale":1e9,"easing":"nope","position":[1,"x"]},{"name":"Good One","unit":"words","opacity":10}]';
  buttonNth("Import", 0).onClick();
  var after = JSON.parse(app.settings.getSetting("Flow Studio", "textPresets"));
  var hostile = after.filter(function (x) { return x.name === "Hostile b"; })[0];
  check("import sanitizes bad fields", !!hostile && hostile.unit === "chars" && hostile.easing === "linear" && hostile.scale === 1000 && !hostile.position, JSON.stringify(after));
  box.text = "not json";
  buttonNth("Import", 0).onClick();
  check("import rejects bad JSON", /^! /.test(F.status()), F.status());
  pick("Good One");
  button("Delete my preset").onClick();
  var afterDel = JSON.parse(app.settings.getSetting("Flow Studio", "textPresets"));
  check("delete removes my preset", afterDel.filter(function (x) { return x.name === "Good One"; }).length === 0 && afterDel.length === 2, JSON.stringify(afterDel));
  pick("Fade Up");
  button("Delete my preset").onClick();
  check("cannot delete a built-in", /^! /.test(F.status()), F.status());

  // ---- Gradient backgrounds
  var layersBefore = comp.numLayers;
  tx.selected = false;
  pick("Sunset");
  button("Add background").onClick();
  var bgLayer = comp.layer(comp.numLayers);
  check("background added at the bottom", comp.numLayers === layersBefore + 1 && bgLayer.comment === "flow:bg" && bgLayer.name === "Flow BG: Sunset", bgLayer.name + " " + F.status());
  var ramp = bgLayer.property("ADBE Effect Parade").property(1);
  var sc = ramp.property("Start Color").value;
  check("linear ramp colour 1 = #FF512F", near(sc[0], 1, 0.01) && near(sc[1], 0.318, 0.01) && near(sc[2], 0.184, 0.01), JSON.stringify(sc));
  var ep = ramp.property("End of Ramp").value, sp0 = ramp.property("Start of Ramp").value;
  check("45 degree ramp spans the frame diagonally", ep[0] > sp0[0] && ep[1] > sp0[1] && near((ep[0] + sp0[0]) / 2, 960, 1) && near((ep[1] + sp0[1]) / 2, 540, 1), JSON.stringify([sp0, ep]));

  pick("Ocean");
  for (var z = 1; z <= comp.numLayers; z++) comp.layer(z).selected = false;
  bgLayer.selected = true;
  button("Update selected").onClick();
  var ramp2 = bgLayer.property("ADBE Effect Parade").property(1);
  check("update replaces the gradient (one effect)", bgLayer.property("ADBE Effect Parade").numProperties === 1 && bgLayer.name === "Flow BG: Ocean", bgLayer.name);
  var a0 = ramp2.property("Start of Ramp").valueAtTime(0, false), a1 = ramp2.property("Start of Ramp").valueAtTime(2, false);
  check("rotate motion moves the ramp over time", Math.abs(a0[0] - a1[0]) + Math.abs(a0[1] - a1[1]) > 5, JSON.stringify([a0, a1]));

  pick("Aurora");
  button("Add background").onClick();
  var four = comp.layer(comp.numLayers).property("ADBE Effect Parade").property(1);
  var g = four.property(1);
  check("4-colour gradient sets 4 colours", near(g.property(2).value[0], 0, 0.01) && near(g.property(2).value[1], 0.96, 0.02) && near(g.property(8).value[2], 1, 0.01), JSON.stringify([g.property(2).value, g.property(8).value]));
  var d0 = g.property(1).valueAtTime(0, false), d1 = g.property(1).valueAtTime(1.3, false);
  check("drift moves the points", Math.abs(d0[0] - d1[0]) + Math.abs(d0[1] - d1[1]) > 5, JSON.stringify([d0, d1]));

  pick("Spotlight");
  button("Add background").onClick();
  var rad = comp.layer(comp.numLayers).property("ADBE Effect Parade").property(1);
  check("radial ramp shape", rad.property("Ramp Shape").value === 2, rad.property("Ramp Shape").value);

  // my own gradient
  pick("Gold");
  editWith("#F7971E").text = "#00FF00";
  editWith("Gold").text = "My Green";
  buttonNth("Save as my preset", 1).onClick();
  var bstored = app.settings.getSetting("Flow Studio", "bgPresets");
  check("my gradient is stored", bstored.indexOf("My Green") >= 0 && bstored.indexOf("#00FF00") >= 0, bstored);
  editWith("#00FF00").text = "red";
  buttonNth("Save as my preset", 1).onClick();
  check("bad colour is refused", /^! /.test(F.status()), F.status());
  pick("My Green");
  buttonNth("Delete my preset", 1).onClick();
  check("my gradient deleted", JSON.parse(app.settings.getSetting("Flow Studio", "bgPresets")).length === 0, app.settings.getSetting("Flow Studio", "bgPresets"));

  // ---- Effects
  var fxSolid = comp.layers.addSolid([0.5, 0.5, 0.5], "FX", 1920, 1080, 1, 8);
  for (var fz = 1; fz <= comp.numLayers; fz++) comp.layer(fz).selected = false;
  fxSolid.selected = true;
  check("16 effects", F.fx.length === 16, F.fx.length);
  F.fx.forEach(function (fx) {
    pick(fx.name);
    var drop = dropWith(fx.name);
    button("Apply effect").onClick();
    var parade = fxSolid.property("ADBE Effect Parade");
    var found = false;
    for (var q = 1; q <= parade.numProperties; q++) if (String(parade.property(q).name).indexOf("Flow: " + fx.name) === 0) found = true;
    check("effect " + fx.name, found && !/^! /.test(F.status()), F.status());
  });
  var shake = fxSolid.property("ADBE Effect Parade").property("Flow: Shake");
  var sa = shake.property("Position").valueAtTime(0.01, false), sb = shake.property("Position").valueAtTime(3, false);
  var base = [960, 540];
  check("shake moves inside its window and rests after", Math.abs(sa[0] - base[0]) + Math.abs(sa[1] - base[1]) > 1 && near(sb[0], base[0], 0.001) && near(sb[1], base[1], 0.001), JSON.stringify([sa, sb, base]));
  var flash = fxSolid.property("ADBE Effect Parade").property("Flow: Flash").property("Master").property("Exposure");
  var f0 = flash.valueAtTime(0, false), f1 = flash.valueAtTime(3, false);
  check("flash fires in its window (at playhead 0) and rests after", f0 > 1 && near(f1, 0, 0.001), f0 + " " + f1);
  var punch = fxSolid.property("ADBE Effect Parade").property("Flow: Zoom Punch").property("Scale Height");
  check("zoom punch starts big, ends at 100", punch.valueAtTime(0, false) > 130 && near(punch.valueAtTime(3, false), 100, 0.01), punch.valueAtTime(0, false));
  var pix = fxSolid.property("ADBE Effect Parade").property("Flow: Pixel Reveal").property("Horizontal Blocks");
  check("pixel reveal starts coarse", pix.valueAtTime(0, false) <= 10, pix.valueAtTime(0, false));
  pick("Blur Out");
  button("Remove Flow effects").onClick();
  check("remove clears every Flow effect", fxSolid.property("ADBE Effect Parade").numProperties === 0, fxSolid.property("ADBE Effect Parade").numProperties);

  // ---- Sounds (pack via sfx.pack.list; built-in stays the fallback)
  check("sound source offers pack / built-in / my folder", F.sfxSource.items.length === 3, F.sfxSource.items.length);
  F.sfxSource.selection = 0;
  F.sfxSource.onChange();
  F.loadSounds();
  check("pack sounds listed", /sons du pack/.test(F.status()), F.status());
  var sl = all(F.ui, "listbox").filter(function (l) { return l.items.length === 84; })[0];
  check("84 pack sounds", !!sl, "list=" + (sl ? sl.items.length : 0));
  sl.selection = 0;
  comp.time = 2;
  for (var sz = 1; sz <= comp.numLayers; sz++) comp.layer(sz).selected = false;
  var before = comp.numLayers;
  button("Add at playhead").onClick();
  var sfxLayer = comp.layer(1);
  check("sound added at the playhead", comp.numLayers === before + 1 && sfxLayer.comment === "flow:sfx" && near(sfxLayer.startTime, 2, 0.01) && sfxLayer.hasAudio, sfxLayer.name + " " + sfxLayer.startTime + " " + F.status());
  for (var sw = 1; sw <= comp.numLayers; sw++) comp.layer(sw).selected = false;
  tx.selected = true;
  fxSolid.selected = true;
  button("Add at selected layers").onClick();
  var n = 0;
  for (var sy = 1; sy <= comp.numLayers; sy++) if (comp.layer(sy).comment === "flow:sfx") n++;
  check("sound added at each selected layer's start", n === 3, n + " " + F.status());
  var mine = F.sfxFolder;
  mine.text = (function () {
    var f1 = new Folder("/tmp/flowtest/sfx");
    if (f1.exists) return "/tmp/flowtest/sfx";
    return (new Folder("target/flowtest/sfx")).fsName || "target/flowtest/sfx";
  })();
  button("Scan my folder").onClick();
  check("scan finds the user's sounds", /20 sounds found/.test(F.status()), F.status());

  // ---- Library (one panel like Resolve's Effects Library)
  function libGo(catName) {
    if (!F.libCategory(catName)) throw new Error("unknown library category " + catName);
  }
  function libCount() { return F.libShown().length; }
  function libPick(name) {
    var items = F.libShown();
    for (var q = 0; q < items.length; q++) if (items[q].name === name) { F.libSelect(q); return; }
    throw new Error("not in the library: " + name);
  }
  function deselectAll() {
    for (var d = 1; d <= comp.numLayers; d++) comp.layer(d).selected = false;
  }
  libGo("Titles");
  check("14+ titles", libCount() >= 14, libCount());
  deselectAll();
  comp.time = 1;
  var nBefore = comp.numLayers;
  libPick("Lower Third");
  button("Add to timeline").onClick();
  var title = comp.layer(1);
  check("title lands at the playhead with an animation", comp.numLayers === nBefore + 1 && title.comment === "flow:title" && near(title.inPoint, 1, 0.02) && title.property("ADBE Text Properties").property("ADBE Text Animators").numProperties === 1, F.status());
  libPick("Heading");
  button("Add to timeline").onClick();
  check("second title added", comp.numLayers === nBefore + 2, F.status());

  libGo("Effects");
  check("effects listed", libCount() === 16, libCount());
  deselectAll();
  var adjBefore = comp.numLayers;
  libPick("Glitch");
  button("Add to timeline").onClick();
  check("effect with nothing selected makes an adjustment layer", comp.numLayers === adjBefore + 1 && comp.layer(1).adjustmentLayer === true && comp.layer(1).property("ADBE Effect Parade").numProperties === 1, F.status());
  deselectAll();
  fxSolid.selected = true;
  libPick("Blur In");
  button("Add to timeline").onClick();
  check("effect on the selected layer", fxSolid.property("ADBE Effect Parade").property("Flow: Blur In") !== null, F.status());

  libGo("Transitions");
  check("18 transitions", libCount() === 18, libCount());
  var trLayer = comp.layers.addSolid([0, 0.5, 1], "TR", 1920, 1080, 1, 6);
  trLayer.startTime = 0;
  deselectAll();
  trLayer.selected = true;
  all(F.ui, "dropdownlist").filter(function (d) { return d.items.length === 3 && d.items[2].text === "Both"; })[0].selection = 2;
  libPick("Cross Dissolve");
  button("Add to timeline").onClick();
  var tOp = trLayer.property("ADBE Effect Parade");
  var tin = tOp.property("Flow: Cross Dissolve in").property("Opacity"), tout = tOp.property("Flow: Cross Dissolve out").property("Opacity");
  check("dissolve in: 0 at start, 100 after", near(tin.valueAtTime(0, false), 0, 0.5) && near(tin.valueAtTime(2, false), 100, 0.5), tin.valueAtTime(0, false) + " " + tin.valueAtTime(2, false));
  check("dissolve out: 100 before, 0 at the end", near(tout.valueAtTime(2, false), 100, 0.5) && near(tout.valueAtTime(6, false), 0, 0.5), tout.valueAtTime(2, false) + " " + tout.valueAtTime(6, false));
  libPick("Wipe to Right");
  button("Add to timeline").onClick();
  var wipe = tOp.property("Flow: Wipe to Right in").property("Transition Completion");
  check("wipe completes from 100 to 0", near(wipe.valueAtTime(0, false), 100, 0.5) && near(wipe.valueAtTime(2, false), 0, 0.5), wipe.valueAtTime(0, false));
  libPick("Slide Left");
  button("Add to timeline").onClick();
  var slide = tOp.property("Flow: Slide Left in").property("Position");
  check("slide starts off-screen and ends in place", slide.valueAtTime(0, false)[0] > 1920 && near(slide.valueAtTime(2, false)[0], 960, 0.5), JSON.stringify(slide.valueAtTime(0, false)));
  for (var ti = 0; ti < F.transitions.length; ti++) {
    libPick(F.transitions[ti].name);
    button("Add to timeline").onClick();
    check("transition " + F.transitions[ti].name, !/^! /.test(F.status()), F.status());
  }

  libGo("Generators");
  check("generators listed", libCount() >= 14, libCount());
  deselectAll();
  var gb = comp.numLayers;
  libPick("Solid Color");
  button("Add to timeline").onClick();
  check("solid colour generator", comp.numLayers === gb + 1 && comp.layer(1).comment === "flow:generator", F.status());
  libPick("Grey Scale");
  button("Add to timeline").onClick();
  var gs = comp.layer(1).property("ADBE Effect Parade").property(1);
  check("grey scale is a black-to-white ramp", near(gs.property("Start Color").value[0], 0, 0.01) && near(gs.property("End Color").value[0], 1, 0.01), F.status());
  libPick("Aurora");
  button("Add to timeline").onClick();
  check("gradient generator goes to the bottom", comp.layer(comp.numLayers).comment === "flow:bg", F.status());

  libGo("Audio");
  check("audio list has tools and 84 sounds", libCount() === 89, libCount());
  deselectAll();
  comp.time = 3;
  var ab = comp.numLayers;
  libPick("Sweep down");
  button("Add to timeline").onClick();
  var wl = comp.layer(1);
  check("sound placed at the playhead from the library", comp.numLayers === ab + 1 && wl.comment === "flow:sfx" && near(wl.startTime, 3, 0.02), F.status());
  deselectAll();
  wl.selected = true;
  libPick("Audio Fade In");
  button("Add to timeline").onClick();
  var lv = wl.property("ADBE Audio Group").property("ADBE Audio Levels");
  check("audio fade in starts at -60 dB and reaches 0", lv.valueAtTime(wl.inPoint, false)[0] <= -59 && near(lv.valueAtTime(wl.inPoint + 5, false)[0], 0, 0.1), JSON.stringify(lv.valueAtTime(wl.inPoint, false)) + F.status());
  libPick("Lower by 12 dB");
  button("Add to timeline").onClick();
  check("lower by 12 dB", near(lv.valueAtTime(wl.inPoint + 1, false)[0], -12, 0.1), JSON.stringify(lv.valueAtTime(wl.inPoint + 1, false)));
  deselectAll();
  libPick("Mute");
  button("Add to timeline").onClick();
  check("tools need a selected layer", /^! /.test(F.status()), F.status());

  // favourites and search
  libGo("Audio");
  libPick("Sweep down");
  button("★ Favorite").onClick();
  libGo("Favorites ★");
  check("favourite shows in Favorites", libCount() === 1 && /Sweep down/.test(F.libShown()[0].name), libCount());
  button("★ Favorite").onClick();
  check("un-favourite empties it", libCount() === 0, libCount());
  libGo("Effects");
  var searchBox = all(F.ui, "edittext").filter(function (e) { return e.onChanging && e.minimumSize && e.minimumSize[0] === 90; })[0];
  searchBox.text = "blur";
  searchBox.onChanging();
  check("search filters the list", libCount() === 2, libCount());
  searchBox.text = "";
  searchBox.onChanging();

  // ---- Models tab talks to the helper
  button("Connect / refresh").onClick();
  check("models list loads", /Connected/.test(F.status()), F.status());

  // ================================================================== NEW FEATURES (Flow Studio v2)

  // 1. Consolidated Tab Layout (5 main tabs, clean sub-tab grouping)
  check("5 main tabs (Library, Montage, Animer, Look, Réglages)", F.mainTabs && F.mainTabs.children && F.mainTabs.children.length === 5, F.mainTabs ? F.mainTabs.children.length : "none");
  check("Montage sub-tabs (Silence, Captions, Sounds)", F.montageSub && F.montageSub.children && F.montageSub.children.length === 3, F.montageSub ? F.montageSub.children.length : "none");
  check("Animer sub-tabs (Ease, Expressions, Text)", F.animSub && F.animSub.children && F.animSub.children.length === 3, F.animSub ? F.animSub.children.length : "none");
  check("Look sub-tabs (Background, Effects, Stroke)", F.lookSub && F.lookSub.children && F.lookSub.children.length === 3, F.lookSub ? F.lookSub.children.length : "none");
  check("Réglages sub-tabs (Models, Helper/Aide, Pack Presets)", F.settingsSub && F.settingsSub.children && F.settingsSub.children.length === 3, F.settingsSub ? F.settingsSub.children.length : "none");

  // 2. Beat Detection (tempo analysis & markers)
  alayer.selected = true;
  for (var si = 1; si <= comp.numLayers; si++) if (comp.layer(si) !== alayer) comp.layer(si).selected = false;
  button("Detect Beats").onClick();
  pump();
  check("beat detection ran", /marqueurs.*posés|BPM|done\./.test(F.status()), F.status());

  // 3. Karaoke Subtitles
  var karoDrop = all(F.ui, "dropdownlist").filter(function (d) { return d.items && d.items.length >= 4 && /Hormozi/.test(d.items[1].text); })[0];
  check("karaoke dropdown available", !!karoDrop, "no karaoke dropdown");
  if (karoDrop) {
    karoDrop.selection = 1; // Hormozi (Pop jaune)
    var capsBefore = comp.numLayers;
    button("Create text layers").onClick();
    var karoLayer = null;
    for (var ki = 1; ki <= comp.numLayers; ki++) {
      if (comp.layer(ki).comment === "flow:caption:karaoke:hormozi") {
        karoLayer = comp.layer(ki);
        break;
      }
    }
    check("karaoke text layer created with Hormozi tag", !!karoLayer, F.status());
    if (karoLayer) {
      check("karaoke layer has a word pop expression", karoLayer.transform.scale.expression.indexOf("E(t)") >= 0, karoLayer.transform.scale.expression);
    }
  }

  // 4. ASS Subtitle Export (karaoke mode is active)
  button("Export ASS").onClick();
  var assMatch = /Saved ASS:\s*(.+\.ass)/.exec(F.status());
  check("export ASS format", !!assMatch, F.status());
  if (assMatch) {
    var assFile = new File(assMatch[1]);
    var assText = "";
    if (assFile.open("r")) { assText = assFile.read(); assFile.close(); }
    check("exported ASS contains karaoke timing tags", /\{\\k\d+\}/.test(assText), assText.substr(0, 120));
  }

  // 5. Preset Pack Export & Import
  button("Export pack").onClick();
  check("preset pack export", /Pack.*exporté/.test(F.status()), F.status());
  button("Import pack").onClick();
  check("preset pack import", /Pack importé/.test(F.status()), F.status());

  // 6. AE Utility Scripts in Library
  libGo("AE Scripts");
  check("AE Scripts category present", libCount() >= 6, libCount());
  // Test Auto Nulls
  deselectAll();
  solid.selected = true;
  alayer.selected = true;
  var countBefore = comp.numLayers;
  libPick("Auto Nulls");
  button("Add to timeline").onClick();
  var createdNull = comp.layer(1);
  check("Auto Null created", comp.numLayers === countBefore + 1 && createdNull.nullLayer === true && solid.parent === createdNull, F.status());
  // Test Anchor Snap
  deselectAll();
  solid.selected = true;
  libPick("Anchor Snap");
  button("Add to timeline").onClick();
  check("Anchor Snap applied", /Point d'ancrage centré/.test(F.status()), F.status());
  // Test Bounce
  deselectAll();
  solid.selected = true;
  libPick("Bounce");
  button("Add to timeline").onClick();
  check("Bounce expression applied", solid.transform.position.expression.indexOf("nearestKey") >= 0, solid.transform.position.expression);
  // Test Sequence Layers
  deselectAll();
  solid.selected = true;
  alayer.selected = true;
  libPick("Sequence Layers");
  button("Add to timeline").onClick();
  check("Sequence Layers staggered layers", /calques décalés/.test(F.status()), F.status());
  // Test Text Exploder
  deselectAll();
  var expText = comp.layers.addText("WordOne WordTwo");
  expText.selected = true;
  libPick("Text Exploder");
  button("Add to timeline").onClick();
  check("Text Exploder created word layers", /Texte explosé/.test(F.status()), F.status());

  // ================================================================== Flow Studio v3 shell & data
  // 1. Library: 2-column grid, six tiles per page, working pager.
  libGo("Titles");
  var libTiles = all(F.ui, "button").filter(function (b) { return b._itemIndex !== undefined; });
  check("v3 library grid is 2 columns x 3 rows", libTiles.length === 6, libTiles.length);
  var titlesTotal = libCount();
  check("v3 library pages hold 6 items", titlesTotal > 6 && F.libPages() === Math.ceil(titlesTotal / 6), titlesTotal + "/" + F.libPages());
  check("v3 library starts on page 1", F.libPage() === 0, F.libPage());
  F.libSelect(6);
  check("v3 selecting item 7 opens page 2", F.libPage() === 1 && F.libSelected().name === F.libShown()[6].name, F.libPage());
  var nextPage = all(F.ui, "button").filter(function (b) { return b.text === F.tr("nextPage"); })[0];
  check("v3 pager button exists", !!nextPage, "no next page button");
  if (nextPage) nextPage.onClick();
  check("v3 pager moves to page 3", F.libPage() === 2, F.libPage());
  F.libCategory("Titles");
  F.libSelect(0);

  // 2. Caption style thumbnails: eight tiles, clicking one fills the editor.
  var styleTiles = all(F.ui, "button").filter(function (b) { return b._styleIndex !== undefined; });
  check("v3 style grid has 8 thumbnails", styleTiles.length === 8, styleTiles.length);
  check("v3 ships 8 caption styles", F.styleCount() >= 8, F.styleCount());
  if (styleTiles.length === 8) {
    styleTiles[7].onClick();
    check("v3 clicking a style tile selects it", F.styleIndex() === 7, F.styleIndex());
    var styleNameField = all(F.ui, "edittext").filter(function (e) { return e.text === "Karaoke"; })[0];
    check("v3 style tile fills the editor", !!styleNameField, "no Karaoke style name");
  }

  // 3. Preset pack: a real JSON file written by the helper, then loaded back.
  button("Export pack").onClick();
  var packPath = F.lastPackPath();
  var packJson = F.lastPackJson();
  check("v3 pack export writes a .json file", /\.json$/i.test(packPath), packPath);
  check("v3 pack file exists on disk", !!packPath && new File(packPath).exists, packPath);
  check("v3 pack json has every section", /"schema"\s*:\s*1/.test(packJson) && /"text"\s*:/.test(packJson) && /"backgrounds"\s*:/.test(packJson) && /"captionStyles"\s*:/.test(packJson) && /"settings"\s*:/.test(packJson), packJson.substr(0, 140));
  check("v3 pack carries the saved text presets", /"My Wave"/.test(packJson), "no My Wave in the pack");
  button("Load this file").onClick();
  check("v3 pack loads back from its file", /Pack importé/.test(F.status()), F.status());

  // 4. Language switching: the whole shell follows en -> ar -> en.
  check("v3 switch to English", F.setLanguage("en") === true && F.language() === "en", F.language());
  check("v3 English tab labels", F.mainTabs.children[0].text === "Library" && F.mainTabs.children[4].text === "Settings", F.mainTabs.children[0].text + "/" + F.mainTabs.children[4].text);
  check("v3 English welcome title", F.welcome.children[0].text === "Welcome to Flow Studio", F.welcome.children[0].text);
  check("v3 switch to Arabic", F.setLanguage("ar") === true && F.language() === "ar", F.language());
  check("v3 Arabic tab labels", F.mainTabs.children[0].text === F.tr("library") && F.mainTabs.children[4].text === F.tr("settings"), F.mainTabs.children[0].text + "/" + F.mainTabs.children[4].text);
  check("v3 Arabic welcome title", F.welcome.children[0].text === F.tr("welcome.title"), F.welcome.children[0].text);
  check("v3 back to English", F.setLanguage("en") === true && F.mainTabs.children[0].text === "Library", F.mainTabs.children[0].text);

  // 5. Theme switching repaints without touching content.
  var labelBeforeTheme = F.mainTabs.children[0].text;
  check("v3 dark theme", F.setTheme("dark") === true && F.theme() === "dark", F.theme());
  check("v3 light theme", F.setTheme("light") === true && F.theme() === "light", F.theme());
  check("v3 theme keeps labels", F.mainTabs.children[0].text === labelBeforeTheme, F.mainTabs.children[0].text);
  F.setTheme("auto");

  // 6. Exactly one primary action per leaf screen, and one on the welcome screen.
  var tabList = all(F.ui, "tab");
  var leafTabs = tabList.filter(function (t) { return all(t, "tab").filter(function (x) { return x !== t; }).length === 0; });
  var primaryProblems = [];
  for (var lt = 0; lt < leafTabs.length; lt++) {
    var primaries = all(leafTabs[lt], "button").filter(function (b) { return b.isPrimary === true; });
    if (primaries.length !== 1) primaryProblems.push(leafTabs[lt].text + "=" + primaries.length);
  }
  check("v3 has 13 leaf screens", leafTabs.length === 13, leafTabs.length);
  check("v3 one primary action per screen", primaryProblems.length === 0, primaryProblems.join(", "));
  check("v3 welcome has one primary action", all(F.welcome, "button").filter(function (b) { return b.isPrimary === true; }).length === 1, "welcome primaries");

  // 7. Arabic captions are right-justified and placed against the right edge.
  var karoMode = all(F.ui, "dropdownlist").filter(function (d) { return d._en === "Karaoke Mode"; })[0];
  if (karoMode) karoMode.selection = 0;
  F.setCaptions([{ start: 1, end: 2.5, words: [
    { text: "\u0645\u0631\u062d\u0628\u0627", start: 1, end: 1.6 },
    { text: "\u0628\u0627\u0644\u0639\u0627\u0644\u0645", start: 1.6, end: 2.5 }
  ] }], 0);
  var arBefore = comp.numLayers;
  button("Create text layers").onClick();
  var arLayer = comp.layer(1);
  check("v3 Arabic caption layer created", comp.numLayers === arBefore + 1 && arLayer.comment === "flow:caption", F.status());
  var arDoc = arLayer.property("Source Text").value;
  check("v3 Arabic caption is right justified", arDoc.justification === ParagraphJustification.RIGHT_JUSTIFY, arDoc.justification);
  check("v3 Arabic caption sits on the right edge", arLayer.transform.position.value[0] > comp.width / 2, arLayer.transform.position.value[0]);
})();
__results.join("\n");
