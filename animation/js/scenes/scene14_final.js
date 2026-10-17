/* =============================================================================
   SCENE 14 — FINAL FRAME
   Clean paper. Hero Grobox centred with its lid slightly raised, a small pile
   of hemp hurds on one side, fine mycelium threads on the other. Title and
   tagline are cut-paper letters in the open space above. Holds at the end.
   ========================================================================== */
(function () {
  const { el, g, seg, rng, smoothPath } = GB;

  const BOX = { x: 960, y: 770, s: 0.8 };

  GB.scene('final', {
    design: 6,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      // hurds pile (left)
      ctx.pile = GB.HurdPile(root, { cx: 470, cy: 930, rx: 200, ry: 58, n: 170, len: [18, 40], seed: 81, heap: 0.7 });
      // mycelium threads (right) — a small tuft of fine branching threads
      ctx.threads = g(root, { filter: 'url(#f-thread)' });
      const r = rng(91);
      ctx.threadEls = [];
      for (let i = 0; i < 40; i++) {
        let x = 1450 + (r() - 0.5) * 90, y = 930 + (r() - 0.5) * 26, a = r() * Math.PI * 2;
        const pts = [[x, y]];
        const n = 8 + Math.floor(r() * 10);
        let w = 0;
        for (let k = 0; k < n; k++) { w = w * 0.8 + (r() - 0.5) * 0.5; a += w; x += Math.cos(a) * 14; y += Math.sin(a) * 14 * 0.55; pts.push([x, y]); }
        const L = n * 14 + 4;
        const p = GB.line(ctx.threads, smoothPath(pts, false), '@mycelium', 1.4 + r() * 1.4, { 'stroke-dasharray': `${L} ${L}`, 'stroke-dashoffset': L });
        ctx.threadEls.push({ el: p, L, d: r() * 0.5 });
      }
      el('ellipse', { cx: 1450, cy: 930, rx: 30, ry: 13, style: 'fill:var(--mycelium)' }, ctx.threads);
      // product
      ctx.box = g(root);
      GB.Grobox(ctx.box, {});
      ctx.lid = g(root);
      GB.GroboxLid(ctx.lid, { contact: false });
      ctx.lidShadow = GB.PaperShadow(root, 0, 0, 230, 40, 0.5);
      root.insertBefore(ctx.lidShadow, ctx.lid);
      // title letters
      ctx.title = g(root, { filter: 'url(#f-paper)' });
      const word = GB.config.title;
      ctx.letters = [];
      const size = 168, track = size * 0.86;
      const x0 = 960 - ((word.length - 1) * track) / 2;
      for (let i = 0; i < word.length; i++) {
        const lt = el('text', { x: 0, y: 0, 'text-anchor': 'middle', 'font-size': size, class: 'title-text', style: 'fill:var(--ink)' }, ctx.title);
        lt.textContent = word[i];
        ctx.letters.push({ el: lt, x: x0 + i * track, rot: (rng(i + 3)() - 0.5) * 4 });
      }
      ctx.tag = GB.config.tagline.map((line, i) => {
        const tg = g(root);
        const tx = el('text', { x: 0, y: 0, 'text-anchor': 'middle', 'font-size': 48, class: 'cap-text', style: 'fill:var(--ink-soft)' }, tg);
        tx.textContent = line;
        return tg;
      });
    },
    update(t, ctx) {
      // product arrives
      const bi = seg(t, 0.0, 0.8, 'out');
      const bb = GB.boil('box14', bi < 1 ? 1 : 0.25);
      GB.place(ctx.box, BOX.x + bb.x, BOX.y + (1 - bi) * 500 + bb.y, 0, BOX.s, 1);
      const li = seg(t, 0.4, 1.3, 'out');
      const lift = 120;
      const lb = GB.boil('lid14', li < 1 ? 1 : 0.25);
      GB.place(ctx.lid, BOX.x + 10 + lb.x, BOX.y - lift - (1 - li) * 700 + lb.y, -3, BOX.s, li > 0 ? 1 : 0);
      ctx.lidShadow.setAttribute('transform', `translate(${BOX.x + 10},${BOX.y + 40})`);
      ctx.lidShadow.setAttribute('opacity', (li * 0.35).toFixed(2));
      // side elements
      const pv = seg(t, 0.6, 1.2, 'out');
      ctx.pile.chips.forEach((c, i) => GB.show(c.g, i < pv * ctx.pile.chips.length ? 1 : 0));
      const tv = seg(t, 0.8, 2.0, 'out');
      ctx.threadEls.forEach((th) => {
        const q = GB.clamp((tv - th.d) / (1 - th.d));
        th.el.setAttribute('stroke-dashoffset', (th.L * (1 - q)).toFixed(1));
      });
      // title: cut-paper letters drop in one by one
      ctx.letters.forEach((L, i) => {
        const p = seg(t, 1.5 + i * 0.12, 1.9 + i * 0.12, 'outBack');
        const b = GB.boil('L' + i, p < 1 ? 1 : 0.2);
        GB.place(L.el, L.x + b.x, 250 - (1 - p) * 60 + b.y, L.rot * p, 1, p > 0 ? Math.min(1, p * 2) : 0);
      });
      ctx.tag.forEach((tg, i) => {
        const p = seg(t, 2.7 + i * 0.5, 3.2 + i * 0.5, 'out');
        GB.place(tg, 960, 340 + i * 60 + (1 - p) * 16, 0, 1, p);
      });
    }
  });
})();
