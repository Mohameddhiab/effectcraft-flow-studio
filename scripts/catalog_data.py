"""Authoring source for the Flow Studio catalogue (lot 1).

The JSON files under ``catalog/`` are the published source of truth: the build validates them
field by field and embeds them in the panel.  This module only *seeds* those files once, so the
hundreds of presets stay reproducible and reviewable instead of being typed by hand.

Everything here is original work: names, colours, timings and text are ours.  No After Effects
preset, Adobe artwork, sampled sound or third-party thumbnail is used anywhere.
"""

# --------------------------------------------------------------------------- helpers

TEXT_UNITS = ("chars", "words", "lines")
CAPS = ("none", "upper", "lower", "small")
WEIGHTS = ("Regular", "Medium", "SemiBold", "Bold", "Black", "Light", "Italic")

TITLE_STYLE = {
    "size": 64,
    "font": "Inter",
    "weight": "SemiBold",
    "tracking": 0,
    "leading": 1.15,
    "caps": "upper",
    "fill": "#FFFFFF",
    "fill2": None,
    "stroke": None,
    "strokeWidth": 0,
    "shadow": True,
    "glow": False,
    "glowColor": "#5CE1FF",
    "align": "left",
    "anchor": "bottom-left",
    "margin": 0.08,
    "glass": False,
    "glassFill": "#FFFFFF",
    "glassOpacity": 12,
    "bar": False,
    "barFill": "#5CE1FF",
    "underline": False,
    "underlineColor": "#5CE1FF",
    "rtl": False,
}


def style(**kw):
    out = dict(TITLE_STYLE)
    out.update(kw)
    return out


def title(ident, name, family, text, anim, out, tags, duration=4.5, approx=False, **kw):
    item = {
        "id": "title." + ident,
        "kind": "title",
        "name": name,
        "family": family,
        "tags": tags,
        "text": text,
        "duration": duration,
        "anim": anim,
        "out": out,
        "style": style(**kw),
    }
    if approx:
        item["approx"] = True
    return item


def titles():
    out = []

    # ---- Lower thirds (12)
    lt = "Lower thirds"
    out += [
        title("lower-third.minimal-line", "Minimal Line", lt, "JANE DOE\rDIRECTOR OF PHOTOGRAPHY", "text.line-rise", "text.fade-up-out", ["lowerthird", "minimal", "name"], underline=True, size=58),
        title("lower-third.glass-card", "Glass Card", lt, "ALEX MORGAN\rCREATIVE DIRECTOR", "text.fade-up", "text.fade-up-out", ["lowerthird", "glass", "card"], glass=True, size=54, margin=0.09),
        title("lower-third.bold-bar", "Bold Bar", lt, "SAM RIVERA\rEDITOR", "text.words-slide", "text.fade-up-out", ["lowerthird", "bar", "bold"], bar=True, size=66, fill="#0B0E14", barFill="#5CE1FF"),
        title("lower-third.corner-tag", "Corner Tag", lt, "LIVE FROM PARIS", "text.slide-right", "text.fade-down-out", ["lowerthird", "corner", "tag"], anchor="top-left", size=40, bar=True, barFill="#FF5F6D", fill="#FFFFFF", margin=0.05),
        title("lower-third.underline-slide", "Underline Slide", lt, "MAYA CHEN\rFILMMAKER", "text.tracking-in", "text.fade-up-out", ["lowerthird", "underline", "slide"], underline=True, underlineColor="#7B7DFF", size=60),
        title("lower-third.split-reveal", "Split Reveal", lt, "NOAH KIM\rSOUND DESIGNER", "text.mask-wipe", "text.fade-up-out", ["lowerthird", "split", "reveal"], size=58, fill="#F5F7FB", underline=True),
        title("lower-third.ticker", "Ticker", lt, "BREAKING  /  NEW RELEASE  /  TODAY", "text.slide-left", "text.slide-right-out", ["lowerthird", "ticker", "news"], bar=True, barFill="#101526", size=34, tracking=6, margin=0.06),
        title("lower-third.name-role", "Name + Role", lt, "AVA STONE\rHEAD OF VIDEO", "text.line-rise", "text.fade-up-out", ["lowerthird", "name", "role"], glass=True, size=50),
        title("lower-third.social-handle", "Social Handle", lt, "@FLOWSTUDIO", "text.tracking-in", "text.fade-in-slow-out", ["lowerthird", "social", "handle"], size=34, anchor="bottom-right", align="right", fill="#5CE1FF", underline=True),
        title("lower-third.subscribe-bar", "Subscribe Bar", lt, "SUBSCRIBE FOR MORE", "text.pop-in", "text.fade-up-out", ["lowerthird", "subscribe", "cta"], bar=True, barFill="#FF0033", size=38, align="center", anchor="bottom-center"),
        title("lower-third.location-pin", "Location Pin", lt, "REYKJAVIK  //  64.1 N", "text.slide-down", "text.fade-up-out", ["lowerthird", "location", "travel"], anchor="top-right", align="right", size=30, tracking=3),
        title("lower-third.quote-card", "Quote Card", lt, "\u201cThe edit is the story.\u201d", "text.words-slide", "text.fade-up-out", ["lowerthird", "quote", "serif"], font="Georgia", weight="Italic", caps="none", glass=True, size=48, margin=0.12),
    ]

    # ---- Full screen titles (12)
    fs = "Full screen titles"
    out += [
        title("full.cinematic-spaced", "Cinematic Spaced", fs, "THE LAST LIGHT", "text.tracking-in", "text.fade-up-out", ["title", "cinematic", "spaced"], size=96, tracking=28, align="center", anchor="middle-center", weight="Light"),
        title("full.big-bold", "Big Bold", fs, "MAKE IT LOUD", "text.pop-in", "text.fade-up-out", ["title", "bold", "impact"], size=180, font="Impact", weight="Black", align="center", anchor="middle-center", leading=0.95),
        title("full.outline-hollow", "Outline Hollow", fs, "OUT OF THE FRAME", "text.blur-reveal", "text.fade-up-out", ["title", "outline", "hollow"], size=120, fill="#0B0E14", stroke="#FFFFFF", strokeWidth=4, align="center", anchor="middle-center", approx=True),
        title("full.neon-sign", "Neon Sign", fs, "OPEN ALL NIGHT", "text.neon-flicker", "text.fade-up-out", ["title", "neon", "glow"], size=100, fill="#5CE1FF", glow=True, glowColor="#5CE1FF", align="center", anchor="middle-center"),
        title("full.glitch-title", "Glitch Title", fs, "SIGNAL LOST", "text.glitch-in", "text.glitch-in-out", ["title", "glitch", "digital"], size=120, fill="#F5F7FB", glow=True, glowColor="#FF5F6D", align="center", anchor="middle-center"),
        title("full.chrome", "Chrome", fs, "FUTURE FORWARD", "text.slide-up", "text.fade-up-out", ["title", "chrome", "metal"], size=110, fill="#DCE6F5", glow=True, glowColor="#7B7DFF", tracking=6, align="center", anchor="middle-center", approx=True),
        title("full.retro-80s", "Retro 80s", fs, "MIDNIGHT DRIVE", "text.flip-x", "text.fade-up-out", ["title", "retro", "80s"], size=100, font="Trebuchet MS", fill="#FF6FD8", glow=True, glowColor="#5CE1FF", align="center", anchor="middle-center"),
        title("full.handwritten", "Handwritten", fs, "just breathe", "text.fade-in-slow", "text.fade-up-out", ["title", "handwritten", "soft"], size=86, font="Segoe Script", weight="Regular", caps="none", align="center", anchor="middle-center", approx=True),
        title("full.editorial-serif", "Editorial Serif", fs, "A Quiet Revolution", "text.words-slide", "text.fade-up-out", ["title", "editorial", "serif"], size=92, font="Georgia", weight="Italic", caps="none", align="center", anchor="middle-center"),
        title("full.brutalist", "Brutalist", fs, "NO FILTER", "text.words-slide", "text.slide-right-out", ["title", "brutalist", "raw"], size=200, font="Impact", weight="Black", align="left", anchor="middle-left", tracking=-4, margin=0.04, leading=0.9),
        title("full.gradient-fill", "Gradient Fill", fs, "CHASING LIGHT", "text.tracking-in", "text.fade-up-out", ["title", "gradient", "color"], size=120, fill="#FFB36B", fill2="#7B7DFF", align="center", anchor="middle-center", approx=True),
        title("full.duotone", "Duotone", fs, "TWO WORLDS", "text.blur-reveal", "text.fade-up-out", ["title", "duotone", "color"], size=120, fill="#FFB36B", fill2="#5CE1FF", align="center", anchor="middle-center", approx=True),
    ]

    # ---- Social titles (12)
    so = "Social titles"
    out += [
        title("social.hormozi", "Hormozi", so, "THIS CHANGES EVERYTHING", "text.pop-in", "text.pop-in-out", ["social", "bold", "shorts"], size=104, weight="Black", fill="#FFE600", stroke="#000000", strokeWidth=14, align="center", anchor="middle-center", leading=1.0),
        title("social.word-pop", "Word Pop", so, "WAIT FOR IT", "text.pop-in", "text.pop-in-out", ["social", "word", "pop"], size=118, weight="Black", fill="#FFFFFF", stroke="#000000", strokeWidth=10, align="center", anchor="middle-center"),
        title("social.karaoke-glow", "Karaoke Glow", so, "SING IT LOUD", "text.karaoke-fill", "text.fade-up-out", ["social", "karaoke", "glow"], size=88, weight="Bold", fill="#5CE1FF", glow=True, glowColor="#5CE1FF", stroke="#000000", strokeWidth=6, align="center", anchor="middle-center"),
        title("social.beasty-bold", "Beasty Bold", so, "NO SHORTCUTS", "text.scale-up", "text.pop-in-out", ["social", "bold", "beasty"], size=120, weight="Black", fill="#FFFFFF", stroke="#FF0033", strokeWidth=12, align="center", anchor="middle-center", leading=0.95),
        title("social.clean-white", "Clean White", so, "A simple sentence.", "text.fade-up", "text.fade-up-out", ["social", "clean", "minimal"], size=68, weight="Medium", caps="none", fill="#FFFFFF", align="center", anchor="bottom-center", shadow=True),
        title("social.yellow-highlight", "Yellow Highlight", so, "THE IMPORTANT PART", "text.highlight-sweep", "text.fade-up-out", ["social", "yellow", "highlight"], size=78, weight="Bold", fill="#111111", bar=True, barFill="#FFE600", align="center", anchor="middle-center"),
        title("social.boxed", "Boxed", so, "FULL FRAME", "text.unfold", "text.fade-up-out", ["social", "box", "block"], size=96, weight="Bold", fill="#FFFFFF", bar=True, barFill="#101526", align="center", anchor="middle-center"),
        title("social.outlined-heavy", "Outlined Heavy", so, "LOUD AND CLEAR", "text.stretch-in", "text.pop-in-out", ["social", "outline", "heavy"], size=110, weight="Black", fill="#FFFFFF", stroke="#000000", strokeWidth=16, align="center", anchor="middle-center"),
        title("social.typewriter-line", "Typewriter Line", so, "one letter at a time", "text.typewriter", "text.fade-up-out", ["social", "typewriter", "mono"], size=52, font="Courier New", weight="Bold", caps="lower", fill="#F5F7FB", align="center", anchor="bottom-center"),
        title("social.emoji-burst", "Emoji Burst", so, "BIG NEWS", "text.elastic-in", "text.pop-in-out", ["social", "emoji", "burst"], size=106, weight="Black", fill="#FFFFFF", fill2="#FFE600", glow=True, glowColor="#FFE600", align="center", anchor="middle-center", approx=True),
        title("social.soft-shadow", "Soft Shadow", so, "Quiet confidence", "text.fade-in-slow", "text.fade-up-out", ["social", "shadow", "soft"], size=64, weight="Medium", caps="none", fill="#FFFFFF", align="center", anchor="bottom-center"),
        title("social.arabic-naskh", "Arabic Naskh", so, "\u0645\u0631\u062d\u0628\u0627 \u0628\u0627\u0644\u0639\u0627\u0644\u0645", "text.fade-up", "text.fade-up-out", ["social", "arabic", "rtl", "naskh"], size=72, font="Noto Naskh Arabic", weight="Regular", caps="none", align="right", anchor="bottom-right", rtl=True, stroke="#000000", strokeWidth=5),
    ]

    # ---- Calls to action (8)
    ct = "Calls to action"
    out += [
        title("cta.subscribe", "Subscribe", ct, "SUBSCRIBE", "text.pop-in", "text.pop-in-out", ["cta", "subscribe", "youtube"], size=84, weight="Black", fill="#FFFFFF", bar=True, barFill="#FF0033", align="center", anchor="bottom-center"),
        title("cta.like", "Like", ct, "LIKE THIS", "text.bounce-in", "text.pop-in-out", ["cta", "like", "social"], size=88, weight="Black", fill="#5CE1FF", align="center", anchor="middle-center"),
        title("cta.follow", "Follow", ct, "FOLLOW FOR MORE", "text.slide-up", "text.fade-up-out", ["cta", "follow", "social"], size=64, weight="Bold", fill="#FFFFFF", underline=True, align="center", anchor="bottom-center"),
        title("cta.swipe-up", "Swipe Up", ct, "SWIPE UP", "text.slide-up", "text.slide-down-out", ["cta", "swipe", "stories"], size=76, weight="Black", fill="#111111", bar=True, barFill="#FFFFFF", align="center", anchor="bottom-center"),
        title("cta.link-in-bio", "Link in Bio", ct, "LINK IN BIO", "text.tracking-in", "text.fade-up-out", ["cta", "link", "bio"], size=52, weight="Medium", fill="#F5F7FB", glass=True, align="center", anchor="bottom-center"),
        title("cta.sale-badge", "Sale Badge", ct, "-50% TODAY", "text.pop-in", "text.pop-in-out", ["cta", "sale", "badge"], size=96, weight="Black", fill="#FFFFFF", bar=True, barFill="#FF5F6D", align="center", anchor="middle-center"),
        title("cta.countdown", "Countdown", ct, "3", "text.counter-roll", "text.pop-in-out", ["cta", "countdown", "number"], size=200, weight="Black", fill="#FFFFFF", glow=True, glowColor="#5CE1FF", align="center", anchor="middle-center"),
        title("cta.live", "Live", ct, "LIVE NOW", "text.neon-flicker", "text.fade-up-out", ["cta", "live", "stream"], size=64, weight="Black", fill="#FFFFFF", bar=True, barFill="#FF0033", align="center", anchor="top-center"),
    ]

    # ---- Generic titles (8)
    ge = "Generic titles"
    out += [
        title("generic.scrolling-credits", "Scrolling Credits", ge, "DIRECTED BY\rJANE DOE\r\rEDITED BY\rSAM RIVERA", "text.fade-in-slow", "text.fade-up-out", ["generic", "credits", "scroll"], size=44, weight="Medium", caps="upper", align="center", anchor="middle-center", duration=10),
        title("generic.title-card", "Title Card", ge, "CHAPTER ONE", "text.fade-up", "text.fade-up-out", ["generic", "card", "chapter"], size=92, weight="Light", tracking=18, align="center", anchor="middle-center"),
        title("generic.chapter-number", "Chapter Number", ge, "01", "text.counter-roll", "text.fade-up-out", ["generic", "number", "chapter"], size=180, weight="Black", fill="#5CE1FF", align="center", anchor="middle-center"),
        title("generic.date-stamp", "Date Stamp", ge, "12.08.2026", "text.typewriter", "text.fade-up-out", ["generic", "date", "stamp"], size=38, font="Courier New", weight="Bold", fill="#F5F7FB", align="right", anchor="bottom-right", margin=0.06),
        title("generic.kinetic-typography", "Kinetic Typography", ge, "EVERY FRAME COUNTS", "text.cascade", "text.slide-right-out", ["generic", "kinetic", "type"], size=104, weight="Black", fill="#FFFFFF", align="center", anchor="middle-center"),
        title("generic.quote-highlight", "Quote Highlight", ge, "\u201cShow, don't tell.\u201d", "text.words-slide", "text.fade-up-out", ["generic", "quote", "serif"], size=64, font="Georgia", weight="Italic", caps="none", fill="#F5F7FB", underline=True, underlineColor="#5CE1FF", align="center", anchor="middle-center"),
        title("generic.stat-counter", "Stat Counter", ge, "98%", "text.counter-roll", "text.fade-up-out", ["generic", "stat", "number"], size=160, weight="Black", fill="#44D7A2", align="center", anchor="middle-center"),
        title("generic.versus", "Versus", ge, "A  /  B", "text.flip-y", "text.fade-up-out", ["generic", "versus", "compare"], size=120, weight="Black", fill="#FFFFFF", stroke="#7B7DFF", strokeWidth=6, align="center", anchor="middle-center"),
    ]

    # ---- Callouts and legends (8)
    ca = "Callouts"
    out += [
        title("callout.arrow-label", "Arrow Label", ca, "THIS PART", "text.slide-left", "text.fade-up-out", ["callout", "arrow", "label"], size=34, weight="Bold", fill="#111111", bar=True, barFill="#FFE600", anchor="middle-left", margin=0.12),
        title("callout.circle-note", "Circle Note", ca, "LOOK HERE", "text.pop-in", "text.pop-in-out", ["callout", "circle", "note"], size=32, weight="Bold", fill="#FFFFFF", stroke="#5CE1FF", strokeWidth=7, align="center", anchor="middle-center"),
        title("callout.underline-note", "Underline Note", ca, "important detail", "text.fade-up", "text.fade-up-out", ["callout", "underline", "note"], size=30, weight="Medium", caps="none", fill="#F5F7FB", underline=True, underlineColor="#FF5F6D", anchor="bottom-left", margin=0.1),
        title("callout.sticker", "Sticker", ca, "NEW!", "text.elastic-in", "text.pop-in-out", ["callout", "sticker", "fun"], size=48, weight="Black", fill="#FFFFFF", stroke="#111111", strokeWidth=6, bar=True, barFill="#FF6FD8", align="center", anchor="middle-center"),
        title("callout.speech-bubble", "Speech Bubble", ca, "Wait, what?", "text.pop-in", "text.pop-in-out", ["callout", "bubble", "speech"], size=34, weight="Medium", caps="none", fill="#111111", glass=True, glassFill="#FFFFFF", glassOpacity=95, anchor="middle-right", align="right", margin=0.1),
        title("callout.tooltip", "Tooltip", ca, "pro tip", "text.fade-up", "text.fade-up-out", ["callout", "tooltip", "hint"], size=24, weight="Medium", caps="lower", fill="#F5F7FB", bar=True, barFill="#101526", anchor="top-center", align="center", margin=0.06),
        title("callout.number-badge", "Number Badge", ca, "1", "text.pop-in", "text.pop-in-out", ["callout", "number", "badge"], size=44, weight="Black", fill="#111111", bar=True, barFill="#5CE1FF", align="center", anchor="top-left", margin=0.06),
        title("callout.highlight-box", "Highlight Box", ca, "READ THIS", "text.highlight-sweep", "text.fade-up-out", ["callout", "box", "highlight"], size=40, weight="Bold", fill="#111111", bar=True, barFill="#FFE600", align="center", anchor="middle-center"),
    ]

    return out


# --------------------------------------------------------------------------- text animations

def _from(**kw):
    out = {}
    for key in ("opacity", "scale", "rotation", "blur", "tracking", "position"):
        if key in kw and kw[key] is not None:
            out[key] = kw[key]
    return out


def text_animation(ident, name, family, unit, from_state, easing="outCubic", duration=0.8, smooth=100, random=False):
    return {
        "id": "text." + ident,
        "kind": "text",
        "name": name,
        "family": family,
        "tags": [family.lower(), unit],
        "unit": unit,
        "mode": "in",
        "from": from_state,
        "easing": easing,
        "duration": duration,
        "smooth": smooth,
        "random": random,
    }


def text_animations():
    entries = [
        text_animation("fade-up", "Fade Up", "Entrance", "chars", _from(opacity=0, position=[0, 40])),
        text_animation("fade-down", "Fade Down", "Entrance", "chars", _from(opacity=0, position=[0, -40])),
        text_animation("fade-in-slow", "Fade In Slow", "Entrance", "chars", _from(opacity=0), "smooth", 1.6),
        text_animation("pop-in", "Pop In", "Entrance", "chars", _from(opacity=0, scale=0), "outBack", 0.7),
        text_animation("scale-up", "Scale Up", "Entrance", "chars", _from(opacity=0, scale=40), "outQuart", 0.8),
        text_animation("bounce-in", "Bounce In", "Entrance", "chars", _from(opacity=0, position=[0, -80]), "outBounce", 1.0),
        text_animation("elastic-in", "Elastic In", "Entrance", "words", _from(opacity=0, scale=20), "outElastic", 1.1),
        text_animation("drop-bounce", "Drop Bounce", "Entrance", "chars", _from(opacity=0, position=[0, -120]), "outBounce", 1.0),
        text_animation("slide-left", "Slide Left", "Entrance", "words", _from(opacity=0, position=[60, 0])),
        text_animation("slide-right", "Slide Right", "Entrance", "words", _from(opacity=0, position=[-60, 0])),
        text_animation("slide-up", "Slide Up", "Entrance", "words", _from(opacity=0, position=[0, 60])),
        text_animation("slide-down", "Slide Down", "Entrance", "words", _from(opacity=0, position=[0, -60])),
        text_animation("typewriter", "Typewriter", "Entrance", "chars", _from(opacity=0), "linear", 1.2, 0),
        text_animation("blur-reveal", "Blur Reveal", "Entrance", "chars", _from(opacity=0, blur=30), "outQuad", 1.0),
        text_animation("tracking-in", "Tracking In", "Entrance", "lines", _from(opacity=0, tracking=40), "outCubic", 1.2),
        text_animation("words-slide", "Words Slide", "Entrance", "words", _from(opacity=0, position=[-60, 0]), "outExpo", 0.9),
        text_animation("line-rise", "Line Rise", "Entrance", "lines", _from(opacity=0, position=[0, 70]), "outQuart", 0.9),
        text_animation("spin-words", "Spin Words", "Entrance", "words", _from(opacity=0, rotation=-90, scale=40), "outBack", 0.9),
        text_animation("flip-x", "Flip X", "Entrance", "chars", _from(opacity=0, scale=0, rotation=90), "outBack", 0.8),
        text_animation("flip-y", "Flip Y", "Entrance", "chars", _from(opacity=0, scale=0, rotation=-90), "outBack", 0.8),
        text_animation("rotate-in", "Rotate In", "Entrance", "words", _from(opacity=0, rotation=-180), "outQuart", 1.0),
        text_animation("wave", "Wave", "Entrance", "chars", _from(opacity=0, position=[0, 30]), "outSine", 1.0, 70),
        text_animation("wobble", "Wobble", "Entrance", "chars", _from(opacity=0, rotation=20), "outElastic", 1.0, 80),
        text_animation("random-fade", "Random Fade", "Entrance", "chars", _from(opacity=0), "linear", 1.2, 100, True),
        text_animation("scramble", "Scramble", "Entrance", "chars", _from(opacity=0, blur=10), "linear", 1.1, 60, True),
        text_animation("glitch-in", "Glitch In", "Entrance", "chars", _from(opacity=0, position=[6, 0], blur=14), "steps", 0.7, 20, True),
        text_animation("mask-wipe", "Mask Wipe", "Entrance", "chars", _from(opacity=0, tracking=-30), "outExpo", 1.0, 10),
        text_animation("unfold", "Unfold", "Entrance", "lines", _from(opacity=0, scale=10), "outQuart", 0.9),
        text_animation("stretch-in", "Stretch In", "Entrance", "words", _from(opacity=0, scale=140), "outExpo", 0.8),
        text_animation("rubber-band", "Rubber Band", "Entrance", "words", _from(opacity=0, scale=30), "outElastic", 1.0),
        text_animation("swing", "Swing", "Entrance", "words", _from(opacity=0, rotation=35), "outBack", 1.0),
        text_animation("cascade", "Cascade", "Entrance", "lines", _from(opacity=0, position=[20, 40]), "outCubic", 1.2, 60),
        text_animation("spotlight", "Spotlight", "Entrance", "chars", _from(opacity=0), "outQuad", 1.4, 0),
        text_animation("highlight-sweep", "Highlight Sweep", "Entrance", "chars", _from(opacity=0, tracking=30), "outExpo", 1.1),
        text_animation("karaoke-fill", "Karaoke Fill", "Entrance", "chars", _from(opacity=0), "outCubic", 1.0, 0),
        text_animation("neon-flicker", "Neon Flicker", "Entrance", "chars", _from(opacity=0, blur=6), "steps", 0.9, 10, True),
        text_animation("counter-roll", "Counter Roll", "Entrance", "chars", _from(opacity=0, position=[0, 80]), "outExpo", 0.8),
        text_animation("tilt-in", "Tilt In", "Entrance", "words", _from(opacity=0, rotation=12, position=[0, 30]), "outBack", 0.8),
        text_animation("drop-in", "Drop In", "Entrance", "chars", _from(opacity=0, position=[0, -60], blur=4), "outQuad", 0.6),
        text_animation("rise-fade", "Rise Fade", "Entrance", "lines", _from(opacity=0, position=[0, 24]), "outSine", 1.2),
        text_animation("slide-blur", "Slide Blur", "Entrance", "words", _from(opacity=0, position=[-100, 0], blur=18), "outExpo", 0.9),
        text_animation("pulse-in", "Pulse In", "Entrance", "words", _from(opacity=0, scale=60), "outElastic", 0.9),
        text_animation("compression", "Compression", "Entrance", "lines", _from(opacity=0, scale=160), "outQuart", 0.7),
        text_animation("expand", "Expand", "Entrance", "lines", _from(opacity=0, scale=40), "outCubic", 1.0),
        text_animation("offset-in", "Offset In", "Entrance", "chars", _from(opacity=0, position=[20, -20]), "outCubic", 0.9),
    ]

    out = list(entries)
    for e in entries:
        m = dict(e)
        m["id"] = e["id"] + "-out"
        m["name"] = e["name"].replace(" In", "").replace(" Up", "").replace(" Down", "").strip() + " Out"
        m["family"] = "Exit"
        m["tags"] = ["exit", e["unit"]]
        m["mode"] = "out"
        out.append(m)

    loops = [
        ("loop-pulse", "Pulse", "Loop", "scale", 1.6, 4),
        ("loop-float", "Float", "Loop", "position", 3.0, 8),
        ("loop-shake", "Shake", "Loop", "position", 0.25, 3),
        ("loop-breathe", "Breathe", "Loop", "scale", 4.0, 2),
        ("loop-shimmer", "Shimmer", "Loop", "opacity", 2.2, 18),
        ("loop-color-cycle", "Color Cycle", "Loop", "color", 6.0, 0),
    ]
    for ident, name, family, loop, period, amount in loops:
        out.append({
            "id": "text." + ident,
            "kind": "text",
            "name": name,
            "family": family,
            "tags": ["loop", loop],
            "unit": "chars",
            "mode": "loop",
            "loop": loop,
            "period": period,
            "amount": amount,
            "easing": "linear",
            "duration": 0.5,
            "smooth": 100,
            "random": False,
        })

    return out


# --------------------------------------------------------------------------- transitions

def transition(ident, name, family, ops, tags, duration=1.0, approx=False, note=None):
    item = {
        "id": "trans." + ident,
        "kind": "transition",
        "name": name,
        "family": family,
        "tags": tags,
        "duration": duration,
        "ops": ops,
    }
    if approx:
        item["approx"] = True
    if note:
        item["note"] = note
    return item


def transitions():
    return [
        transition("cross-dissolve", "Cross Dissolve", "Fades", [{"op": "fade"}], ["fade", "dissolve"]),
        transition("dip-black", "Dip to Black", "Fades", [{"op": "dip", "color": "black", "amount": 9}], ["fade", "black"]),
        transition("dip-white", "Dip to White", "Fades", [{"op": "dip", "color": "white", "amount": 9}], ["fade", "white"]),
        transition("dip-color", "Dip to Color", "Fades", [{"op": "dip", "color": "custom", "value": "#5CE1FF", "amount": 7}], ["fade", "color"]),
        transition("additive", "Additive Dissolve", "Fades", [{"op": "fade"}, {"op": "exposure", "amount": 2}], ["fade", "additive"]),
        transition("film-dissolve", "Film Dissolve", "Fades", [{"op": "fade"}, {"op": "grain", "amount": 18, "ramp": True}], ["fade", "film"]),
        transition("blur-dissolve", "Blur Dissolve", "Fades", [{"op": "fade"}, {"op": "blur", "amount": 80}], ["fade", "blur"]),
        transition("luma-fade", "Luma Fade", "Fades", [{"op": "levels", "amount": 45}, {"op": "fade"}], ["fade", "luma"]),
        transition("slide-left", "Slide Left", "Movement", [{"op": "slide", "dx": 1, "dy": 0}], ["slide", "left"]),
        transition("slide-right", "Slide Right", "Movement", [{"op": "slide", "dx": -1, "dy": 0}], ["slide", "right"]),
        transition("slide-up", "Slide Up", "Movement", [{"op": "slide", "dx": 0, "dy": 1}], ["slide", "up"]),
        transition("slide-down", "Slide Down", "Movement", [{"op": "slide", "dx": 0, "dy": -1}], ["slide", "down"]),
        transition("push-left", "Push Left", "Movement", [{"op": "push", "dx": 1, "dy": 0}], ["push", "left"]),
        transition("push-right", "Push Right", "Movement", [{"op": "push", "dx": -1, "dy": 0}], ["push", "right"]),
        transition("push-up", "Push Up", "Movement", [{"op": "push", "dx": 0, "dy": 1}], ["push", "up"]),
        transition("push-down", "Push Down", "Movement", [{"op": "push", "dx": 0, "dy": -1}], ["push", "down"]),
        transition("whip-left", "Whip Pan Left", "Movement", [{"op": "slide", "dx": 1, "dy": 0}, {"op": "blurdir", "amount": 120, "direction": 0}], ["whip", "left"]),
        transition("whip-right", "Whip Pan Right", "Movement", [{"op": "slide", "dx": -1, "dy": 0}, {"op": "blurdir", "amount": 120, "direction": 180}], ["whip", "right"]),
        transition("whip-up", "Whip Pan Up", "Movement", [{"op": "slide", "dx": 0, "dy": 1}, {"op": "blurdir", "amount": 120, "direction": 90}], ["whip", "up"]),
        transition("whip-down", "Whip Pan Down", "Movement", [{"op": "slide", "dx": 0, "dy": -1}, {"op": "blurdir", "amount": 120, "direction": 270}], ["whip", "down"]),
        transition("spin", "Spin", "Movement", [{"op": "spin", "angle": -180, "scale": 30}], ["spin", "rotate"]),
        transition("zoom-in", "Zoom In", "Movement", [{"op": "zoom", "from": 250}], ["zoom", "in"]),
        transition("zoom-out", "Zoom Out", "Movement", [{"op": "zoom", "from": 30}], ["zoom", "out"]),
        transition("zoom-through", "Zoom Through", "Movement", [{"op": "zoomthrough"}], ["zoom", "through"]),
        transition("dolly-zoom", "Dolly Zoom", "Movement", [{"op": "dolly"}], ["dolly", "zoom"], approx=True),
        transition("roll", "Roll", "Movement", [{"op": "spin", "angle": -90, "scale": 100}, {"op": "offset", "x": 1, "y": 0}], ["roll", "move"]),
        transition("swing", "Swing", "Movement", [{"op": "swing", "angle": 25}], ["swing", "rotate"]),
        transition("cube-rotate", "Cube Rotate", "Movement", [{"op": "scaleWidth", "from": 0}, {"op": "fade"}], ["cube", "3d"], approx=True, note="Approximated with a horizontal squeeze: no true 3D card effect is available."),
        transition("page-peel", "Page Peel", "Movement", [{"op": "wipe", "angle": 45, "feather": 30}, {"op": "rotate", "angle": 8}], ["page", "peel"], approx=True, note="Approximated with a feathered diagonal wipe."),
        transition("iris-circle", "Iris Circle", "Shapes", [{"op": "iris", "points": 12, "reverse": True}], ["iris", "circle"]),
        transition("iris-box", "Iris Box", "Shapes", [{"op": "iris", "points": 4, "reverse": True}], ["iris", "box"]),
        transition("iris-diamond", "Iris Diamond", "Shapes", [{"op": "iris", "points": 3, "reverse": True}], ["iris", "diamond"]),
        transition("clock-wipe", "Clock Wipe", "Shapes", [{"op": "radial", "angle": -90}], ["clock", "wipe"]),
        transition("radial-wipe", "Radial Wipe", "Shapes", [{"op": "radial", "angle": 0}], ["radial", "wipe"]),
        transition("barn-h", "Barn Doors H", "Shapes", [{"op": "wipe", "angle": 90, "feather": 2}], ["barn", "doors"], approx=True),
        transition("barn-v", "Barn Doors V", "Shapes", [{"op": "wipe", "angle": 0, "feather": 2}], ["barn", "doors"], approx=True),
        transition("split-h", "Split H", "Shapes", [{"op": "wipe", "angle": 90, "feather": 12}], ["split", "horizontal"]),
        transition("split-v", "Split V", "Shapes", [{"op": "wipe", "angle": 0, "feather": 12}], ["split", "vertical"]),
        transition("blinds-h", "Blinds H", "Shapes", [{"op": "venetian", "direction": "horizontal", "width": 18}], ["blinds", "horizontal"]),
        transition("blinds-v", "Blinds V", "Shapes", [{"op": "venetian", "direction": "vertical", "width": 18}], ["blinds", "vertical"]),
        transition("checker", "Checker", "Shapes", [{"op": "mosaic", "max": 220}, {"op": "fade"}], ["checker", "blocks"], approx=True),
        transition("venetian", "Venetian", "Shapes", [{"op": "venetian", "direction": "vertical", "width": 8}], ["venetian", "blinds"]),
        transition("glitch", "Glitch", "Stylised", [{"op": "glitch", "amount": 60, "fps": 16}], ["glitch", "rgb"]),
        transition("rgb-split", "RGB Split", "Stylised", [{"op": "rgbsplit", "amount": 35}, {"op": "fade"}], ["rgb", "split"], approx=True, note="Approximated with per-channel blur."),
        transition("flash-through", "Flash Through", "Stylised", [{"op": "flash", "amount": 6}], ["flash", "white"]),
        transition("light-leak", "Light Leak", "Stylised", [{"op": "leak", "amount": 140}, {"op": "fade"}], ["light", "leak"], approx=True),
        transition("film-burn", "Film Burn", "Stylised", [{"op": "burn", "amount": 100}, {"op": "fade"}], ["film", "burn"]),
        transition("pixelate", "Pixelate", "Stylised", [{"op": "mosaic", "max": 320}, {"op": "fade"}], ["pixelate", "blocks"]),
        transition("mosaic", "Mosaic", "Stylised", [{"op": "mosaic", "max": 120}, {"op": "fade"}], ["mosaic", "tile"]),
        transition("ripple", "Ripple", "Stylised", [{"op": "ripple", "radius": 70}, {"op": "fade"}], ["ripple", "wave"]),
        transition("wave-warp", "Wave Warp", "Stylised", [{"op": "wave", "height": 40}, {"op": "fade"}], ["wave", "warp"]),
        transition("shake-cut", "Shake Cut", "Stylised", [{"op": "shake", "amount": 45, "fps": 18}, {"op": "fade"}], ["shake", "cut"]),
        transition("strobe", "Strobe", "Stylised", [{"op": "strobe", "fps": 14}, {"op": "flash", "amount": 2}], ["strobe", "flash"]),
        transition("luma-wipe", "Luma Wipe", "Stylised", [{"op": "levels", "amount": 60}, {"op": "fade"}], ["luma", "wipe"]),
        transition("smear", "Smear", "Stylised", [{"op": "smear", "amount": 80}, {"op": "fade"}], ["smear", "motion"]),
    ]


# --------------------------------------------------------------------------- effects

def effect(ident, name, family, ops, tags, when="playhead", duration=0.6, approx=False, note=None):
    item = {
        "id": "fx." + ident,
        "kind": "effect",
        "name": name,
        "family": family,
        "tags": tags,
        "when": when,
        "duration": duration,
        "ops": ops,
    }
    if approx:
        item["approx"] = True
    if note:
        item["note"] = note
    return item


def effects():
    return [
        # Motion / camera
        effect("motion.shake-light", "Shake Light", "Motion", [{"op": "shake", "amount": 10, "fps": 12}], ["shake", "light"]),
        effect("motion.shake-strong", "Shake Strong", "Motion", [{"op": "shake", "amount": 34, "fps": 18}], ["shake", "strong"]),
        effect("motion.handheld", "Handheld", "Motion", [{"op": "shake", "amount": 5, "fps": 4}, {"op": "shake", "amount": 1.5, "fps": 11}], ["handheld", "camera"], duration=2.0),
        effect("motion.zoom-punch", "Zoom Punch", "Motion", [{"op": "punch", "amount": 26}], ["zoom", "punch"], duration=0.35),
        effect("motion.slow-push-in", "Slow Push-In", "Motion", [{"op": "pushin", "amount": 18}], ["push", "slow"], duration=4.0),
        effect("motion.pull-out", "Pull-Out", "Motion", [{"op": "pullout", "amount": 18}], ["pull", "slow"], duration=4.0),
        effect("motion.whip", "Whip", "Motion", [{"op": "slide", "dx": 0.6, "dy": 0}, {"op": "blurdir", "amount": 60, "direction": 0}], ["whip", "fast"], duration=0.4),
        effect("motion.wiggle", "Wiggle", "Motion", [{"op": "wiggle", "amount": 8, "fps": 3}], ["wiggle", "loop"], duration=2.0),
        effect("motion.rotate-pulse", "Rotate Pulse", "Motion", [{"op": "rotatepulse", "amount": 4}], ["rotate", "pulse"], duration=2.0),
        effect("motion.camera-drift", "Camera Drift", "Motion", [{"op": "drift", "amount": 12, "period": 6}], ["drift", "camera"], duration=2.0),
        effect("motion.bounce", "Bounce", "Motion", [{"op": "bounce", "amount": 60}], ["bounce", "entrance"]),
        # Looks
        effect("look.teal-orange", "Teal & Orange", "Look", [{"op": "look", "temperature": 8, "contrast": 12, "shadows": -8, "highlights": 6, "saturation": 4}], ["look", "cinema"], when="layerStart", duration=0.01),
        effect("look.cinematic-warm", "Cinematic Warm", "Look", [{"op": "look", "temperature": 14, "contrast": 10, "highlights": 4}], ["look", "warm"], when="layerStart", duration=0.01),
        effect("look.cold-blue", "Cold Blue", "Look", [{"op": "look", "temperature": -18, "contrast": 8, "shadows": 6}], ["look", "cold"], when="layerStart", duration=0.01),
        effect("look.bleach-bypass", "Bleach Bypass", "Look", [{"op": "look", "saturation": -55, "contrast": 30, "faded": 4}], ["look", "bleach"], when="layerStart", duration=0.01),
        effect("look.bw-contrast", "B&W Contrast", "Look", [{"op": "bw", "contrast": 24}], ["look", "blackwhite"], when="layerStart", duration=0.01),
        effect("look.bw-soft", "B&W Soft", "Look", [{"op": "bw", "contrast": 4}], ["look", "blackwhite"], when="layerStart", duration=0.01),
        effect("look.sepia", "Sepia", "Look", [{"op": "duotone", "shadow": "#2B1B10", "highlight": "#F0D9B5"}], ["look", "sepia"], when="layerStart", duration=0.01),
        effect("look.vintage-fade", "Vintage Fade", "Look", [{"op": "look", "faded": 22, "saturation": -18, "temperature": 6}], ["look", "vintage"], when="layerStart", duration=0.01),
        effect("look.matte-black", "Matte Black", "Look", [{"op": "look", "contrast": 18, "blacks": -12, "saturation": -8}], ["look", "matte"], when="layerStart", duration=0.01),
        effect("look.high-key", "High Key", "Look", [{"op": "look", "exposure": 0.4, "contrast": 6, "highlights": 12}], ["look", "bright"], when="layerStart", duration=0.01),
        effect("look.low-key", "Low Key", "Look", [{"op": "look", "exposure": -0.4, "contrast": 16, "shadows": -10}], ["look", "dark"], when="layerStart", duration=0.01),
        effect("look.vibrance-pop", "Vibrance Pop", "Look", [{"op": "look", "vibrance": 28, "saturation": 6}], ["look", "vibrant"], when="layerStart", duration=0.01),
        effect("look.day-for-night", "Day for Night", "Look", [{"op": "look", "exposure": -0.6, "temperature": -20, "shadows": 8, "saturation": -12}], ["look", "night"], when="layerStart", duration=0.01),
        effect("look.golden-hour", "Golden Hour", "Look", [{"op": "look", "temperature": 22, "highlights": 10, "saturation": 10}], ["look", "golden"], when="layerStart", duration=0.01),
        effect("look.cyberpunk", "Cyberpunk", "Look", [{"op": "duotone", "shadow": "#12002B", "highlight": "#5CE1FF"}, {"op": "look", "saturation": 16, "contrast": 14}], ["look", "cyberpunk"], when="layerStart", duration=0.01),
        effect("look.moody-green", "Moody Green", "Look", [{"op": "look", "temperature": -6, "tint": 12, "contrast": 10, "saturation": -10}], ["look", "green"], when="layerStart", duration=0.01),
        effect("look.pastel", "Pastel", "Look", [{"op": "look", "faded": 14, "saturation": -6, "highlights": 8}], ["look", "pastel"], when="layerStart", duration=0.01),
        effect("look.warm-social", "Warm Social", "Look", [{"op": "look", "temperature": 12, "vibrance": 18}], ["look", "warm"], when="layerStart", duration=0.01),
        effect("look.cool-social", "Cool Social", "Look", [{"op": "look", "temperature": -12, "vibrance": 14}], ["look", "cool"], when="layerStart", duration=0.01),
        # Blur and glow
        effect("blur.gaussian", "Gaussian Blur", "Blur & Glow", [{"op": "blur", "amount": 18, "constant": True}], ["blur", "gaussian"], when="layerStart", duration=0.01),
        effect("blur.directional", "Directional Blur", "Blur & Glow", [{"op": "blurdir", "amount": 24, "direction": 0, "constant": True}], ["blur", "directional"], when="layerStart", duration=0.01),
        effect("blur.radial", "Radial Blur", "Blur & Glow", [{"op": "radialblur", "amount": 18, "constant": True}], ["blur", "radial"], when="layerStart", duration=0.01),
        effect("blur.zoom", "Zoom Blur", "Blur & Glow", [{"op": "radialblur", "amount": 26, "type": "zoom", "constant": True}], ["blur", "zoom"], when="layerStart", duration=0.01),
        effect("glow.soft", "Glow Soft", "Blur & Glow", [{"op": "glow", "radius": 30, "intensity": 1.2}], ["glow", "soft"], when="layerStart", duration=0.01),
        effect("glow.strong", "Glow Strong", "Blur & Glow", [{"op": "glow", "radius": 80, "intensity": 2.2}], ["glow", "strong"], when="layerStart", duration=0.01),
        effect("glow.bloom", "Bloom", "Blur & Glow", [{"op": "glow", "radius": 120, "intensity": 1.6, "threshold": 72}], ["bloom", "glow"], when="layerStart", duration=0.01),
        effect("glow.dream", "Dream Glow", "Blur & Glow", [{"op": "glow", "radius": 60, "intensity": 1.4}, {"op": "look", "faded": 8, "saturation": 4}], ["dream", "glow"], when="layerStart", duration=0.01),
        # Stylised
        effect("style.glitch", "Glitch", "Stylised", [{"op": "glitch", "amount": 40, "fps": 16}], ["glitch", "digital"], duration=0.8),
        effect("style.rgb-split", "RGB Split", "Stylised", [{"op": "rgbsplit", "amount": 18}], ["rgb", "split"], when="layerStart", duration=0.01, approx=True, note="Per-channel blur stands in for a spatial split."),
        effect("style.scanlines", "Scanlines", "Stylised", [{"op": "scanlines", "amount": 34}], ["scanlines", "crt"], when="layerStart", duration=0.01),
        effect("style.vhs", "VHS", "Stylised", [{"op": "scanlines", "amount": 24}, {"op": "grain", "amount": 20}, {"op": "wave", "height": 6, "constant": True}, {"op": "look", "saturation": -8, "faded": 12}], ["vhs", "retro"], when="layerStart", duration=0.01),
        effect("style.crt", "CRT", "Stylised", [{"op": "scanlines", "amount": 40}, {"op": "glow", "radius": 20, "intensity": 1.2}, {"op": "look", "contrast": 12}], ["crt", "retro"], when="layerStart", duration=0.01),
        effect("style.film-grain", "Film Grain", "Stylised", [{"op": "grain", "amount": 16}], ["grain", "film"], when="layerStart", duration=0.01),
        effect("style.old-film", "Old Film", "Stylised", [{"op": "duotone", "shadow": "#2B1B10", "highlight": "#F0D9B5"}, {"op": "grain", "amount": 12}, {"op": "flicker", "amount": 1.5}], ["oldfilm", "retro"], when="layerStart", duration=0.01),
        effect("style.halftone", "Halftone", "Stylised", [{"op": "posterize", "levels": 4}, {"op": "scanlines", "amount": 18}], ["halftone", "print"], when="layerStart", duration=0.01, approx=True),
        effect("style.posterize", "Posterize", "Stylised", [{"op": "posterize", "levels": 6}], ["posterize", "flat"], when="layerStart", duration=0.01),
        effect("style.pixelate", "Pixelate", "Stylised", [{"op": "mosaic", "max": 60, "constant": True}], ["pixelate", "mosaic"], when="layerStart", duration=0.01),
        effect("style.mosaic", "Mosaic", "Stylised", [{"op": "mosaic", "max": 24, "constant": True}], ["mosaic", "tile"], when="layerStart", duration=0.01),
        effect("style.duotone", "Duotone", "Stylised", [{"op": "duotone", "shadow": "#1A0033", "highlight": "#5CE1FF"}], ["duotone", "color"], when="layerStart", duration=0.01),
        effect("style.neon-edge", "Neon Edge", "Stylised", [{"op": "findedges"}, {"op": "glow", "radius": 18, "intensity": 1.8}], ["neon", "edge"], when="layerStart", duration=0.01),
        effect("style.sketch", "Sketch", "Stylised", [{"op": "findedges"}, {"op": "bw", "contrast": 20}], ["sketch", "line"], when="layerStart", duration=0.01),
        effect("style.heat-wave", "Heat Wave", "Stylised", [{"op": "wave", "height": 22, "speed": 1.4}], ["heat", "wave"], duration=2.0),
        effect("style.echo-trail", "Echo Trail", "Stylised", [{"op": "echo", "count": 4, "intensity": 80}], ["echo", "trail"], when="layerStart", duration=0.01),
        effect("style.strobe", "Strobe", "Stylised", [{"op": "strobe", "amount": 2.5, "fps": 14}], ["strobe", "flash"], duration=1.0),
        effect("style.flicker", "Flicker", "Stylised", [{"op": "flicker", "amount": 3}], ["flicker", "light"], duration=1.0),
        effect("style.kaleido", "Kaleido", "Stylised", [{"op": "kaleido", "segments": 6}], ["kaleido", "mirror"], when="layerStart", duration=0.01, approx=True),
        # Utility
        effect("util.vignette", "Vignette", "Utility", [{"op": "vignette", "amount": -55}], ["vignette", "dark"], when="layerStart", duration=0.01),
        effect("util.letterbox-239", "Letterbox 2.39", "Utility", [{"op": "letterbox", "ratio": 2.39}], ["letterbox", "cinema"], when="layerStart", duration=0.01),
        effect("util.letterbox-185", "Letterbox 1.85", "Utility", [{"op": "letterbox", "ratio": 1.85}], ["letterbox", "cinema"], when="layerStart", duration=0.01),
        effect("util.letterbox-45", "Letterbox 4:5", "Utility", [{"op": "letterbox", "ratio": 0.8}], ["letterbox", "social"], when="layerStart", duration=0.01),
        effect("util.safe-zone", "Safe Zone Overlay", "Utility", [{"op": "safezone"}], ["safezone", "guide"], when="layerStart", duration=0.01),
        effect("util.auto-contrast", "Auto Contrast", "Utility", [{"op": "look", "contrast": 14, "shadows": -6, "highlights": 6}], ["contrast", "auto"], when="layerStart", duration=0.01),
        effect("util.sharpen", "Sharpen", "Utility", [{"op": "sharpen", "amount": 40}], ["sharpen", "detail"], when="layerStart", duration=0.01),
        effect("util.denoise-light", "Light Denoise", "Utility", [{"op": "denoise", "radius": 2.5}], ["denoise", "noise"], when="layerStart", duration=0.01),
        effect("util.freeze-frame", "Freeze Frame", "Utility", [{"op": "freeze"}], ["freeze", "time"], when="playhead", duration=0.01),
        effect("util.speed-ramp", "Speed Ramp", "Utility", [{"op": "speedramp"}], ["speed", "ramp"], when="layerStart", duration=0.01, approx=True, note="Expression time remap; tune the key times in the timeline."),
        effect("util.reverse", "Reverse Clip", "Utility", [{"op": "reverse"}], ["reverse", "time"], when="layerStart", duration=0.01),
        effect("util.mirror", "Mirror", "Utility", [{"op": "mirror", "angle": 90}], ["mirror", "symmetry"], when="layerStart", duration=0.01),
        effect("util.crop-916", "Crop 9:16", "Utility", [{"op": "crop", "ratio": 0.5625}], ["crop", "vertical"], when="layerStart", duration=0.01),
    ]


# --------------------------------------------------------------------------- gradients and generators

def gradient(ident, name, family, colors, kind="linear", angle=0, anim="none", speed=30):
    return {
        "id": "bg." + ident,
        "kind": "gradient",
        "name": name,
        "family": family,
        "tags": ["gradient", family.lower(), kind],
        "sub": "gradient",
        "bg": {"kind": kind, "colors": colors, "angle": angle, "anim": anim, "speed": speed},
    }


def generators():
    rows = [
        ("solid", "Solid Color", ["#0B0E14"]),
        ("grey-scale", "Grey Scale", ["#000000", "#FFFFFF", "#FFFFFF", "#FFFFFF"]),
        ("color-bars-smpte", "SMPTE Color Bars", ["#C0C0C0"]),
        ("color-bars-ebu", "EBU Color Bars", ["#C0C0C0"]),
        ("checker", "Checkerboard", ["#101526"]),
        ("grid", "Grid", ["#101526"]),
        ("noise", "Noise", ["#101526"]),
        ("countdown", "Countdown", ["#0B0E14"]),
    ]
    out = []
    for ident, name, colors in rows:
        out.append({
            "id": "gen." + ident,
            "kind": "gradient",
            "name": name,
            "family": "Generators",
            "tags": ["generator", ident],
            "sub": "generator",
            "gen": ident,
            "color": colors[0],
        })
    return out


def gradients():
    return [
        gradient("sunset", "Sunset", "Warm", ["#FF512F", "#DD2476", "#6A11CB", "#2575FC"], "linear", 45, "rotate", 20),
        gradient("ocean", "Ocean", "Cool", ["#0F2027", "#2C5364", "#00C6FF", "#0072FF"], "linear", 90, "rotate", 15),
        gradient("aurora", "Aurora", "Nature", ["#00F5A0", "#00D9F5", "#7F00FF", "#E100FF"], "four", 0, "drift", 40),
        gradient("neon-night", "Neon Night", "Neon", ["#0B0B2B", "#FF00C8", "#00E5FF", "#1A0033"], "four", 0, "drift", 50),
        gradient("candy", "Candy", "Pastel", ["#FFB6B9", "#FAE3D9", "#BBDED6", "#8AC6D1"], "four", 0, "drift", 30),
        gradient("mint", "Mint", "Nature", ["#A8FF78", "#78FFD6", "#78FFD6", "#78FFD6"], "linear", 135, "none", 30),
        gradient("gold", "Gold", "Warm", ["#F7971E", "#FFD200", "#FFD200", "#FFD200"], "linear", 0, "none", 30),
        gradient("midnight", "Midnight", "Dark", ["#2B3A67", "#0A0A14", "#0A0A14", "#0A0A14"], "radial", 0, "pulse", 30),
        gradient("fire", "Fire", "Warm", ["#F12711", "#F5AF19", "#F5AF19", "#F5AF19"], "linear", 90, "rotate", 15),
        gradient("lavender", "Lavender", "Pastel", ["#E8D5FF", "#C6A8FF", "#9B7DFF", "#6C4FD8"], "linear", 120, "none", 20),
        gradient("peach", "Peach", "Pastel", ["#FFD3A5", "#FD6585", "#FD6585", "#FD6585"], "linear", 45, "none", 20),
        gradient("steel", "Steel", "Cool", ["#1F2937", "#374151", "#6B7280", "#9CA3AF"], "linear", 180, "none", 20),
        gradient("forest", "Forest", "Nature", ["#0B3D2E", "#1F6F50", "#3FA37A", "#A8E6CF"], "linear", 90, "drift", 18),
        gradient("dusk", "Dusk", "Warm", ["#2B1055", "#7597DE", "#FFB36B", "#FF6B6B"], "four", 0, "drift", 25),
        gradient("ice", "Ice", "Cool", ["#E0F7FF", "#A5D8FF", "#4DABF7", "#1C7ED6"], "linear", 135, "none", 20),
        gradient("rose-gold", "Rose Gold", "Luxury", ["#F9D9C6", "#E8A87C", "#C97B63", "#8C4A3C"], "linear", 45, "none", 20),
        gradient("cyber", "Cyber", "Neon", ["#0D0221", "#3A0CA3", "#F72585", "#4CC9F0"], "four", 0, "drift", 45),
        gradient("lava", "Lava", "Warm", ["#1A0000", "#8B0000", "#FF4500", "#FFD700"], "linear", 90, "pulse", 25),
        gradient("sky", "Sky", "Nature", ["#56CCF2", "#2F80ED", "#B2FEFA", "#0ED2F7"], "linear", 0, "drift", 12),
        gradient("mono", "Mono", "Dark", ["#000000", "#1F1F1F", "#4A4A4A", "#BFBFBF"], "linear", 0, "none", 10),
        gradient("emerald", "Emerald", "Luxury", ["#022C22", "#065F46", "#10B981", "#D1FAE5"], "linear", 120, "none", 15),
        gradient("sapphire", "Sapphire", "Luxury", ["#0A1128", "#1C3F94", "#2563EB", "#93C5FD"], "linear", 90, "drift", 14),
        gradient("coral", "Coral", "Warm", ["#FF7E5F", "#FEB47B", "#FFD6A5", "#FFF1E6"], "linear", 45, "none", 15),
        gradient("violet", "Violet", "Neon", ["#1A0033", "#5B21B6", "#A78BFA", "#F5D0FE"], "four", 0, "pulse", 30),
        gradient("sand", "Sand", "Calm", ["#E9D8A6", "#D4A373", "#BC6C25", "#FEFAE0"], "linear", 30, "none", 10),
        gradient("slate", "Slate", "Corporate", ["#0F172A", "#1E293B", "#334155", "#64748B"], "linear", 180, "none", 10),
        gradient("navy", "Navy", "Corporate", ["#020617", "#0F172A", "#1E3A8A", "#3B82F6"], "linear", 90, "drift", 10),
        gradient("teal", "Teal", "Corporate", ["#042F2E", "#115E59", "#14B8A6", "#99F6E4"], "linear", 135, "none", 12),
        gradient("sunrise", "Sunrise", "Warm", ["#FF9A8B", "#FF6A88", "#FF99AC", "#FFDEE9"], "linear", 0, "drift", 18),
        gradient("glacier", "Glacier", "Cool", ["#001219", "#005F73", "#0A9396", "#94D2BD"], "linear", 90, "none", 12),
        gradient("magenta", "Magenta", "Neon", ["#1A001A", "#7A0066", "#FF00AA", "#FFB3E6"], "four", 0, "pulse", 35),
        gradient("amber", "Amber", "Warm", ["#3D1F00", "#92400E", "#F59E0B", "#FEF3C7"], "linear", 45, "none", 12),
        gradient("plum", "Plum", "Dark", ["#1A0B2E", "#3B0764", "#6B21A8", "#C084FC"], "linear", 120, "drift", 20),
        gradient("seafoam", "Seafoam", "Calm", ["#E0F2F1", "#B2DFDB", "#80CBC4", "#4DB6AC"], "linear", 0, "none", 10),
        gradient("copper", "Copper", "Luxury", ["#2B1B10", "#7C2D12", "#C2410C", "#FDBA74"], "linear", 90, "none", 12),
        gradient("arctic", "Arctic", "Cool", ["#F8FAFC", "#CBD5E1", "#64748B", "#0F172A"], "linear", 180, "none", 10),
        gradient("tropical", "Tropical", "Nature", ["#006D77", "#83C5BE", "#FFDDD2", "#E29578"], "four", 0, "drift", 20),
        gradient("noir", "Noir", "Dark", ["#000000", "#0A0A0A", "#2B2B2B", "#6B6B6B"], "radial", 0, "pulse", 10),
        gradient("blush", "Blush", "Pastel", ["#FFF1F2", "#FFE4E6", "#FECDD3", "#FDA4AF"], "linear", 45, "none", 8),
        gradient("electric", "Electric", "Neon", ["#001233", "#0353A4", "#00B4D8", "#90E0EF"], "four", 0, "drift", 40),
        gradient("earth", "Earth", "Nature", ["#2F1B0C", "#6B4423", "#A67B5B", "#D2B48C"], "linear", 90, "none", 10),
        gradient("galaxy", "Galaxy", "Dark", ["#000000", "#1B0033", "#4C1D95", "#EC4899"], "radial", 0, "drift", 30),
    ]


# --------------------------------------------------------------------------- palettes

def palettes():
    rows = [
        ("corporate.trust", "Trust Blue", "Corporate", ["#0B1F3A", "#123B6D", "#1E5AA8", "#4F8FD4", "#E8F1FB"]),
        ("corporate.slate", "Slate Office", "Corporate", ["#0F172A", "#1E293B", "#475569", "#94A3B8", "#F1F5F9"]),
        ("corporate.graphite", "Graphite", "Corporate", ["#111111", "#2E2E2E", "#5C5C5C", "#A3A3A3", "#F5F5F5"]),
        ("tech.quantum", "Quantum", "Tech", ["#03071E", "#370617", "#6A040F", "#DC2F02", "#FFBA08"]),
        ("tech.circuit", "Circuit", "Tech", ["#001219", "#005F73", "#0A9396", "#94D2BD", "#E9D8A6"]),
        ("tech.signal", "Signal", "Tech", ["#0D1B2A", "#1B263B", "#415A77", "#778DA9", "#E0E1DD"]),
        ("nature.forest", "Forest Floor", "Nature", ["#0B3D2E", "#1F6F50", "#3FA37A", "#A8E6CF", "#F2FFF9"]),
        ("nature.desert", "Desert Clay", "Nature", ["#3D1F00", "#92400E", "#D97706", "#FCD34D", "#FFFBEB"]),
        ("nature.ocean", "Ocean Depth", "Nature", ["#012A4A", "#01497C", "#2A6F97", "#61A5C2", "#D7F9FF"]),
        ("luxury.gold", "Quiet Gold", "Luxury", ["#1A1305", "#3D2C0A", "#8A6A1F", "#D4AF37", "#FFF6D6"]),
        ("luxury.wine", "Wine Cellar", "Luxury", ["#1A0010", "#4A0E2E", "#7B1E4B", "#B05A7A", "#F7E6EE"]),
        ("luxury.jade", "Jade", "Luxury", ["#031A16", "#064E3B", "#0F766E", "#5EEAD4", "#ECFDF5"]),
        ("energy.volt", "Volt", "Energy", ["#111111", "#3A0CA3", "#7209B7", "#F72585", "#4CC9F0"]),
        ("energy.flame", "Flame", "Energy", ["#1A0000", "#7F1D1D", "#DC2626", "#F97316", "#FDE68A"]),
        ("energy.pulse", "Pulse", "Energy", ["#001219", "#005F73", "#EE9B00", "#CA6702", "#BB3E03"]),
        ("calm.linen", "Linen", "Calm", ["#F8F4E3", "#E9E3D5", "#CFC8B8", "#A8A08E", "#6B6455"]),
        ("calm.sage", "Sage", "Calm", ["#1F2A24", "#3E4F42", "#7A8F7B", "#B7C9B1", "#EDF3E9"]),
        ("calm.mist", "Mist", "Calm", ["#F4F7FB", "#DCE6F2", "#B7C9DD", "#8AA6C1", "#5C7A99"]),
        ("retro.arcade", "Arcade", "Retro", ["#0B0B2B", "#2D1B69", "#FF00C8", "#00E5FF", "#FFE600"]),
        ("retro.film", "Film Stock", "Retro", ["#1C120C", "#4A2C1A", "#8C5A3C", "#C9A27E", "#F0E2D0"]),
        ("retro.paper", "Paper", "Retro", ["#2B2118", "#5C4A32", "#A88B63", "#D9C7A7", "#F5EDDC"]),
        ("neon.cyber", "Cyber", "Neon", ["#0D0221", "#3A0CA3", "#F72585", "#4CC9F0", "#FFFFFF"]),
        ("neon.toxic", "Toxic", "Neon", ["#000000", "#1A3300", "#66FF00", "#CCFF00", "#FFFFFF"]),
        ("neon.ultra", "Ultra Violet", "Neon", ["#12002B", "#4C1D95", "#8B5CF6", "#E879F9", "#FDF4FF"]),
        ("pastel.cloud", "Cloud", "Pastel", ["#FDF2F8", "#FCE7F3", "#FBCFE8", "#F9A8D4", "#EC4899"]),
        ("pastel.mint", "Mint Cream", "Pastel", ["#F0FDFA", "#CCFBF1", "#99F6E4", "#5EEAD4", "#14B8A6"]),
        ("pastel.apricot", "Apricot", "Pastel", ["#FFF7ED", "#FFEDD5", "#FED7AA", "#FDBA74", "#F97316"]),
        ("dark.obsidian", "Obsidian", "Dark", ["#000000", "#0A0A0A", "#1A1A1A", "#333333", "#E5E5E5"]),
        ("dark.ink", "Ink", "Dark", ["#050914", "#0B1224", "#15213D", "#2B3A67", "#DCE6F5"]),
        ("dark.ember", "Ember", "Dark", ["#0A0505", "#1F0A0A", "#4C1D1D", "#991B1B", "#FCA5A5"]),
    ]
    return [
        {"id": "pal." + ident, "kind": "palette", "name": name, "family": family,
         "tags": ["palette", family.lower()], "colors": colors}
        for ident, name, family, colors in rows
    ]


# --------------------------------------------------------------------------- captions

CAPTION_BASE = {
    "fontFamily": "Inter",
    "fontStyle": "SemiBold",
    "fontSize": 54,
    "uppercase": False,
    "tracking": 0,
    "lineSpacing": 1.2,
    "fill": "#FFFFFF",
    "stroke": "#000000",
    "strokeWidth": 0,
    "shadow": None,
    "position": {"anchor": "bottom", "margin": 0.12, "offsetX": 0},
    "align": "center",
    "group": {"maxChars": 32, "maxWords": 7, "maxDuration": 4, "maxGap": 0.8},
    "animation": {"kind": "fade", "duration": 0.15, "easing": "outCubic"},
}


def caption(ident, name, family, tags, **kw):
    st = dict(CAPTION_BASE)
    approx = bool(kw.pop("approx", False))
    st.update(kw)
    item = {
        "id": "cap." + ident,
        "kind": "caption",
        "name": name,
        "family": family,
        "tags": tags,
        "style": st,
    }
    if approx:
        item["approx"] = True
    return item


def captions():
    return [
        caption("clean", "Clean", "Essential", ["caption", "clean"], fontStyle="Medium", shadow={"color": "#000000", "opacity": 60, "angle": 135, "distance": 4, "softness": 8}),
        caption("bold-yellow", "Bold Yellow", "Bold", ["caption", "yellow", "bold"], fontStyle="Bold", fontSize=76, uppercase=True, fill="#FFE600", strokeWidth=9, group={"maxChars": 20, "maxWords": 3, "maxDuration": 4, "maxGap": 0.8}, animation={"kind": "pop", "duration": 0.18, "easing": "outBack"}),
        caption("word-pop", "Word Pop", "Bold", ["caption", "word", "pop"], fontStyle="Bold", fontSize=110, uppercase=True, strokeWidth=10, group={"maxChars": 20, "maxWords": 1, "maxDuration": 4, "maxGap": 0.4}, animation={"kind": "pop", "duration": 0.14, "easing": "outBack"}),
        caption("minimal", "Minimal", "Essential", ["caption", "minimal"], fontStyle="Regular", fontSize=40, position={"anchor": "bottom", "margin": 0.08, "offsetX": 0}, group={"maxChars": 44, "maxWords": 9, "maxDuration": 4, "maxGap": 0.8}, animation={"kind": "none", "duration": 0.15, "easing": "outCubic"}),
        caption("subtitle-outline", "Subtitle Outline", "Essential", ["caption", "outline"], strokeWidth=6, animation={"kind": "slideUp", "duration": 0.2, "easing": "outCubic"}),
        caption("hormozi", "Hormozi", "Social", ["caption", "hormozi", "yellow"], fontStyle="Bold", fontSize=120, uppercase=True, fill="#FFE600", strokeWidth=14, position={"anchor": "middle", "margin": 0.12, "offsetX": 0}, group={"maxChars": 20, "maxWords": 1, "maxDuration": 4, "maxGap": 0.4}, animation={"kind": "pop", "duration": 0.12, "easing": "outBack"}),
        caption("karaoke", "Karaoke", "Social", ["caption", "karaoke"], fontSize=64, strokeWidth=7, position={"anchor": "bottom", "margin": 0.1, "offsetX": 0}, group={"maxChars": 30, "maxWords": 5, "maxDuration": 4, "maxGap": 0.8}, animation={"kind": "none", "duration": 0.15, "easing": "outCubic"}),
        caption("beasty", "Beasty", "Social", ["caption", "beasty", "bold"], fontStyle="Black", fontSize=118, uppercase=True, fill="#FFFFFF", stroke="#FF0033", strokeWidth=12, group={"maxChars": 18, "maxWords": 2, "maxDuration": 4, "maxGap": 0.5}, animation={"kind": "pop", "duration": 0.16, "easing": "outBack"}),
        caption("boxed-dark", "Boxed Dark", "Boxed", ["caption", "box", "dark"], fontSize=56, fill="#FFFFFF", strokeWidth=0, shadow={"color": "#000000", "opacity": 55, "angle": 135, "distance": 3, "softness": 6}, group={"maxChars": 28, "maxWords": 6, "maxDuration": 4, "maxGap": 0.8}),
        caption("boxed-light", "Boxed Light", "Boxed", ["caption", "box", "light"], fontSize=56, fill="#111111", strokeWidth=0, group={"maxChars": 28, "maxWords": 6, "maxDuration": 4, "maxGap": 0.8}),
        caption("glass", "Glass", "Boxed", ["caption", "glass"], fontStyle="Medium", fontSize=52, fill="#FFFFFF", strokeWidth=0, shadow={"color": "#000000", "opacity": 40, "angle": 135, "distance": 6, "softness": 14}, group={"maxChars": 30, "maxWords": 7, "maxDuration": 4, "maxGap": 0.8}),
        caption("neon", "Neon", "Social", ["caption", "neon", "glow"], fontStyle="Bold", fontSize=72, fill="#5CE1FF", stroke="#000000", strokeWidth=4, uppercase=True, animation={"kind": "fade", "duration": 0.2, "easing": "outCubic"}),
        caption("retro", "Retro", "Style", ["caption", "retro"], fontFamily="Trebuchet MS", fontStyle="Bold", fontSize=64, fill="#FFE600", stroke="#7B2CBF", strokeWidth=8, group={"maxChars": 26, "maxWords": 5, "maxDuration": 4, "maxGap": 0.8}),
        caption("comic", "Comic", "Style", ["caption", "comic"], fontFamily="Comic Sans MS", fontStyle="Bold", fontSize=70, uppercase=True, fill="#FFFFFF", stroke="#000000", strokeWidth=10, group={"maxChars": 22, "maxWords": 4, "maxDuration": 4, "maxGap": 0.7}, animation={"kind": "pop", "duration": 0.2, "easing": "outElastic"}),
        caption("cinema", "Cinema", "Style", ["caption", "cinema"], fontFamily="Georgia", fontStyle="Italic", fontSize=46, uppercase=False, fill="#F5F7FB", strokeWidth=0, position={"anchor": "bottom", "margin": 0.09, "offsetX": 0}, group={"maxChars": 42, "maxWords": 9, "maxDuration": 5, "maxGap": 1.0}, animation={"kind": "fade", "duration": 0.25, "easing": "outQuad"}),
        caption("news-ticker", "News Ticker", "Style", ["caption", "news", "ticker"], fontStyle="Bold", fontSize=38, uppercase=True, fill="#FFFFFF", strokeWidth=0, position={"anchor": "bottom", "margin": 0.04, "offsetX": 0}, group={"maxChars": 52, "maxWords": 10, "maxDuration": 6, "maxGap": 1.0}, animation={"kind": "slideUp", "duration": 0.12, "easing": "linear"}),
        caption("two-tone", "Two-Tone", "Social", ["caption", "two-tone"], fontStyle="Bold", fontSize=78, uppercase=True, fill="#5CE1FF", stroke="#101526", strokeWidth=6, group={"maxChars": 24, "maxWords": 4, "maxDuration": 4, "maxGap": 0.6}),
        caption("gradient-fill", "Gradient Fill", "Social", ["caption", "gradient"], fontStyle="Bold", fontSize=80, uppercase=True, fill="#FFB36B", strokeWidth=0, group={"maxChars": 24, "maxWords": 4, "maxDuration": 4, "maxGap": 0.6}, approx=True),
        caption("typewriter", "Typewriter", "Style", ["caption", "typewriter"], fontFamily="Courier New", fontStyle="Bold", fontSize=44, fill="#F5F7FB", strokeWidth=0, position={"anchor": "bottom", "margin": 0.1, "offsetX": 0}, group={"maxChars": 38, "maxWords": 8, "maxDuration": 4, "maxGap": 0.8}, animation={"kind": "none", "duration": 0.1, "easing": "linear"}),
        caption("handwritten", "Handwritten", "Style", ["caption", "handwritten"], fontFamily="Segoe Script", fontStyle="Regular", fontSize=52, uppercase=False, fill="#FFFFFF", strokeWidth=0, group={"maxChars": 34, "maxWords": 7, "maxDuration": 4, "maxGap": 0.8}, approx=True),
        caption("arabic-naskh", "Arabic Naskh", "Arabic", ["caption", "arabic", "rtl"], fontFamily="Noto Naskh Arabic", fontStyle="Regular", fontSize=58, uppercase=False, fill="#FFFFFF", strokeWidth=4, align="right", group={"maxChars": 34, "maxWords": 7, "maxDuration": 4, "maxGap": 0.8}),
        caption("arabic-kufi", "Arabic Kufi", "Arabic", ["caption", "arabic", "rtl"], fontFamily="Noto Kufi Arabic", fontStyle="Bold", fontSize=56, uppercase=False, fill="#FFE600", strokeWidth=5, align="right", group={"maxChars": 32, "maxWords": 6, "maxDuration": 4, "maxGap": 0.8}),
        caption("arabic-bold-boxed", "Arabic Bold Boxed", "Arabic", ["caption", "arabic", "rtl", "box"], fontFamily="Noto Sans Arabic", fontStyle="Black", fontSize=64, uppercase=False, fill="#FFFFFF", strokeWidth=0, align="right", group={"maxChars": 28, "maxWords": 6, "maxDuration": 4, "maxGap": 0.8}),
        caption("tiny-footnote", "Tiny Footnote", "Essential", ["caption", "small"], fontStyle="Regular", fontSize=28, fill="#E5E7EB", strokeWidth=0, position={"anchor": "bottom", "margin": 0.05, "offsetX": 0}, group={"maxChars": 60, "maxWords": 12, "maxDuration": 5, "maxGap": 1.0}, animation={"kind": "fade", "duration": 0.1, "easing": "linear"}),
        caption("big-center", "Big Center", "Bold", ["caption", "center", "big"], fontStyle="Black", fontSize=130, uppercase=True, fill="#FFFFFF", strokeWidth=8, position={"anchor": "middle", "margin": 0.12, "offsetX": 0}, group={"maxChars": 16, "maxWords": 2, "maxDuration": 4, "maxGap": 0.4}, animation={"kind": "pop", "duration": 0.2, "easing": "outBack"}),
        caption("top-bar", "Top Bar", "Style", ["caption", "top"], fontStyle="Bold", fontSize=42, uppercase=True, fill="#FFFFFF", strokeWidth=0, position={"anchor": "top", "margin": 0.06, "offsetX": 0}, group={"maxChars": 42, "maxWords": 8, "maxDuration": 5, "maxGap": 0.9}, animation={"kind": "slideUp", "duration": 0.15, "easing": "outCubic"}),
        caption("lower-third", "Lower Third Caption", "Style", ["caption", "lowerthird"], fontStyle="Medium", fontSize=44, uppercase=False, fill="#FFFFFF", strokeWidth=0, position={"anchor": "bottom", "margin": 0.16, "offsetX": 0}, group={"maxChars": 40, "maxWords": 8, "maxDuration": 5, "maxGap": 0.9}, animation={"kind": "slideUp", "duration": 0.18, "easing": "outCubic"}),
        caption("speaker-colors", "Speaker Colors", "Social", ["caption", "speaker", "color"], fontStyle="Bold", fontSize=62, uppercase=False, fill="#5CE1FF", stroke="#101526", strokeWidth=4, group={"maxChars": 30, "maxWords": 6, "maxDuration": 4, "maxGap": 0.8}),
        caption("emoji-auto", "Emoji Auto", "Social", ["caption", "emoji"], fontStyle="Bold", fontSize=68, uppercase=True, fill="#FFFFFF", strokeWidth=6, group={"maxChars": 24, "maxWords": 4, "maxDuration": 4, "maxGap": 0.6}, approx=True),
        caption("highlight-keyword", "Highlight Keyword", "Social", ["caption", "keyword", "highlight"], fontStyle="Bold", fontSize=66, uppercase=False, fill="#FFFFFF", stroke="#000000", strokeWidth=5, group={"maxChars": 30, "maxWords": 6, "maxDuration": 4, "maxGap": 0.7}, approx=True),
        caption("cinema-italic", "Cinema Italic", "Style", ["caption", "cinema", "italic"], fontFamily="Georgia", fontStyle="Italic", fontSize=50, fill="#F5F7FB", strokeWidth=0, group={"maxChars": 40, "maxWords": 8, "maxDuration": 5, "maxGap": 1.0}),
        caption("bold-white-box", "Bold White Box", "Boxed", ["caption", "box", "white"], fontStyle="Black", fontSize=66, uppercase=True, fill="#111111", strokeWidth=0, group={"maxChars": 24, "maxWords": 5, "maxDuration": 4, "maxGap": 0.7}, animation={"kind": "pop", "duration": 0.15, "easing": "outBack"}),
        caption("soft-shadow", "Soft Shadow", "Essential", ["caption", "shadow"], fontStyle="Medium", fontSize=56, fill="#FFFFFF", strokeWidth=0, shadow={"color": "#000000", "opacity": 75, "angle": 135, "distance": 6, "softness": 18}, group={"maxChars": 34, "maxWords": 7, "maxDuration": 4, "maxGap": 0.8}),
        caption("outlined-heavy", "Outlined Heavy", "Bold", ["caption", "outline", "heavy"], fontStyle="Black", fontSize=92, uppercase=True, fill="#FFFFFF", stroke="#000000", strokeWidth=16, group={"maxChars": 20, "maxWords": 3, "maxDuration": 4, "maxGap": 0.5}),
    ]


# --------------------------------------------------------------------------- sounds

def sounds():
    rows = [
        # id, name, family, seconds, recipe, variant
        ("whoosh", "Whoosh", "Whoosh", 0.9, "legacy", 0),
        ("whoosh-fast", "Fast Whoosh", "Whoosh", 0.4, "legacy", 0),
        ("sweep-down", "Sweep Down", "Whoosh", 0.8, "legacy", 0),
        ("whoosh-soft", "Soft Whoosh", "Whoosh", 1.1, "whoosh", 11),
        ("whoosh-deep", "Deep Whoosh", "Whoosh", 1.3, "whoosh", 12),
        ("swoosh-up", "Swoosh Up", "Whoosh", 0.7, "whoosh", 13),
        ("swoosh-down", "Swoosh Down", "Whoosh", 0.7, "whoosh", 14),
        ("air-pass", "Air Pass", "Whoosh", 1.5, "whoosh", 15),
        ("riser", "Riser", "Riser", 1.6, "legacy", 0),
        ("tension-riser", "Tension Riser", "Riser", 2.4, "riser", 21),
        ("noise-riser", "Noise Riser", "Riser", 1.8, "riser", 22),
        ("reverse-swell", "Reverse Swell", "Riser", 2.0, "reverse", 23),
        ("build-up", "Build Up", "Riser", 2.8, "riser", 24),
        ("uplift", "Uplift", "Riser", 2.2, "riser", 25),
        ("ascend", "Ascend", "Riser", 1.4, "riser", 26),
        ("impact", "Cinematic Impact", "Impact", 1.5, "legacy", 0),
        ("punch", "Punch Hit", "Impact", 0.35, "legacy", 0),
        ("bass-drop", "Bass Drop", "Impact", 1.8, "legacy", 0),
        ("heartbeat", "Heartbeat", "Impact", 1.2, "legacy", 0),
        ("boom", "Boom", "Impact", 1.6, "boom", 31),
        ("slam", "Slam", "Impact", 0.6, "impact", 32),
        ("thud", "Thud", "Impact", 0.45, "impact", 33),
        ("sub-drop", "Sub Drop", "Drop", 1.4, "drop", 41),
        ("drop-hit", "Drop Hit", "Drop", 1.0, "drop", 42),
        ("low-boom", "Low Boom", "Drop", 1.8, "boom", 43),
        ("downlifter", "Downlifter", "Drop", 1.5, "downlifter", 44),
        ("gravity", "Gravity", "Drop", 2.2, "downlifter", 45),
        ("floor-shake", "Floor Shake", "Drop", 1.2, "impact", 46),
        ("sub-pulse", "Sub Pulse", "Drop", 1.0, "drop", 47),
        ("pop", "Pop", "UI", 0.15, "legacy", 0),
        ("click", "Click", "UI", 0.05, "legacy", 0),
        ("key", "Key Press", "UI", 0.07, "legacy", 0),
        ("toggle", "Toggle", "UI", 0.12, "ui", 51),
        ("swipe-ui", "Swipe UI", "UI", 0.25, "ui", 52),
        ("hover", "Hover", "UI", 0.08, "ui", 53),
        ("confirm", "Confirm", "UI", 0.3, "ui", 54),
        ("ding", "Bell Ding", "Notification", 1.4, "legacy", 0),
        ("notify", "Notification", "Notification", 0.6, "legacy", 0),
        ("success", "Success Chime", "Notification", 0.9, "legacy", 0),
        ("error", "Error Buzz", "Notification", 0.45, "legacy", 0),
        ("message", "Message", "Notification", 0.5, "chime", 61),
        ("alert", "Alert", "Notification", 0.7, "chime", 62),
        ("chime-soft", "Soft Chime", "Notification", 1.2, "chime", 63),
        ("sparkle", "Sparkle", "Magic", 1.1, "legacy", 0),
        ("zap", "Laser Zap", "Magic", 0.4, "legacy", 0),
        ("glitch", "Glitch", "Magic", 0.5, "legacy", 0),
        ("tape-stop", "Tape Stop", "Magic", 1.0, "legacy", 0),
        ("shimmer", "Shimmer", "Magic", 1.6, "shimmer", 71),
        ("fairy-dust", "Fairy Dust", "Magic", 1.8, "shimmer", 72),
        ("magic-wand", "Magic Wand", "Magic", 1.2, "sparkle", 73),
        ("data-stream", "Data Stream", "Digital", 1.4, "digital", 81),
        ("bit-crush", "Bit Crush", "Digital", 0.6, "digital", 82),
        ("static-burst", "Static Burst", "Digital", 0.4, "digital", 83),
        ("modem", "Modem", "Digital", 1.8, "digital", 84),
        ("error-code", "Error Code", "Digital", 0.8, "digital", 85),
        ("digital-rain", "Digital Rain", "Digital", 2.0, "digital", 86),
        ("shutter", "Camera Shutter", "Camera", 0.25, "legacy", 0),
        ("focus-pull", "Focus Pull", "Camera", 0.6, "camera", 91),
        ("lens-click", "Lens Click", "Camera", 0.2, "camera", 92),
        ("film-advance", "Film Advance", "Camera", 0.9, "camera", 93),
        ("flash-charge", "Flash Charge", "Camera", 1.2, "riser", 94),
        ("camera-roll", "Camera Roll", "Camera", 1.5, "camera", 95),
        ("room-tone", "Room Tone", "Ambience", 3.0, "ambience", 101),
        ("soft-wind", "Soft Wind", "Ambience", 4.0, "ambience", 102),
        ("deep-drone", "Deep Drone", "Ambience", 5.0, "ambience", 103),
        ("air-pad", "Air Pad", "Ambience", 4.0, "ambience", 104),
        ("ocean-wash", "Ocean Wash", "Ambience", 4.5, "ambience", 105),
        ("night-ambience", "Night Ambience", "Ambience", 5.0, "ambience", 106),
        ("boing", "Boing", "Cartoon", 0.7, "cartoon", 111),
        ("squeak", "Squeak", "Cartoon", 0.4, "cartoon", 112),
        ("slide-whistle", "Slide Whistle", "Cartoon", 1.0, "cartoon", 113),
        ("bonk", "Bonk", "Cartoon", 0.3, "cartoon", 114),
        ("pop-cork", "Pop Cork", "Cartoon", 0.25, "cartoon", 115),
        ("wobble", "Wobble", "Cartoon", 0.8, "cartoon", 116),
        ("laser-zap", "Laser Zap", "Sci-Fi", 0.4, "scifi", 121),
        ("phaser", "Phaser", "Sci-Fi", 0.8, "scifi", 122),
        ("warp", "Warp", "Sci-Fi", 1.6, "scifi", 123),
        ("teleport", "Teleport", "Sci-Fi", 1.2, "scifi", 124),
        ("hologram", "Hologram", "Sci-Fi", 1.4, "scifi", 125),
        ("energy-hum", "Energy Hum", "Sci-Fi", 2.0, "scifi", 126),
    ]
    out = []
    for ident, name, family, seconds, recipe, variant in rows:
        out.append({
            "id": "sfx." + ident,
            "kind": "sfx",
            "name": name,
            "family": family,
            "tags": ["sound", family.lower()],
            "seconds": seconds,
            "recipe": recipe,
            "variant": variant,
        })
    return out


# --------------------------------------------------------------------------- workflow tools

def tools():
    rows = [
        ("markers.chapters", "Chapter Markers", "Markers", "marker.chapters", "comp", ["marker", "chapter"]),
        ("markers.beats", "Beat Markers", "Markers", "marker.beats", "audio", ["marker", "beat", "music"]),
        ("markers.notes", "Note Markers", "Markers", "marker.notes", "comp", ["marker", "note"]),
        ("layers.rename", "Rename Layers", "Layers", "layer.rename", "layers", ["rename", "layer"]),
        ("layers.labels", "Colour Labels", "Layers", "layer.labels", "layers", ["label", "color"]),
        ("layers.nulls", "Auto Nulls", "Layers", "layer.nulls", "layers", ["null", "parent"]),
        ("layers.anchor", "Anchor Snap", "Layers", "layer.anchor", "layers", ["anchor", "center"]),
        ("layers.trim", "Trim Path", "Layers", "layer.trim", "shape", ["trim", "path"]),
        ("layers.sequence", "Sequence Layers", "Layers", "layer.sequence", "two-layers", ["sequence", "stagger"]),
        ("layers.align-left", "Align Left", "Layers", "layer.align-left", "layers", ["align", "left"]),
        ("layers.distribute", "Distribute", "Layers", "layer.distribute", "two-layers", ["distribute", "space"]),
        ("layers.precompose", "Pre-compose Clean", "Layers", "layer.precompose", "layers", ["precompose", "clean"]),
        ("layers.explode", "Text Exploder", "Text", "text.explode", "text", ["text", "explode", "words"]),
        ("layers.batch-offset", "Batch Offset", "Layers", "layer.batch-offset", "layers", ["batch", "offset", "stagger"]),
        ("project.916", "Vertical 9:16", "Project", "project.preset-916", "comp", ["project", "social", "vertical"]),
        ("project.11", "Square 1:1", "Project", "project.preset-11", "comp", ["project", "social", "square"]),
        ("project.45", "Portrait 4:5", "Project", "project.preset-45", "comp", ["project", "social", "portrait"]),
        ("project.169", "Landscape 16:9", "Project", "project.preset-169", "comp", ["project", "video", "landscape"]),
        ("project.4k", "4K UHD", "Project", "project.preset-4k", "comp", ["project", "4k"]),
        ("project.safe", "Safe Area Guides", "Project", "project.safe", "comp", ["project", "safe", "guide"]),
        ("history.repeat", "Repeat on Selection", "Workflow", "history.repeat", "layers", ["history", "repeat"]),
        ("history.clear", "Clear Flow History", "Workflow", "history.clear", "comp", ["history", "clear"]),
        ("time.freeze", "Freeze Frame", "Time", "time.freeze", "layers", ["freeze", "time"]),
        ("time.reverse", "Reverse Clip", "Time", "time.reverse", "layers", ["reverse", "time"]),
    ]
    return [
        {"id": "tool." + ident, "kind": "tool", "name": name, "family": family,
         "tags": tags, "tool": tool_id, "needs": needs}
        for ident, name, family, tool_id, needs, tags in rows
    ]
