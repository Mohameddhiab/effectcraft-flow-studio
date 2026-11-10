#!/usr/bin/env node
// Offscreen Flow Studio panel captures for docs/images.
//
// Starts the desktop app with `--control` (its hidden agent window), installs the panel in a
// throwaway EFFECTCRAFT_CONFIG_DIR, maximizes it, drives the real ScriptUI controls, and saves
// PNGs through the control channel's `ui.screenshot`. No desktop session, window manager or
// human click is involved; the app still needs a working GPU/desktop runtime to paint.
//
//   node scripts/panel_snapshot.js [--out docs/images] [--app target/debug/effectcraft.exe]
//       [--width 1280] [--height 860] [--keep-config] [--port N]
//
// The capture is cropped to the panel tab bar (the app toolbar above it is not part of the
// panel), using a dependency-free PNG reader/writer.
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const net = require('net');
const { spawn } = require('child_process');

const root = path.join(__dirname, '..');

function args() {
  const a = {
    app: process.env.EFFECTCRAFT_APP || path.join(root, 'target', 'debug', process.platform === 'win32' ? 'effectcraft.exe' : 'effectcraft'),
    out: path.join(root, 'docs', 'images'),
    panel: path.join(root, 'extensions', 'scriptui-panels', 'Flow Studio.jsx'),
    width: 1280,
    height: 860,
    keepConfig: false,
    port: 0,
  };
  const it = process.argv.slice(2);
  for (let i = 0; i < it.length; i++) {
    const k = it[i];
    const v = () => {
      if (i + 1 >= it.length) throw new Error(`${k} needs a value`);
      return it[++i];
    };
    if (k === '--app') a.app = path.resolve(v());
    else if (k === '--out') a.out = path.resolve(v());
    else if (k === '--panel') a.panel = path.resolve(v());
    else if (k === '--width') a.width = Number(v());
    else if (k === '--height') a.height = Number(v());
    else if (k === '--port') a.port = Number(v());
    else if (k === '--keep-config') a.keepConfig = true;
    else if (k === '-h' || k === '--help') {
      console.log('usage: node scripts/panel_snapshot.js [--out DIR] [--app EXE] [--width N] [--height N] [--port N] [--keep-config]');
      process.exit(0);
    } else throw new Error(`unknown argument ${k}`);
  }
  for (const n of ['width', 'height']) {
    if (!Number.isFinite(a[n]) || a[n] < 100) throw new Error(`--${n} must be at least 100`);
  }
  return a;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ------------------------------------------------------------------ PNG (zlib only)
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

function decodePng(file) {
  const b = fs.readFileSync(file);
  if (b.readUInt32BE(0) !== 0x89504e47) throw new Error(`${file}: not a PNG`);
  let off = 8;
  let w = 0;
  let h = 0;
  let bd = 8;
  let ct = 6;
  const idat = [];
  while (off + 8 <= b.length) {
    const len = b.readUInt32BE(off);
    const type = b.toString('ascii', off + 4, off + 8);
    const data = b.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      w = data.readUInt32BE(0);
      h = data.readUInt32BE(4);
      bd = data[8];
      ct = data[9];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    off += 12 + len;
  }
  if (bd !== 8 || ![6, 2, 0].includes(ct)) throw new Error(`${file}: unsupported PNG ${bd}/${ct}`);
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : 1;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  const stride = w * bpp;
  const px = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[y * stride + x - bpp] : 0;
      const up = y > 0 ? px[(y - 1) * stride + x] : 0;
      const ul = x >= bpp && y > 0 ? px[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a;
      else if (f === 2) v += up;
      else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) {
        const p = a + up - ul;
        const pa = Math.abs(p - a);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - ul);
        v += pa <= pb && pa <= pc ? a : pb <= pc ? up : ul;
      }
      px[y * stride + x] = v & 0xff;
    }
  }
  const rgba = Buffer.alloc(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    if (bpp === 4) px.copy(rgba, i * 4, i * 4, i * 4 + 4);
    else if (bpp === 3) {
      rgba[i * 4] = px[i * 3];
      rgba[i * 4 + 1] = px[i * 3 + 1];
      rgba[i * 4 + 2] = px[i * 3 + 2];
      rgba[i * 4 + 3] = 255;
    } else {
      rgba[i * 4] = rgba[i * 4 + 1] = rgba[i * 4 + 2] = px[i];
      rgba[i * 4 + 3] = 255;
    }
  }
  return { w, h, rgba };
}

function writePng(file, w, h, rgba) {
  const stride = w * 4;
  const raw = Buffer.alloc((stride + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (stride + 1)] = 0;
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
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

/** Crops `src` to `w`x`h` starting at `y`, and writes `dst`; returns the output size. */
function cropPng(src, dst, y, w, h) {
  const img = decodePng(src);
  if (img.w < w || y + h > img.h) throw new Error(`${src}: ${img.w}x${img.h} cannot be cropped to ${w}x${h}+${y}`);
  const out = Buffer.alloc(w * h * 4);
  for (let row = 0; row < h; row++) {
    img.rgba.copy(out, row * w * 4, ((y + row) * img.w) * 4, ((y + row) * img.w + w) * 4);
  }
  writePng(dst, w, h, out);
  return { w, h };
}

// ------------------------------------------------------------------ control channel
class Control {
  constructor(socket) {
    this.socket = socket;
    this.buf = '';
    this.id = 0;
    this.waiting = new Map();
    socket.on('data', (d) => {
      this.buf += d;
      let i;
      while ((i = this.buf.indexOf('\n')) >= 0) {
        const line = this.buf.slice(0, i);
        this.buf = this.buf.slice(i + 1);
        if (!line.trim()) continue;
        let msg;
        try {
          msg = JSON.parse(line);
        } catch (e) {
          continue;
        }
        const w = this.waiting.get(msg.id);
        if (w) {
          this.waiting.delete(msg.id);
          w(msg);
        }
      }
    });
  }

  request(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = ++this.id;
      const timer = setTimeout(() => {
        this.waiting.delete(id);
        reject(new Error(`${method}: no reply after 60 s`));
      }, 60000);
      this.waiting.set(id, (msg) => {
        clearTimeout(timer);
        resolve(msg);
      });
      this.socket.write(JSON.stringify({ id, method, params }) + '\n');
    });
  }

  async call(method, params = {}) {
    const r = await this.request(method, params);
    if (!r.ok) throw new Error(`${method}: ${r.error}`);
    return r.result;
  }

  /** engine.execute unwraps one level and surfaces the command's own ok/error. */
  async exec(command, params = {}) {
    const r = await this.call('engine.execute', { command, params });
    const inner = r && r.result !== undefined ? r.result : r;
    if (inner && inner.ok === false) throw new Error(`${command}: ${inner.error}`);
    return inner;
  }
}

function freePort() {
  return new Promise((resolve, reject) => {
    const s = net.createServer();
    s.once('error', reject);
    s.listen(0, '127.0.0.1', () => {
      const p = s.address().port;
      s.close(() => resolve(p));
    });
  });
}

async function connect(port, child) {
  const end = Date.now() + 30000;
  let last;
  while (Date.now() < end) {
    if (child.exitCode !== null) throw new Error(`the app exited with code ${child.exitCode} before answering`);
    try {
      const socket = await new Promise((resolve, reject) => {
        const s = net.connect(port, '127.0.0.1', () => resolve(s));
        s.once('error', reject);
      });
      return new Control(socket);
    } catch (e) {
      last = e;
      await sleep(250);
    }
  }
  throw new Error(`no control port ${port}: ${last && last.message}`);
}

function walk(node, fn) {
  if (!node || typeof node !== 'object') return undefined;
  const hit = fn(node);
  if (hit !== undefined) return hit;
  for (const key of ['children', 'items']) {
    if (Array.isArray(node[key])) {
      for (const child of node[key]) {
        const r = walk(child, fn);
        if (r !== undefined) return r;
      }
    }
  }
  return undefined;
}

async function main() {
  const a = args();
  if (!fs.existsSync(a.app)) throw new Error(`app not found: ${a.app}\nBuild it or pass --app.`);
  if (!fs.existsSync(a.panel)) throw new Error(`panel not found: ${a.panel}`);
  fs.mkdirSync(a.out, { recursive: true });

  const config = path.join(root, 'target', 'panel-snapshot-config');
  const panelDir = path.join(config, 'Scripts', 'ScriptUI Panels');
  fs.rmSync(config, { recursive: true, force: true });
  fs.mkdirSync(panelDir, { recursive: true });
  fs.copyFileSync(a.panel, path.join(panelDir, path.basename(a.panel)));

  const port = a.port || (await freePort());
  const env = { ...process.env, EFFECTCRAFT_CONFIG_DIR: config };
  let child = null;
  let ctl = null;
  let log = '';
  const boot = async () => {
    child = spawn(a.app, ['--control', String(port), '--empty'], {
      env,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });
    child.stdout.on('data', (d) => (log += d));
    child.stderr.on('data', (d) => (log += d));
    ctl = await connect(port, child);
  };
  const done = async (code) => {
    try {
      if (ctl) {
        await ctl.request('app.quit', { force: true });
        ctl.socket.end();
      }
    } catch (e) {}
    if (child.exitCode === null) child.kill();
    if (!a.keepConfig) fs.rmSync(config, { recursive: true, force: true });
    process.exit(code);
  };
  for (const sig of ['SIGINT', 'SIGTERM']) process.on(sig, () => done(1));

  try {
    await boot();
    let inspect = await ctl.call('ui.inspect');
    // The panel's ScriptUI layout needs 1 point per pixel (the reference test's ppp 1.0); on a
    // scaled display its controls are not laid out at all. egui's UI Scale setting is applied by
    // the app on load, so set it in the throwaway config and relaunch until it reads back.
    for (let tries = 0; tries < 3 && Math.abs((inspect.pixelsPerPoint || 1) - 1) > 0.01; tries++) {
      const uiScale = Math.max(75, Math.min(200, Math.round(100 / inspect.pixelsPerPoint)));
      try {
        await ctl.request('app.quit', { force: true });
      } catch (e) {}
      ctl.socket.end();
      await new Promise((resolve) => {
        if (child.exitCode !== null) return resolve();
        const t = setTimeout(resolve, 5000);
        child.once('exit', () => {
          clearTimeout(t);
          resolve();
        });
      });
      if (child.exitCode === null) child.kill();
      fs.writeFileSync(
        path.join(config, 'prefs.json'),
        JSON.stringify({ version: 3, appearance: { appearanceMode: 'dark', theme: 'dark', uiScale } })
      );
      await sleep(500);
      log = '';
      await boot();
      await sleep(1000);
      inspect = await ctl.call('ui.inspect');
      console.log(`INFO uiScale ${uiScale} -> ${inspect.pixelsPerPoint} px/pt`);
    }
    if (Math.abs((inspect.pixelsPerPoint || 1) - 1) > 0.01) {
      throw new Error(`the app did not apply UI Scale (still ${inspect.pixelsPerPoint} px/pt)`);
    }
    const ppp = inspect.pixelsPerPoint;
    await ctl.call('ui.set', { menuBar: false, theme: 'dark' });
    // Size the window BEFORE the panel is created: a docked ScriptUI window keeps the layout it
    // was built with, and resizing it afterwards leaves its tab content under the tab row.
    await ctl.call('ui.resize', {
      width: Math.round(a.width / ppp),
      height: Math.round(a.height / ppp) + 42,
    });
    await sleep(700);

    // A startup update check can open a modal over the workspace; it is not part of the panel.
    const dismissUpdate = async () => {
      await sleep(700);
      const els = await ctl.call('ui.elements', {});
      const later = els.find((e) => /^(later|plus tard|ignorer|skip)$/i.test(String(e.label || '').trim()));
      if (later) {
        await ctl.call('ui.click', { id: later.id });
        await sleep(400);
      }
    };
    await dismissUpdate();

    const opened = await ctl.exec('window.scriptPanel', { name: path.basename(a.panel) });
    const openedWindow = opened && opened.window;
    await sleep(800);
    const windows = await ctl.exec('scriptui.list', {});
    const panelWindow = (Array.isArray(windows) ? windows : windows && windows.result ? windows.result : []).find(
      (w) => w.script === path.basename(a.panel)
    );
    if (!panelWindow) throw new Error('the Flow Studio panel did not open');
    const win = panelWindow.window ?? openedWindow;

    // Dark panel theme (the dropdown's item text), independent of the app theme.
    const tree = await ctl.exec('scriptui.get', { window: win });
    const themeId = walk(tree, (n) => (Array.isArray(n.items) && n.items.includes('Sombre') ? n.id : undefined));
    if (themeId !== undefined) {
      await ctl.exec('scriptui.set', { window: win, widget: themeId, value: 'Sombre' });
      await sleep(300);
    }

    // Maximize by hovering a panel control: window.maximizePanel uses the panel under the pointer.
    // Wait for the panel's first painted frame instead of assuming a fixed startup time.
    let elements = [];
    for (let i = 0; i < 120 && !elements.length; i++) {
      elements = await ctl.call('ui.elements', { prefix: `scriptui.${win}.` });
      if (!elements.length) await sleep(200);
    }
    const anchor = elements.find((e) => e.label === 'Continuer sans helper') || elements.find((e) => e.rect[2] > 40) || elements[0];
    if (!anchor) {
      const list = await ctl.exec('scriptui.list', {});
      throw new Error(`no panel control to point at (win=${JSON.stringify(win)}, list=${JSON.stringify(list)}, elements=${JSON.stringify(elements).slice(0, 300)})`);
    }
    const [ax, ay, aw, ah] = anchor.rect;
    await ctl.call('ui.move', { x: ax + aw / 2, y: ay + ah / 2 });
    const max = await ctl.exec('window.maximizePanel', {});
    if (!max || !JSON.stringify(max.maximized || null).includes('ScriptPanel')) {
      throw new Error(`the wrong panel maximized: ${JSON.stringify(max && max.maximized)}`);
    }
    await sleep(500);

    // The panel's own onResize pins its tabbed area to the pane height; without this callback the
    // tab row and the active tab's first row occupy the same y (overlapping). App 0.23+ takes
    // `size`; older hosts do not expose the command, so a failure is reported, not hidden.
    const rootEl = (await ctl.call('ui.elements', {})).find((e) => e.id === `scriptui.${win}`);
    if (!rootEl) throw new Error('the Flow Studio panel has no bounds');
    await ctl.exec('scriptui.resize', {
      window: win,
      size: [Math.max(320, Math.floor(rootEl.rect[2])), Math.max(300, Math.floor(rootEl.rect[3]))],
    });
    await sleep(500);

    // The app toolbar above the panel tab bar is not part of the panel: crop at the tab bar.
    const tops = (await ctl.call('ui.elements', {})).filter((e) => e.id && e.id.startsWith('panel.tab.ScriptPanel'));
    if (!tops.length) throw new Error('the Flow Studio tab is not on screen');
    const tabY = Math.min(...tops.map((e) => e.rect[1]));
    const cropY = Math.max(0, Math.floor(tabY * ppp));
    await sleep(700);

    const shot = async (name) => {
      await dismissUpdate();
      await sleep(700);
      const full = path.join(a.out, `.${name}.full.png`);
      const final = path.join(a.out, `${name}.png`);
      let r;
      let lastError;
      // Capture the panel element itself: it is resolved from the live layout, so a hidden app
      // window or a panel that moved does not turn the shot into an empty desktop grab.
      for (let attempt = 1; attempt <= 4; attempt++) {
        try {
          r = await ctl.call('ui.screenshot', { path: full, id: `scriptui.${win}` });
          if (r && r.width) break;
          lastError = new Error('no image');
        } catch (e) {
          lastError = e;
          if (/covered or minimized/i.test(e.message)) {
            try {
              await ctl.call('ui.focus');
            } catch (e2) {}
            await sleep(1200);
          }
        }
        await sleep(600);
      }
      if (!r || !r.width) throw new Error(`ui.screenshot ${name}: ${lastError ? lastError.message : 'no image'}`);
      fs.renameSync(full, final);
      console.log(`PASS ${name}.png ${r.width}x${r.height}`);
    };
    const click = async (text) => {
      await ctl.exec('scriptui.click', { window: win, widget: text });
      await sleep(900);
    };
    // Capture ui.screenshot by element id, not by window, so it works even when the
    // app window is in the background. The panel element is resolved from the live layout.
    ;(async () => {
      // noop: captured inline per-screenshot below via the id param
    })();

    await shot('flow-studio-after-welcome');
    await click('Continuer sans helper');
    await shot('flow-studio-after-library');
    await click('Montage');
    await click('Sous-titres');
    await shot('flow-studio-after-captions');
    await click('Silence');
    await shot('flow-studio-after-silence');
    await click('Réglages');
    await click('Pack de presets');
    await shot('flow-studio-after-pack');

    await done(0);
  } catch (e) {
    console.error('FAIL', e.message);
    if (log.trim()) console.error(log.trim().split('\n').slice(-20).join('\n'));
    await done(1);
  }
}

main().catch((e) => {
  console.error('FAIL', e.message);
  process.exit(1);
});
