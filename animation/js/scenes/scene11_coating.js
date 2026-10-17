/* =============================================================================
   SCENE 11 — BIO COATING
   After cooling, a paper spray bottle applies a very thin coat to the outer
   walls, the rim and the lid. Tiny pale translucent droplets; the finish stays
   matte and natural (bio-based moisture-resistant coating, under development).
   ========================================================================== */
(function () {
  const { el, g, seg, rng, rrPath, bandPath } = GB;

  const BOX = { x: 800, y: 470, s: 0.9 };
  const LID = { x: 1370, y: 760, s: 0.66 };

  GB.scene('coating', {
    design: 11,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      ctx.box = g(root, { transform: GB.tf(BOX.x, BOX.y, 0, BOX.s) });
      const b = GB.Grobox(ctx.box, {});
      ctx.lid = g(root, { transform: GB.tf(LID.x, LID.y, 0, LID.s) });
      const l = GB.GroboxLid(ctx.lid, {});
      // coat overlays (barely-there sheen, stays matte)
      const geo = b.geom, lg = l.geom;
      const coat = 'fill:rgba(255,252,240,1);mix-blend-mode:soft-light';
      ctx.coatWall = el('path', { d: bandPath(geo.x, geo.y, geo.w, geo.d, geo.h, geo.rx, geo.ry), style: coat, opacity: 0 }, b);
      ctx.coatRim = el('path', { d: rrPath(geo.x, geo.y, geo.w, geo.d, geo.rx, geo.ry) + rrPath(geo.ix, geo.iy, geo.iw, geo.id, geo.irx, geo.iry), 'fill-rule': 'evenodd', style: coat, opacity: 0 }, b);
      ctx.coatLid = el('path', { d: rrPath(lg.x, lg.y, lg.w, lg.d, lg.rx, lg.ry) + bandPath(lg.x, lg.y, lg.w, lg.d, lg.h, lg.rx, lg.ry), style: coat, opacity: 0 }, l);
      // cooling
      ctx.cool = GB.AirflowField(g(root), [0, 1, 2, 3].map((i) => ({ x: 420, y: 380 + i * 110, len: 1180, amp: 9, waves: 1.6, thick: 8, color: '@cool', travel: 300, speed: 150 })));
      // mist droplets
      ctx.mist = g(root);
      const r = rng(23);
      ctx.M = [];
      for (let i = 0; i < 90; i++) {
        const c = el('circle', { r: 2 + r() * 3.5, style: 'fill:rgba(225,238,244,.7);stroke:rgba(170,195,210,.45);stroke-width:1' }, ctx.mist);
        ctx.M.push({ el: c, spread: (r() - 0.5) * 0.5, speed: 0.6 + r() * 0.6, off: r() });
      }
      // bottle + hand
      ctx.bottle = g(root);
      const bot = GB.SprayBottle(ctx.bottle);
      ctx.nozzle = bot.nozzle;
      const hand = g(ctx.bottle, { transform: 'translate(40,-10) scale(0.9)' });
      GB.PaperHand(hand, { pose: 'grip' });
      ctx.bottleScale = 0.62;
    },
    update(t, ctx) {
      ctx.cool.update(t, seg(t, 0, 0.5) * (1 - seg(t, 1.8, 2.4)));
      // bottle path: walls (left→right), rim, then the lid
      const enter = seg(t, 2.0, 2.9, 'out'), leave = seg(t, 9.0, 9.8, 'in');
      const k1 = seg(t, 3.0, 5.0, 'inOut'), k2 = seg(t, 5.2, 6.8, 'inOut'), k3 = seg(t, 7.0, 8.7, 'inOut');
      let tx, ty; // where the mist lands
      if (t < 5.1) { tx = GB.lerp(560, 1040, k1); ty = 640; }
      else if (t < 6.9) { tx = GB.lerp(1030, 600, k2); ty = 420; }
      else { tx = GB.lerp(1220, 1520, k3); ty = 740; }
      const bs = ctx.bottleScale;
      const bx = tx + 300 + (1 - enter) * 900 + leave * 900, by = ty - 120;
      const bb = GB.boil('bottle', 0.8);
      GB.place(ctx.bottle, bx + bb.x, by + bb.y, -14, bs, 1);
      const spraying = (t > 3.0 && t < 5.0) || (t > 5.2 && t < 6.8) || (t > 7.0 && t < 8.7);
      const nx = bx + ctx.nozzle.x * bs * Math.cos(-14 * Math.PI / 180) - ctx.nozzle.y * bs * Math.sin(-14 * Math.PI / 180);
      const ny = by + ctx.nozzle.x * bs * Math.sin(-14 * Math.PI / 180) + ctx.nozzle.y * bs * Math.cos(-14 * Math.PI / 180);
      ctx.M.forEach((m) => {
        if (!spraying) { m.el.setAttribute('display', 'none'); return; }
        const q = ((t * m.speed + m.off) % 1);
        const ax = tx - nx, ay = ty - ny;
        const x = nx + ax * q + -ay * m.spread * q, y = ny + ay * q + ax * m.spread * q;
        m.el.removeAttribute('display');
        m.el.setAttribute('cx', x.toFixed(1));
        m.el.setAttribute('cy', y.toFixed(1));
        m.el.setAttribute('opacity', (Math.sin(q * Math.PI) * 0.9).toFixed(2));
      });
      // coating builds very subtly (matte)
      ctx.coatWall.setAttribute('opacity', (k1 * 0.22).toFixed(3));
      ctx.coatRim.setAttribute('opacity', (k2 * 0.22).toFixed(3));
      ctx.coatLid.setAttribute('opacity', (k3 * 0.22).toFixed(3));
    }
  });
})();
