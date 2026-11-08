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
  var LIB_CATS = ["Titles", "Effects", "Transitions", "Generators", "Audio", "Favorites ★", "AE Scripts"];
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
    var favs = libFavorites();
    var all = [].concat(libTitles(), libEffects(), libItems(2), libGenerators(), libAudio(), libScripts());
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
    var swW = 28, swH = 28;
    var swX = w - swW - 12, swY = 18;
    var colB = it.cat === "Titles" || it.cat === "Generators" ? [0.25, 0.6, 0.95, 1] : it.cat === "Transitions" ? [0.95, 0.5, 0.2, 1] : it.cat === "Audio" ? [0.2, 0.8, 0.5, 1] : [0.7, 0.4, 0.9, 1];
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
        var colB = it.cat === "Titles" || it.cat === "Generators" ? [0.25, 0.6, 0.95, 1] : it.cat === "Transitions" ? [0.95, 0.5, 0.2, 1] : it.cat === "Audio" ? [0.2, 0.8, 0.5, 1] : [0.7, 0.4, 0.9, 1];
        g.newPath();
        g.rectPath(6, 8, 28, 28);
        g.fillPath(colorBrush(g, colB));
        g.drawString(String(it.name).substr(0, 20), colorPen(g, C.text, 1), 40, 8);
        g.drawString(String(it.sub || "").substr(0, 22), colorPen(g, C.muted, 1), 40, 26);
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
    var q = String(libSearch.text).toLowerCase();
    var items = libItems(cat);
    libShown = [];
    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      if (q && (it.name + " " + it.sub).toLowerCase().indexOf(q) < 0) continue;
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
    app.beginUndoGroup("Flow Library: " + it.name);
    var msg;
    try {
      msg = it.run(ctx);
    } catch (e2) {
      app.endUndoGroup();
      return fail(String(e2.message || e2));
    }
    app.endUndoGroup();
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
