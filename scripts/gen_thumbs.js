// Generate placeholder thumbnails for catalogue transitions
// 55 transition kinds, 400x240 px, exported as assets/thumbs/<kind>-<id>@2x.png

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// CRC table for PNG
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

function writePng(file, w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1), y * stride, (y + 1) * stride);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const png = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
  fs.writeFileSync(file, png);
}

// 55 transition kinds from the catalogue
const transitionKinds = [
  'fade', 'dip', 'exposure', 'grain', 'blur', 'levels', 'slide', 'push',
  'blurdir', 'spin', 'zoom', 'zoomthrough', 'dolly', 'swing', 'scaleWidth',
  'wipe', 'rotate', 'iris', 'radial', 'venetian', 'mosaic', 'glitch',
  'rgbsplit', 'flash', 'leak', 'burn', 'ripple', 'wave', 'shake', 'strobe',
  'smear', 'look', 'bw', 'duotone', 'glow', 'radialblur', 'scanlines',
  'flicker', 'posterize', 'echo', 'findedges', 'kaleido', 'vignette',
  'letterbox', 'safezone', 'sharpen', 'denoise', 'freeze', 'speedramp',
  'reverse', 'mirror', 'crop', 'punch', 'pushin', 'pullout', 'rotatepulse',
  'drift', 'bounce', 'offset'
];

const thumbsDir = path.join(__dirname, '..', 'assets', 'thumbs');
fs.mkdirSync(thumbsDir, { recursive: true });

transitionKinds.forEach((kind, i) => {
  const canvasSize = 400;
  const rgba = Buffer.alloc(canvasSize * canvasSize * 4);
  
  // Fill with kind-specific color
  for (let y = 0; y < canvasSize; y++) {
    for (let x = 0; x < canvasSize; x++) {
      const idx = (y * canvasSize + x) * 4;
      const r = (i * 50) % 256;
      const g = (i * 100) % 256;
      const b = (i * 150) % 256;
      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = 255;
    }
  }
  
  const filename = path.join(thumbsDir, `${kind}-${i + 1}@2x.png`);
  writePng(filename, canvasSize, 240, rgba);
  console.log(`Created ${filename} ${canvasSize}x240`);
});

console.log(`Generated ${transitionKinds.length} transition thumbnails in ${thumbsDir}`);