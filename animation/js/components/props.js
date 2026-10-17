/* =============================================================================
   Props — trays, chambers, sieve, spawn container, paddle, spray bottle,
   blade, pallet, truck, ship, map, compost tray, sprout, drops.
   All paper-cut, three-quarter tabletop or simple side views.
   ========================================================================== */
(function () {
  const { el, g, rrPath, bandPath, polyPath, smoothPath, rng, K } = GB;

  // ------------------------------------------------------------------ tray
  /** Shallow process tray. .setFill(patternKey, level) */
  GB.Tray = function (parent, o) {
    o = Object.assign({ w: 560, d: 230, h: 56, rx: 18, wall: 16, fill: 'p-hurds', level: 0.75 }, o || {});
    const v = GB.vessel(parent, { w: o.w, d: o.d, h: o.h, rx: o.rx, wall: o.wall, floorH: 10, mat: 'tray', contact: o.contact });
    const fill = el('path', { d: v.levelPath(o.level), style: `fill:url(#${o.fill})` }, v.fill);
    const fill2 = el('path', { d: v.levelPath(o.level), style: 'fill:url(#p-mix);opacity:0' }, v.fill);
    v.setFill = function (pat, level, mixOpacity) {
      fill.setAttribute('d', v.levelPath(level));
      fill2.setAttribute('d', v.levelPath(level));
      if (pat) fill.setAttribute('style', `fill:url(#${pat})`);
      if (mixOpacity !== undefined) fill2.style.opacity = mixOpacity;
    };
    v.fillEl = fill;
    return v;
  };

  // --------------------------------------------------------------- chamber
  /**
   * Treatment chamber (front view with a sliver of top). Origin = centre of the
   * opening's floor line. Returns { g, inside (clipped), door, glow, shelf }.
   */
  GB.Chamber = function (parent, o) {
    o = Object.assign({ w: 820, h: 520, top: 70, frame: 46, wire: false }, o || {});
    const W = o.w, Hh = o.h, F = o.frame;
    const x = -W / 2, y = -Hh + 40;
    const grp = g(parent);
    const body = g(grp, { filter: 'url(#f-lift)' });
    // legs
    GB.PaperShape(body, `M${x + 40},${y + Hh}h34v44h-34z M${x + W - 74},${y + Hh}h34v44h-34z`, '@grey-dark');
    // top (receding)
    GB.PaperShape(body, polyPath([[x, y], [x + 50, y - o.top], [x + W - 50, y - o.top], [x + W, y]]), '#b3b5b6');
    // front frame
    const oy = y + F, oh = Hh - 2 * F, ox = x + F, ow = W - 2 * F;
    const front = `M${x},${y}H${x + W}V${y + Hh}H${x}Z` + `M${ox},${oy}V${oy + oh}H${ox + ow}V${oy}Z`;
    // interior
    const inner = g(grp);
    el('path', { d: `M${ox},${oy}h${ow}v${oh}h${-ow}z`, style: 'fill:#4a4b4c' }, inner);
    el('path', { d: polyPath([[ox + 60, oy + 50], [ox + ow - 60, oy + 50], [ox + ow - 60, oy + oh - 40], [ox + 60, oy + oh - 40]]), style: 'fill:#5c5e60' }, inner);
    el('path', { d: polyPath([[ox, oy + oh], [ox + 60, oy + oh - 40], [ox + ow - 60, oy + oh - 40], [ox + ow, oy + oh]]), style: 'fill:#6b6d6f' }, inner);
    const glow = el('rect', { x: ox, y: oy, width: ow, height: oh, style: 'fill:url(#g-glow-warm)', opacity: 0 }, inner);
    const glowTint = el('rect', { x: ox, y: oy, width: ow, height: oh, style: 'fill:#f2a964;mix-blend-mode:soft-light', opacity: 0 }, inner);
    const insideClip = GB.makeClip(grp, `M${ox},${oy}h${ow}v${oh}h${-ow}z`);
    const inside = g(grp, { 'clip-path': insideClip });
    const insideFx = g(grp, { 'clip-path': insideClip });
    let shelf = null;
    if (o.wire) {
      shelf = g(inside);
      const sy = oy + oh * 0.62;
      for (let i = 0; i <= 14; i++) GB.line(shelf, `M${ox + 50 + i * (ow - 100) / 14},${sy - 26}L${ox + 30 + i * (ow - 60) / 14},${sy + 10}`, '#9fa2a4', 3);
      GB.line(shelf, `M${ox + 50},${sy - 26}H${ox + ow - 50}M${ox + 30},${sy + 10}H${ox + ow - 30}`, '#b5b8ba', 4);
    }
    const fr = g(grp, { filter: 'url(#f-paper)' });
    GB.PaperShape(fr, front, '@grey', { textureOpacity: 0.5 });
    el('path', { d: `M${ox},${oy}V${oy + oh}H${ox + ow}V${oy}Z`, style: 'fill:none;stroke:#7d8083;stroke-width:5' }, fr);
    // indicator
    const lamp = el('circle', { cx: x + W - 30, cy: y + 24, r: 9, style: 'fill:#7d8083' }, fr);
    // door (slides down from the top)
    const doorClip = GB.makeClip(grp, `M${ox - 4},${oy - 4}h${ow + 8}v${oh + 8}h${-ow - 8}z`);
    const doorWrap = g(grp, { 'clip-path': doorClip });
    const door = g(doorWrap, { filter: 'url(#f-paper)' });
    GB.PaperShape(door, `M${ox - 4},${oy - 4}h${ow + 8}v${oh + 8}h${-ow - 8}z`, '#a8aaac');
    GB.path(door, rrPath(-60, oy + 30, 120, 16, 8, 8), '#8a8d90');
    for (let i = 1; i < 4; i++) GB.line(door, `M${ox + 20},${oy + (oh * i) / 4}H${ox + ow - 20}`, 'rgba(80,80,80,.18)', 3);
    grp.inside = inside; grp.insideFx = insideFx; grp.door = door; grp.glow = glow; grp.glowTint = glowTint; grp.lamp = lamp; grp.shelf = shelf;
    grp.geom = { ox, oy, ow, oh, x, y, W, H: Hh };
    grp.setDoor = function (p) { // 0 open, 1 closed
      door.setAttribute('transform', `translate(0,${((1 - p) * -(oh + 20)).toFixed(1)})`);
      GB.show(door, p > 0.001 ? 1 : 0);
    };
    grp.setHeat = function (p) {
      glow.setAttribute('opacity', p.toFixed(3));
      glowTint.setAttribute('opacity', (p * 0.6).toFixed(3));
      lamp.setAttribute('style', `fill:${p > 0.05 ? '#e9945a' : '#7d8083'}`);
    };
    grp.setDoor(0); grp.setHeat(0);
    return grp;
  };

  // ----------------------------------------------------------------- sieve
  GB.Sieve = function (parent, o) {
    o = Object.assign({ r: 170 }, o || {});
    const R = o.r, ry = R * 0.5;
    const grp = g(parent, { filter: 'url(#f-lift)' });
    // handle
    GB.PaperShape(grp, `M${R - 6},-14 L${R + 230},-24 Q${R + 252},-12 ${R + 230},4 L${R - 6},10Z`, '@kraft');
    // rim back
    el('ellipse', { cx: 0, cy: 0, rx: R, ry, style: 'fill:#9a9c9e' }, grp);
    // mesh
    const id = 'mesh-pat';
    if (!document.getElementById(id)) {
      const p = el('pattern', { id, patternUnits: 'userSpaceOnUse', width: 12, height: 12 }, GB.defs);
      el('path', { d: 'M0,0H12M0,0V12', style: 'stroke:#6e7174;stroke-width:2.2;fill:none' }, p);
    }
    el('ellipse', { cx: 0, cy: 6, rx: R - 12, ry: ry - 8, style: 'fill:#d9d6cf' }, grp);
    el('ellipse', { cx: 0, cy: 6, rx: R - 12, ry: ry - 8, style: `fill:url(#${id});opacity:.8` }, grp);
    const contents = g(grp);
    // front rim
    el('path', { d: `M${-R},0 A${R},${ry} 0 0 0 ${R},0 L${R},16 A${R},${ry} 0 0 1 ${-R},16Z`, style: 'fill:#a7a9ab' }, grp);
    el('path', { d: `M${-R},0 A${R},${ry} 0 0 0 ${R},0`, style: 'fill:none;stroke:#c3c5c6;stroke-width:5' }, grp);
    grp.contents = contents;
    return grp;
  };

  // -------------------------------------------------------- spawn container
  /** Round paper tub of white mycelium spawn. */
  GB.SpawnTub = function (parent, o) {
    o = Object.assign({ w: 240, h: 170 }, o || {});
    const v = GB.vessel(parent, { w: o.w, d: o.w * 0.42, h: o.h, rx: o.w / 2, ry: o.w * 0.21, wall: 10, floorH: 30, mat: { top: '#f3efe6', band: 'g-band-white', inner: '#dcd6ca', floor: '#e6e1d6', tex: 'p-fibre', texOp: 0.4, edge: '#fff' } });
    const r = rng(77);
    const lv = v.levelPath(0.86);
    el('path', { d: lv, style: 'fill:#f6f3ec' }, v.fill);
    const gr = g(v.fill, { filter: 'url(#f-thread)' });
    const ge = v.geom;
    for (let i = 0; i < 90; i++) {
      const x = ge.ix + 10 + r() * (ge.iw - 20), y = ge.iy + ge.depth * 0.14 + 4 + r() * (ge.id - 10);
      GB.path(gr, smoothPath(GB.blobPoints(x, y, 4 + r() * 3, 3 + r() * 2, 7, 0.5, r), true), '@mycelium');
    }
    // label band
    GB.path(v, `M${-o.w / 2 + 2},${o.w * 0.21 + 40}Q0,${o.w * 0.21 + 40 + o.w * 0.21} ${o.w / 2 - 2},${o.w * 0.21 + 40}V${o.w * 0.21 + 80}Q0,${o.w * 0.21 + 80 + o.w * 0.21} ${-o.w / 2 + 2},${o.w * 0.21 + 80}Z`, '@hemp-pale');
    return v;
  };

  /** Wooden paper paddle (top-down), blade at origin, handle toward +x. */
  GB.Paddle = function (parent) {
    const grp = g(parent, { filter: 'url(#f-lift)' });
    GB.PaperShape(grp, 'M60,-12 L360,-16 Q380,0 360,16 L60,12Z', '@kraft-light');
    GB.PaperShape(grp, 'M-70,-38 Q-90,0 -70,38 L40,30 Q70,0 40,-30Z', '@kraft-light');
    GB.line(grp, 'M-60,0L340,0', 'rgba(120,85,45,.35)', 2);
    return grp;
  };

  /** Chopping blade (cut-paper cleaver), cutting edge at y=0 along x. */
  GB.Blade = function (parent) {
    const grp = g(parent, { filter: 'url(#f-lift)' });
    GB.PaperShape(grp, 'M-120,0 L120,0 L130,-190 L-110,-200Z', '#b8bbbd');
    GB.path(grp, 'M-120,0 L120,0 L122,-22 L-118,-24Z', '#d8dadb');
    GB.PaperShape(grp, 'M-30,-196 L30,-198 L26,-330 Q0,-344 -26,-330Z', '@kraft-dark');
    return grp;
  };

  // ----------------------------------------------------------- spray bottle
  GB.SprayBottle = function (parent) {
    const grp = g(parent, { filter: 'url(#f-lift)' });
    GB.PaperShape(grp, 'M-70,40 Q-74,0 -50,-20 L50,-20 Q74,0 70,40 L70,300 Q70,320 50,320 L-50,320 Q-70,320 -70,300Z', '#f1efea');
    GB.path(grp, 'M-70,140 H70 V230 H-70Z', '@hemp-pale', { opacity: 0.9 });
    GB.PaperShape(grp, 'M-26,-20 L26,-20 L26,-60 L-26,-60Z', '#e2ddd3');
    // trigger head
    GB.PaperShape(grp, 'M-40,-60 L50,-60 Q70,-60 70,-90 L70,-110 L-90,-110 Q-110,-108 -112,-92 L-112,-80 L-40,-80Z', '#4e6a55');
    GB.PaperShape(grp, 'M10,-62 Q20,-20 0,10 L-14,4 Q4,-24 -6,-60Z', '#425b48');
    GB.path(grp, 'M-112,-98 h-14 v12 h14z', '#3b4e40');
    grp.nozzle = { x: -126, y: -92 };
    return grp;
  };

  // ------------------------------------------------------------ logistics
  GB.Pallet = function (parent, o) {
    o = Object.assign({ w: 640, d: 150 }, o || {});
    const grp = g(parent, { filter: 'url(#f-paper)' });
    const x = -o.w / 2, y = -o.d / 2;
    GB.PaperShadow(grp, 0, y + o.d + 50, o.w * 0.55, 30, 0.8);
    // front band with blocks
    GB.PaperShape(grp, `M${x},${y + o.d}h${o.w}v14h${-o.w}z`, '@kraft');
    for (const bx of [x, x + o.w / 2 - 30, x + o.w - 60]) GB.PaperShape(grp, `M${bx},${y + o.d + 14}h60v30h-60z`, '@kraft-dark');
    GB.PaperShape(grp, `M${x},${y + o.d + 44}h${o.w}v14h${-o.w}z`, '@kraft');
    // deck boards
    for (let i = 0; i < 5; i++) {
      const by = y + (i * o.d) / 5;
      GB.PaperShape(grp, `M${x + 4},${by + 3}h${o.w - 8}v${o.d / 5 - 6}h${-o.w + 8}z`, i % 2 ? '@kraft-light' : '#d9b98d');
    }
    return grp;
  };

  /** Refrigerated truck, side view, facing left. Origin = ground under the middle. */
  GB.Truck = function (parent) {
    const grp = g(parent, { filter: 'url(#f-lift)' });
    // box
    GB.PaperShape(grp, rrPath(-260, -380, 640, 320, 12, 12), '#f4f2ec');
    GB.path(grp, 'M-260,-140 H380 V-110 H-260Z', '@ocean');
    // snowflake icon
    const sf = g(grp, { transform: 'translate(60,-260)' });
    for (let i = 0; i < 3; i++) GB.line(sf, 'M0,-46V46M-12,-34L0,-22L12,-34M-12,34L0,22L12,34', '@ocean-dark', 7, { transform: `rotate(${i * 60})` });
    // reefer unit
    GB.PaperShape(grp, 'M-260,-370 h-34 v120 h34z', '#c9cbcc');
    // cab
    GB.PaperShape(grp, 'M-286,-60 L-286,-250 L-400,-250 Q-440,-246 -460,-190 L-480,-120 L-480,-60Z', '@ocean-dark');
    GB.path(grp, 'M-310,-236 L-392,-236 Q-420,-230 -436,-180 L-440,-170 L-310,-170Z', '#dfe8eb');
    // chassis + wheels
    GB.PaperShape(grp, 'M-480,-62 H380 V-36 H-480Z', '#5a5d60');
    for (const wx of [-390, 200, 300]) {
      el('circle', { cx: wx, cy: -24, r: 44, style: 'fill:#3f4245' }, grp);
      el('circle', { cx: wx, cy: -24, r: 18, style: 'fill:#9a9c9e' }, grp);
    }
    return grp;
  };

  /** Small cargo ship (side view) facing right. */
  GB.CargoShip = function (parent, o) {
    o = Object.assign({ scale: 1 }, o || {});
    const grp = g(parent, { filter: 'url(#f-paper)', transform: `scale(${o.scale})` });
    const cols = ['@ocean', '@red', '@kraft', '@hemp', '#d9d4c7'];
    for (let i = 0; i < 6; i++) GB.path(grp, rrPath(-90 + i * 30, -66 - (i % 2) * 22, 28, 22 + (i % 2) * 22, 2, 2), cols[i % cols.length]);
    GB.PaperShape(grp, 'M-130,-22 L130,-22 L110,10 L-112,10Z', '#55595d');
    GB.path(grp, 'M-125,-14 L126,-14 L122,-8 L-120,-8Z', '@red');
    GB.PaperShape(grp, 'M-126,-80 h30 v58 h-30z', '#eeeae2');
    return grp;
  };

  /** Simple fishing boat (side view) facing left. Origin = waterline centre. */
  GB.FishingBoat = function (parent) {
    const grp = g(parent, { filter: 'url(#f-paper)' });
    GB.line(grp, 'M-40,-60 L-40,-250 M90,-60 L90,-210 M-40,-230 L-150,-60 M-40,-230 L90,-200 M90,-190 L170,-60', '#7b6a55', 4);
    GB.PaperShape(grp, 'M-40,-60 h-110 v-74 h110z', '#f4f2ec');
    GB.path(grp, 'M-138,-120 h24 v22 h-24z M-104,-120 h24 v22 h-24z', '#7fa0b0');
    GB.PaperShape(grp, 'M-160,-62 h-20 v-90 h20z', '#e7e3da');
    GB.PaperShape(grp, 'M-230,-60 L230,-60 L190,20 L-200,20Z', '#f4f2ec');
    GB.path(grp, 'M-214,-6 L214,-6 L196,18 L-200,18Z', '@red');
    el('circle', { cx: 60, cy: -32, r: 14, style: 'fill:#e3713f' }, grp);
    el('circle', { cx: 120, cy: -32, r: 14, style: 'fill:#e3713f' }, grp);
    return grp;
  };

  /** Simplified Iceland outline in a ~400×250 box (top-left origin). */
  GB.ICELAND = [[20, 62], [42, 32], [72, 26], [62, 52], [96, 36], [112, 56], [102, 76], [136, 70], [150, 42], [176, 32], [200, 46], [216, 26], [246, 32], [266, 20], [292, 36], [322, 30], [346, 50], [372, 62], [386, 86], [376, 110], [392, 136], [372, 160], [350, 186], [320, 206], [280, 224], [240, 234], [200, 240], [160, 232], [120, 222], [96, 214], [70, 204], [86, 190], [60, 184], [76, 170], [44, 158], [72, 150], [102, 140], [82, 126], [40, 120], [34, 104], [70, 100], [50, 86], [18, 90], [30, 76]];

  // ------------------------------------------------------------ end of life
  GB.Sprout = function (parent) {
    const grp = g(parent, { filter: 'url(#f-paper)' });
    const stem = GB.line(grp, 'M0,0 C2,-30 -4,-60 0,-90', '@hemp-dark', 7);
    const l1 = g(grp, { transform: 'translate(0,-84)' });
    GB.PaperShape(l1, 'M0,0 C-20,-36 -70,-40 -86,-18 C-60,4 -24,10 0,0Z', '@hemp-mid', { textureOpacity: 0.4 });
    const l2 = g(grp, { transform: 'translate(0,-88)' });
    GB.PaperShape(l2, 'M0,0 C22,-40 76,-46 92,-22 C64,4 26,10 0,0Z', '@hemp', { textureOpacity: 0.4 });
    grp.stem = stem; grp.l1 = l1; grp.l2 = l2;
    grp.setGrow = function (p) {
      const s1 = GB.clamp(p / 0.5), s2 = GB.clamp((p - 0.35) / 0.65);
      grp.setAttribute('transform', grp.base + ` scale(${Math.max(0.001, GB.lerp(0.2, 1, s1)).toFixed(3)})`);
      l1.setAttribute('transform', `translate(0,-84) scale(${Math.max(0.001, s2).toFixed(3)})`);
      l2.setAttribute('transform', `translate(0,-88) scale(${Math.max(0.001, s2).toFixed(3)})`);
      GB.show(grp, s1 > 0.001 ? 1 : 0);
    };
    grp.base = '';
    return grp;
  };

  GB.Drop = function (parent, o) {
    o = Object.assign({ size: 40 }, o || {});
    const s = o.size;
    const grp = g(parent, { filter: 'url(#f-paper)' });
    GB.PaperShape(grp, `M0,${-s} C${s * 0.15},${-s * 0.6} ${s * 0.55},${-s * 0.15} ${s * 0.55},${s * 0.2} A${s * 0.55},${s * 0.55} 0 0 1 ${-s * 0.55},${s * 0.2} C${-s * 0.55},${-s * 0.15} ${-s * 0.15},${-s * 0.6} 0,${-s}Z`, '@ocean-light', { textureOpacity: 0.35 });
    return grp;
  };
})();
