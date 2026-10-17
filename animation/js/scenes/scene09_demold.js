/* =============================================================================
   SCENE 9 — DEMOULD
   One mould leaves the rack. On the table it opens in an exploded movement:
   upper plate lifts away, inner core lifts out, the box is raised clear and the
   lower mould moves away — revealing the beige Grobox (thick walls, hollow
   centre, rounded corners). Its matching lid slides in beside it.
   ========================================================================== */
(function () {
  const { g, seg } = GB;

  const S = 0.8, X = 960, Y = 520;

  GB.scene('demold', {
    design: 12,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      // rack close-up (same world as scenes 7–8)
      ctx.rackLayer = g(root);
      ctx.rw = GB.RackWorld(ctx.rackLayer);
      // table set
      ctx.table = g(root);
      ctx.lowerG = g(ctx.table);
      const low = GB.MoldLower(ctx.lowerG, { contact: true });
      ctx.low = low;
      ctx.box = g(low.contents);
      ctx.boxInner = GB.Grobox(ctx.box, { bloom: 0.32, contact: false });
      ctx.core = g(low.contents);
      GB.MoldCore(ctx.core);
      ctx.free = g(ctx.table); // box moves here once it is clear of the mould
      ctx.plate = g(ctx.table);
      GB.MoldPlate(ctx.plate);
      ctx.lid = g(ctx.table);
      GB.GroboxLid(ctx.lid, { bloom: 0.32 });
    },
    update(t, ctx) {
      // ---- 0–1.3: mould slides off the rack (close-up)
      const onRack = t < 1.35;
      GB.show(ctx.rackLayer, onRack ? 1 : 0);
      GB.show(ctx.table, onRack ? 0 : 1);
      if (onRack) {
        const rw = ctx.rw, slot = rw.rack.slots[4];
        const p = seg(t, 0.2, 1.3, 'in');
        GB.place(rw.rack.molds[4], slot.x + p * 1100, slot.y, 0, GB.RACK.moldScale, 1);
        GB.camera(rw.world, slot.x - 40, slot.y + 70, 2.35);
        rw.flow.update(t, 0);
        return;
      }
      // ---- table: mould enters from the left (continuing the motion)
      const enter = seg(t, 1.35, 2.3, 'out');
      const bm = GB.boil('mold9', enter < 1 ? 1 : 0.4);
      const mx = X - (1 - enter) * 1300;
      // lower mould moves away later
      const away = seg(t, 6.3, 7.2, 'in');
      GB.place(ctx.lowerG, mx + bm.x - away * 0, Y + bm.y + away * 900, 0, S, 1 - seg(t, 7.0, 7.2));

      // plate: on top → lifts off and leaves upward
      const pl = seg(t, 2.6, 3.7, 'inOut');
      GB.place(ctx.plate, mx + bm.x, Y - 30 * S - pl * 900 + bm.y, 0, S, pl < 1 ? 1 : 0);
      // core: lifts out after the plate
      const cl = seg(t, 3.8, 4.9, 'inOut');
      ctx.core.setAttribute('transform', `translate(0,${(-cl * 1300).toFixed(1)})`);
      GB.show(ctx.core, cl < 1 ? 1 : 0);
      // box: raised clear, mould leaves, box set down on the table
      const raise = seg(t, 5.1, 6.1, 'inOut');
      const lower = seg(t, 7.2, 8.0, 'out');
      const clear = raise >= 1;
      const boxLift = raise * 360 - lower * 360;
      if (clear) {
        if (ctx.box.parentNode !== ctx.free) ctx.free.appendChild(ctx.box);
        const slide = seg(t, 8.4, 9.4, 'inOut');
        GB.place(ctx.box, X - slide * 260, Y - boxLift / 1 * S, 0, S, 1);
      } else {
        if (ctx.box.parentNode !== ctx.low.contents) ctx.low.contents.insertBefore(ctx.box, ctx.core);
        ctx.box.setAttribute('transform', `translate(0,${(-boxLift).toFixed(1)})`);
        ctx.box.removeAttribute('display');
      }
      // lid slides in beside the box
      const lidIn = seg(t, 8.6, 9.7, 'out');
      const lb = GB.boil('lid9', lidIn < 1 ? 1 : 0.3);
      GB.place(ctx.lid, X + 330 + (1 - lidIn) * 900 + lb.x, Y + 120 + lb.y, 0, S * 0.9, lidIn > 0 ? 1 : 0);
    }
  });
})();
