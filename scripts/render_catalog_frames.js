// Renders target/catalog-scene.ecproj: each transition at 0 / 50 / 100 % of its window and each
// effect at mid-window. Writes target/frames/tr/<slug>-<pct>.png and target/frames/fx/<slug>.png.
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.join(__dirname, '..');
const cli = path.join(root, 'target', 'debug', 'effectcraft-cli.exe');
const project = path.join(root, 'target', 'catalog-scene.ecproj');
const outRoot = path.join(root, 'target', 'frames');

if (!fs.existsSync(project)) {
  console.error('Missing', project, '- run node scripts/build_render_steps.js and the CLI scene step first.');
  process.exit(1);
}
const text = fs.readFileSync(project, 'utf8');
const slugify = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
// Each effect is sampled inside its own window: a 0.01 s utility is gone by 0.1 s.
const fxDuration = {};
try {
  for (const it of JSON.parse(fs.readFileSync(path.join(root, 'catalog', 'effects.json'), 'utf8')).items) {
    fxDuration[slugify(it.name)] = Number(it.duration) || 0.6;
  }
} catch (e) { console.log('no effect durations:', e.message); }
const names = [];
const re = /"(TR|FX) ([a-z0-9-]+)"/g;
let m;
while ((m = re.exec(text))) names.push(m[0].slice(1, -1));

function render(comp, time, out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const r = spawnSync(cli, ['render-frame', project, '--comp', comp, '--time', String(time), '--out', out, '--max-side', '320'], { encoding: 'utf8' });
  if (r.status !== 0) console.log('FAIL', comp, time, (r.stderr || r.stdout || '').trim().slice(0, 160));
  return r.status === 0;
}

let ok = 0, bad = 0;
if (render('BASE plate', 0.003, path.join(outRoot, 'base.png'))) ok++; else bad++;
for (const name of names) {
  const kind = name.slice(0, 2), slug = name.slice(3);
  if (kind === 'TR') {
    for (const [pct, time] of [[0, 0], [50, 0.5], [100, 1]]) {
      if (render(name, time, path.join(outRoot, 'tr', `${slug}-${pct}.png`))) ok++; else bad++;
    }
  } else {
    const d = fxDuration[slug] || 0.6;
    const at = Math.max(0.002, Math.min(0.4, d * 0.3));
    if (render(name, at, path.join(outRoot, 'fx', `${slug}.png`))) ok++; else bad++;
  }
}
console.log(`rendered ${ok} frames, ${bad} failures, ${names.length} comps`);
