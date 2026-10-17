/* =============================================================================
   SCENE 13 — END OF LIFE
   A used Grobox on a clean surface is broken into pieces, moved into a
   controlled compost tray, watered with paper drops; the soil darkens, the
   pieces get smaller and a small sprout appears. (No ocean / landscape
   dumping, no biodegradation time shown.)
   ========================================================================== */
(function () {
  const { el, g, seg, rng, polyPath, rrPath } = GB;

  const BX = 960, BY = 400, BS = 0.8;
  const TRAY = { x: 960, y: 770 };

  GB.scene('endoflife', {
    design: 12,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      // compost tray (wooden box with soil)
      ctx.trayG = g(root);
      const tray = GB.vessel(ctx.trayG, { w: 1000, d: 300, h: 120, rx: 20, wall: 26, floorH: 16, mat: 'kraft' });
      ctx.tray = tray;
      ctx.soil = el('path', { d: tray.levelPath(0.72), style: 'fill:url(#p-soil)' }, tray.fill);
      ctx.soilDark = el('path', { d: tray.levelPath(0.72), style: 'fill:#2f2218', opacity: 0 }, tray.fill);
      ctx.wet = el('path', { d: tray.levelPath(0.72), style: 'fill:#3a5866;mix-blend-mode:multiply', opacity: 0 }, tray.fill);
      // chunks lying in the soil (after the move)
      const tg = tray.geom;
      const r = rng(71);
      ctx.chunks = [];
      const chunkG = g(tray.contents, { filter: 'url(#f-paper)' });
      for (let i = 0; i < 9; i++) {
        const cx = tg.ix + 90 + (i % 5) * 180 + r() * 50, cy = tg.iy + tg.depth * 0.28 + 30 + Math.floor(i / 5) * 90 + r() * 30;
        const cg = g(chunkG);
        const pts = GB.blobPoints(0, 0, 40 + r() * 26, 24 + r() * 12, 6, 0.6, r);
        GB.PaperShape(cg, polyPath(pts), '@beige', { texture: 'p-grobox', textureOpacity: 0.9 });
        GB.path(cg, polyPath([pts[0], pts[1], pts[2], [0, 0]]), 'rgba(140,110,70,.25)');
        ctx.chunks.push({ g: cg, x: cx, y: cy, rot: r() * 60 - 30, d: r() });
      }
      ctx.sprout = GB.Sprout(tray.contents);
      ctx.sprout.base = `translate(${tg.ix + tg.iw * 0.56},${tg.iy + tg.depth * 0.28 + 60})`;

      // the box, built as shards (same drawing, clipped by polygons)
      ctx.box = g(root, { transform: GB.tf(BX, BY, 0, BS) });
      const shardsDef = [
        [[-330, -200], [-60, -200], [-90, 60], [-330, 90]],
        [[-60, -200], [180, -200], [140, 20], [-90, 60]],
        [[180, -200], [330, -200], [330, 120], [140, 20]],
        [[-330, 90], [-90, 60], [-40, 400], [-330, 400]],
        [[-90, 60], [140, 20], [170, 400], [-40, 400]],
        [[140, 20], [330, 120], [330, 400], [170, 400]]
      ];
      ctx.shards = shardsDef.map((pts, i) => {
        const sg = g(ctx.box, { 'clip-path': GB.makeClip(ctx.box, polyPath(pts)) });
        const inner = g(sg);
        GB.Grobox(inner, { contact: false, filter: 'paper' });
        const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length;
        return { g: sg, cx, cy, i };
      });
      ctx.boxShadow = GB.PaperShadow(ctx.box, 8, 330, 300, 70, 0.8);
      ctx.box.insertBefore(ctx.boxShadow, ctx.box.firstChild);
      // drops
      ctx.drops = [0, 1, 2, 3, 4, 5].map((i) => {
        const d = g(root);
        GB.Drop(d, { size: 34 });
        return { g: d, x: 640 + i * 130 + (i % 2) * 30, t0: 5.9 + i * 0.28 };
      });
    },
    update(t, ctx) {
      // tray slides up into view
      const tin = seg(t, 3.0, 3.9, 'out');
      GB.place(ctx.trayG, TRAY.x, TRAY.y + (1 - tin) * 600, 0, 1, tin > 0 ? 1 : 0);
      // break: crack apart, then spread
      const crack = seg(t, 1.8, 2.3, 'out'), spread = seg(t, 2.3, 3.0, 'out');
      const move = seg(t, 4.0, 5.4, 'inOut');
      ctx.shards.forEach((s) => {
        const dx = s.cx * (0.06 * crack + 0.25 * spread), dy = s.cy * (0.06 * crack + 0.2 * spread);
        const rot = (s.i % 2 ? 1 : -1) * (4 * crack + 10 * spread);
        const b = GB.boil('shard' + s.i, crack > 0 ? 0.8 : 0.3);
        // move: towards the tray (in box-local units)
        const tx = (TRAY.x - BX) / BS + (s.cx * 0.6), ty = (TRAY.y - BY) / BS - 30 + (s.cy > 100 ? 40 : -20);
        const x = GB.lerp(dx, tx - s.cx * 0.6, move), y = GB.lerp(dy, ty - s.cy * 0.3, move);
        s.g.setAttribute('transform', `translate(${(x + b.x).toFixed(1)},${(y + b.y).toFixed(1)}) rotate(${(rot * (1 - move) + rot * 2 * move).toFixed(1)},${s.cx},${s.cy}) translate(${s.cx},${s.cy}) scale(${(1 - move * 0.55).toFixed(3)}) translate(${-s.cx},${-s.cy})`);
      });
      const swap = t >= 5.4;
      GB.show(ctx.box, swap ? 0 : 1);
      GB.show(ctx.boxShadow, 0.8 * (1 - spread));
      // pieces in the tray: get smaller and fewer as the soil works
      const decay = seg(t, 7.6, 11.6, 'inOut');
      ctx.chunks.forEach((c) => {
        const s = GB.lerp(1, 0.35, GB.clamp(decay * (0.8 + c.d * 0.5)));
        const fade = 1 - seg(decay, 0.55 + c.d * 0.3, 0.75 + c.d * 0.3);
        GB.place(c.g, c.x, c.y, c.rot, Math.max(0.001, s), swap ? fade : 0);
      });
      // water
      ctx.drops.forEach((d) => {
        const p = seg(t, d.t0, d.t0 + 0.6, 'in');
        GB.place(d.g, d.x, GB.lerp(-80, TRAY.y - 40, p), 0, 1, p > 0 && p < 1 ? 1 : 0);
      });
      ctx.wet.setAttribute('opacity', (seg(t, 6.2, 7.8) * 0.18 * (1 - decay * 0.5)).toFixed(3));
      ctx.soilDark.setAttribute('opacity', (decay * 0.45).toFixed(3));
      ctx.sprout.setGrow(seg(t, 9.0, 11.4, 'out'));
    }
  });
})();
