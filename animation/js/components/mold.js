/* =============================================================================
   Mold — reusable grey Grobox production mould.
     • lower section with a rounded-rectangular cavity (the box's outside)
     • inner core (forms the hollow centre)
     • upper plate (closes the mould)
     • side tabs with U-notches on lower section and plate
   ========================================================================== */
(function () {
  const { el, g, rrPath, polyPath, K } = GB;

  const M = 64; // margin of grey around the cavity (screen px at scale 1)

  /** U-notched side tab drawn on the top plane at side ±1. */
  function tab(parent, side, cx, cy, reach, depth, thick, mat) {
    const x0 = cx, x1 = cx + side * reach;
    const y0 = cy - depth / 2, y1 = cy + depth / 2;
    const nw = depth * 0.34, nd = reach * 0.42; // notch
    const nx = x1 - side * nd;
    const top = [[x0, y0], [x1, y0], [x1, cy - nw / 2], [nx, cy - nw / 2], [nx, cy + nw / 2], [x1, cy + nw / 2], [x1, y1], [x0, y1]];
    const grp = g(parent);
    // front band (thickness)
    el('path', { d: polyPath([[x0, y1], [x1, y1], [x1, y1 + thick], [x0, y1 + thick]]), style: 'fill:#85888b' }, grp);
    el('path', { d: polyPath(top), style: `fill:${GB.paint(mat || '@grey-light')}` }, grp);
    el('path', { d: polyPath(top), style: 'fill:url(#p-fibre);opacity:.45' }, grp);
    // notch shadow (see-through to the band beneath)
    el('path', { d: polyPath([[nx, cy - nw / 2], [x1, cy - nw / 2], [x1, cy - nw / 2 + 5], [nx + side * 4, cy - nw / 2 + 5]]), style: 'fill:rgba(40,40,40,.25)' }, grp);
    return grp;
  }

  /**
   * Lower mould. `box` = Grobox dims (GB.BOX by default).
   * Returns vessel with interior/contents/fill + .geom.
   */
  GB.MoldLower = function (parent, o) {
    o = o || {};
    const box = Object.assign({}, GB.BOX, o.box || {});
    const W = box.w + 2 * M, D = box.d + 2 * M * K, H = box.h + 36;
    const grp = g(parent);
    const v = GB.vessel(grp, {
      w: W, d: D, h: H, rx: 16, wall: M, wallY: M * K, innerRx: box.rx, floorH: 36, mat: 'grey', contact: o.contact
    });
    // tabs, mid-depth on each side
    tab(grp, -1, -W / 2 + 2, 0, 70, D * 0.42, 20);
    tab(grp, 1, W / 2 - 2, 0, 70, D * 0.42, 20);
    grp.v = v;
    grp.interior = v.interior; grp.fill = v.fill; grp.contents = v.contents;
    grp.levelPath = v.levelPath;
    grp.geom = Object.assign({ W, D, H }, v.geom);
    return grp;
  };

  /** Upper plate (with the inner core hanging beneath it when `withCore`). */
  GB.MoldPlate = function (parent, o) {
    o = o || {};
    const box = Object.assign({}, GB.BOX, o.box || {});
    const W = box.w + 2 * M + 16, D = box.d + 2 * M * K + 8;
    const grp = g(parent);
    tab(grp, -1, -W / 2 + 2, 0, 78, D * 0.5, 16);
    tab(grp, 1, W / 2 - 2, 0, 78, D * 0.5, 16);
    const s = GB.solid(grp, { w: W, d: D, h: 30, rx: 18, mat: 'grey', filter: 'paper' });
    // handle-ish ridge to read as a plate
    el('path', { d: rrPath(-W * 0.32, -D * 0.12, W * 0.64, D * 0.24, 18, 8), style: 'fill:none;stroke:rgba(70,72,75,.28);stroke-width:3' }, s);
    grp.geom = { W, D, h: 30 };
    return grp;
  };

  /** Inner forming core: the hollow-centre geometry. */
  GB.MoldCore = function (parent, o) {
    o = o || {};
    const box = Object.assign({}, GB.BOX, o.box || {});
    const w = box.w - 2 * box.wall, d = box.d - 2 * box.wall * K, h = box.h - box.floorH;
    const s = GB.solid(parent, { w, d, h, rx: Math.max(box.rx - box.wall * 0.55, 6), mat: { top: '#a7a9ab', band: 'g-band-grey', tex: 'p-fibre', texOp: 0.45, edge: '#c3c5c6' }, filter: 'paper' });
    s.geom = { w, d, h };
    return s;
  };

  /** Closed mould — only grey is visible. Origin = centre of plate top face. */
  GB.MoldClosed = function (parent, o) {
    o = o || {};
    const box = Object.assign({}, GB.BOX, o.box || {});
    const W = box.w + 2 * M, D = box.d + 2 * M * K, H = box.h + 36;
    const grp = g(parent, o.filter === false ? {} : { filter: 'url(#f-paper)' });
    if (o.contact !== false) GB.PaperShadow(grp, 8, D / 2 + H + 24, W * 0.56, D * 0.3 + 12, 0.85);
    const low = g(grp, { transform: 'translate(0,30)' });
    tab(low, -1, -W / 2 + 2, 0, 70, D * 0.42, 20);
    tab(low, 1, W / 2 - 2, 0, 70, D * 0.42, 20);
    GB.solid(low, { w: W, d: D, h: H, rx: 16, mat: 'grey', filter: false });
    // seam line between plate and block
    const pl = g(grp);
    tab(pl, -1, -(W + 16) / 2 + 2, 0, 78, (D + 8) * 0.5, 16);
    tab(pl, 1, (W + 16) / 2 - 2, 0, 78, (D + 8) * 0.5, 16);
    const plate = GB.solid(pl, { w: W + 16, d: D + 8, h: 30, rx: 18, mat: 'grey', filter: false });
    el('path', { d: rrPath(-(W + 16) * 0.32, -(D + 8) * 0.12, (W + 16) * 0.64, (D + 8) * 0.24, 18, 8), style: 'fill:none;stroke:rgba(70,72,75,.28);stroke-width:3' }, plate);
    grp.geom = { W, D, H, total: H + 30 };
    return grp;
  };

  /** Shallow lid mould (lid is produced separately). */
  GB.LidMold = function (parent, o) {
    o = o || {};
    const lid = { w: GB.BOX.w, d: GB.BOX.d, rx: GB.BOX.rx };
    const W = lid.w + 2 * M * 0.8, D = lid.d + 2 * M * 0.8 * K, H = 74;
    const grp = g(parent);
    const v = GB.vessel(grp, { w: W, d: D, h: H, rx: 14, wall: M * 0.8, innerRx: lid.rx, floorH: 26, mat: 'grey', contact: true });
    tab(grp, -1, -W / 2 + 2, 0, 60, D * 0.42, 16);
    tab(grp, 1, W / 2 - 2, 0, 60, D * 0.42, 16);
    grp.v = v; grp.fill = v.fill; grp.levelPath = v.levelPath; grp.contents = v.contents;
    grp.geom = Object.assign({ W, D, H }, v.geom);
    return grp;
  };

  GB.LidMoldPlate = function (parent) {
    const W = GB.BOX.w + 2 * M * 0.8 + 14, D = GB.BOX.d + 2 * M * 0.8 * K + 6;
    const grp = g(parent);
    tab(grp, -1, -W / 2 + 2, 0, 66, D * 0.5, 14);
    tab(grp, 1, W / 2 - 2, 0, 66, D * 0.5, 14);
    GB.solid(grp, { w: W, d: D, h: 24, rx: 16, mat: 'grey' });
    return grp;
  };

  GB.MOLD_MARGIN = M;
})();
