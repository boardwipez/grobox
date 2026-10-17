/* =============================================================================
   Hemp — paper hemp leaf, plant, harvested stalk and HempHurd chips.
   ========================================================================== */
(function () {
  const { el, g, smoothPath, polyPath, rng, hash } = GB;

  /** One serrated leaflet pointing up the local -y axis, base at (0,0). */
  function leafletPts(len, wid, r) {
    const n = 14, left = [], right = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const half = Math.sin(Math.PI * Math.pow(t, 0.75)) * wid / 2 * (1 - t * 0.15);
      const tooth = i % 2 === 1 && i < n - 1 ? 1.35 : 1;
      left.push([-half * tooth, -t * len]);
      right.push([half * tooth, -t * len]);
    }
    return right.concat(left.reverse());
  }

  /** Palmate hemp leaf. Base at (0,0), pointing up. */
  GB.HempLeaf = function (parent, o) {
    o = Object.assign({ size: 160, leaflets: 7, color: '@hemp', filter: 'paper' }, o || {});
    const grp = g(parent, o.filter ? { filter: `url(#f-${o.filter})` } : {});
    const r = rng(o.seed || 7);
    const n = o.leaflets, spread = 150;
    // petiole
    GB.line(grp, `M0,0L0,${o.size * 0.42}`, '@hemp-dark', 5);
    for (let i = 0; i < n; i++) {
      const t = n === 1 ? 0.5 : i / (n - 1);
      const ang = (t - 0.5) * spread;
      const centre = 1 - Math.abs(t - 0.5) * 1.25;
      const len = o.size * (0.45 + 0.55 * centre);
      const wid = len * 0.2;
      const lg = g(grp, { transform: `rotate(${ang})` });
      GB.path(lg, polyPath(leafletPts(len, wid, r)), i % 2 ? o.color : '@hemp-mid');
      GB.line(lg, `M0,-2L0,${-len * 0.92}`, '@hemp-dark', 1.6, { opacity: 0.55 });
    }
    return grp;
  };

  /**
   * Hemp plant standing on the ground at (0,0), height `h`.
   * Returns { g, stalk, leaves: [{g, x, y, side}], top }.
   */
  GB.HempPlant = function (parent, o) {
    o = Object.assign({ h: 640 }, o || {});
    const grp = g(parent);
    const h = o.h;
    const stalkG = g(grp, { filter: 'url(#f-paper)' });
    const sd = `M-11,0 C-10,${-h * 0.4} -6,${-h * 0.8} -3,${-h} L3,${-h} C6,${-h * 0.8} 10,${-h * 0.4} 11,0Z`;
    GB.PaperShape(stalkG, sd, '@stalk');
    GB.line(stalkG, `M-2,-6C-1,${-h * 0.4} 0,${-h * 0.8} 0,${-h + 6}`, '#8a9a64', 2, { opacity: 0.5 });
    // nodes
    const leaves = [];
    const leafG = g(grp);
    const NODES = [[0.30, 150, 60], [0.47, 138, 54], [0.63, 122, 47], [0.78, 104, 40]];
    NODES.forEach(([t, sz, ang], i) => {
      const y = -h * t;
      for (const side of [-1, 1]) {
        const lg = g(leafG);
        const inner = g(lg, { transform: `rotate(${side * ang})` });
        GB.line(inner, `M0,0L0,${-sz * 0.5}`, '@hemp-dark', 3.5);
        const leaf = GB.HempLeaf(g(inner, { transform: `translate(0,${-sz * 0.5}) rotate(${-side * ang * 0.5})` }), { size: sz, seed: i * 2 + (side > 0), filter: 'paper' });
        leaves.push({ g: lg, x: side * 5, y, side, size: sz, leaf });
        lg.setAttribute('transform', GB.tf(side * 5, y));
      }
      GB.path(stalkG, `M-7,${y}h14v4h-14z`, '#9aaa72', { opacity: 0.6 });
    });
    const top = g(leafG, { transform: `translate(0,${-h + 4})` });
    GB.HempLeaf(top, { size: 120, seed: 99 });
    leaves.push({ g: top, x: 0, y: -h + 4, side: 0, size: 120 });
    return { g: grp, stalk: stalkG, leaves, top };
  };

  /** Harvested stalk lying horizontally; centre at (0,0), length `len`. */
  GB.HempStalk = function (parent, o) {
    o = Object.assign({ len: 620, thick: 26, seed: 3 }, o || {});
    const grp = g(parent, { filter: 'url(#f-paper)' });
    const L = o.len, T = o.thick;
    const d = `M${-L / 2},${-T / 2}C${-L / 6},${-T / 2 - 2} ${L / 6},${-T / 2 + 3} ${L / 2},${-T * 0.38}L${L / 2},${T * 0.38}C${L / 6},${T / 2 - 1} ${-L / 6},${T / 2 + 2} ${-L / 2},${T / 2}Z`;
    GB.PaperShape(grp, d, '@stalk');
    GB.line(grp, `M${-L / 2 + 8},-3C${-L / 6},-5 ${L / 6},-2 ${L / 2 - 6},-3`, '#e4e2c0', 2, { opacity: 0.6 });
    const r = rng(o.seed);
    for (let i = 1; i < 5; i++) {
      const x = -L / 2 + (L * i) / 5 + (r() - 0.5) * 30;
      GB.path(grp, `M${x - 3},${-T / 2}h6v${T}h-6z`, '#93a46c', { opacity: 0.55 });
    }
    // cut end showing the woody core (hurd) and hollow pith
    const ce = g(grp, { transform: `translate(${-L / 2},0)` });
    el('ellipse', { cx: 0, cy: 0, rx: 7, ry: T / 2, style: 'fill:var(--hurd-light)' }, ce);
    el('ellipse', { cx: 0, cy: 0, rx: 3, ry: T * 0.22, style: 'fill:#b89767' }, ce);
    grp.len = L;
    return grp;
  };

  const HURD_COLS = ['#c9a574', '#d8b886', '#b88f5c', '#e0c597', '#c49e68', '#d2ad7a'];
  GB.HURD_COLS = HURD_COLS;

  /** Irregular woody shard outline, centred, long axis = x. */
  GB.hurdPoints = function (len, wid, r) {
    const pts = [];
    const n = 4 + Math.floor(r() * 3);
    // top edge
    for (let i = 0; i <= n; i++) pts.push([-len / 2 + (len * i) / n, -wid / 2 + (r() - 0.5) * wid * 0.25]);
    // right jagged end
    pts.push([len / 2 + (r() - 0.3) * wid * 0.6, (r() - 0.5) * wid * 0.4]);
    for (let i = n; i >= 0; i--) pts.push([-len / 2 + (len * i) / n, wid / 2 + (r() - 0.5) * wid * 0.25]);
    pts.push([-len / 2 - (r() - 0.3) * wid * 0.6, (r() - 0.5) * wid * 0.4]);
    return pts;
  };

  /** One HempHurd chip (group, unfiltered — put filters on the parent). */
  GB.HempHurd = function (parent, o) {
    const r = rng(o.seed || 1);
    const len = o.len || 40, wid = o.wid || len * (0.22 + r() * 0.2);
    const pts = GB.hurdPoints(len, wid, r);
    const col = o.color || HURD_COLS[Math.floor(r() * HURD_COLS.length)];
    const grp = g(parent);
    GB.path(grp, polyPath(pts), col);
    if (o.grain !== false) {
      const lines = 1 + Math.floor(r() * 3);
      for (let i = 0; i < lines; i++) {
        const yy = (r() - 0.5) * wid * 0.6;
        GB.line(grp, `M${-len * 0.42},${yy}L${len * (0.2 + r() * 0.2)},${yy + (r() - 0.5) * 3}`, 'rgba(120,85,45,.45)', Math.max(0.8, len / 60));
      }
      GB.line(grp, `M${-len * 0.4},${-wid * 0.3}L${len * 0.35},${-wid * 0.32}`, 'rgba(255,240,210,.5)', Math.max(0.8, len / 70));
    }
    grp.pts = pts;
    return grp;
  };

  /** A loose scatter/pile of hurd chips inside an ellipse. Returns {g, chips[]}. */
  GB.HurdPile = function (parent, o) {
    o = Object.assign({ cx: 0, cy: 0, rx: 120, ry: 60, n: 60, len: [16, 34], seed: 11, filter: 'paper', heap: 0.7 }, o);
    const grp = g(parent, o.filter ? { filter: `url(#f-${o.filter})` } : {});
    const r = rng(o.seed);
    const chips = [];
    for (let i = 0; i < o.n; i++) {
      // heap: denser at centre, later chips higher (drawn on top)
      const a = r() * Math.PI * 2, d = Math.pow(r(), o.heap);
      const x = o.cx + Math.cos(a) * o.rx * d, y = o.cy + Math.sin(a) * o.ry * d - (1 - d) * o.ry * 0.25;
      const len = o.len[0] + r() * (o.len[1] - o.len[0]);
      const c = GB.HempHurd(grp, { len, seed: o.seed * 1000 + i });
      const rot = r() * 180;
      c.setAttribute('transform', GB.tf(x, y, rot));
      chips.push({ g: c, x, y, rot, i });
    }
    return { g: grp, chips };
  };
})();
