// ================================================================== Catalogue screens
//
// The catalogue lives inside the Library tab, so the panel keeps its five tabs. The kind and
// family dropdowns narrow 528 presets down to a handful of cards; the search box also matches
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
