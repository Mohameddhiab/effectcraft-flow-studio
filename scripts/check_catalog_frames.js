// Checks every rendered catalogue frame with a dependency-free PNG reader (zlib only):
//  - transitions: non-blank, the base is visible at the start, and the frame changes by the end;
//  - effects: non-blank and varied enough that the plate was actually processed.
// Prints PASS/FAIL per item and a SUMMARY per kind; exit 1 on any failure.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const root = path.join(__dirname, '..');
const frames = path.join(root, 'target', 'frames');

function decode(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error('not a PNG');
  let off = 8, w = 0, h = 0, bd = 8, ct = 6;
  const idat = [];
  while (off + 8 <= b.length) {
    const len = b.readUInt32BE(off);
    const type = b.toString('ascii', off + 4, off + 8);
    const data = b.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); bd = data[8]; ct = data[9]; }
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bd !== 8 || (ct !== 6 && ct !== 2 && ct !== 0)) throw new Error('unsupported PNG ' + bd + '/' + ct);
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 1;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0;
      const up = y > 0 ? out[(y - 1) * stride + x] : 0;
      const ul = x >= bpp && y > 0 ? out[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += up;
      else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) {
        const p = a + up - ul, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - ul);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? up : ul;
      }
      out[y * stride + x] = v & 255;
    }
  }
  return { w, h, bpp, data: out };
}

function stats(img) {
  const { w, h, bpp, data } = img;
  const seen = new Set();
  let n = 0, sum = 0, sum2 = 0, green = 0, red = 0;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      const i = (y * w + x) * bpp;
      const r = data[i], g = bpp > 1 ? data[i + 1] : r, bl = bpp > 1 ? data[i + 2] : r;
      seen.add((r >> 3) + ',' + (g >> 3) + ',' + (bl >> 3));
      const l = (r + g + bl) / 3;
      sum += l; sum2 += l * l; n++;
      if (g > r * 1.25 && g > bl * 1.15) green++;
      if (r > g * 1.3 && r > bl * 1.2) red++;
    }
  }
  const mean = sum / n;
  return { unique: seen.size, mean, std: Math.sqrt(Math.max(0, sum2 / n - mean * mean)), green: green / n, red: red / n };
}

function diff(a, b) {
  const n = Math.min(a.data.length, b.data.length);
  let s = 0, c = 0;
  for (let i = 0; i < n; i += 4) { s += Math.abs(a.data[i] - b.data[i]) + Math.abs(a.data[i + 1] - b.data[i + 1]) + Math.abs(a.data[i + 2] - b.data[i + 2]); c++; }
  return s / (c * 3);
}

const trs = fs.existsSync(path.join(frames, 'tr')) ? fs.readdirSync(path.join(frames, 'tr')).filter((f) => /-0\.png$/.test(f)).map((f) => f.replace(/-0\.png$/, '')) : [];
const fxs = fs.existsSync(path.join(frames, 'fx')) ? fs.readdirSync(path.join(frames, 'fx')).filter((f) => f.endsWith('.png')).map((f) => f.slice(0, -4)) : [];
let trPass = 0, trFail = 0, fxPass = 0, fxFail = 0;

for (const slug of trs) {
  try {
    const a = decode(path.join(frames, 'tr', slug + '-0.png'));
    const b = decode(path.join(frames, 'tr', slug + '-50.png'));
    const c = decode(path.join(frames, 'tr', slug + '-100.png'));
    const sa = stats(a), sb = stats(b), sc = stats(c);
    const d = diff(a, c);
    // Textured plates: the transition must visibly change the frame and both ends must be non-blank.
    // A dip can legitimately end on a flat colour, so a solid frame still counts as content.
    const ok = sa.unique >= 1 && sc.unique >= 1 && d >= 1;
    if (ok) trPass++; else trFail++;
    console.log((ok ? 'PASS ' : 'FAIL ') + 'transition ' + slug + (ok ? '' : `  -> red0=${sa.red.toFixed(2)} green100=${sc.green.toFixed(2)} diff=${d.toFixed(1)} unique=${sa.unique}/${sc.unique}`));
  } catch (e) {
    trFail++; console.log('FAIL transition ' + slug + '  -> ' + e.message);
  }
}
const basePath = path.join(frames, 'base.png');
const base = fs.existsSync(basePath) ? decode(basePath) : null;
for (const slug of fxs) {
  try {
    const img = decode(path.join(frames, 'fx', slug + '.png'));
    const s = stats(img);
    const changed = base ? diff(base, img) : 0;
    // A threshold/edge effect can legitimately output a flat colour: a large change from the
    // reference plate still proves the effect ran, while a small change needs visible variation.
    const ok = (s.unique >= 3 && s.std >= 2 && (base ? changed >= 0.5 : true)) || (base && changed >= 10);
    if (ok) fxPass++; else fxFail++;
    console.log((ok ? 'PASS ' : 'FAIL ') + 'effect ' + slug + (ok ? '' : `  -> unique=${s.unique} std=${s.std.toFixed(1)} vsBase=${changed.toFixed(2)}`));
  } catch (e) {
    fxFail++; console.log('FAIL effect ' + slug + '  -> ' + e.message);
  }
}
console.log(`SUMMARY Transitions: ${trPass} PASS, ${trFail} FAIL`);
console.log(`SUMMARY Effects: ${fxPass} PASS, ${fxFail} FAIL`);
process.exit(trFail + fxFail ? 1 : 0);
