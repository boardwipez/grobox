#!/usr/bin/env node
/* =============================================================================
   Export every paper element as a transparent PNG (for After Effects etc.).

     node tools/export-assets.mjs            → export/ae/elements/*.png  (2× scale)
     node tools/export-assets.mjs --scale 3

   Also writes the mycelium macro plate as separate layers (background bed,
   hemp chips, mycelium threads at 25/50/75/100 % growth).
   ========================================================================== */
import { createRequire } from 'module';
import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import url from 'url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); }

const args = process.argv.slice(2);
const SCALE = parseFloat(args.includes('--scale') ? args[args.indexOf('--scale') + 1] : '2');
const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const OUT = path.join(ROOT, 'export', 'ae', 'elements');
fs.mkdirSync(OUT, { recursive: true });

const browser = await pw.chromium.launch({ executablePath: process.env.CHROME || undefined });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: SCALE });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(url.pathToFileURL(path.join(ROOT, 'index.html')).href + '?export=1');
await page.waitForFunction(() => window.GROBOX && window.GROBOX.ready);

// clean transparent page with a fresh SVG + defs
await page.evaluate(() => {
  document.getElementById('stage').remove();
  document.documentElement.style.background = 'transparent';
  document.body.style.background = 'transparent';
  document.body.className = '';
  const svg = document.createElementNS(GB.NS, 'svg');
  svg.id = 'kit';
  svg.style.cssText = 'position:absolute;left:0;top:0;overflow:visible';
  document.body.appendChild(svg);
  GB.buildDefs(svg);
  window.KIT = svg;
});

// name → JS body building into `g` (a <g> at the origin)
const items = {
  'grobox-body': "GB.Grobox(g, {})",
  'grobox-body-fresh-white-bloom': "GB.Grobox(g, { bloom: 0.32 })",
  'grobox-lid': "GB.GroboxLid(g, {})",
  'grobox-lid-fresh-white-bloom': "GB.GroboxLid(g, { bloom: 0.32 })",
  'grobox-closed': "GB.Grobox(g, {}); const l = GB.g(g, { transform: 'translate(0,-40)' }); GB.GroboxLid(l, { contact: false })",
  'eps-foam-box': "GB.EpsBox(g, {})",
  'eps-foam-box-with-fish': "const b = GB.EpsBox(g, {}); const e = b.geom; GB.IceBed(b.contents, { cx: 0, cy: e.iy + e.id * 0.55, rx: e.iw * 0.46, ry: e.id * 0.4, n: 46, seed: 4 }); [[-40,-14,-6,300],[40,18,4,320],[-10,42,-2,290]].forEach(([x,y,r,L],i)=>{ const f = GB.g(b.contents,{transform:GB.tf(x,y,r)}); GB.Fish(f,{len:L,seed:i+1}); })",
  'foam-fragment': "GB.foamPiece(GB.g(g, { filter: 'url(#f-paper)', transform: 'scale(2.6)' }), GB.FOAM_FRAGMENT)",
  'mould-lower': "GB.MoldLower(g, {})",
  'mould-inner-core': "GB.MoldCore(g)",
  'mould-upper-plate': "GB.MoldPlate(g)",
  'mould-closed': "GB.MoldClosed(g, {})",
  'lid-mould': "GB.LidMold(g)",
  'lid-mould-plate': "GB.LidMoldPlate(g)",
  'rack-full': "GB.Rack(g, { x: 0, y: 0 })",
  'rack-empty': "GB.Rack(g, { x: 0, y: 0, filled: () => false })",
  'hemp-leaf': "GB.HempLeaf(g, { size: 200 })",
  'hemp-plant': "GB.HempPlant(g, { h: 620 })",
  'hemp-stalk': "GB.HempStalk(g, { len: 640, thick: 26 })",
  'hemp-hurds-pile': "GB.HurdPile(g, { rx: 200, ry: 70, n: 200, len: [18, 40], seed: 13 })",
  'hemp-hurd-chip-large': "GB.HempHurd(GB.g(g, { filter: 'url(#f-paper)' }), { len: 220, seed: 5 })",
  'fish-mackerel': "GB.Fish(g, { len: 320, kind: 'mackerel' })",
  'fish-cod': "GB.Fish(g, { len: 320, kind: 'cod' })",
  'ice-bed': "GB.IceBed(g, { rx: 240, ry: 70, n: 50 })",
  'tray-hurds': "GB.Tray(g, { w: 560, d: 230, h: 56, level: 0.75 })",
  'tray-hurds-mycelium-mix': "GB.Tray(g, { w: 560, d: 230, h: 56, level: 0.75 }).setFill(null, 0.75, 1)",
  'tray-empty': "GB.Tray(g, { w: 560, d: 230, h: 56, level: 0 }).fillEl.remove()",
  'mycelium-spawn-tub': "GB.SpawnTub(g, {})",
  'paddle': "GB.Paddle(g)",
  'paper-hand-grip': "GB.PaperHand(g, { pose: 'grip' })",
  'paper-hand-open': "GB.PaperHand(g, { pose: 'open' })",
  'spray-bottle': "GB.SprayBottle(g)",
  'blade': "GB.Blade(g)",
  'sieve': "GB.Sieve(g, { r: 190 })",
  'heat-chamber': "GB.Chamber(g, { w: 840, h: 540 })",
  'drying-chamber-wire-rack': "GB.Chamber(g, { w: 1100, h: 700, wire: true })",
  'pallet': "GB.Pallet(g, { w: 760, d: 150 })",
  'refrigerated-truck': "GB.Truck(g)",
  'cargo-ship': "GB.CargoShip(g, { scale: 1.5 })",
  'fishing-boat': "GB.FishingBoat(g)",
  'compost-tray-soil': "const v = GB.vessel(g, { w: 1000, d: 300, h: 120, rx: 20, wall: 26, floorH: 16, mat: 'kraft' }); GB.el('path', { d: v.levelPath(0.72), style: 'fill:url(#p-soil)' }, v.fill)",
  'sprout': "const s = GB.Sprout(g); s.setGrow(1)",
  'water-drop': "GB.Drop(g, { size: 60 })",
  'heat-ribbon-orange': "GB.Airflow(g, { len: 700, amp: 14, waves: 2.2, thick: 16, color: '@heat', travel: 0 }).update(0, 1)",
  'cool-airflow-blue': "GB.Airflow(g, { len: 700, amp: 9, waves: 1.6, thick: 8, color: '@cool', travel: 0 }).update(0, 1)",
  'iceland-map-shape': "GB.PaperShape(GB.g(g, { filter: 'url(#f-paper)' }), GB.smoothPath(GB.ICELAND.map(([x, y]) => [x * 2, y * 2]), true), '@beige')",
  'title-grobox': "GB.el('text', { x: 0, y: 0, 'text-anchor': 'middle', 'font-size': 168, class: 'title-text', style: 'fill:var(--ink);letter-spacing:0.33em', filter: 'url(#f-paper)', text: 'GROBOX' }, g)"
};

async function shoot(name, body) {
  const box = await page.evaluate(({ body }) => {
    KIT.querySelectorAll(':scope > g').forEach((n) => n.remove());
    const g = GB.g(KIT);
    new Function('g', body)(g);
    const b = g.getBBox();
    const pad = 60;
    g.setAttribute('transform', `translate(${-b.x + pad},${-b.y + pad})`);
    const w = Math.ceil(b.width + pad * 2), h = Math.ceil(b.height + pad * 2);
    KIT.setAttribute('width', w); KIT.setAttribute('height', h);
    return { w, h };
  }, { body });
  await page.setViewportSize({ width: Math.max(box.w, 100), height: Math.max(box.h, 100) });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.screenshot({ path: path.join(OUT, name + '.png'), omitBackground: true, clip: { x: 0, y: 0, width: box.w, height: box.h } });
  console.log(name, box.w * SCALE + '×' + box.h * SCALE);
}

for (const [name, body] of Object.entries(items)) await shoot(name, body);

// ---- mycelium macro plate as separate 1920×1080 layers
await page.setViewportSize({ width: 1920, height: 1080 });
const macro = async (name, fn) => {
  await page.evaluate(({ fn }) => {
    KIT.querySelectorAll(':scope > g').forEach((n) => n.remove());
    KIT.setAttribute('width', 1920); KIT.setAttribute('height', 1080);
    const g = GB.g(KIT);
    new Function('g', fn)(g);
  }, { fn });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  await page.screenshot({ path: path.join(OUT, name + '.png'), omitBackground: true, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  console.log(name);
};
const setup = `
  const bounds = { x: -60, y: -60, w: 2040, h: 1200 };
  const chips = GB.packChips(bounds, { n: 120, len: [80, 280], wid: [34, 76], gap: 16, seed: 31, tries: 20000 });
`;
await macro('macro-1-background-bed', `GB.el('rect',{x:0,y:0,width:1920,height:1080,style:'fill:#6d5236'},g); GB.el('rect',{x:0,y:0,width:1920,height:1080,style:'fill:url(#p-hurds);opacity:.35',filter:'url(#f-blur-s)'},g); GB.el('rect',{x:0,y:0,width:1920,height:1080,style:'fill:rgba(60,40,22,.35)'},g);`);
await macro('macro-2-hemp-chips', setup + 'GB.drawMacroChips(g, chips);');
for (const p of [25, 50, 75, 100]) {
  await macro(`macro-3-mycelium-threads-${p}pct`, setup + `
    const scratch = GB.g(g, { display: 'none' });
    const layers = { under: GB.g(g), over: GB.g(g), haze: GB.g(g) };
    g.insertBefore(layers.haze, layers.under);
    const net = GB.MyceliumNetwork(layers, { bounds, chips, seed: 12, seeds: 44, seedSpacing: 130, budget: 26000, maxDensity: 12, felt: 1800 });
    net.update(${p / 100});`);
}
await browser.close();
console.log('→', OUT);
