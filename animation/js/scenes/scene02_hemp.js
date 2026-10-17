/* =============================================================================
   SCENE 2 — HEMP
   The foam fragment flips (paper card turn) into a hemp leaf, which becomes
   the crown of a paper hemp plant. The plant is cut, laid down, its leaves
   fall away, and attention settles on the woody stalk.
   ========================================================================== */
(function () {
  const { el, g, seg, rng } = GB;

  const BASE = { x: 960, y: 1000 };
  const H = 620;

  GB.scene('hemp', {
    design: 12,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      // soft spotlight card for the final focus
      ctx.spot = g(root, { filter: 'url(#f-paper)' });
      GB.PaperShape(ctx.spot, GB.smoothPath(GB.blobPoints(0, 0, 520, 150, 22, 0.08, rng(4)), true), '@paper-2');

      // ground strip
      ctx.ground = g(root, { filter: 'url(#f-paper)' });
      GB.PaperShape(ctx.ground, GB.wavyBand(560, 1360, BASE.y - 6, BASE.y + 60, 6, 90, 0, 3), '@kraft');

      // plant
      ctx.plantG = g(root);
      const plant = GB.HempPlant(ctx.plantG, { h: H });
      ctx.plant = plant;
      // crown leaf comes from the flip, keep the plant's own top hidden until then
      // cut mark
      ctx.cut = g(root, { filter: 'url(#f-paper)' });
      GB.PaperShape(ctx.cut, 'M-70,6 L70,-10 L72,-2 L-68,14Z', '#fbfaf6');

      // foam fragment (from scene 1) and the leaf it turns into
      ctx.frag = g(root, { filter: 'url(#f-paper)' });
      GB.foamPiece(ctx.frag, GB.FOAM_FRAGMENT, 99);
      ctx.leafCard = g(root);
      ctx.leafInner = g(ctx.leafCard);
      GB.HempLeaf(g(ctx.leafInner, { transform: 'translate(0,60)' }), { size: 120, seed: 99 });

      // clean stalk + cross-section callout for the focus beat
      ctx.stalk = g(root);
      GB.HempStalk(ctx.stalk, { len: 640, thick: 26 });
      ctx.callout = g(root);
      const co = g(ctx.callout, { filter: 'url(#f-lift)' });
      el('circle', { cx: 0, cy: 0, r: 120, style: 'fill:var(--card)' }, co);
      el('circle', { cx: 0, cy: 0, r: 82, style: 'fill:var(--stalk)' }, co);
      el('circle', { cx: 0, cy: 0, r: 70, style: 'fill:var(--hurd-light)' }, co);
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        GB.line(co, `M${Math.cos(a) * 30},${Math.sin(a) * 30}L${Math.cos(a) * 66},${Math.sin(a) * 66}`, 'rgba(150,115,70,.35)', 2);
      }
      el('circle', { cx: 0, cy: 0, r: 28, style: 'fill:#f2ede2' }, co);
      ctx.coLine = GB.line(ctx.callout, 'M0,0', '@ink-soft', 2.5, { 'stroke-dasharray': '6 7' });
      const lab = GB.PaperLabel(ctx.callout, 'woody core', { size: 28, className: 'tag-text' });
      lab.layout();
      lab.setAttribute('transform', 'translate(-80,190)');
    },
    update(t, ctx) {
      const E = GB.FRAGMENT_END;
      // ---- 0–1.3: card flip fragment → leaf
      const f1 = seg(t, 0.25, 0.65, 'in'), f2 = seg(t, 0.65, 1.05, 'out');
      GB.place(ctx.frag, E.x, E.y, 0, 1, f1 < 1 ? 1 : 0);
      ctx.frag.setAttribute('transform', `translate(${E.x},${E.y}) scale(${(E.s * Math.max(0.02, 1 - f1)).toFixed(3)},${E.s})`);
      // leaf travels from the centre to the top of the plant
      const top = { x: BASE.x, y: BASE.y - H + 4 };
      const mv = seg(t, 1.3, 2.6, 'inOut');
      const lx = GB.lerp(E.x, top.x, mv), ly = GB.lerp(E.y - 60 * 1.9, top.y - 60, mv);
      const ls = GB.lerp(1.9, 1, mv);
      if (t < 0.65) GB.show(ctx.leafCard, 0);
      else {
        GB.show(ctx.leafCard, t < 2.6 ? 1 : 0);
        ctx.leafCard.setAttribute('transform', `translate(${lx.toFixed(1)},${ly.toFixed(1)}) scale(${(ls * Math.max(0.02, f2)).toFixed(3)},${ls.toFixed(3)})`);
      }

      // ---- plant assembly: ground, stalk grows, leaves pop on (stop-motion)
      const gp = seg(t, 1.0, 1.6, 'out');
      GB.place(ctx.ground, 0, (1 - gp) * 200, 0, 1, gp > 0 ? 1 : 0);
      const grow = seg(t, 1.4, 2.6, 'out');
      const leaves = ctx.plant.leaves;
      leaves.forEach((lf, i) => {
        let s;
        if (lf.side === 0) s = t >= 2.6 ? 1 : 0; // crown = the flipped leaf
        else s = seg(t, 1.9 + (Math.floor(i / 2)) * 0.18, 2.3 + (Math.floor(i / 2)) * 0.18, 'outBack');
        lf.s = s;
      });

      // ---- harvest: cut, lift, lay horizontal
      const sway = Math.sin(t * 1.4) * 1.2 * seg(t, 2.8, 3.4) * (1 - seg(t, 4.4, 4.8));
      const cutP = seg(t, 4.5, 4.9, 'out');
      GB.place(ctx.cut, GB.lerp(BASE.x - 260, BASE.x + 40, cutP), BASE.y - 30, -8, 1, cutP > 0 && t < 5.4 ? 1 - seg(t, 5.1, 5.4) : 0);
      const lay = seg(t, 5.2, 6.7, 'inOut');
      const px = GB.lerp(BASE.x, 1280, lay), py = GB.lerp(BASE.y, 600, lay);
      const rot = GB.lerp(sway, -90, lay);
      // leaves fall away (stop-motion), 6.9 → 8.6
      leaves.forEach((lf, i) => {
        const d = 6.9 + (i % 7) * 0.2;
        const fall = seg(t, d, d + 0.7, 'in');
        const base = `translate(${lf.x},${lf.y})`;
        if (fall <= 0) {
          lf.g.setAttribute('transform', base + ` scale(${Math.max(0.001, lf.s).toFixed(3)})`);
          GB.show(lf.g, lf.s > 0.001 ? 1 : 0);
        } else {
          // fall in screen space: undo plant rotation by moving along +x in plant space (= down on screen)
          lf.g.setAttribute('transform', base + ` translate(${(-fall * 700).toFixed(1)},${(lf.side * fall * 120).toFixed(1)}) rotate(${(fall * 50 * (lf.side || 1)).toFixed(1)})`);
          GB.show(lf.g, 1 - seg(t, d + 0.5, d + 0.7));
        }
      });
      ctx.plantG.setAttribute('transform', `translate(${px.toFixed(1)},${py.toFixed(1)}) rotate(${rot.toFixed(2)}) scale(1,${Math.max(0.001, grow).toFixed(3)})`);
      // ground leaves the frame once the plant is lifted
      if (t > 5.2) GB.place(ctx.ground, 0, seg(t, 5.6, 6.4, 'in') * 300, 0, 1, 1 - seg(t, 5.6, 6.4));

      // ---- focus on the stalk: replace with the clean stalk, centre it
      const swap = t >= 8.7;
      GB.show(ctx.plantG, swap ? 0 : 1);
      const cen = seg(t, 8.8, 9.8, 'inOut');
      const sb = GB.boil('stalk2', 0.5);
      GB.place(ctx.stalk, GB.lerp(1280 - 320, 960, cen) + sb.x, GB.lerp(600, 560, cen) + sb.y, sb.r, 1, swap ? 1 : 0);
      GB.place(ctx.spot, 960, 600, 0, GB.lerp(0.6, 1, seg(t, 9.0, 9.8, 'out')), seg(t, 9.0, 9.6));
      const co = seg(t, 9.6, 10.3, 'outBack');
      GB.place(ctx.callout, 470, 300, 0, Math.max(0.001, co), co > 0 ? 1 : 0);
      ctx.coLine.setAttribute('d', 'M70,100 L166,252');
    }
  });
})();
