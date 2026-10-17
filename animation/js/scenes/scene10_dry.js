/* =============================================================================
   SCENE 10 — FINAL HEAT
   Box and lid sit on a wire rack in a drying chamber. Warm orange airflow
   ribbons (no flames, no smoke) remove moisture — small pale-blue drops lift
   away — and the white surface growth settles: growth stopped, material
   stabilised.
   ========================================================================== */
(function () {
  const { g, seg, rng } = GB;

  const CH = { x: 960, y: 900 };

  GB.scene('dry', {
    design: 11,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      ctx.chG = g(root, { transform: GB.tf(CH.x, CH.y) });
      const ch = GB.Chamber(ctx.chG, { w: 1100, h: 700, wire: true });
      ctx.ch = ch;
      const geo = ch.geom;
      ctx.shelfY = geo.oy + geo.oh * 0.62 - 8;
      // ribbons behind the objects
      ctx.ribBack = GB.AirflowField(g(ch.inside), [0, 1, 2].map((i) => ({ x: geo.ox + 40, y: geo.oy + 90 + i * 70, len: geo.ow - 80, amp: 16, waves: 2.4, thick: 14, color: i % 2 ? '@heat-light' : '@heat', travel: 0 })));
      ctx.objs = g(ch.inside);
      ctx.box = g(ctx.objs);
      ctx.boxEl = GB.Grobox(ctx.box, { bloom: 0.32 });
      ctx.lid = g(ctx.objs);
      ctx.lidEl = GB.GroboxLid(ctx.lid, { bloom: 0.32 });
      // moisture drops leaving
      ctx.drops = [];
      const r = rng(17);
      const dropsG = g(ch.insideFx);
      for (let i = 0; i < 14; i++) {
        const d = g(dropsG);
        GB.Drop(d, { size: 14 + r() * 8 });
        ctx.drops.push({ g: d, x: -340 + r() * 640, y0: ctx.shelfY - 90 - r() * 60, t0: 3.0 + r() * 3.6 });
      }
      ctx.ribFront = GB.AirflowField(g(ch.insideFx, { opacity: 0.8 }), [0, 1].map((i) => ({ x: geo.ox + 60, y: ctx.shelfY - 40 + i * 60, len: geo.ow - 120, amp: 12, waves: 1.8, thick: 11, color: '@heat', travel: 0 })));
    },
    update(t, ctx) {
      const { ch } = ctx;
      // box and lid slide in onto the wire rack (stop-motion)
      const bi = seg(t, 0.2, 1.6, 'out'), li = seg(t, 0.7, 2.0, 'out');
      const bb = GB.boil('box10', bi < 1 ? 1 : 0.3), lb = GB.boil('lid10', li < 1 ? 1 : 0.3);
      GB.place(ctx.box, -190 - (1 - bi) * 900 + bb.x, ctx.shelfY - 270 * 0.62 + bb.y, 0, 0.62, 1);
      GB.place(ctx.lid, 250 + (1 - li) * 900 + lb.x, ctx.shelfY - 125 * 0.6 + lb.y, 0, 0.6, 1);
      // heat
      const heat = seg(t, 2.0, 2.8) * (1 - seg(t, 8.6, 9.6));
      ch.setHeat(heat);
      ctx.ribBack.update(t, heat);
      ctx.ribFront.update(t + 0.5, heat * 0.85);
      // white growth settles (stop growth) — bloom fades
      const bloom = GB.lerp(0.32, 0.06, seg(t, 3.0, 8.0));
      ctx.boxEl.bloom.setAttribute('opacity', bloom.toFixed(3));
      ctx.lidEl.bloom.setAttribute('opacity', bloom.toFixed(3));
      // moisture leaves
      ctx.drops.forEach((d) => {
        const p = seg(t, d.t0, d.t0 + 1.4, 'out');
        GB.place(d.g, d.x + Math.sin(p * 6 + d.x) * 10, d.y0 - p * 200, 0, 1 - p * 0.4, p > 0 && p < 1 ? (1 - p) * heat : 0);
      });
    }
  });
})();
