/* =============================================================================
   SCENE 3 — HEMP HURDS
   Stalks slide onto a clean table, a paper blade chops them into irregular
   woody chips (hurds — not sawdust), the chips are screened in a sieve (dust
   falls out) and poured into a shallow tray.
   ========================================================================== */
(function () {
  const { el, g, seg, rng, steps } = GB;

  const STALK_X0 = 430, STALK_X1 = 1190; // stalk extent on the table
  const CHOPS = 11;
  const CHOP_A = 1.8, CHOP_Z = 5.6;

  GB.scene('hurds', {
    design: 12,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      // stalks (clipped as they get chopped)
      const clipId = 'hurd-stalk-clip';
      const cp = el('clipPath', { id: clipId }, GB.defs);
      ctx.clipRect = el('rect', { x: 0, y: 0, width: 2000, height: 1080 }, cp);
      ctx.stalks = g(root, { 'clip-path': `url(#${clipId})` });
      ctx.stalkEls = [0, 1, 2].map((i) => {
        const sg = g(ctx.stalks);
        GB.HempStalk(sg, { len: STALK_X1 - STALK_X0, thick: 26, seed: i + 4 });
        return { g: sg, y: 470 + i * 52, x: (STALK_X0 + STALK_X1) / 2 + (i - 1) * 14, d: i * 0.15 };
      });
      // chip pile (grows with each chop)
      ctx.pile = GB.HurdPile(root, { cx: 1440, cy: 560, rx: 190, ry: 92, n: 170, len: [16, 34], seed: 13, heap: 0.75 });
      // dust specks for screening
      ctx.dust = g(root);
      const r = rng(5);
      ctx.dustP = [];
      for (let i = 0; i < 70; i++) {
        const d = el('circle', { cx: 0, cy: 0, r: 1.4 + r() * 2.2, style: 'fill:#cdb48c' }, ctx.dust);
        ctx.dustP.push({ el: d, x: (r() - 0.5) * 280, y: (r() - 0.5) * 60, t0: 6.2 + r() * 1.8, fall: 120 + r() * 120 });
      }
      // sieve with its own pile
      ctx.sieve = g(root);
      const sv = GB.Sieve(ctx.sieve, { r: 190 });
      ctx.sievePile = GB.HurdPile(sv.contents, { cx: 0, cy: 6, rx: 150, ry: 66, n: 150, len: [16, 34], seed: 13, heap: 0.85, filter: false });
      // tray
      ctx.trayG = g(root);
      ctx.tray = GB.Tray(ctx.trayG, { w: 560, d: 230, h: 56, level: 0 });
      // blade
      ctx.blade = g(root);
      GB.Blade(ctx.blade);
    },
    update(t, ctx) {
      // 1) stalks slide in from the left (stop-motion)
      ctx.stalkEls.forEach((s) => {
        const p = seg(t, 0.1 + s.d, 1.5 + s.d, 'out');
        const b = GB.boil('st' + s.y, 0.5);
        GB.place(s.g, s.x - (1 - p) * 1400 + b.x, s.y + b.y, b.r, 1, 1);
      });
      // 2) chopping right → left
      const n = steps(t, CHOP_A, CHOP_Z, CHOPS);
      const per = (CHOP_Z - CHOP_A) / CHOPS;
      const phase = t < CHOP_A || t >= CHOP_Z ? 1 : ((t - CHOP_A) % per) / per;
      const cutX = STALK_X1 - (n / CHOPS) * (STALK_X1 - STALK_X0) + 20;
      ctx.clipRect.setAttribute('width', n >= CHOPS ? 0 : Math.max(0, cutX + 40));
      const nextX = STALK_X1 - ((n + 1) / CHOPS) * (STALK_X1 - STALK_X0) + 40;
      const down = phase < 0.45 ? seg(phase, 0, 0.45, 'in') : 1 - seg(phase, 0.55, 1, 'out');
      const bladeOn = seg(t, 1.3, 1.8) * (1 - seg(t, 5.7, 6.1));
      GB.place(ctx.blade, Math.min(nextX, STALK_X1 + 30), GB.lerp(330, 600, down) - (1 - bladeOn) * 700, -4, 1, bladeOn > 0 ? 1 : 0);
      // pile grows as pieces are chopped off
      const shown = Math.floor((Math.min(n, CHOPS) / CHOPS) * ctx.pile.chips.length);
      const toSieve = seg(t, 6.0, 6.6, 'inOut');
      ctx.pile.chips.forEach((c, i) => GB.show(c.g, i < shown && toSieve < 1 ? 1 : 0));
      ctx.pile.g.setAttribute('transform', `translate(${(GB.lerp(0, 960 - 1440, toSieve)).toFixed(1)},${(GB.lerp(0, 520 - 560, toSieve)).toFixed(1)})`);

      // 3) sieve: in, shake, dust falls
      const sIn = seg(t, 5.6, 6.2, 'out');
      const shake = t > 6.6 && t < 8.2 ? (GB.frame % 2 ? 1 : -1) * 9 : 0;
      const pour = seg(t, 8.4, 9.4, 'inOut');
      const sOut = seg(t, 10.0, 10.8, 'in');
      const sx = 960 + shake + pour * 40 + sOut * 1200, sy = GB.lerp(520, 420, pour) - (1 - sIn) * 700;
      GB.place(ctx.sieve, sx, sy, pour * -18, 1, sIn > 0 ? 1 : 0);
      ctx.sievePile.g.setAttribute('opacity', toSieve >= 1 ? (1 - seg(t, 8.8, 9.8)).toFixed(2) : 0);
      ctx.sievePile.g.setAttribute('transform', `translate(0,${(seg(t, 8.8, 9.8) * 30).toFixed(1)}) scale(${(1 - seg(t, 8.8, 9.8) * 0.4).toFixed(3)})`);
      ctx.dustP.forEach((d) => {
        const p = seg(t, d.t0, d.t0 + 0.6, 'in');
        if (p <= 0 || p >= 1) { d.el.setAttribute('display', 'none'); return; }
        d.el.removeAttribute('display');
        d.el.setAttribute('cx', (960 + d.x).toFixed(1));
        d.el.setAttribute('cy', (560 + d.y + p * d.fall).toFixed(1));
        d.el.setAttribute('opacity', (1 - p * 0.7).toFixed(2));
      });
      // 4) tray slides in under the sieve, fills
      const tIn = seg(t, 7.8, 8.5, 'out');
      const tc = seg(t, 10.4, 11.4, 'inOut');
      GB.place(ctx.trayG, 960 - (1 - tIn) * 1300, GB.lerp(700, 560, tc), 0, 1, tIn > 0 ? 1 : 0);
      ctx.tray.setFill(null, seg(t, 8.8, 9.9, 'out') * 0.75);
      GB.show(ctx.tray.fillEl, t > 8.8 ? 1 : 0);
    }
  });
})();
