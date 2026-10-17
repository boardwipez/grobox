/* =============================================================================
   SCENE 5 — ADD MYCELIUM
   A tub of white mycelium spawn pours onto the cooled tan hurds; a wooden
   paper paddle (held by a paper hand) mixes it evenly. Tan = hemp, white =
   mycelium culture. No mushroom caps.
   ========================================================================== */
(function () {
  const { el, g, seg, rng } = GB;

  const TRAY = { x: 1060, y: 600 };
  const N = 120;

  GB.scene('mycelium', {
    design: 13,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      ctx.trayG = g(root, { transform: GB.tf(TRAY.x, TRAY.y) });
      const tray = GB.Tray(ctx.trayG, { w: 640, d: 260, h: 60, level: 0.75 });
      ctx.tray = tray;
      const ge = tray.geom;
      const surfY = ge.iy + ge.depth * 0.25;
      // granules: heap position (where they land) and mixed position (spread)
      const r = rng(41);
      ctx.gran = g(tray.contents, { filter: 'url(#f-thread)' });
      ctx.G = [];
      for (let i = 0; i < N; i++) {
        const el2 = GB.path(ctx.gran, GB.smoothPath(GB.blobPoints(0, 0, 5 + r() * 3, 4 + r() * 2, 7, 0.5, r), true), '@mycelium');
        const ha = r() * Math.PI * 2, hd = Math.pow(r(), 0.7);
        ctx.G.push({
          el: el2,
          spawn: 2.7 + (i / N) * 2.0 + r() * 0.2,
          hx: -120 + Math.cos(ha) * 110 * hd, hy: surfY + ge.id * 0.45 + Math.sin(ha) * 40 * hd - (1 - hd) * 22,
          mx: ge.ix + 16 + r() * (ge.iw - 32), my: surfY + 8 + r() * (ge.id - 16),
          md: r() * 0.35
        });
      }
      // spawn tub
      ctx.tub = g(root);
      ctx.tubInner = g(ctx.tub);
      GB.SpawnTub(ctx.tubInner, { w: 240, h: 170 });
      // paddle + hand
      ctx.paddle = g(root);
      GB.Paddle(ctx.paddle);
      const hand = g(ctx.paddle, { transform: 'translate(350,10) rotate(0)' });
      GB.PaperHand(hand, { pose: 'grip', scale: 0.8 });
      // legend
      ctx.legend = g(root);
      const l1 = g(ctx.legend);
      const chip = GB.HempHurd(g(l1, { filter: 'url(#f-paper)', transform: 'translate(0,-12) rotate(-20)' }), { len: 44, seed: 3 });
      const lab1 = GB.PaperLabel(g(l1, { transform: 'translate(46,0)' }), 'hemp hurds', { size: 30, className: 'tag-text' });
      lab1.layout();
      const l2 = g(ctx.legend, { transform: 'translate(0,84)' });
      const gr = g(l2, { filter: 'url(#f-thread)', transform: 'translate(0,-12)' });
      GB.path(gr, GB.smoothPath(GB.blobPoints(-6, 0, 8, 7, 8, 0.4, rng(2)), true), '@mycelium');
      GB.line(gr, 'M4,-2 c8,-6 14,4 22,-2 M0,6 c6,6 -2,12 4,18', '@mycelium', 3);
      const lab2 = GB.PaperLabel(g(l2, { transform: 'translate(46,0)' }), 'mycelium culture', { size: 30, className: 'tag-text' });
      lab2.layout();
      ctx.legendParts = [l1, l2];
      void chip;
    },
    update(t, ctx) {
      // tub: slide in, lift over tray, tilt and pour, leave
      const tin = seg(t, 0.1, 1.3, 'out');
      const lift = seg(t, 1.5, 2.5, 'inOut');
      const tilt = seg(t, 2.3, 2.9, 'inOut') * (1 - seg(t, 4.9, 5.4, 'inOut'));
      const tout = seg(t, 5.3, 6.0, 'in');
      const tx = GB.lerp(GB.lerp(-300, 380, tin), 760, lift) - tout * 1200;
      const ty = GB.lerp(600, 380, lift);
      const tb = GB.boil('tub', 0.6);
      GB.place(ctx.tub, tx + tb.x, ty + tb.y, tilt * 62 + tb.r, 1, 1);

      // granules: fall → heap → mixed
      const lip = { x: 760 + 125, y: 380 - 10 }; // approx pour lip in world
      ctx.G.forEach((gq) => {
        const f = seg(t, gq.spawn, gq.spawn + 0.45, 'in');
        if (f <= 0) { gq.el.setAttribute('display', 'none'); return; }
        gq.el.removeAttribute('display');
        const m = seg(t, 6.6 + gq.md, 10.2 + gq.md, 'inOut');
        // falling in tray-local coords
        const sx = lip.x - TRAY.x, sy = lip.y - TRAY.y;
        let x = GB.lerp(sx, gq.hx, f), y = GB.lerp(sy, gq.hy, f) - Math.sin(f * Math.PI) * 30;
        if (m > 0) {
          // stop-motion stir: swirl around the paddle path while spreading
          const sw = Math.sin(m * Math.PI) * 40;
          x = GB.lerp(gq.hx, gq.mx, m) + Math.cos(m * 9 + gq.md * 20) * sw;
          y = GB.lerp(gq.hy, gq.my, m) + Math.sin(m * 9 + gq.md * 20) * sw * 0.35;
        }
        gq.el.setAttribute('transform', `translate(${x.toFixed(1)},${y.toFixed(1)})`);
      });
      // the hurds surface turns into the mixed texture (white specks + threads)
      ctx.tray.setFill(null, 0.75, seg(t, 7.2, 10.6));

      // paddle mixing loops
      const pin = seg(t, 5.8, 6.6, 'out'), pout = seg(t, 10.6, 11.3, 'in');
      const k = seg(t, 6.6, 10.6, 'linear');
      const px = TRAY.x - 40 + Math.sin(k * Math.PI * 6) * 170 + (1 - pin) * 900 + pout * 1000;
      const py = TRAY.y + 20 + Math.sin(k * Math.PI * 12) * 34;
      const pb = GB.boil('paddle', 0.8);
      GB.place(ctx.paddle, px + pb.x, py + pb.y, -12 + Math.sin(k * Math.PI * 6) * 8, 1, pin > 0 && pout < 1 ? 1 : 0);

      // legend
      ctx.legendParts.forEach((lp, i) => {
        const v = seg(t, 10.9 + i * 0.35, 11.4 + i * 0.35, 'out');
        GB.place(lp, 1430 + (1 - v) * 40, 230 + i * 84, 0, 1, v);
      });
    }
  });
})();
