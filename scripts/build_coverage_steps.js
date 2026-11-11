// Writes target/coverage-steps.json: the panel plus scripts/catalog_coverage.jsx as one script.run.
// Run: node scripts/build_coverage_steps.js
const fs = require('fs');
const path = require('path');
const root = path.join(__dirname, '..');
const panel = fs.readFileSync(path.join(root, 'extensions', 'scriptui-panels', 'Flow Studio.jsx'), 'utf8');
const coverage = fs.readFileSync(path.join(__dirname, 'catalog_coverage.jsx'), 'utf8');
const steps = [
  { command: 'prefs.set', params: { key: 'scripting.allowScriptsWriteFiles', value: true } },
  { command: 'script.run', params: { code: panel + '\n' + coverage, name: 'catalog-coverage.jsx' } },
];
fs.mkdirSync(path.join(root, 'target'), { recursive: true });
fs.writeFileSync(path.join(root, 'target', 'coverage-steps.json'), JSON.stringify(steps), 'utf8');
console.log('target/coverage-steps.json written:', panel.length + coverage.length, 'chars');
