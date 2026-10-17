/* =============================================================================
   Rack — vertical growing rack: grey uprights, kraft shelves, closed moulds.
   Layout is in world coordinates; `slots[i]` gives the world position of the
   top-face centre of the mould sitting in slot i (row-major, top shelf first).
   ========================================================================== */
(function () {
  const { el, g, rrPath, bandPath } = GB;

  GB.RACK = {
    cols: 3, rows: 4,
    moldScale: 0.3,
    colGap: 340,      // centre-to-centre
    rowGap: 252,
    width: 1100,
    shelfDepth: 70,   // foreshortened top face of a shelf
    shelfThick: 20
  };

  /**
   * GB.Rack(parent, { x, y (top-left of the frame), filled: fn(i) → bool })
   * Returns { g, slots[], molds[], shelves[] }.
   */
  GB.Rack = function (parent, o) {
    const R = Object.assign({}, GB.RACK, o || {});
    const x0 = R.x === undefined ? 410 : R.x, y0 = R.y === undefined ? 20 : R.y;
    const H = R.rows * R.rowGap + 60;
    const grp = g(parent);
    const back = g(grp, { filter: 'url(#f-paper)' });
    const front = g(grp, { filter: 'url(#f-paper)' });

    // uprights (back pair, slightly lighter and offset up to suggest depth)
    const upW = 26;
    for (const ux of [x0 + 14, x0 + R.width - 14 - upW]) {
      GB.PaperShape(back, rrPath(ux + 18, y0 - 26, upW, H + 6, 4, 4), '#a9abac');
    }
    const shelves = [], slots = [], molds = [];
    const moldLayer = g(grp, { filter: 'url(#f-paper)' });
    for (let r = 0; r < R.rows; r++) {
      const sy = y0 + (r + 1) * R.rowGap; // shelf top-face front edge y
      const top = rrPath(x0, sy - R.shelfDepth, R.width, R.shelfDepth, 6, 4);
      const sh = g(back);
      GB.PaperShape(sh, top, '@kraft-light');
      GB.PaperShape(sh, bandPath(x0, sy - R.shelfDepth, R.width, R.shelfDepth, R.shelfThick, 6, 4), '@kraft');
      shelves.push(sh);
      for (let c = 0; c < R.cols; c++) {
        const cx = x0 + R.width / 2 + (c - (R.cols - 1) / 2) * R.colGap;
        // mould sits on the shelf: its plate top-face centre is above the shelf
        const s = R.moldScale;
        const mh = (GB.BOX.h + 36 + 30) * s;
        const my = sy - R.shelfDepth * 0.42 - mh - (GB.BOX.d + 2 * GB.MOLD_MARGIN * GB.K) * s * 0.5;
        slots.push({ x: cx, y: my, row: r, col: c, shelfY: sy });
      }
    }
    // front uprights
    for (const ux of [x0 - 6, x0 + R.width - upW + 6]) {
      GB.PaperShape(front, rrPath(ux, y0, upW, H, 4, 4), '@grey');
    }
    // moulds (drawn between back structure and front uprights)
    grp.insertBefore(moldLayer, front);
    slots.forEach((s, i) => {
      const m = g(moldLayer, { transform: GB.tf(s.x, s.y, 0, R.moldScale) });
      GB.MoldClosed(m, { filter: false, contact: true });
      if (R.filled && !R.filled(i)) m.setAttribute('display', 'none');
      molds.push(m);
    });
    return { g: grp, slots, molds, shelves, moldLayer, frontLayer: front, x0, y0, width: R.width, height: H, R };
  };
})();
