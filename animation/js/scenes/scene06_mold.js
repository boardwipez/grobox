/* =============================================================================
   SCENE 6 — FILL THE GROBOX MOULD
   Exploded paper-craft view: 1 lower mould · 2 hemp/mycelium mix · 3 inner
   core · 4 upper plate. The mix is spread into the cavity, the core presses
   in (bottom + four walls + hollow centre — clarified by a cross-section card),
   the plate closes it: only grey is visible. The lid is moulded separately.
   ========================================================================== */
(function () {
  const { el, g, seg, rng, rrPath } = GB;

  const S = 0.72, MX = 830;
  const Y = { plate: 105, core: 315, mix: 540, lower: 752 };

  GB.scene('mold', {
    design: 15,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      // lower mould
      ctx.lowerG = g(root, { transform: GB.tf(MX, Y.lower, 0, S) });
      const low = GB.MoldLower(ctx.lowerG, {});
      ctx.low = low;
      ctx.fill = el('path', { d: low.levelPath(0), style: 'fill:url(#p-mix)' }, low.fill);
      // heap of mix (in the clipped contents so it drops *into* the cavity)
      ctx.heap = g(low.contents, { filter: 'url(#f-paper)' });
      const hp = GB.smoothPath(GB.blobPoints(0, 0, 230, 70, 16, 0.25, rng(6)), true);
      GB.PaperShape(ctx.heap, hp, '#b38d5f', { texture: 'p-mix', textureOpacity: 1 });
      // inner core (also in contents)
      ctx.core = g(low.contents);
      GB.MoldCore(ctx.core);
      // plate
      ctx.plate = g(root);
      GB.MoldPlate(ctx.plate);

      // labels (left)
      const names = ['1  Neðra mót', '2  Hampur + sveppagró', '3  Innri kjarni', '4  Efri plata'];
      const ys = [Y.lower + 60, Y.mix, Y.core + 50, Y.plate];
      ctx.labels = names.map((n, i) => {
        const lg = g(root);
        const lab = GB.PaperLabel(lg, n, { size: 30, className: 'tag-text' });
        lab.layout();
        const line = GB.line(root, `M${396},${ys[i] - 10}L${MX - 330 * S - 10},${ys[i] - 10}`, '@ink-soft', 2, { 'stroke-dasharray': '5 6' });
        if (GB.config.showLabels === false) line.style.visibility = 'hidden';
        return { g: lg, lab, y: ys[i], line };
      });

      // cross-section card
      ctx.inset = g(root);
      const card = g(ctx.inset, { filter: 'url(#f-lift)' });
      GB.PaperShape(card, rrPath(-250, -200, 500, 430, 10, 10), '@card');
      const t = GB.PaperLabel(ctx.inset, 'Þversnið', { size: 24, className: 'tag-text' }); t.layout();
      t.setAttribute('transform', 'translate(-226,196)');
      const sec = g(ctx.inset, { filter: 'url(#f-paper)', transform: 'translate(0,30)' });
      const cavity = 'M-140,-40H140V110H-140Z';
      ctx.secMixClipRect = el('rect', { x: -140, y: 110, width: 280, height: 0 }, el('clipPath', { id: 'sec-mix-clip' }, GB.defs));
      const mixG = g(sec, { 'clip-path': 'url(#sec-mix-clip)' });
      el('path', { d: cavity, style: 'fill:#b38d5f' }, mixG);
      el('path', { d: cavity, style: 'fill:url(#p-mix)' }, mixG);
      el('path', { d: 'M-180,-40H180V150H-180Z' + 'M-140,-40V110H140V-40Z', 'fill-rule': 'evenodd', style: 'fill:var(--grey)' }, sec);
      ctx.secCore = g(sec);
      el('path', { d: 'M-100,0H100V110H-100Z', style: 'fill:#a7a9ab' }, ctx.secCore);
      ctx.secPlate = g(sec);
      el('path', { d: 'M-196,0H196V24H-196Z', style: 'fill:var(--grey-light)' }, ctx.secPlate);
      // section labels
      ctx.secLabels = [['botn', 0, 92, 0, 160], ['veggir', -120, 20, -210, -14], ['holrými', 0, 20, 70, -112]].map(([txt, ax, ay, lx, ly]) => {
        const lg = g(ctx.inset);
        GB.line(lg, `M${ax},${ay + 30}L${lx + (lx < ax ? 40 : 0)},${ly + 20}`, '@ink', 2);
        el('circle', { cx: ax, cy: ay + 30, r: 5, style: 'fill:var(--ink)' }, lg);
        const l = GB.PaperLabel(g(lg, { transform: `translate(${lx},${ly + 30})` }), txt, { size: 22, className: 'tag-text' });
        l.layout();
        if (GB.config.showLabels === false) lg.style.visibility = 'hidden';
        return lg;
      });
      ctx.hollowTint = el('path', { d: 'M-100,-10H100V100H-100Z', style: 'fill:rgba(255,255,255,.0)' }, sec);

      // lid mould (separate)
      ctx.lidG = g(root);
      const lm = GB.LidMold(ctx.lidG);
      ctx.lidMold = lm;
      ctx.lidFill = el('path', { d: lm.levelPath(0), style: 'fill:url(#p-mix)' }, lm.fill);
      ctx.lidPlate = g(root);
      GB.LidMoldPlate(ctx.lidPlate);
      ctx.lidLabel = g(root);
      const ll = GB.PaperLabel(ctx.lidLabel, 'Mót fyrir lok', { size: 26, className: 'tag-text' }); ll.layout();
    },
    update(t, ctx) {
      const drop = (a) => seg(t, a, a + 0.6, 'out');
      // ---- exploded assembly (stop-motion drops)
      const pL = drop(0.2), pM = drop(0.7), pC = drop(1.2), pP = drop(1.7);
      const bL = GB.boil('low6', 0.5);
      GB.place(ctx.lowerG, MX + bL.x, Y.lower + (1 - pL) * -900 + bL.y, 0, S, pL > 0 ? 1 : 0);

      // ---- mix into cavity
      const hDrop = seg(t, 3.3, 4.0, 'in');
      const spread = seg(t, 4.0, 6.2, 'inOut');
      const coreIn = seg(t, 6.4, 8.4, 'inOut');
      const level = t < 4 ? 0 : GB.lerp(0, 0.42, GB.ease.out(spread)) + coreIn * 0.58;
      ctx.fill.setAttribute('d', ctx.low.levelPath(Math.max(0.001, level)));
      GB.show(ctx.fill, level > 0.002 ? 1 : 0);
      const heapLocalY = (Y.mix - Y.lower) / S + (1 - pM) * -900;
      const heapY = GB.lerp(heapLocalY, 60, hDrop);
      const heapS = 1 - spread;
      ctx.heap.setAttribute('transform', `translate(0,${heapY.toFixed(1)}) scale(${Math.max(0.001, heapS * GB.lerp(1, 0.85, hDrop)).toFixed(3)},${Math.max(0.001, heapS).toFixed(3)})`);
      GB.show(ctx.heap, pM > 0 && heapS > 0.01 ? 1 : 0);

      // ---- core: exploded position → pressed into cavity (top flush with mould top)
      const coreLocal0 = (Y.core - Y.lower) / S + (1 - pC) * -900;
      const cY = GB.lerp(coreLocal0, 0, coreIn);
      ctx.core.setAttribute('transform', `translate(0,${cY.toFixed(1)})`);
      GB.show(ctx.core, pC > 0 ? 1 : 0);

      // ---- plate closes
      const plateIn = seg(t, 8.7, 9.7, 'inOut');
      const pY = GB.lerp(Y.plate + (1 - pP) * -900, Y.lower - 30 * S, plateIn);
      const bP = GB.boil('plate6', plateIn > 0 && plateIn < 1 ? 1 : 0.4);
      GB.place(ctx.plate, MX + bP.x, pY + bP.y, 0, S, pP > 0 ? 1 : 0);

      // ---- labels
      ctx.labels.forEach((L, i) => {
        const a = [0.5, 1.0, 1.5, 2.0][i];
        const v = seg(t, a, a + 0.4) * (1 - seg(t, 3.1, 3.5));
        GB.place(L.g, 380 - L.lab.w + L.lab.left * 0 + 26, L.y, 0, 1, v);
        L.line.setAttribute('opacity', v.toFixed(2));
      });

      // ---- cross-section card mirrors the main action
      const iv = seg(t, 3.2, 3.8, 'out');
      GB.place(ctx.inset, 1590, 330 + (1 - iv) * 40, 0, 0.92, iv);
      const secLevel = t < 4 ? 0 : GB.lerp(0, 0.42, GB.ease.out(spread)) + coreIn * 0.58;
      ctx.secMixClipRect.setAttribute('y', (110 - 150 * secLevel).toFixed(1));
      ctx.secMixClipRect.setAttribute('height', (150 * secLevel).toFixed(1));
      ctx.secCore.setAttribute('transform', `translate(0,${GB.lerp(-200, -40, coreIn).toFixed(1)})`);
      ctx.secPlate.setAttribute('transform', `translate(0,${GB.lerp(-200, -64, plateIn).toFixed(1)})`);
      GB.show(ctx.secPlate, seg(t, 8.5, 8.8));
      ctx.secLabels.forEach((sl, i) => GB.show(sl, seg(t, 9.6 + i * 0.35, 10 + i * 0.35)));

      // ---- lid mould, filled and closed separately
      const lIn = seg(t, 10.4, 11.0, 'out');
      const lFill = seg(t, 11.1, 12.1, 'out');
      const lClose = seg(t, 12.3, 13.0, 'inOut');
      const LX = 1560, LY = 840, LS = 0.5;
      GB.place(ctx.lidG, LX + (1 - lIn) * 700, LY, 0, LS, lIn > 0 ? 1 : 0);
      ctx.lidFill.setAttribute('d', ctx.lidMold.levelPath(Math.max(0.001, lFill * 0.85)));
      GB.show(ctx.lidFill, lFill > 0 ? 1 : 0);
      GB.place(ctx.lidPlate, LX, GB.lerp(LY - 420, LY - 24 * LS, lClose), 0, LS, lClose > 0 ? Math.min(1, lClose * 4) : 0);
      const llv = seg(t, 10.8, 11.2) * (1 - seg(t, 14.4, 14.9));
      GB.place(ctx.lidLabel, LX - 70, LY + 150, 0, 1, llv);
    }
  });
})();
