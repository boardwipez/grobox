/* =============================================================================
   SCENE 4 — HEAT TREATMENT
   The tray of hurds slides into a paper-built chamber. Soft orange paper waves
   (no flames) show heat; then the tray comes out and blue airflow cools it.
   ========================================================================== */
(function () {
  const { g, seg } = GB;

  const CH = { x: 820, y: 820 };

  GB.scene('heat', {
    design: 10,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      ctx.chG = g(root);
      const ch = GB.Chamber(ctx.chG, { w: 840, h: 540 });
      ctx.ch = ch;
      const geo = ch.geom;
      // heat ribbons inside (behind and in front of the tray)
      const back = g(ch.inside);
      ctx.heatBack = GB.AirflowField(back, [0, 1, 2, 3].map((i) => ({ x: geo.ox + 40, y: geo.oy + 70 + i * 80, len: geo.ow - 80, amp: 14, waves: 2.2, thick: 16, color: i % 2 ? '@heat' : '@heat-light', travel: 0, filter: 'paper' })));
      ctx.trayInside = g(ch.inside);
      ctx.heatFront = GB.AirflowField(g(ch.insideFx, { opacity: 0.85 }), [0, 1].map((i) => ({ x: geo.ox + 70, y: geo.oy + 300 + i * 70, len: geo.ow - 140, amp: 10, waves: 1.7, thick: 12, color: '@heat', travel: 0 })));
      // tray (moves between the room and the chamber interior)
      ctx.trayOut = g(root);
      ctx.trayG = g(ctx.trayOut);
      ctx.tray = GB.Tray(ctx.trayG, { w: 560, d: 230, h: 56, level: 0.75 });
      // cooling airflow (outside)
      ctx.cool = GB.AirflowField(g(root), [0, 1, 2, 3, 4].map((i) => ({ x: 560, y: 450 + i * 46, len: 760, amp: 9, waves: 1.6, thick: 8, color: '@cool', travel: 260, speed: 140 })));
    },
    update(t, ctx) {
      const { ch } = ctx;
      // chamber slides in from the left, leaves to the left at the end
      const cIn = seg(t, 0, 0.9, 'out'), cOut = seg(t, 7.0, 7.8, 'in');
      const chX = CH.x - (1 - cIn) * 1400 - cOut * 1500;
      GB.place(ctx.chG, chX, CH.y, 0, 1, 1);

      // tray path: centre (continues from scene 3) → front of opening → in → out → centre
      const a = seg(t, 0.5, 1.8, 'inOut');      // to the front of the chamber
      const b = seg(t, 1.9, 2.6, 'inOut');      // push in
      const c = seg(t, 6.2, 6.9, 'inOut');      // pull out
      const d = seg(t, 7.1, 8.0, 'inOut');      // back to the centre of the table
      const inside = b >= 1 && c <= 0;
      let x = GB.lerp(960, CH.x, a), y = GB.lerp(560, CH.y + 60, a), s = 1;
      if (b > 0) { y = GB.lerp(CH.y + 60, CH.y - 100, b); s = GB.lerp(1, 0.82, b); }
      if (c > 0) { y = GB.lerp(CH.y - 100, CH.y + 60, c); s = GB.lerp(0.82, 1, c); }
      if (d > 0) { x = GB.lerp(CH.x, 960, d); y = GB.lerp(CH.y + 60, 580, d); }
      const bo = GB.boil('tray4', 0.5);
      if (inside) {
        if (ctx.trayG.parentNode !== ctx.trayInside) ctx.trayInside.appendChild(ctx.trayG);
        ctx.trayG.setAttribute('transform', GB.tf(x - chX + bo.x, y - CH.y + bo.y, 0, s));
      } else {
        if (ctx.trayG.parentNode !== ctx.trayOut) ctx.trayOut.appendChild(ctx.trayG);
        ctx.trayG.setAttribute('transform', GB.tf(x + bo.x, y + bo.y, 0, s));
      }
      // heat
      const heat = seg(t, 2.7, 3.4) * (1 - seg(t, 5.8, 6.4));
      ch.setHeat(heat);
      ctx.heatBack.update(t, heat);
      ctx.heatFront.update(t + 0.4, heat * 0.9);
      // cooling
      ctx.cool.update(t, seg(t, 7.8, 8.4) * (1 - seg(t, 9.6, 10)));
    }
  });
})();
