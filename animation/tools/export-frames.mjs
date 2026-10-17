#!/usr/bin/env node
/* =============================================================================
   Frame-accurate export of the GROBOX animation → PNG sequence (+ MP4).

     npm install            (once — installs Playwright)
     npx playwright install chromium   (once, if you have no Chromium)
     node tools/export-frames.mjs                 # full film, 24 fps, 1920×1080
     node tools/export-frames.mjs --fps 25 --workers 4 --mp4
     node tools/export-frames.mjs --from 96 --to 112 --out export/growth

   Options
     --fps N        output frame rate (default 24; stop-motion poses stay at
                    config.stopMotionFps, frames between poses are duplicated)
     --from S       start time in seconds (default 0)
     --to S         end time in seconds (default: end of film)
     --out DIR      output directory (default export/frames)
     --workers N    parallel browser pages (default 2)
     --mp4          also encode export/grobox.mp4 with ffmpeg (H.264, yuv420p)
     --prores       also encode export/grobox.mov (ProRes 422 HQ, for editing)

   Each frame is rendered with window.GROBOX.renderAt(t), so the result is
   identical every time regardless of machine speed.
   ========================================================================== */
import { createRequire } from 'module';
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import url from 'url';

const require = createRequire(import.meta.url);
let pw;
try { pw = require('playwright'); } catch {
  try { pw = require(execSync('npm root -g').toString().trim() + '/playwright'); } catch {
    console.error('Playwright not found. Run `npm install` in the animation folder first.');
    process.exit(1);
  }
}

const args = process.argv.slice(2);
const opt = (name, def) => { const i = args.indexOf('--' + name); return i >= 0 ? args[i + 1] : def; };
const flag = (name) => args.includes('--' + name);

const ROOT = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const FPS = parseFloat(opt('fps', '24'));
const OUT = path.resolve(ROOT, opt('out', 'export/frames'));
const WORKERS = parseInt(opt('workers', '2'), 10);
fs.mkdirSync(OUT, { recursive: true });

const launch = { executablePath: process.env.CHROME || undefined };
const pageUrl = url.pathToFileURL(path.join(ROOT, 'index.html')).href + '?export=1';

async function openPage(browser) {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(pageUrl);
  await page.waitForFunction(() => window.GROBOX && window.GROBOX.ready, null, { timeout: 120000 });
  return page;
}

const browser = await pw.chromium.launch(launch);
const probe = await openPage(browser);
const total = await probe.evaluate(() => GROBOX.total);
await probe.close();

const from = parseFloat(opt('from', '0'));
const to = Math.min(parseFloat(opt('to', String(total))), total);
const first = Math.round(from * FPS), last = Math.ceil(to * FPS) - 1;
const frames = [];
for (let f = first; f <= last; f++) frames.push(f);
console.log(`Exporting ${frames.length} frames (${from}s → ${to}s @ ${FPS} fps) with ${WORKERS} worker(s) → ${OUT}`);

const name = (f) => path.join(OUT, String(f - first).padStart(5, '0') + '.png');
let done = 0;
const t0 = Date.now();

async function worker(chunk) {
  const page = await openPage(browser);
  let lastPose = null, lastFile = null;
  for (const f of chunk) {
    const t = f / FPS;
    const pose = await page.evaluate((t) => GROBOX.renderAt(t), t);
    const file = name(f);
    if (pose === lastPose && lastFile) {
      fs.copyFileSync(lastFile, file); // same stop-motion pose → identical frame
    } else {
      await page.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
      await page.screenshot({ path: file, clip: { x: 0, y: 0, width: 1920, height: 1080 } });
      lastPose = pose; lastFile = file;
    }
    done++;
    if (done % 48 === 0 || done === frames.length) {
      const el = (Date.now() - t0) / 1000;
      process.stdout.write(`\r  ${done}/${frames.length} frames · ${el.toFixed(0)}s elapsed · ~${((el / done) * (frames.length - done)).toFixed(0)}s left   `);
    }
  }
  await page.close();
}

// contiguous chunks so each worker can reuse identical poses
const size = Math.ceil(frames.length / WORKERS);
await Promise.all(Array.from({ length: WORKERS }, (_, i) => worker(frames.slice(i * size, (i + 1) * size))));
await browser.close();
console.log('\nFrames done.');

function encode(outFile, extra) {
  const ff = spawnSync('ffmpeg', ['-y', '-framerate', String(FPS), '-i', path.join(OUT, '%05d.png'), ...extra, outFile], { stdio: 'inherit' });
  if (ff.status === 0) console.log('Wrote', outFile);
  else console.error('ffmpeg failed (is it installed and on PATH?)');
}
if (flag('mp4')) encode(path.join(ROOT, 'export', 'grobox.mp4'), ['-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-movflags', '+faststart']);
if (flag('prores')) encode(path.join(ROOT, 'export', 'grobox.mov'), ['-c:v', 'prores_ks', '-profile:v', '3', '-pix_fmt', 'yuv422p10le']);
