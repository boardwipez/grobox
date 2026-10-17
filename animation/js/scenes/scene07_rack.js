/* =============================================================================
   SCENE 7 — VERTICAL RACK
   A closed grey mould slides onto a shelf; the camera pulls back to reveal
   the full rack (3 moulds × 4 shelves) with airflow space around each mould.
   ========================================================================== */
(function () {
  const { g, seg } = GB;

  /** Shared rack "world" (used by scenes 7, 8 and 9). */
  GB.RackWorld = function (root, o) {
    o = o || {};
    const world = g(root);
    // neighbouring racks (suggest a larger growing room)
    const nb = [];
    for (const dx of [-1210, 1210]) {
      const ng = g(world);
      GB.Rack(ng, { x: 410 + dx });
      nb.push(ng);
    }
    const rack = GB.Rack(world, { x: 410 });
    // ventilation ribbons in the gaps between the moulds
    const air = g(world);
    const specs = [];
    const topOff = (GB.BOX.d + 2 * GB.MOLD_MARGIN * GB.K) * GB.RACK.moldScale * 0.5;
    rack.slots.forEach((sl, i) => {
      if (sl.col < 2) specs.push({ x: sl.x + 170, y: sl.y - 10, len: 110, amp: 6, waves: 1, thick: 5, color: '@cool', travel: 60, speed: 18, filter: false, rot: 90 });
      if (i % 2 === 0) specs.push({ x: sl.x - 90, y: sl.y - topOff - 14, len: 180, amp: 4, waves: 1.2, thick: 5, color: '@cool', travel: 120, speed: 30, filter: false });
    });
    const flow = GB.AirflowField(air, specs);
    return { world, rack, flow, centre: { x: 960, y: 540 } };
  };

  GB.scene('rack', {
    design: 10,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      const rw = GB.RackWorld(root);
      ctx.rw = rw;
      ctx.target = 4; // middle-ish slot: row 1, col 1
    },
    update(t, ctx) {
      const { rw } = ctx;
      const slot = rw.rack.slots[ctx.target];
      const mold = rw.rack.molds[ctx.target];
      // 1) the mould slides in horizontally from the right
      const pIn = seg(t, 0.2, 2.6, 'out');
      const b = GB.boil('rack-mold', pIn < 1 && pIn > 0 ? 1 : 0.4);
      GB.place(mold, slot.x + (1 - pIn) * 1100 + b.x, slot.y + b.y, b.r, GB.RACK.moldScale, 1);
      // 2) camera: close on the slot → pull back to the full rack
      const pc = seg(t, 2.9, 7.6, 'inOut');
      const s = GB.lerp(2.35, 0.94, pc);
      const cx = GB.lerp(slot.x - 40, 960, pc), cy = GB.lerp(slot.y + 70, 548, pc);
      GB.camera(rw.world, cx, cy, s);
      // 3) gentle airflow appears once the rack is revealed
      rw.flow.update(t, seg(t, 5.5, 7.5) * 0.85);
    }
  });
})();
