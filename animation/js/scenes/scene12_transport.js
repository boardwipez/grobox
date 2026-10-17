/* =============================================================================
   SCENE 12 — SEAFOOD TRANSPORT
   Ice and fish go into the finished Grobox, the lid goes on; closed boxes are
   stacked on a pallet, loaded into a refrigerated truck, and a simple paper
   map shows the route from Iceland to another country.
   ========================================================================== */
(function () {
  const { el, g, seg, rng, polyPath, smoothPath } = GB;

  GB.scene('transport', {
    design: 12,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      // ---------------- A: pack the box
      ctx.packA = g(root);
      ctx.boxG = g(ctx.packA, { transform: GB.tf(960, 470, 0, 0.95) });
      const box = GB.Grobox(ctx.boxG, {});
      const ge = box.geom;
      ctx.ice = GB.IceBed(box.contents, { cx: 0, cy: ge.iy + ge.id * 0.55, rx: ge.iw * 0.46, ry: ge.id * 0.4, n: 40, seed: 14 });
      ctx.fish = [[-30, -18, -6, 280, 'mackerel'], [30, 14, 5, 300, 'cod'], [-6, 38, -2, 270, 'mackerel']].map(([x, y, r, len, kind], i) => {
        const f = g(box.contents);
        GB.Fish(f, { len, kind, seed: i + 7 });
        return { g: f, x, y, r };
      });
      ctx.lidA = g(ctx.packA);
      GB.GroboxLid(ctx.lidA, {});

      // ---------------- B: pallet, stack, truck
      ctx.packB = g(root);
      ctx.truck = g(ctx.packB);
      GB.Truck(g(ctx.truck, { transform: 'scale(-1,1)' })); // rear doors face the pallet
      ctx.palletG = g(ctx.packB);
      GB.Pallet(ctx.palletG, { w: 760, d: 150 });
      ctx.stack = [];
      const sc = 0.4;
      for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 3; col++) {
          const bg = g(ctx.palletG);
          // closed box = body + lid on top
          const B = GB.BOX;
          const body = g(bg, { transform: `translate(0,${40 * sc})` });
          GB.solid(body, { w: B.w * sc, d: B.d * sc, h: B.h * sc, rx: B.rx * sc, mat: 'grobox', filter: 'paper' });
          GB.GroboxLid(g(bg, { transform: `scale(${sc})` }), { filter: 'paper', contact: false });
          ctx.stack.push({ g: bg, x: (col - 1) * (B.w * sc + 12), y: -40 - row * ((B.h + 40) * sc + 2), i: row * 3 + col });
        }
      }
      // truck box front (so the pallet disappears *into* the truck)
      ctx.truckFront = g(ctx.packB);

      // ---------------- C: map
      ctx.map = g(root);
      el('rect', { x: -40, y: -40, width: 2000, height: 1160, style: 'fill:var(--ocean-light)' }, ctx.map);
      el('rect', { x: -40, y: -40, width: 2000, height: 1160, style: 'fill:url(#p-fibre);opacity:.4' }, ctx.map);
      const land = g(ctx.map, { filter: 'url(#f-paper)' });
      const ice = GB.ICELAND.map(([x, y]) => [200 + x * 1.25, 150 + y * 1.25]);
      GB.PaperShape(land, smoothPath(ice, true), '@beige');
      // generic mainland coast to the south-east (unnamed)
      const r = rng(61);
      const coast = [[1250, 1120]];
      for (let y = 1100; y >= 380; y -= 60) coast.push([1300 + Math.sin(y / 70) * 50 + r() * 40 + (1100 - y) * 0.42, y]);
      coast.push([2000, 300], [2000, 1120]);
      GB.PaperShape(land, smoothPath(coast, true), '@beige');
      const tag = GB.PaperLabel(g(ctx.map, { transform: 'translate(330,520)' }), 'Ísland', { size: 32, className: 'tag-text' });
      tag.layout();
      // route
      ctx.routeD = 'M560,430 C760,560 900,760 1120,860 S1500,900 1620,820';
      ctx.route = GB.line(ctx.map, ctx.routeD, '#fbfaf6', 6, { 'stroke-dasharray': '18 14' });
      ctx.routeMask = el('path', { d: ctx.routeD, style: 'fill:none;stroke:var(--ocean-light);stroke-width:12;stroke-linecap:round' }, ctx.map);
      ctx.ship = g(ctx.map);
      GB.CargoShip(ctx.ship, { scale: 0.75 });
      ctx.dest = g(ctx.map, { filter: 'url(#f-paper)' });
      el('circle', { cx: 0, cy: 0, r: 16, style: 'fill:var(--red)' }, ctx.dest);
      el('circle', { cx: 0, cy: 0, r: 6, style: 'fill:#fbfaf6' }, ctx.dest);
      ctx.home = g(ctx.map, { filter: 'url(#f-paper)', transform: 'translate(560,430)' });
      el('circle', { cx: 0, cy: 0, r: 12, style: 'fill:var(--ocean-dark)' }, ctx.home);
      // a measuring path for the ship
      ctx.measure = el('path', { d: ctx.routeD, style: 'fill:none;stroke:none' }, ctx.map);
    },
    update(t, ctx) {
      const A = t < 3.6, B = t >= 3.6 && t < 8.3, C = t >= 8.3;
      GB.show(ctx.packA, A ? 1 : 0); GB.show(ctx.packB, B ? 1 : 0); GB.show(ctx.map, C ? 1 : 0);
      if (A) {
        const nIce = GB.steps(t, 0.2, 0.9, 5);
        ctx.ice.pieces.forEach((p, i) => GB.show(p.g, i < nIce * 8 ? 1 : 0));
        ctx.fish.forEach((f, i) => {
          const p = seg(t, 0.9 + i * 0.4, 1.4 + i * 0.4, 'out');
          const b = GB.boil('f12' + i, 0.8);
          GB.place(f.g, f.x + b.x, f.y - (1 - p) * 300 + b.y, f.r, 1, p > 0 ? 1 : 0);
        });
        const lid = seg(t, 2.5, 3.3, 'inOut');
        GB.place(ctx.lidA, 960, GB.lerp(-200, 470 - 40 * 0.95, lid), 0, 0.95, lid > 0 ? 1 : 0);
      }
      if (B) {
        // stack drops on (stop-motion), truck arrives, pallet loads, truck leaves
        ctx.stack.forEach((s) => {
          const p = seg(t, 3.7 + s.i * 0.17, 4.05 + s.i * 0.17, 'out');
          const b = GB.boil('stack' + s.i, 0.5);
          GB.place(s.g, s.x + b.x, s.y - (1 - p) * 500 + b.y, 0, 1, p > 0 ? 1 : 0);
        });
        const tin = seg(t, 5.2, 6.1, 'out');
        const load = seg(t, 6.2, 7.0, 'inOut');
        const tout = seg(t, 7.3, 8.3, 'in');
        const truckX = GB.lerp(2500, 1300, tin) + tout * 1400;
        GB.place(ctx.truck, truckX, 900, 0, 1, 1);
        GB.place(ctx.palletG, GB.lerp(560, truckX - 60, load), 760 - load * 60, 0, GB.lerp(1, 0.9, load), load < 0.95 ? 1 : 0);
        // pallet goes behind the truck box while loading
        if (load > 0.05 && ctx.palletG.nextSibling !== ctx.truck) ctx.packB.insertBefore(ctx.palletG, ctx.truck);
        if (load <= 0.05 && ctx.truck.nextSibling !== ctx.palletG) ctx.packB.insertBefore(ctx.truck, ctx.palletG);
      }
      if (C) {
        const draw = seg(t, 8.6, 11.0, 'inOut');
        // reveal the dashed route by shrinking a mask stroke
        const L = ctx.measure.getTotalLength();
        ctx.routeMask.setAttribute('stroke-dasharray', `${L + 20} ${L + 20}`);
        ctx.routeMask.setAttribute('stroke-dashoffset', (-draw * L).toFixed(1));
        const pt = ctx.measure.getPointAtLength(L * draw);
        const pt2 = ctx.measure.getPointAtLength(Math.min(L, L * draw + 2));
        const ang = Math.atan2(pt2.y - pt.y, pt2.x - pt.x) * 180 / Math.PI;
        const bb = GB.boil('ship', 0.6);
        GB.place(ctx.ship, pt.x + bb.x, pt.y - 10 + bb.y, ang * 0.3, 1, seg(t, 8.4, 8.7));
        const dv = seg(t, 10.9, 11.3, 'outBack');
        GB.place(ctx.dest, 1620, 820, 0, Math.max(0.001, dv), dv > 0 ? 1 : 0);
      }
    }
  });
})();
