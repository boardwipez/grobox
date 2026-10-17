#!/usr/bin/env node
/* =============================================================================
   Export the opening scenes (1 harbour, 1 coast, 2 hemp) as full-frame
   transparent PNG layers. Every layer is 1920×1080 (× --scale) and keeps its
   position from the film, so stacking them in order rebuilds the shot.

     node tools/export-scene-layers.mjs           → export/ae/scene-layers/
     node tools/export-scene-layers.mjs --scale 1
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
const OUT = path.join(ROOT, 'export', 'ae', 'scene-layers');

const browser = await pw.chromium.launch({ executablePath: process.env.CHROME || undefined });
const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: SCALE });
page.on('pageerror', (e) => console.error('page error:', e.message));
await page.goto(url.pathToFileURL(path.join(ROOT, 'index.html')).href + '?export=1');
await page.waitForFunction(() => window.GROBOX && window.GROBOX.ready);
await page.evaluate(() => {
  document.getElementById('stage').remove();
  document.documentElement.style.background = 'transparent';
  document.body.style.background = 'transparent';
  document.body.className = '';
  const svg = document.createElementNS(GB.NS, 'svg');
  svg.setAttribute('width', 1920); svg.setAttribute('height', 1080);
  svg.style.cssText = 'position:absolute;left:0;top:0';
  document.body.appendChild(svg);
  GB.buildDefs(svg);
  window.KIT = svg;
});

async function layer(folder, name, body) {
  fs.mkdirSync(path.join(OUT, folder), { recursive: true });
  await page.evaluate(({ body }) => {
    KIT.querySelectorAll(':scope > g').forEach((n) => n.remove());
    const g = GB.g(KIT);
    new Function('g', 'GB', 'rng', 'polyPath', body)(g, GB, GB.rng, GB.polyPath);
  }, { body });
  await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
  const file = path.join(OUT, folder, name + '.png');
  await page.screenshot({ path: file, omitBackground: true, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
  console.log(folder + '/' + name);
}

// ---------------------------------------------------------------- harbour
const H = '01-harbour';
await layer(H, '00-paper-table', "GB.PaperBackdrop(g, '@paper'); GB.el('rect',{x:0,y:0,width:1920,height:1080,style:'fill:url(#p-fibre);opacity:.35'},g)");
await layer(H, '01-sky', "GB.el('rect', { x: 0, y: 0, width: 1920, height: 700, style: 'fill:var(--sky)' }, g)");
await layer(H, '02-cloud', "const c = GB.g(g, { filter: 'url(#f-paper)', transform: 'translate(420,130)' }); GB.PaperShape(c, GB.smoothPath(GB.blobPoints(0, 0, 120, 34, 12, 0.35, rng(3)), true), '#fbfaf6')");
await layer(H, '03-hills-far', "const h = GB.Hills(g, { y: 480, seed: 4 }); h.children[1].remove()");
await layer(H, '04-hills-near', "const h = GB.Hills(g, { y: 480, seed: 4 }); h.children[0].remove()");
await layer(H, '05-sea-far', "GB.Wave(g, { y: 470, amp: 5, wl: 220, color: '@ocean-light', seed: 2, speed: 10, x1: 2100 })");
await layer(H, '06-sea-middle', "GB.Wave(g, { y: 540, amp: 7, wl: 200, color: '@ocean', seed: 3, speed: 16, x1: 2100 })");
await layer(H, '07-fishing-boat', "const b = GB.g(g, { transform: GB.tf(1340, 600, 0, 0.82) }); GB.FishingBoat(b)");
await layer(H, '08-sea-front', "GB.Wave(g, { y: 640, amp: 9, wl: 240, color: '@ocean-dark', seed: 5, speed: 22, x1: 2100 })");
await layer(H, '09-dock', `
  const dock = GB.g(g, { filter: 'url(#f-paper)' });
  GB.PaperShape(dock, polyPath([[-60, 1100], [-60, 700], [1500, 700], [1700, 1100]]), '@kraft-light');
  for (let i = 1; i < 9; i++) GB.line(dock, 'M' + (-60 + i * 190) + ',700L' + (-60 + i * 190 * 1.13) + ',1100', 'rgba(120,85,45,.35)', 3);
  for (let i = 1; i < 4; i++) GB.line(dock, 'M-60,' + (700 + i * 100) + 'L' + (1500 + i * 50) + ',' + (700 + i * 100), 'rgba(120,85,45,.22)', 2);
  GB.PaperShape(dock, polyPath([[-60, 700], [1500, 700], [1505, 714], [-60, 714]]), '#e3c9a0');`);
const bollard = (x, y, s) => `
  const bg = GB.g(g, { filter: 'url(#f-paper)', transform: GB.tf(${x}, ${y}, 0, ${s}) });
  GB.PaperShape(bg, 'M-40,0 V-110 H40 V0 Q0,16 -40,0Z', '@kraft-dark');
  GB.el('ellipse', { cx: 0, cy: -110, rx: 40, ry: 14, style: 'fill:#b08a5e' }, bg);
  GB.line(bg, 'M-40,-60 Q0,-48 40,-60', 'rgba(70,50,30,.4)', 3);`;
await layer(H, '10-bollard-left', bollard(200, 790, 1));
await layer(H, '11-bollard-right', bollard(1380, 770, 0.85));
await layer(H, '12-rope-coil', "const rope = GB.g(g, { filter: 'url(#f-paper)', transform: 'translate(250,990)' }); for (let i = 0; i < 4; i++) GB.el('ellipse', { cx: 0, cy: 0, rx: 150 - i * 24, ry: 56 - i * 9, style: 'fill:none;stroke:' + (i % 2 ? '#c49a62' : '#b4874f') + ';stroke-width:20' }, rope)");
await layer(H, '13-eps-box-empty', "GB.EpsBox(GB.g(g, { transform: 'translate(860,650)' }), {})");
await layer(H, '14-eps-box-with-fish-and-ice', `
  const eps = GB.EpsBox(GB.g(g, { transform: 'translate(860,650)' }), {}); const ge = eps.geom;
  GB.IceBed(eps.contents, { cx: 0, cy: ge.iy + ge.id * 0.55, rx: ge.iw * 0.46, ry: ge.id * 0.4, n: 46, seed: 4 });
  [[-40, -14, -6, 300], [40, 18, 4, 320], [-10, 42, -2, 290]].forEach(([x, y, r, L], i) => GB.Fish(GB.g(eps.contents, { transform: GB.tf(x, y, r) }), { len: L, seed: i + 1 }));
  GB.IceBed(eps.contents, { cx: 0, cy: ge.iy + ge.id * 0.8, rx: ge.iw * 0.44, ry: ge.id * 0.2, n: 16, seed: 8 });`);

// ------------------------------------------------------------------ coast
const C = '01-coast';
await layer(C, '00-paper-table', "GB.PaperBackdrop(g, '@paper'); GB.el('rect',{x:0,y:0,width:1920,height:1080,style:'fill:url(#p-fibre);opacity:.35'},g)");
await layer(C, '01-sky', "GB.el('rect', { x: 0, y: 0, width: 1920, height: 700, style: 'fill:var(--sky)' }, g)");
await layer(C, '02-cloud', "const c = GB.g(g, { filter: 'url(#f-paper)', transform: 'translate(1350,150)' }); GB.PaperShape(c, GB.smoothPath(GB.blobPoints(0, 0, 100, 28, 12, 0.35, rng(9)), true), '#fbfaf6')");
await layer(C, '03-hills-far', "const h = GB.Hills(g, { y: 430, seed: 12, x0: 0, colors: ['@hill-far', '#7e8f7e'] }); h.children[1].remove()");
await layer(C, '04-hills-near', "const h = GB.Hills(g, { y: 430, seed: 12, x0: 0, colors: ['@hill-far', '#7e8f7e'] }); h.children[0].remove()");
await layer(C, '05-sea-far', "GB.Wave(g, { y: 420, amp: 5, wl: 220, color: '@ocean-light', seed: 21, speed: 12, x0: 0, x1: 2100 })");
await layer(C, '06-sea-near', "GB.Wave(g, { y: 500, amp: 8, wl: 200, color: '@ocean', seed: 22, speed: 18, x0: 0, x1: 2100 })");
await layer(C, '07-beach-sand', "const s = GB.g(g, { filter: 'url(#f-paper)' }); GB.PaperShape(s, GB.wavyBand(0, 2100, 610, 1200, 10, 300, 0.3, 9), '@sand')");
await layer(C, '08-shore-wash-and-foam-line', "GB.ShoreWash(g, { x0: 0, x1: 2100, y: 590, reach: 46 })");
const rocks = `
  const rr = rng(33);
  const specs = [[120, 760, 190], [330, 700, 120], [60, 980, 220], [1600, 690, 170], [1810, 800, 230], [1450, 980, 150], [1900, 620, 140]];
  const all = specs.map(([x, y, s], i) => {
    const pts = [];
    for (let k = 0; k < 7; k++) { const a = Math.PI + (k / 6) * Math.PI; const kk = 0.75 + rr() * 0.4; pts.push([x + Math.cos(a) * s * kk, y + Math.sin(a) * s * 0.75 * kk]); }
    pts.push([x + s * 0.9, y + s * 0.2], [x - s * 0.9, y + s * 0.2]);
    return { pts, x, y, s, i };
  });`;
await layer(C, '09-rocks-all', rocks + `
  const grp = GB.g(g, { filter: 'url(#f-paper)' });
  all.forEach(({ pts, x, y, s, i }) => { GB.PaperShape(grp, polyPath(pts), i % 2 ? '@rock' : '@rock-dark', { textureOpacity: 0.6 }); GB.path(grp, polyPath([pts[1], pts[2], pts[3], [x, y - s * 0.2]]), 'rgba(255,255,255,.12)'); });`);
for (let k = 0; k < 7; k++) {
  await layer(C, `10-rock-${k + 1}`, rocks + `
    const { pts, x, y, s, i } = all[${k}]; const grp = GB.g(g, { filter: 'url(#f-paper)' });
    GB.PaperShape(grp, polyPath(pts), i % 2 ? '@rock' : '@rock-dark', { textureOpacity: 0.6 }); GB.path(grp, polyPath([pts[1], pts[2], pts[3], [x, y - s * 0.2]]), 'rgba(255,255,255,.12)');`);
}
await layer(C, '11-seaweed', "const w = GB.g(g, { filter: 'url(#f-paper)' }); GB.line(w, 'M1160,900 C1220,860 1300,880 1380,840 C1420,820 1460,830 1500,800', '@hemp-dark', 10); GB.line(w, 'M1210,880 l-20,-30 M1290,872 l-6,-34 M1380,842 l18,-30', '@hemp-dark', 6)");
await layer(C, '12-foam-beads', `
  const rr = rng(33); for (let i = 0; i < 49; i++) rr(); // skip the rock draws so the beads match the film
  const b = GB.g(g, { filter: 'url(#f-paper)' });
  for (let i = 0; i < 70; i++) GB.el('circle', { cx: 300 + rr() * 1300, cy: 650 + rr() * 380, r: 3 + rr() * 4, style: 'fill:#f8f8f4' }, b);`);
const frags = `
  const fr = rng(55);
  const rand = (s) => { const n = 6 + Math.floor(fr() * 3), pts = []; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + fr() * 0.5; const k = s * (0.6 + fr() * 0.5); pts.push([Math.cos(a) * k, Math.sin(a) * k * 0.8]); } return pts; };
  const specs = [[520, 800, 70], [760, 900, 52], [1080, 760, 90], [1290, 930, 60], [620, 1000, 46], [1420, 720, 44]];
  const shapes = specs.map(([x, y, s]) => ({ x, y, pts: rand(s), rot: (fr() - 0.5) * 50 }));`;
await layer(C, '13-foam-fragments-all', frags + "shapes.forEach((f) => GB.foamPiece(GB.g(g, { filter: 'url(#f-paper)', transform: GB.tf(f.x, f.y, f.rot) }), f.pts)); GB.foamPiece(GB.g(g, { filter: 'url(#f-paper)', transform: GB.tf(900, 820, -14) }), GB.FOAM_FRAGMENT)");
for (let k = 0; k < 6; k++) await layer(C, `14-foam-fragment-${k + 1}`, frags + `const f = shapes[${k}]; GB.foamPiece(GB.g(g, { filter: 'url(#f-paper)', transform: GB.tf(f.x, f.y, f.rot) }), f.pts)`);
await layer(C, '14-foam-fragment-7-hero', "GB.foamPiece(GB.g(g, { filter: 'url(#f-paper)', transform: GB.tf(900, 820, -14) }), GB.FOAM_FRAGMENT)");

// ------------------------------------------------------------------ hemp
const P = '02-hemp';
await layer(P, '00-paper-table', "GB.PaperBackdrop(g, '@paper'); GB.el('rect',{x:0,y:0,width:1920,height:1080,style:'fill:url(#p-fibre);opacity:.35'},g)");
await layer(P, '01-foam-fragment-centred', "GB.foamPiece(GB.g(g, { filter: 'url(#f-paper)', transform: GB.tf(960, 520, 0, 2.6) }), GB.FOAM_FRAGMENT)");
await layer(P, '02-ground-strip', "const gr = GB.g(g, { filter: 'url(#f-paper)' }); GB.PaperShape(gr, GB.wavyBand(560, 1360, 994, 1060, 6, 90, 0, 3), '@kraft')");
await layer(P, '03-hemp-stalk-standing', "const pl = GB.HempPlant(GB.g(g, { transform: 'translate(960,1000)' }), { h: 620 }); pl.leaves.forEach((l) => l.g.remove())");
await layer(P, '04-hemp-leaves-on-plant', "const pl = GB.HempPlant(GB.g(g, { transform: 'translate(960,1000)' }), { h: 620 }); pl.stalk.remove()");
await layer(P, '05-hemp-plant-complete', "GB.HempPlant(GB.g(g, { transform: 'translate(960,1000)' }), { h: 620 })");
await layer(P, '06-hemp-leaf-large', "GB.HempLeaf(GB.g(g, { transform: 'translate(960,640) scale(2)' }), { size: 140, seed: 99 })");
await layer(P, '07-cut-mark', "const c = GB.g(g, { filter: 'url(#f-paper)', transform: GB.tf(1000, 970, -8) }); GB.PaperShape(c, 'M-70,6 L70,-10 L72,-2 L-68,14Z', '#fbfaf6')");
await layer(P, '08-spotlight-card', "const s = GB.g(g, { filter: 'url(#f-paper)', transform: 'translate(960,600)' }); GB.PaperShape(s, GB.smoothPath(GB.blobPoints(0, 0, 520, 150, 22, 0.08, rng(4)), true), '@paper-2')");
await layer(P, '09-hemp-stalk-lying', "GB.HempStalk(GB.g(g, { transform: 'translate(960,560)' }), { len: 640, thick: 26 })");
await layer(P, '10-stalk-cross-section-callout', `
  const co = GB.g(g, { filter: 'url(#f-lift)', transform: 'translate(470,300)' });
  GB.el('circle', { cx: 0, cy: 0, r: 120, style: 'fill:var(--card)' }, co);
  GB.el('circle', { cx: 0, cy: 0, r: 82, style: 'fill:var(--stalk)' }, co);
  GB.el('circle', { cx: 0, cy: 0, r: 70, style: 'fill:var(--hurd-light)' }, co);
  for (let i = 0; i < 18; i++) { const a = (i / 18) * Math.PI * 2; GB.line(co, 'M' + Math.cos(a) * 30 + ',' + Math.sin(a) * 30 + 'L' + Math.cos(a) * 66 + ',' + Math.sin(a) * 66, 'rgba(150,115,70,.35)', 2); }
  GB.el('circle', { cx: 0, cy: 0, r: 28, style: 'fill:#f2ede2' }, co);`);

await browser.close();
console.log('→', OUT);
