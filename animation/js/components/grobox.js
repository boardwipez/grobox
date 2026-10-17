/* =============================================================================
   Grobox — moulded hemp/mycelium seafood box (and the generic extrusions that
   the moulds, trays and EPS box share).

   Projection: three-quarter tabletop view. A rounded rectangle lying on the
   table is drawn with its top face foreshortened (K = 0.42) and its front
   face as a vertical band. All components are centred on the top face.
   ========================================================================== */
(function () {
  const { el, g, rrPath, bandPath } = GB;
  const K = 0.42;
  GB.K = K;

  let clipN = 0;
  function clip(parent, d) {
    const id = 'clip' + (++clipN);
    const cp = el('clipPath', { id }, GB.defs);
    el('path', { d }, cp);
    return `url(#${id})`;
  }
  GB.makeClip = clip;

  const MATERIALS = {
    grobox: { top: '@beige', band: 'g-band-beige', inner: '#c9b088', floor: '#d6c19a', tex: 'p-grobox', texOp: 0.9, edge: '#f1e6cf' },
    eps: { top: '#f8f8f5', band: 'g-band-white', inner: '#dfdfdb', floor: '#ececE8', tex: 'p-eps', texOp: 0.9, edge: '#ffffff' },
    grey: { top: '@grey-light', band: 'g-band-grey', inner: '#85888a', floor: '#9a9d9f', tex: 'p-fibre', texOp: 0.5, edge: '#c9cbcc' },
    tray: { top: '#c5c7c6', band: 'g-band-grey', inner: '#a4a6a7', floor: '#b4b6b6', tex: 'p-fibre', texOp: 0.5, edge: '#dadcdb' },
    kraft: { top: '@kraft-light', band: 'g-band-beige', inner: '#a98457', floor: '#b8946a', tex: 'p-fibre', texOp: 0.6, edge: '#e3c99f' }
  };
  GB.MATERIALS = MATERIALS;

  function texLayer(parent, d, mat, op) {
    if (!mat.tex) return null;
    return el('path', { d, style: `fill:url(#${mat.tex});opacity:${op === undefined ? mat.texOp : op}` }, parent);
  }

  /**
   * Solid rounded slab (lid, mould plate, core, closed block).
   * o: { w, d, h, rx, ry, mat, contact (bool), inset (lid step line) }
   */
  GB.solid = function (parent, o) {
    const mat = typeof o.mat === 'string' ? MATERIALS[o.mat] : (o.mat || MATERIALS.grobox);
    const w = o.w, d = o.d, h = o.h, rx = o.rx, ry = o.ry === undefined ? rx * K : o.ry;
    const x = -w / 2, y = -d / 2;
    const grp = g(parent, o.filter === false ? {} : { filter: `url(#f-${o.filter || 'paper'})` });
    if (o.contact) GB.PaperShadow(grp, 6, y + d + h - 4, w * 0.56, d * 0.3 + 10, 0.8);
    const band = bandPath(x, y, w, d, h, rx, ry);
    el('path', { d: band, style: `fill:url(#${mat.band})` }, grp);
    texLayer(grp, band, mat, mat.texOp * 0.7);
    const top = rrPath(x, y, w, d, rx, ry);
    el('path', { d: top, style: `fill:${GB.paint(mat.top)}` }, grp);
    texLayer(grp, top, mat);
    // front edge highlight (cut-paper edge catching light)
    el('path', { d: `M${x + rx},${y + d}H${x + w - rx}`, style: `fill:none;stroke:${mat.edge};stroke-width:2;opacity:.7` }, grp);
    if (o.inset) {
      const i = o.inset;
      el('path', { d: rrPath(x + i, y + i * K, w - 2 * i, d - 2 * i * K, Math.max(rx - i, 6), Math.max(rx - i, 6) * K), style: 'fill:none;stroke:rgba(90,70,40,.22);stroke-width:2' }, grp);
    }
    grp.geom = { x, y, w, d, h, rx, ry };
    return grp;
  };

  /**
   * Open vessel (Grobox body, EPS box, lower mould, trays).
   * o: { w, d, h, rx, ry, wall, wallY, floorH, innerRx, mat, contact }
   * Returns group with:
   *   .interior  (clipped to the opening — for fill surfaces)
   *   .contents  (clipped so things inside are hidden by the front rim but may
   *               rise above the opening — fish, ice, cores)
   *   .levelPath(level) → path of a fill surface (0 = floor, 1 = rim)
   *   .rim       (group drawn above contents for the front rim)
   */
  GB.vessel = function (parent, o) {
    const mat = typeof o.mat === 'string' ? MATERIALS[o.mat] : (o.mat || MATERIALS.grobox);
    const w = o.w, d = o.d, h = o.h, rx = o.rx, ry = o.ry === undefined ? rx * K : o.ry;
    const wall = o.wall, wallY = o.wallY === undefined ? wall * K : o.wallY;
    const x = -w / 2, y = -d / 2;
    const ix = x + wall, iy = y + wallY, iw = w - 2 * wall, idp = d - 2 * wallY;
    const irx = o.innerRx !== undefined ? o.innerRx : Math.max(rx - wall * 0.55, 6), iry = irx * (ry / rx || K);
    const depth = h - (o.floorH === undefined ? wall * 0.7 : o.floorH);

    const grp = g(parent, o.filter === false ? {} : { filter: `url(#f-${o.filter || 'paper'})` });
    if (o.contact !== false) GB.PaperShadow(grp, 8, y + d + h - 6, w * 0.56, d * 0.28 + 12, 0.85);
    const band = bandPath(x, y, w, d, h, rx, ry);
    el('path', { d: band, style: `fill:url(#${mat.band})` }, grp);
    texLayer(grp, band, mat, mat.texOp * 0.7);

    const outer = rrPath(x, y, w, d, rx, ry);
    const inner = rrPath(ix, iy, iw, idp, irx, iry);
    // top rim (ring)
    el('path', { d: outer + inner, 'fill-rule': 'evenodd', style: `fill:${GB.paint(mat.top)}` }, grp);
    const rt = texLayer(grp, outer + inner, mat);
    if (rt) rt.setAttribute('fill-rule', 'evenodd');
    el('path', { d: `M${x + rx},${y + d}H${x + w - rx}`, style: `fill:none;stroke:${mat.edge};stroke-width:2;opacity:.7` }, grp);

    // interior (clipped to opening)
    const interior = g(grp, { 'clip-path': clip(grp, inner) });
    el('path', { d: inner, style: `fill:${mat.inner}` }, interior);
    texLayer(interior, inner, mat, mat.texOp * 0.6);
    const floorD = rrPath(ix, iy + depth, iw, idp, irx, iry);
    const floor = el('path', { d: floorD, style: `fill:${mat.floor}` }, interior);
    texLayer(interior, floorD, mat, mat.texOp * 0.8);
    const fill = g(interior); // fill surfaces go here (above floor, below shading)
    el('rect', { x: ix, y: iy, width: iw, height: Math.min(depth * 1.1, idp + depth), style: 'fill:url(#g-inner-shade)' }, interior);

    const contents = g(grp, { 'clip-path': clip(grp, inner + `M-5000,-5000H5000V${iy + idp * 0.5}H-5000Z`) });
    const rim = g(grp);

    grp.interior = interior;
    grp.fill = fill;
    grp.floor = floor;
    grp.contents = contents;
    grp.rim = rim;
    grp.geom = { x, y, w, d, h, rx, ry, ix, iy, iw, id: idp, irx, iry, depth };
    grp.levelPath = function (level) {
      return rrPath(ix, iy + depth * (1 - level), iw, idp, irx, iry);
    };
    return grp;
  };

  // ----------------------------------------------------------- the product ---
  // Canonical Grobox proportions (screen px at scale 1).
  GB.BOX = { w: 560, d: 170, h: 185, rx: 62, wall: 48, floorH: 42 };

  /** Finished Grobox body. o.bloom = 0..1 white mycelium skin (pre-drying). */
  GB.Grobox = function (parent, o) {
    o = Object.assign({}, GB.BOX, o || {});
    const v = GB.vessel(parent, { w: o.w, d: o.d, h: o.h, rx: o.rx, wall: o.wall, floorH: o.floorH, mat: 'grobox', contact: o.contact, filter: o.filter });
    if (o.bloom !== undefined) {
      const geo = v.geom;
      const all = rrPath(geo.x, geo.y, geo.w, geo.d, geo.rx, geo.ry) + bandPath(geo.x, geo.y, geo.w, geo.d, geo.h, geo.rx, geo.ry);
      v.bloom = el('path', { d: all, style: 'fill:url(#p-mixGrown);mix-blend-mode:screen', opacity: o.bloom }, v);
      v.insertBefore(v.bloom, v.contents);
    }
    return v;
  };

  /** Matching fitted lid. */
  GB.GroboxLid = function (parent, o) {
    o = Object.assign({}, GB.BOX, { h: 40 }, o || {});
    const s = GB.solid(parent, { w: o.w, d: o.d, h: o.h, rx: o.rx, mat: 'grobox', inset: 22, contact: o.contact, filter: o.filter });
    if (o.bloom !== undefined) {
      const geo = s.geom;
      s.bloom = el('path', { d: rrPath(geo.x, geo.y, geo.w, geo.d, geo.rx, geo.ry) + bandPath(geo.x, geo.y, geo.w, geo.d, geo.h, geo.rx, geo.ry), style: 'fill:url(#p-mixGrown);mix-blend-mode:screen', opacity: o.bloom }, s);
    }
    return s;
  };

  /** Conventional white EPS fish box (problem scene). */
  GB.EpsBox = function (parent, o) {
    o = Object.assign({ w: 560, d: 220, h: 200, rx: 18, wall: 34, floorH: 30 }, o || {});
    return GB.vessel(parent, Object.assign({ mat: 'eps' }, o));
  };
})();
