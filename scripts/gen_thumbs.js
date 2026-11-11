// Generate one illustration per catalogue item.
//
// Every item gets a deterministic 240x144 PNG in assets/thumbs/<slug>@2x.png, built from a
// seeded, dependency-free renderer: a dusk sky, a sun and its glow, a skyline/mountain
// silhouette, water, vignette and grain, then a per-kind overlay (A/B wipe for transitions,
// grade bars for effects, type blocks for titles/text, a caption bar, palette bands, a waveform
// for sounds, a widget frame for widgets, a glyph for tools).
//
// The panel loads these files when the installed folder ships assets/thumbs; otherwise it keeps
// its drawn fallbacks. Nothing is fetched at runtime, so the gallery works offline.
//
//   node scripts/gen_thumbs.js [--size 240x144] [--only transition,effect]
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// ------------------------------------------------------------------ PNG
const CRC_TABLE = (() => {
  const t = new Int32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = -1;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}
function chunk(type, data) {
  const out = Buffer.alloc(12 + data.length);
  out.writeUInt32BE(data.length, 0);
  out.write(type, 4, 'ascii');
  data.copy(out, 8);
  out.writeUInt32BE(crc32(Buffer.concat([Buffer.from(type, 'ascii'), data])), 8 + data.length);
  return out;
}
// Indexed PNG (colour type 3): one byte per pixel + a 216-colour uniform palette. A 525-image
// gallery has to stay small; truecolour gradients doubled the download for no visible gain.
const PAL_LEVELS = 6;
function writePngIndexed(file, w, h, rgba) {
  const palette = Buffer.alloc(PAL_LEVELS * PAL_LEVELS * PAL_LEVELS * 3);
  for (let r = 0; r < PAL_LEVELS; r++) {
    for (let g = 0; g < PAL_LEVELS; g++) {
      for (let b = 0; b < PAL_LEVELS; b++) {
        const i = ((r * PAL_LEVELS + g) * PAL_LEVELS + b) * 3;
        palette[i] = Math.round((r * 255) / (PAL_LEVELS - 1));
        palette[i + 1] = Math.round((g * 255) / (PAL_LEVELS - 1));
        palette[i + 2] = Math.round((b * 255) / (PAL_LEVELS - 1));
      }
    }
  }
  const step = 255 / (PAL_LEVELS - 1);
  const idx = Buffer.alloc(w * h);
  const raw = Buffer.alloc((w + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w + 1)] = 0;
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const r = Math.round(rgba[i] / step);
      const g = Math.round(rgba[i + 1] / step);
      const b = Math.round(rgba[i + 2] / step);
      raw[y * (w + 1) + 1 + x] = ((r * PAL_LEVELS + g) * PAL_LEVELS + b) & 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 3; // indexed
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('PLTE', palette),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}

// ------------------------------------------------------------------ helpers
function hash(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}
function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s >>>= 0;
    s ^= s >>> 17;
    s ^= s << 5; s >>>= 0;
    return s / 4294967296;
  };
}
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smooth = (t) => t * t * (3 - 2 * t);
function mix(c1, c2, t) {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)];
}
function hex(s) {
  const t = String(s || '').replace('#', '');
  if (t.length !== 6) return null;
  const n = parseInt(t, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// Palette per kind: sky top, sky bottom, sun, silhouette, accent.
const PALETTES = {
  transition: [[18, 20, 40], [70, 38, 46], [255, 176, 96], [10, 14, 26], [92, 225, 255]],
  effect: [[26, 16, 44], [48, 24, 62], [180, 120, 255], [12, 10, 24], [123, 125, 255]],
  title: [[10, 14, 28], [28, 34, 62], [255, 214, 140], [8, 10, 20], [245, 247, 251]],
  text: [[12, 22, 40], [34, 56, 92], [255, 230, 170], [8, 12, 22], [92, 225, 255]],
  caption: [[28, 20, 20], [56, 34, 28], [255, 196, 120], [12, 10, 12], [255, 189, 89]],
  gradient: [[30, 20, 50], [60, 40, 40], [255, 200, 140], [16, 12, 24], [255, 255, 255]],
  palette: [[20, 24, 34], [40, 46, 58], [230, 230, 230], [10, 12, 18], [255, 255, 255]],
  sfx: [[14, 34, 34], [24, 58, 50], [160, 255, 210], [8, 14, 16], [68, 215, 162]],
  widget: [[20, 18, 44], [38, 34, 76], [200, 190, 255], [12, 10, 26], [123, 125, 255]],
  tool: [[22, 26, 34], [44, 50, 62], [220, 230, 240], [12, 14, 18], [92, 225, 255]],
};

// ------------------------------------------------------------------ scene
function renderScene(w, h, seed, pal, horizon) {
  const rnd = rng(seed);
  const sky1 = pal[0];
  const sky2 = pal[1];
  const sun = pal[2];
  const sil = pal[3];
  const hz = Math.round(h * (horizon === undefined ? 0.62 : horizon));
  const sunX = Math.round(w * (0.22 + rnd() * 0.5));
  const sunY = Math.round(hz * (0.48 + rnd() * 0.22));
  const sunR = Math.round(w * (0.055 + rnd() * 0.035));
  const ridge = [];
  const ridge2 = [];
  let n = 0;
  for (let x = 0; x < w; x++) {
    n += (rnd() - 0.5) * 0.5;
    n = clamp(n, -1, 1);
    ridge[x] = Math.round(hz - n * h * 0.10);
    ridge2[x] = Math.round(hz + Math.abs(Math.sin(x * 0.07 + rnd() * 0.02)) * h * 0.025);
  }
  const buf = Buffer.alloc(w * h * 4);
  for (let y = 0; y < h; y++) {
    const t = smooth(clamp(y / hz, 0, 1));
    const base = mix(sky1, sky2, t);
    for (let x = 0; x < w; x++) {
      let c = base;
      // sun disc + wide glow
      const dx = x - sunX;
      const dy = y - sunY;
      const d2 = dx * dx + dy * dy;
      if (d2 < sunR * sunR) {
        c = mix(c, sun, 0.92);
      } else {
        const g = Math.exp(-d2 / (sunR * sunR * 26));
        c = mix(c, sun, g * 0.5);
      }
      // reflection glow on the water under the sun
      if (y > hz) {
        const rx = Math.abs(x - sunX);
        const band = Math.exp(-(rx * rx) / (w * w * 0.02)) * Math.exp(-(y - hz) / (h * 0.28));
        c = mix(c, sun, band * 0.22);
      }
      let out = c;
      // skyline / ridge silhouette
      if (y >= ridge[x]) out = mix(out, sil, 0.94);
      if (y >= ridge2[x]) out = mix(out, sil, 0.55);
      // vignette
      const vx = (x - w / 2) / (w / 2);
      const vy = (y - h / 2) / (h / 2);
      const v = 1 - 0.28 * smooth(clamp((vx * vx + vy * vy) * 0.7, 0, 1));
      // Smooth output (no per-pixel grain): a 525-image gallery has to stay a few MB, and
      // smooth gradients compress far better than noise does.
      const i = (y * w + x) * 4;
      buf[i] = clamp(out[0] * v, 0, 255) | 0;
      buf[i + 1] = clamp(out[1] * v, 0, 255) | 0;
      buf[i + 2] = clamp(out[2] * v, 0, 255) | 0;
      buf[i + 3] = 255;
    }
  }
  return buf;
}
function hash2(x, y, seed) {
  let h = seed ^ Math.imul(x + 1, 374761393) ^ Math.imul(y + 1, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

// ------------------------------------------------------------------ overlay helpers
function rect(buf, w, h, x0, y0, rw, rh, color, alpha) {
  const x1 = clamp(x0 + rw, 0, w);
  const y1 = clamp(y0 + rh, 0, h);
  for (let y = clamp(y0, 0, h); y < y1; y++) {
    for (let x = clamp(x0, 0, w); x < x1; x++) {
      const i = (y * w + x) * 4;
      buf[i] = lerp(buf[i], color[0], alpha) | 0;
      buf[i + 1] = lerp(buf[i + 1], color[1], alpha) | 0;
      buf[i + 2] = lerp(buf[i + 2], color[2], alpha) | 0;
    }
  }
}
function circle(buf, w, h, cx, cy, r, color, alpha) {
  for (let y = Math.max(0, cy - r); y < Math.min(h, cy + r); y++) {
    for (let x = Math.max(0, cx - r); x < Math.min(w, cx + r); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy <= r * r) {
        const i = (y * w + x) * 4;
        buf[i] = lerp(buf[i], color[0], alpha) | 0;
        buf[i + 1] = lerp(buf[i + 1], color[1], alpha) | 0;
        buf[i + 2] = lerp(buf[i + 2], color[2], alpha) | 0;
      }
    }
  }
}
function wave(buf, w, h, color) {
  const baseY = Math.round(h * 0.72);
  for (let x = 6; x < w - 6; x++) {
    const env = Math.sin((x / w) * Math.PI);
    const y = Math.round(baseY - Math.sin(x * 0.22) * env * h * 0.20 - Math.sin(x * 0.07) * env * h * 0.06);
    for (let k = 0; k < 2; k++) {
      const yy = clamp(y + k, 0, h - 1);
      const i = (yy * w + x) * 4;
      buf[i] = lerp(buf[i], color[0], 0.85) | 0;
      buf[i + 1] = lerp(buf[i + 1], color[1], 0.85) | 0;
      buf[i + 2] = lerp(buf[i + 2], color[2], 0.85) | 0;
    }
  }
}

// ------------------------------------------------------------------ per-kind overlays
function overlay(kind, item, buf, w, h, pal, seed) {
  const accent = [pal[4][0], pal[4][1], pal[4][2]];
  const rnd = rng(seed ^ 0x9e3779b9);
  if (kind === 'transition') {
    // A/B reveal: left scene, right darker grade, a bright diagonal seam.
    const seam = Math.round(w * (0.44 + rnd() * 0.12));
    for (let y = 0; y < h; y++) {
      const e = seam + Math.round((y / h - 0.5) * 10);
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (x > e) {
          buf[i] = lerp(buf[i], 10, 0.42) | 0;
          buf[i + 1] = lerp(buf[i + 1], 14, 0.42) | 0;
          buf[i + 2] = lerp(buf[i + 2], 26, 0.42) | 0;
        }
        if (Math.abs(x - e) < 2) {
          buf[i] = lerp(buf[i], accent[0], 0.85) | 0;
          buf[i + 1] = lerp(buf[i + 1], accent[1], 0.85) | 0;
          buf[i + 2] = lerp(buf[i + 2], accent[2], 0.85) | 0;
        }
      }
    }
    return;
  }
  if (kind === 'effect') {
    const bars = 3 + Math.floor(rnd() * 3);
    for (let b = 0; b < bars; b++) {
      const y = Math.round((0.16 + b * 0.17) * h);
      rect(buf, w, h, 0, y, w, 2 + Math.floor(rnd() * 3), accent, 0.18 + rnd() * 0.2);
    }
    circle(buf, w, h, Math.round(w * 0.7), Math.round(h * 0.4), Math.round(w * 0.09), accent, 0.28);
    return;
  }
  if (kind === 'title' || kind === 'text') {
    const cx = Math.round(w * 0.5);
    const y = Math.round(h * (kind === 'title' ? 0.32 : 0.36));
    rect(buf, w, h, Math.round(w * 0.2), y, Math.round(w * 0.44), Math.round(h * 0.075), [255, 255, 255], 0.94);
    rect(buf, w, h, Math.round(w * 0.24), y + Math.round(h * 0.12), Math.round(w * 0.3), Math.round(h * 0.04), [255, 255, 255], 0.66);
    rect(buf, w, h, Math.round(w * 0.24), y + Math.round(h * 0.2), Math.round(w * 0.36), Math.round(h * 0.032), [255, 255, 255], 0.38);
    if (kind === 'text') {
      for (let i = 0; i < 3; i++) {
        const t = i / 2;
        circle(buf, w, h, Math.round(lerp(w * 0.3, w * 0.72, t)), Math.round(lerp(h * 0.72, h * 0.5, t)), 2, accent, 0.9);
      }
    }
    return;
  }
  if (kind === 'caption') {
    rect(buf, w, h, Math.round(w * 0.08), Math.round(h * 0.74), Math.round(w * 0.84), Math.round(h * 0.15), [4, 5, 9], 0.78);
    rect(buf, w, h, Math.round(w * 0.12), Math.round(h * 0.79), Math.round(w * 0.5), Math.round(h * 0.035), [255, 255, 255], 0.92);
    rect(buf, w, h, Math.round(w * 0.12), Math.round(h * 0.845), Math.round(w * 0.34), Math.round(h * 0.028), [255, 255, 255], 0.55);
    return;
  }
  if (kind === 'gradient') {
    const cols = (item.colors && item.colors.length ? item.colors : ['#5ce1ff', '#7b7dff', '#ffbd59'])
      .map(hex)
      .filter(Boolean);
    const c0 = cols[0] || accent;
    const c1 = cols[cols.length - 1] || [255, 255, 255];
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const t = (x / w) * 0.7 + (y / h) * 0.3;
        const c = mix(c0, c1, clamp(t, 0, 1));
        const i = (y * w + x) * 4;
        buf[i] = lerp(buf[i], c[0], 0.55) | 0;
        buf[i + 1] = lerp(buf[i + 1], c[1], 0.55) | 0;
        buf[i + 2] = lerp(buf[i + 2], c[2], 0.55) | 0;
      }
    }
    return;
  }
  if (kind === 'palette') {
    const cols = (item.colors && item.colors.length ? item.colors : ['#5ce1ff', '#7b7dff', '#44d7a2', '#ffbd59', '#ff5f6d'])
      .map(hex)
      .filter(Boolean);
    const n = Math.max(1, cols.length);
    const sw = w / n;
    for (let i = 0; i < n; i++) {
      rect(buf, w, h, Math.round(i * sw), Math.round(h * 0.2), Math.round(sw) + 1, Math.round(h * 0.6), cols[i], 0.82);
    }
    return;
  }
  if (kind === 'sfx') {
    const bars = 38;
    const mid = Math.round(h * 0.52);
    for (let b = 0; b < bars; b++) {
      const x = Math.round((b + 0.5) * (w / bars));
      const amp = Math.abs(Math.sin(b * 0.6 + rnd() * 0.4)) * (0.4 + rnd() * 0.6);
      const bh = Math.max(2, Math.round(amp * h * 0.34));
      rect(buf, w, h, x, mid - bh, 2, bh * 2, accent, 0.85);
    }
    return;
  }
  if (kind === 'widget') {
    const x = Math.round(w * 0.2), y = Math.round(h * 0.24);
    const ww = Math.round(w * 0.6), hh = Math.round(h * 0.52);
    rect(buf, w, h, x, y, ww, hh, [12, 14, 24], 0.55);
    rect(buf, w, h, x, y, ww, Math.max(1, Math.round(hh * 0.04)), accent, 0.95);
    rect(buf, w, h, x + 6, y + 9, Math.round(ww * 0.45), 3, [255, 255, 255], 0.9);
    rect(buf, w, h, x + 6, y + 16, Math.round(ww * 0.6), 2, [255, 255, 255], 0.5);
    circle(buf, w, h, x + ww - 10, y + 10, 4, accent, 0.9);
    return;
  }
  if (kind === 'tool') {
    circle(buf, w, h, Math.round(w * 0.5), Math.round(h * 0.5), Math.round(w * 0.12), accent, 0.16);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const x = Math.round(w * 0.5 + Math.cos(a) * w * 0.15);
      const y = Math.round(h * 0.5 + Math.sin(a) * w * 0.15);
      circle(buf, w, h, x, y, 2, accent, 0.8);
    }
    return;
  }
  // generic
  rect(buf, w, h, Math.round(w * 0.15), Math.round(h * 0.2), Math.round(w * 0.7), 2, accent, 0.8);
}

// ------------------------------------------------------------------ catalogue
const FILES = [
  ['transitions.json', 'transition'],
  ['effects.json', 'effect'],
  ['titles.json', 'title'],
  ['text-animations.json', 'text'],
  ['captions.json', 'caption'],
  ['gradients.json', 'gradient'],
  ['palettes.json', 'palette'],
  ['sfx.json', 'sfx'],
  ['widgets.json', 'widget'],
  ['tools.json', 'tool'],
];

function slug(id) {
  return String(id).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-+|-+$/g, '').toLowerCase();
}

function args() {
  const a = { w: 200, h: 120, only: null };
  const it = process.argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    if (it[i] === '--size') {
      const m = /^(\d+)x(\d+)$/.exec(it[++i] || '');
      if (!m) throw new Error('--size WxH');
      a.w = Number(m[1]);
      a.h = Number(m[2]);
    } else if (it[i] === '--only') {
      a.only = String(it[++i]).split(',').map((s) => s.trim());
    } else throw new Error(`unknown argument ${it[i]}`);
  }
  return a;
}

function main() {
  const a = args();
  const catalogDir = path.join(__dirname, '..', 'catalog');
  const outDir = path.join(__dirname, '..', 'assets', 'thumbs');
  fs.mkdirSync(outDir, { recursive: true });

  // Remove stale generated files (keeps the folder in sync with the catalogue).
  for (const f of fs.readdirSync(outDir)) {
    if (/@2x\.png$/.test(f)) fs.unlinkSync(path.join(outDir, f));
  }

  const manifest = [];
  let total = 0;
  for (const [file, kind] of FILES) {
    const full = path.join(catalogDir, file);
    if (!fs.existsSync(full)) continue;
    const data = JSON.parse(fs.readFileSync(full, 'utf8'));
    if (a.only && a.only.indexOf(kind) < 0) continue;
    const items = data.items || [];
    const base = PALETTES[kind] || PALETTES.effect;
    for (const item of items) {
      const seed = hash(String(item.id || item.name || ''));
      const rnd = rng(seed);
      // Per-item hue variation so a screen of cards is not one flat colour.
      const shift = (rnd() - 0.5) * 46;
      const pal = [
        base[0].map((v) => clamp(v + shift, 0, 255)),
        base[1].map((v) => clamp(v + shift * 0.6, 0, 255)),
        base[2],
        base[3],
        base[4],
      ];
      const buf = renderScene(a.w, a.h, seed, pal, 0.58 + rnd() * 0.14);
      overlay(kind, item, buf, a.w, a.h, pal, seed);
      const file2 = path.join(outDir, `${slug(item.id || item.name)}@2x.png`);
      writePngIndexed(file2, a.w, a.h, buf);
      manifest.push({ id: item.id, kind, name: item.name, file: path.basename(file2) });
      total++;
      if (total % 50 === 0) console.log(`  ${total} images...`);
    }
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ size: [a.w, a.h], items: manifest }, null, 1));
  console.log(`Generated ${total} thumbnails in ${outDir} (${a.w}x${a.h})`);
}

main();
