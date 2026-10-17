/* =============================================================================
   Boot + player
   - preloads fonts and textures, builds the timeline
   - player chrome: play/pause, restart, scrubber, fullscreen
   - dev scene navigator (config.devMode or ?dev=1)
   - export API:  window.GROBOX.renderAt(seconds)  (used by tools/export-frames.mjs)

   URL options:
     ?export=1        bare 1920×1080 stage, no UI, no autoplay
     ?ui=0            hide all player/dev UI (for screen recording)
     ?dev=0 / ?dev=1  hide/show the dev navigator
     ?t=42.5          start at a time (seconds)
     ?scene=growth    start at a scene (id or 1-based number)
     ?autoplay=0      start paused
     ?quality=fast    lighter shadows for slow machines (export always uses config)
   ========================================================================== */
(function () {
  const Q = new URLSearchParams(location.search);
  const cfg = GB.config;
  const EXPORT = Q.get('export') === '1';
  const SHOW_UI = !EXPORT && Q.get('ui') !== '0';
  const DEV = SHOW_UI && (Q.has('dev') ? Q.get('dev') === '1' : cfg.devMode);
  const SHOW_PLAYER = SHOW_UI && cfg.showPlayerControls;
  if (Q.get('quality')) cfg.quality = Q.get('quality');

  const $ = (id) => document.getElementById(id);

  function preloadImages() {
    const srcs = Object.values(GB.TEXTURES).map((t) => t.src).concat(['assets/paper-textures/paper-bg.jpg', 'assets/paper-textures/grain.png']);
    return Promise.all(srcs.map((src) => new Promise((res) => {
      const im = new Image();
      im.onload = () => (im.decode ? im.decode().catch(() => {}).then(res) : res());
      im.onerror = () => { console.warn('missing asset', src); res(); };
      im.src = src;
    })));
  }
  function preloadFonts() {
    if (!document.fonts) return Promise.resolve();
    return Promise.all([
      document.fonts.load('500 40px "Space Grotesk"'),
      document.fonts.load('700 40px "Space Grotesk"'),
      document.fonts.load('500 20px "Inter"'),
      document.fonts.load('600 20px "Inter"')
    ]).catch(() => {});
  }

  const fmt = (t) => {
    const m = Math.floor(t / 60), s = t - m * 60;
    return `${m}:${s < 10 ? '0' : ''}${s.toFixed(1)}`;
  };

  async function boot() {
    if (EXPORT) document.body.classList.add('export');
    if (!SHOW_PLAYER) $('player').classList.add('hidden');
    if (!DEV) $('dev').classList.add('hidden');
    const chromeH = (SHOW_PLAYER ? 46 : 0) + (DEV ? 46 : 0);
    document.documentElement.style.setProperty('--chrome-h', chromeH + 'px');

    await Promise.all([preloadImages(), preloadFonts()]);

    const svg = $('film');
    GB.buildDefs(svg);
    const tl = new GB.Timeline(svg);
    tl.build();
    GB.timeline = tl;
    $('loading').classList.add('hidden');

    // ---------------------------------------------------------- playback
    const speed = () => GB.cssNum('anim-speed', 1);
    let t = 0, playing = false, last = 0, endAt = null, lastFrame = -1;
    const startScene = Q.get('scene');
    if (startScene) {
      const it = tl.items.find((x) => x.cfg.id === startScene) || tl.items[parseInt(startScene, 10) - 1];
      if (it) t = it.start;
    }
    if (Q.get('t')) t = parseFloat(Q.get('t')) || 0;

    function draw(force) {
      const info = tl.render(t);
      if (SHOW_PLAYER) {
        $('scrub').value = t;
        $('time').textContent = `${fmt(t)} / ${fmt(tl.total)}`;
      }
      if (DEV) {
        const it = info.scene;
        $('dev-info').innerHTML = `Scene <b>${it.i + 1}</b>/${tl.items.length} · <b>${it.cfg.title}</b> · scene ${info.local.toFixed(1)}s / ${it.cfg.duration}s · film <b>${fmt(t)}</b>`;
        $('dev-select').value = it.i;
      }
      return info;
    }

    function loop(now) {
      if (playing) {
        const dt = Math.min(0.1, (now - last) / 1000) * speed();
        t += dt;
        if (endAt !== null && t >= endAt) { t = endAt - 1e-3; playing = false; endAt = null; }
        if (t >= tl.total) {
          if (cfg.loop) t = 0; else { t = tl.total - 1e-3; playing = false; }
        }
        // only touch the DOM when the stop-motion pose changes
        const fps = cfg.stopMotionFps || 60;
        const f = Math.floor(t * fps);
        if (f !== lastFrame || !playing) { lastFrame = f; draw(); }
        else if (SHOW_PLAYER) { $('scrub').value = t; $('time').textContent = `${fmt(t)} / ${fmt(tl.total)}`; }
        updateButtons();
      }
      last = now;
      requestAnimationFrame(loop);
    }

    function play() { if (t >= tl.total - 0.01) t = 0; playing = true; last = performance.now(); updateButtons(); }
    function pause() { playing = false; updateButtons(); }
    function seek(nt) { t = GB.clamp(nt, 0, tl.total - 1e-3); lastFrame = -1; draw(); }
    function updateButtons() { if (SHOW_PLAYER) $('btn-play').textContent = playing ? '❚❚ Pause' : '▶ Play'; }

    // ----------------------------------------------------------- player UI
    if (SHOW_PLAYER) {
      const scrub = $('scrub');
      scrub.max = tl.total; scrub.step = 0.01;
      scrub.addEventListener('input', () => { endAt = null; seek(parseFloat(scrub.value)); });
      $('btn-play').onclick = () => (playing ? pause() : play());
      $('btn-restart').onclick = () => { endAt = null; seek(0); play(); };
      $('btn-full').onclick = toggleFullscreen;
      const marks = $('marks');
      tl.items.forEach((it) => { const i = document.createElement('i'); i.style.left = (it.start / tl.total * 100) + '%'; i.title = it.cfg.title; marks.appendChild(i); });
    }
    function toggleFullscreen() {
      const st = $('stage');
      const fsEl = document.fullscreenElement || document.webkitFullscreenElement;
      if (fsEl) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
      else (st.requestFullscreen || st.webkitRequestFullscreen).call(st);
    }

    // ---------------------------------------------------------- dev UI
    if (DEV) {
      const sel = $('dev-select');
      tl.items.forEach((it) => { const o = document.createElement('option'); o.value = it.i; o.textContent = `${it.i + 1}. ${it.cfg.title} (${it.cfg.duration}s)`; sel.appendChild(o); });
      const cur = () => tl.sceneAt(t);
      const goScene = (i, playOnly) => {
        const it = tl.items[GB.clamp(i, 0, tl.items.length - 1)];
        seek(it.start);
        endAt = playOnly ? it.end : null;
        play();
      };
      sel.onchange = () => goScene(parseInt(sel.value, 10), true);
      $('dev-prev').onclick = () => goScene(cur().i - 1, true);
      $('dev-next').onclick = () => goScene(cur().i + 1, true);
      $('dev-replay').onclick = () => goScene(cur().i, true);
      $('dev-full').onclick = () => { endAt = null; seek(0); play(); };
    }

    // ---------------------------------------------------------- keyboard
    if (SHOW_UI) {
      window.addEventListener('keydown', (e) => {
        if (e.target.tagName === 'SELECT') return;
        if (e.code === 'Space') { e.preventDefault(); playing ? pause() : play(); }
        else if (e.code === 'ArrowRight') seek(t + (e.shiftKey ? 5 : 1));
        else if (e.code === 'ArrowLeft') seek(t - (e.shiftKey ? 5 : 1));
        else if (e.key === ']') $('dev-next') && $('dev-next').click();
        else if (e.key === '[') $('dev-prev') && $('dev-prev').click();
        else if (e.key === 'f') toggleFullscreen();
        else if (e.key === 'r') { endAt = null; seek(0); play(); }
      });
    }

    // ---------------------------------------------------------- export API
    window.GROBOX = {
      total: tl.total,
      scenes: tl.items.map((it) => ({ id: it.cfg.id, title: it.cfg.title, start: it.start, duration: it.cfg.duration })),
      play, pause, seek,
      /** Render an exact time; returns the stop-motion pose index. */
      renderAt(sec) { playing = false; t = sec; return tl.render(sec).frame; },
      ready: true
    };

    draw();
    const auto = !EXPORT && cfg.autoplay && Q.get('autoplay') !== '0';
    if (auto) play();
    requestAnimationFrame((n) => { last = n; requestAnimationFrame(loop); });
  }

  window.addEventListener('DOMContentLoaded', () => boot().catch((e) => {
    console.error(e);
    const l = $('loading'); l.textContent = 'Error: ' + e.message; l.classList.remove('hidden');
  }));
})();
