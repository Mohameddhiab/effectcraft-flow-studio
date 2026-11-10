// Writes target/render-steps.json: the panel plus scripts/make_catalog_scene.jsx as one script.run.
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const panel = fs.readFileSync(path.join(root, 'extensions', 'scriptui-panels', 'Flow Studio.jsx'), 'utf8');
const scene = fs.readFileSync(path.join(__dirname, 'make_catalog_scene.jsx'), 'utf8');
const steps = [
  { command: 'prefs.set', params: { key: 'scripting.allowScriptsWriteFiles', value: true } },
  { command: 'script.run', params: { code: panel + '\n' + scene, name: 'catalog-scene.jsx' } },
];
fs.mkdirSync(path.join(root, 'target'), { recursive: true });
fs.writeFileSync(path.join(root, 'target', 'render-steps.json'), JSON.stringify(steps), 'utf8');
console.log('target/render-steps.json written:', panel.length + scene.length, 'chars');
