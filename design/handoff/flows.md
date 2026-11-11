# User flows

Prototype these four journeys. Each step names the screen and the visible state.

## 1 · First launch → Library

1. **Welcome** — title, body, status idle.
2. Tap **Vérifier le helper** → status "checking" + progress bar.
3. **Success**: green status "Helper connecté. Tout est prêt." → **Continuer sans helper** label
   becomes **Entrer** (or auto-advance after 800 ms).
   **Failure**: red status "Helper introuvable. Vous pouvez continuer…" + **Réessayer**.
4. **Library** — `COLLECTION`, "Bibliothèque créative", 14 / 14, chips, 6 cards.

Edge cases: no composition open → the primary button is disabled with "Ouvrez d'abord une
composition."; helper offline → only the helper-dependent actions are disabled, the rest works.

## 2 · Apply a catalogue item

1. **Library** — tap the **Catalogue** chip; count becomes `525 / 525`.
2. Search "fade" or pick a kind; the grid updates to 6 results; `Récents ›` shows recent ids.
3. Tap a card → preview sheet fills: `SÉLECTION`, name, kind, tags, duration, side, strength.
4. Adjust **Début | Fin | Les deux** and **Durée**.
5. Tap **Ajouter à la timeline** (or double-click the card).
6. Success toast "Fade Up ajouté à la timeline." The item is remembered in `Récents`; the star
   toggles **Favori**.

Edge cases: no layer selected → disabled card with reason "Sélectionnez au moins un calque.";
missing native effect → disabled card with "Effet natif absent"; unavailable tool → "Non
installé".

## 3 · Silence cleanup

1. **Montage ▸ Silence** — select a video/audio layer.
2. Tap **Analyser les silences** → progress bar → waveform draws silent zones in red, speech in
   green, threshold dashed.
3. Choose a profile (Standard / Podcast / Interview / Musique) and an action (Ripple / Markers).
4. Optional **Mode avancé**: detector, threshold, min silence, padding.
5. Tap **Couper les silences** → success "3 silences coupés." Undo is one step.
6. Optional rhythm: **Détecter le tempo & poser des marqueurs** then **Couper sur le tempo**.

Edge cases: no layer → primary disabled with "Sélectionnez un calque vidéo ou audio, puis
cliquez sur Analyser."; helper offline → danger banner + **Réessayer**.

## 4 · Captions + karaoke + export

1. **Montage ▸ Captions** — select a layer.
2. Tap **Générer depuis le calque** (or **Importer un fichier de sous-titres** with SRT/VTT) →
   progress → caption list.
3. Pick a language and a Whisper model; **Vérifier Whisper** / **Installer le modèle** if needed.
4. Pick a style in the 4 × 2 grid; adjust the advanced panel; optionally pick **Karaoke
   (Surlignage)**.
5. Tap **Créer les calques de texte** → text layers appear, styled and timed.
6. **Exporter SRT** or **Exporter ASS** → success with the file path.

Edge cases: Whisper missing → primary disabled with "Le helper Flow Studio n'est pas lancé." or
"Non installé"; Arabic text → RTL placement and right anchor; no text layer → "Sélectionnez un
calque de texte."

## Global states to show

- **Theme** Auto / Sombre / Clair — persists.
- **Language** FR / EN / ع — full labels, short labels at narrow widths; RTL for Arabic.
- **Helper** online / offline / checking / error.
- **Composition** none open / open with no selection / open with selection.
- **Empty** library, no search result, no recent items, no presets.
- **Loading** progress bar for analyze, transcribe, model install, pack import.
- **Success / warning / danger** status line and banner.
