# Screens

14 screens: the welcome plus 13 leaf screens inside 5 top tabs. Every screen has **exactly one
primary (accent) action**. Copy is given in French (primary language of the panel); the English
and Arabic equivalents are in `strings.json`.

Top tabs and sub-tabs:

```
Library
Montage  → Silence · Captions · Sounds
Animer   → Ease · Expressions · Text
Look     → Background · Effects · Stroke
Réglages → Models · Helper & setup · Preset pack
```

---

## 01 · Welcome

- **When** first launch only; reopen from Réglages ▸ Helper & setup.
- **Layout** centred column, 12 px padding: title 15/700, body 11/400 (wrapped), status line
  10/400 coloured, two buttons.
- **Copy** "Bienvenue dans Flow Studio"; body: "Flow Studio fait le montage à votre place :
  silences, sous-titres, karaoké, rythme, effets. Certaines fonctions ont besoin du petit
  assistant local (helper)."
- **Actions** primary **Vérifier le helper** (becomes **Réessayer** on failure); secondary
  **Continuer sans helper**.
- **States** idle, checking (progress bar), success (green status), failure (red status +
  retry), skipped.

## 02 · Library

- **Layout** SectionHeader → search row → 8 chips (2 rows of 4 at narrow widths) → count +
  "Récents ›" → 3 × 2 card grid → pager → preview sheet.
- **Header** eyebrow `COLLECTION`, title **Bibliothèque créative**, count `14 / 14`.
- **Search** magnifier + "Rechercher un effet…" + `⌘K`.
- **Chips** Titres · Effets · Transitions (active) · Dégradés / Sons · ★ Favoris · Scripts ·
  Catalogue.
- **Cards** illustrated, star top-right, selected accent border, double-click adds.
- **Preview** `SÉLECTION`, name, kind, tags, thumbnail, Début | Fin | Les deux, Duration,
  Strength, **Ajouter à la timeline**.
- **States** empty category, no search result, disabled preset (native effect missing), no
  selection.
- **Note** the catalogue chip shows 525 presets; the count is `shown / total`.

## 03 · Montage ▸ Silence

- **Sections** hint 10/400; waveform 72 (silent red, speech green, threshold dashed); profile
  dropdown (Standard, Podcast, Interview, Musique); action dropdown (Couper et raccorder
  (Ripple), Marqueurs seulement); checkbox "Conserver le calque original"; checkbox "Mode
  avancé" revealing detector, threshold dB, min silence, pad before/after; buttons.
- **Actions** primary **Analyser les silences**; secondary **Couper les silences**;
  **Détecter le tempo & poser des marqueurs**; **Couper sur le tempo**.
- **Empty** "Sélectionnez un calque audio et cliquez sur Analyser".
- **Copy** "Détecte et supprime automatiquement les blancs dans votre vidéo ou voix-off."

## 04 · Montage ▸ Captions

- **Sections** hint; language dropdown (Auto-detect, Français, العربية, English, Español,
  Deutsch); model dropdown (Whisper Small recommended, Base, Tiny, Large v3 Turbo); karaoke
  dropdown (Désactivé (Classique), Hormozi (Pop jaune), Word Pop (Échelle), Karaoke
  (Surlignage)); style preview tile; 4 × 2 style grid; advanced style panel (font, style, size,
  text colour, stroke colour, stroke width, drop shadow, uppercase, position top/middle/bottom,
  edge margin, animation none/fade/pop/slide up, animation duration, easing, max words, max
  chars, save as); import row (SRT/VTT path + **Importer un fichier de sous-titres**).
- **Actions** primary **Générer depuis le calque**; secondary **Vérifier Whisper**, **Installer
  le modèle**, **Enregistrer le style**, **Supprimer**, **Créer les calques de texte**,
  **Re-styliser tous les sous-titres**, **Exporter SRT**, **Exporter ASS**.
- **Copy** "Génère des sous-titres synchronisés par IA (Whisper) avec styles et karaoké." Steps:
  "1. Générez depuis un calque ou importez un fichier. 2. Choisissez un style ou un mode
  karaoké. 3. Créez les calques."
- **Arabic** RTL text and right-anchored captions; keep the shell LTR.

## 05 · Montage ▸ Sounds

- **Sections** source dropdown (Pack de sons, Intégrés (d'origine), Mon dossier); folder field +
  **Scanner mon dossier**; search; 84-item list with waveform; level dB field; insert buttons.
- **Actions** primary **Ajouter à la tête de lecture**; secondary **Ajouter aux calques
  sélectionnés**.
- **Copy** "Le pack (84 sons CC0) est lu via le helper Flow. Les sons intégrés sont générés sur
  votre ordinateur. Glissez vos propres WAV dans un dossier et scannez-le."
- **States** helper offline (list falls back to built-ins), empty folder, playing.

## 06 · Animer ▸ Ease

- **Sections** easing dropdown (37 curves); curve preview 120×80; mode dropdown (Between
  keyframes, Intro (from a value)); From field; Delay; Duration; buttons.
- **Actions** primary **Appliquer aux propriétés sélectionnées**; secondary **Supprimer
  l'expression**.
- **Copy** "Choisissez une courbe, puis appliquez-la aux propriétés sélectionnées."

## 07 · Animer ▸ Expressions

- **Sections** search field; expression list; parameter sliders; code view.
- **Actions** primary **Appliquer l'expression**; secondary **Voir le code**.
- **Copy** "Choisissez une expression, réglez ses valeurs, puis appliquez-la à la propriété
  sélectionnée."

## 08 · Animer ▸ Text

- **Sections** Animate dropdown (chars, words, lines); Easing; Duration; Delay; Softness;
  Random order checkbox; start state (opacity %, offset X/Y, scale %, rotation °, blur, tracking);
  preset name; export/import.
- **Actions** primary **Appliquer au texte sélectionné**; secondary **Supprimer l'animation
  Flow**, **Enregistrer dans mes presets**, **Supprimer mon preset**, **Exporter mes presets**,
  **Importer**.
- **Copy** "Choisissez une animation, réglez son départ, puis appliquez-la au texte sélectionné."

## 09 · Look ▸ Background

- **Sections** type dropdown (linear, radial, 4 colours); colour fields 1–4; angle; motion
  (none, rotate, pulse, drift); speed; preset name; export/import.
- **Actions** primary **Ajouter le fond dégradé**; secondary **Mettre à jour la sélection**,
  **Enregistrer dans mes presets**, **Supprimer mon preset**, **Exporter mes presets**,
  **Importer**.
- **Copy** "Choisissez un dégradé, puis ajoutez-le en fond de composition."

## 10 · Look ▸ Effects

- **Sections** effect dropdown (16); strength; duration; starts at (layer start, playhead, layer
  end); easing; note.
- **Actions** primary **Appliquer l'effet**; secondary **Supprimer les effets Flow**.
- **Copy** "Effects are named \"Flow: …\" and driven by expressions over the time window, so you
  can tweak them in the timeline."

## 11 · Look ▸ Stroke

- **Sections** preset; stroke colour; thickness; blur; softness.
- **Actions** primary **Appliquer le contour**; secondary **Animer l'apparition**.
- **States** plug-in missing → disabled with a clear reason.

## 12 · Réglages ▸ Models

- **Sections** helper port field; **Connecter / Actualiser**; model list (name, licence, source,
  size, checksum status); whisper-cli path; save path.
- **Actions** primary **Connecter / Actualiser**; secondary **Installer**, **Vérifier**,
  **Désinstaller**, **Enregistrer le chemin whisper-cli**.
- **States** connected, disconnected, installing (progress), checksum mismatch, trust-on-first-use.

## 13 · Réglages ▸ Helper & setup

- **Sections** setup guide (multiline, wrapped); permissions reminder; connection status;
  **Tester la connexion / Réessayer**; **Revoir l'aide de démarrage**.
- **Copy** "Pour utiliser les fonctions intelligentes de Flow Studio (analyse audio, silence,
  sous-titres Whisper, tempo) : 1. Ouvrez Préférences > Scripts et expressions, puis cochez «
  Autoriser les scripts à écrire des fichiers et accéder au réseau ». 2. Démarrez le helper dans
  un terminal : effectcraft-flow-helper serve"

## 14 · Réglages ▸ Preset pack

- **Sections** hint; JSON text area; file path field; buttons; result path/JSON.
- **Actions** primary **Exporter le pack complet**; secondary **Importer un pack**, **Charger ce
  fichier**.
- **Copy** "Un seul fichier pour tout votre studio : animations de texte, fonds, styles de
  sous-titres et réglages." / "Collez le JSON dans la zone, ou indiquez le chemin d'un fichier
  .json puis Chargez."
- **States** empty, valid, invalid JSON (danger), imported (success).

---

## Shared chrome

Every screen sits under the same `AppHeader` and `TabBar`. Content starts 26 px below the tab
strip. The status line is pinned to the bottom (16 px) and uses the semantic colours.
