/* =============================================================================
   MyceliumNetwork — procedural, deterministic hyphal growth between hemp hurds.

   The network is simulated ONCE at build time (seeded), producing a set of
   thread paths with birth/finish times. update(p) then reveals threads for
   growth progress p ∈ [0,1] via stroke-dashoffset, so any moment can be shown
   instantly (scrubbing, frame export).

   Rules (kept simple and readable on screen):
     • tips walk with a slight random wobble and branch now and then
     • a tip that meets a hemp chip turns to slide along its edge (wrapping)
     • some tips cross over chips (drawn on top) — threads wrapping fibres
     • crowded areas stop growth so the network fills evenly
     • extra "bridge" strands tie neighbouring chips together
     • late in growth, a fine felt of short threads densifies the gaps
   ========================================================================== */
(function () {
  const { el, g, rng, smoothPath, polyPath } = GB;

  // ------------------------------------------------------------ chip packing
  function segDist(ax, ay, bx, by, cx, cy, dx, dy) {
    // distance between segments AB and CD (sampled — good enough for packing)
    let best = Infinity;
    for (let i = 0; i <= 6; i++) {
      const t = i / 6, px = ax + (bx - ax) * t, py = ay + (by - ay) * t;
      const vx = dx - cx, vy = dy - cy, L = vx * vx + vy * vy || 1;
      const u = Math.max(0, Math.min(1, ((px - cx) * vx + (py - cy) * vy) / L));
      const qx = cx + vx * u, qy = cy + vy * u;
      best = Math.min(best, Math.hypot(px - qx, py - qy));
    }
    return best;
  }

  /** Pack irregular hurd chips into bounds. Returns [{x,y,rot,len,wid,pts(world)}]. */
  GB.packChips = function (b, o) {
    o = Object.assign({ n: 60, len: [120, 270], wid: [34, 70], gap: 16, seed: 21, tries: 4000 }, o || {});
    const r = rng(o.seed);
    const chips = [];
    for (let t = 0; t < o.tries && chips.length < o.n; t++) {
      const len = o.len[0] + r() * (o.len[1] - o.len[0]);
      const wid = o.wid[0] + r() * (o.wid[1] - o.wid[0]);
      const x = b.x + r() * b.w, y = b.y + r() * b.h, rot = r() * Math.PI;
      const ca = Math.cos(rot), sa = Math.sin(rot);
      const ax = x - ca * len * 0.42, ay = y - sa * len * 0.42, bx = x + ca * len * 0.42, by = y + sa * len * 0.42;
      let ok = true;
      for (const c of chips) {
        if (Math.hypot(c.x - x, c.y - y) > (c.len + len) * 0.6 + 40) continue;
        if (segDist(ax, ay, bx, by, c.ax, c.ay, c.bx, c.by) < (wid + c.wid) / 2 + o.gap) { ok = false; break; }
      }
      if (!ok) continue;
      const lr = rng(o.seed * 7919 + chips.length);
      const local = GB.hurdPoints(len, wid, lr);
      const pts = local.map(([px, py]) => [x + px * ca - py * sa, y + px * sa + py * ca]);
      chips.push({ x, y, rot: rot * 180 / Math.PI, len, wid, ax, ay, bx, by, pts, local, seed: o.seed * 7919 + chips.length });
    }
    return chips;
  };

  function pointInPoly(x, y, pts) {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (((yi > y) !== (yj > y)) && (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }

  // ------------------------------------------------------------- simulation
  function simulate(b, chips, o) {
    const r = rng(o.seed);
    const CS = 5; // occupancy cell
    const gw = Math.ceil(b.w / CS) + 2, gh = Math.ceil(b.h / CS) + 2;
    const occ = new Int16Array(gw * gh).fill(-1);
    chips.forEach((c, ci) => {
      let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity;
      for (const [px, py] of c.pts) { minx = Math.min(minx, px); maxx = Math.max(maxx, px); miny = Math.min(miny, py); maxy = Math.max(maxy, py); }
      for (let gx = Math.floor((minx - b.x) / CS); gx <= Math.ceil((maxx - b.x) / CS); gx++) {
        for (let gy = Math.floor((miny - b.y) / CS); gy <= Math.ceil((maxy - b.y) / CS); gy++) {
          if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) continue;
          if (pointInPoly(b.x + gx * CS + CS / 2, b.y + gy * CS + CS / 2, c.pts)) occ[gy * gw + gx] = ci;
        }
      }
    });
    const chipAt = (x, y) => {
      const gx = Math.floor((x - b.x) / CS), gy = Math.floor((y - b.y) / CS);
      if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) return -2;
      return occ[gy * gw + gx];
    };
    const DS = 16;
    const dw = Math.ceil(b.w / DS) + 1, dh = Math.ceil(b.h / DS) + 1;
    const dens = new Uint8Array(dw * dh);
    const densAt = (x, y) => {
      const gx = Math.floor((x - b.x) / DS), gy = Math.floor((y - b.y) / DS);
      if (gx < 0 || gy < 0 || gx >= dw || gy >= dh) return 255;
      return dens[gy * dw + gx];
    };
    const densAdd = (x, y) => {
      const gx = Math.floor((x - b.x) / DS), gy = Math.floor((y - b.y) / DS);
      if (gx >= 0 && gy >= 0 && gx < dw && gy < dh && dens[gy * dw + gx] < 250) dens[gy * dw + gx]++;
    };

    // seeds: inoculum granules in the gaps
    const seeds = [];
    for (let t = 0; t < 4000 && seeds.length < o.seeds; t++) {
      const x = b.x + 30 + r() * (b.w - 60), y = b.y + 30 + r() * (b.h - 60);
      if (chipAt(x, y) !== -1) continue;
      if (seeds.some((s) => Math.hypot(s[0] - x, s[1] - y) < o.seedSpacing)) continue;
      seeds.push([x, y]);
    }

    const STEP = o.step;
    const tips = [];
    const done = [];
    seeds.forEach((s, si) => {
      const n = 3 + Math.floor(r() * 3);
      for (let k = 0; k < n; k++) {
        tips.push({ x: s[0], y: s[1], a: (k / n) * Math.PI * 2 + r() * 0.8, pts: [[s[0], s[1]]], t0: Math.floor(r() * 6), gen: 0, surface: false, life: 40 + r() * 70, turn: r() < 0.5 ? 1 : -1 });
      }
    });

    let budget = o.budget, T = 0;
    const active = tips.slice();
    // start times: stagger by t0
    while (active.length && budget > 0 && T < 600) {
      T++;
      for (let i = active.length - 1; i >= 0; i--) {
        const tip = active[i];
        if (T < tip.t0) continue;
        const age = tip.pts.length;
        tip.w = (tip.w || 0) * 0.82 + GB.gauss(r) * (tip.surface ? 0.16 : 0.13);
        let a = tip.a + tip.w + GB.gauss(r) * 0.1;
        let nx = tip.x + Math.cos(a) * STEP, ny = tip.y + Math.sin(a) * STEP;
        let hit = chipAt(nx, ny);
        if (hit === -2) { finish(i); continue; }
        if (hit >= 0 && !tip.surface) {
          // wall-follow: turn until free (keeps hugging the chip)
          let found = false;
          for (let k = 1; k <= 10 && !found; k++) {
            const aa = a + tip.turn * k * 0.24;
            const tx = tip.x + Math.cos(aa) * STEP, ty = tip.y + Math.sin(aa) * STEP;
            if (chipAt(tx, ty) === -1) { a = aa; nx = tx; ny = ty; found = true; }
          }
          if (!found) { tip.turn *= -1; finish(i); continue; }
          // after sliding, bias back toward the chip (wrapping)
          a -= tip.turn * 0.12;
        }
        if (densAt(nx, ny) > o.maxDensity && age > 3) { finish(i); continue; }
        tip.x = nx; tip.y = ny; tip.a = a;
        tip.pts.push([nx, ny]);
        densAdd(nx, ny);
        budget--;
        if (age > tip.life) { finish(i); continue; }
        // branching
        if (age > 4 && tip.gen < o.maxGen && r() < o.branch * (tip.surface ? 0.4 : 1)) {
          const side = r() < 0.5 ? -1 : 1;
          const child = { x: nx, y: ny, a: a + side * (0.45 + r() * 0.7), pts: [[nx, ny]], t0: T + 1, gen: tip.gen + 1, surface: r() < o.surfaceShare, life: (r() < o.surfaceShare ? 0.5 : 1) * (25 + r() * 60 * Math.pow(0.85, tip.gen)), turn: side };
          active.push(child); tips.push(child);
        }
      }
    }
    function finish(i) { const t = active[i]; t.t1 = T; active.splice(i, 1); done.push(t); }
    active.forEach((t) => { t.t1 = T; });
    const maxT = T;
    tips.forEach((t) => { if (t.t1 === undefined) t.t1 = maxT; });
    return { tips: tips.filter((t) => t.pts.length > 2), seeds, maxT, chipAt };
  }

  /**
   * Build the network.
   *   GB.MyceliumNetwork(layers, { bounds, chips, seed, ... })
   * layers: { under: <g> (between chips), over: <g> (on top of chips), haze: <g> }
   * Returns { update(p), seeds }
   */
  GB.MyceliumNetwork = function (layers, o) {
    o = Object.assign({ seed: 5, seeds: 26, seedSpacing: 120, step: 6, budget: 16000, branch: 0.07, maxGen: 9, maxDensity: 10, surfaceShare: 0.12, bridges: 90, felt: 900 }, o);
    const b = o.bounds, chips = o.chips;
    const sim = simulate(b, chips, o);
    const r = rng(o.seed + 77);
    const items = [];
    const maxT = sim.maxT;

    // inoculum granules (white spawn mixed in during scene 5)
    const gran = g(layers.under, { filter: 'url(#f-thread)' });
    sim.seeds.forEach(([x, y]) => {
      const pts = GB.blobPoints(x, y, 9 + r() * 5, 7 + r() * 4, 9, 0.55, r);
      GB.path(gran, smoothPath(pts, true), '@mycelium');
    });

    const under = g(layers.under, { filter: 'url(#f-thread)' });
    const over = g(layers.over, { filter: 'url(#f-thread)', opacity: 0.85 });
    const widths = [3.0, 2.5, 2.1, 1.8, 1.6, 1.4, 1.3, 1.2, 1.1, 1.0];

    // Normalise sim time to 0..0.92 of growth; bridges and felt fill the rest.
    sim.tips.forEach((tip) => {
      const d = smoothPath(tip.pts, false);
      const L = (tip.pts.length - 1) * o.step * 1.02 + 2;
      const sw = (tip.surface ? 0.75 : 1) * widths[Math.min(tip.gen, widths.length - 1)];
      const p = el('path', { d, style: `fill:none;stroke:var(--mycelium);stroke-width:${sw};stroke-linecap:round;stroke-linejoin:round`, 'stroke-dasharray': `${L} ${L}`, 'stroke-dashoffset': L }, tip.surface ? over : under);
      const a = (tip.t0 / maxT) * 0.9, z = (tip.t1 / maxT) * 0.9;
      items.push({ node: p, L, a, z, last: -1 });
    });

    // bridges between neighbouring chips
    const bridges = [];
    for (let i = 0; i < chips.length; i++) {
      for (let j = i + 1; j < chips.length; j++) {
        if (Math.hypot(chips[i].x - chips[j].x, chips[i].y - chips[j].y) > (chips[i].len + chips[j].len) * 0.6 + 40) continue;
        let best = null;
        for (const pa of chips[i].pts) for (const pb of chips[j].pts) {
          const dd = Math.hypot(pa[0] - pb[0], pa[1] - pb[1]);
          if (!best || dd < best.d) best = { d: dd, pa, pb };
        }
        if (best && best.d > 10 && best.d < 95) bridges.push(best);
      }
    }
    bridges.sort(() => r() - 0.5);
    bridges.slice(0, o.bridges).forEach((br) => {
      const strands = 1 + Math.floor(r() * 3);
      for (let s = 0; s < strands; s++) {
        const off = (s - (strands - 1) / 2) * 7;
        const [ax, ay] = br.pa, [bx, by] = br.pb;
        const nx = -(by - ay) / br.d, ny = (bx - ax) / br.d;
        const ax2 = ax + nx * off, ay2 = ay + ny * off, bx2 = bx + nx * off * 0.6, by2 = by + ny * off * 0.6;
        const mx = (ax2 + bx2) / 2 + nx * (r() - 0.5) * 18, my = (ay2 + by2) / 2 + ny * (r() - 0.5) * 18;
        const d = `M${ax2.toFixed(1)},${ay2.toFixed(1)}Q${mx.toFixed(1)},${my.toFixed(1)} ${bx2.toFixed(1)},${by2.toFixed(1)}`;
        const L = br.d * 1.15 + 6;
        const p = el('path', { d, style: `fill:none;stroke:var(--mycelium);stroke-width:${1.6 + r() * 1.2};stroke-linecap:round`, 'stroke-dasharray': `${L} ${L}`, 'stroke-dashoffset': L }, r() < 0.3 ? over : under);
        const a = 0.35 + r() * 0.45;
        items.push({ node: p, L, a, z: a + 0.06 + r() * 0.06, last: -1 });
      }
    });

    // felt: short curly threads in gaps, revealed in batches
    const feltBatches = [];
    const NB = 8;
    const batchD = Array.from({ length: NB }, () => '');
    let placed = 0;
    for (let t = 0; t < o.felt * 6 && placed < o.felt; t++) {
      let x = b.x + r() * b.w, y = b.y + r() * b.h;
      if (sim.chipAt(x, y) !== -1 && r() > 0.25) continue;
      let a = r() * Math.PI * 2;
      const pts = [[x, y]];
      const n = 3 + Math.floor(r() * 4);
      for (let k = 0; k < n; k++) { a += (r() - 0.5) * 1.6; x += Math.cos(a) * 6; y += Math.sin(a) * 6; pts.push([x, y]); }
      batchD[placed % NB] += smoothPath(pts, false);
      placed++;
    }
    batchD.forEach((d, i) => {
      const p = el('path', { d, style: 'fill:none;stroke:var(--mycelium);stroke-width:1;stroke-linecap:round;opacity:0' }, under);
      feltBatches.push({ node: p, a: 0.55 + (i / NB) * 0.35 });
    });

    // haze — blurred copy that thickens the web late in growth
    let haze = null;
    if (layers.haze && GB.config.quality !== 'fast') {
      under.setAttribute('id', 'myc-under-' + o.seed);
      haze = el('use', { href: '#myc-under-' + o.seed, filter: 'url(#f-blur-s)', opacity: 0 }, layers.haze);
    }

    let lastP = -1;
    function update(p) {
      p = GB.clamp(p);
      if (p === lastP) return;
      lastP = p;
      for (const it of items) {
        const q = p <= it.a ? 0 : p >= it.z ? 1 : (p - it.a) / (it.z - it.a);
        if (q === it.last) continue;
        it.last = q;
        if (q === 0) { it.node.setAttribute('display', 'none'); continue; }
        it.node.removeAttribute('display');
        it.node.setAttribute('stroke-dashoffset', (it.L * (1 - q)).toFixed(1));
      }
      for (const fb of feltBatches) fb.node.style.opacity = (GB.clamp((p - fb.a) / 0.12) * 0.7).toFixed(3);
      if (haze) haze.setAttribute('opacity', (GB.seg(p, 0.45, 1, 'sine') * 0.7).toFixed(3));
      gran.setAttribute('opacity', (1 - GB.seg(p, 0.6, 1) * 0.3).toFixed(3));
    }
    update(0);
    return { update, seeds: sim.seeds, count: items.length };
  };

  /** Draw packed chips (macro scale) into a group. */
  GB.drawMacroChips = function (parent, chips) {
    const grp = g(parent, { filter: 'url(#f-paper)' });
    chips.forEach((c) => {
      const cg = g(grp, { transform: GB.tf(c.x, c.y, c.rot) });
      const r = rng(c.seed + 3);
      const col = GB.HURD_COLS[Math.floor(r() * GB.HURD_COLS.length)];
      GB.PaperShape(cg, polyPath(c.local), col, { textureOpacity: 0.55 });
      // woody grain lines
      const lines = 3 + Math.floor(r() * 4);
      for (let i = 0; i < lines; i++) {
        const yy = (r() - 0.5) * c.wid * 0.7;
        const x0 = -c.len * (0.3 + r() * 0.15), x1 = c.len * (0.2 + r() * 0.25);
        GB.line(cg, `M${x0.toFixed(1)},${yy.toFixed(1)}Q${((x0 + x1) / 2).toFixed(1)},${(yy + (r() - 0.5) * 6).toFixed(1)} ${x1.toFixed(1)},${(yy + (r() - 0.5) * 4).toFixed(1)}`, 'rgba(115,80,42,.38)', 1.4 + r());
      }
      GB.line(cg, `M${(-c.len * 0.38).toFixed(1)},${(-c.wid * 0.34).toFixed(1)}L${(c.len * 0.3).toFixed(1)},${(-c.wid * 0.36).toFixed(1)}`, 'rgba(255,244,220,.55)', 2);
    });
    return grp;
  };
})();
