// Dev helper: render stills at given times →  node tools/snap.mjs out-dir t1 t2 ...
// (times may be "scene:local", e.g. growth:8)
import { createRequire } from 'module';
import { execSync } from 'child_process';
const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }
const { chromium } = pw;
import path from 'path';
import fs from 'fs';
const [outDir, ...times] = process.argv.slice(2);
fs.mkdirSync(outDir, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(m.text()); });
page.on('pageerror', (e) => errors.push('PAGEERROR ' + e.message));
const url = 'file://' + path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', 'index.html') + '?export=1';
await page.goto(url);
await page.waitForFunction(() => window.GROBOX && window.GROBOX.ready, null, { timeout: 60000 });
for (const ts of times) {
  const t = await page.evaluate((ts) => {
    if (ts.includes(':')) { const [id, l] = ts.split(':'); const s = GROBOX.scenes.find((x) => x.id === id); return s.start + parseFloat(l); }
    return parseFloat(ts);
  }, ts);
  const t0 = Date.now();
  await page.evaluate((t) => GROBOX.renderAt(t), t);
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const file = path.join(outDir, ts.replace(/[:]/g, '_') + '.png');
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  console.log(file, (Date.now() - t0) + 'ms');
}
if (errors.length) console.log('CONSOLE:\n' + [...new Set(errors)].join('\n'));
await browser.close();
