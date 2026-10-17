/* =============================================================================
   Fish & ice — simple paper mackerel / cod and crushed-ice pieces.
   ========================================================================== */
(function () {
  const { el, g, polyPath, smoothPath, rng } = GB;

  /** Paper fish facing left, centred, length `len`. */
  GB.Fish = function (parent, o) {
    o = Object.assign({ len: 300, kind: 'mackerel', seed: 1, filter: 'paper' }, o || {});
    const L = o.len, H = L * 0.24;
    const grp = g(parent, o.filter ? { filter: `url(#f-${o.filter})` } : {});
    // tail
    GB.PaperShape(grp, `M${L * 0.38},0 L${L * 0.56},${-H * 0.62} Q${L * 0.5},0 ${L * 0.56},${H * 0.62}Z`, o.kind === 'cod' ? '#8f8a74' : '#6f8796', { textureOpacity: 0.4 });
    // body
    const body = `M${-L / 2},${H * 0.05} C${-L * 0.38},${-H * 0.62} ${L * 0.12},${-H * 0.7} ${L * 0.42},${-H * 0.08} L${L * 0.42},${H * 0.08} C${L * 0.12},${H * 0.62} ${-L * 0.38},${H * 0.6} ${-L / 2},${H * 0.05}Z`;
    GB.PaperShape(grp, body, o.kind === 'cod' ? '#b9b39a' : '#c9d2d6', { textureOpacity: 0.35 });
    // back (darker upper half)
    const back = `M${-L * 0.46},${-H * 0.06} C${-L * 0.36},${-H * 0.58} ${L * 0.12},${-H * 0.66} ${L * 0.42},${-H * 0.08} C${L * 0.1},${-H * 0.12} ${-L * 0.2},${-H * 0.02} ${-L * 0.46},${-H * 0.06}Z`;
    GB.path(grp, back, o.kind === 'cod' ? '#8e8a72' : '#5f7d8e');
    if (o.kind === 'mackerel') {
      const r = rng(o.seed);
      for (let i = 0; i < 7; i++) {
        const x = -L * 0.22 + i * L * 0.085;
        GB.line(grp, `M${x},${-H * 0.42 + r() * 4}q${L * 0.02},${H * 0.15} 0,${H * 0.32}`, '#3f5866', 3, { opacity: 0.7 });
      }
    }
    // fin + gill + eye
    GB.path(grp, `M${-L * 0.05},${-H * 0.48}L${L * 0.12},${-H * 0.66}L${L * 0.14},${-H * 0.4}Z`, o.kind === 'cod' ? '#7d7962' : '#4f6b7b');
    GB.line(grp, `M${-L * 0.3},${-H * 0.3}q${L * 0.04},${H * 0.3} 0,${H * 0.55}`, 'rgba(60,70,80,.35)', 2.5);
    el('circle', { cx: -L * 0.39, cy: -H * 0.1, r: L * 0.024, style: 'fill:#f6f4ee' }, grp);
    el('circle', { cx: -L * 0.39, cy: -H * 0.1, r: L * 0.012, style: 'fill:#2f3438' }, grp);
    return grp;
  };

  /** Crushed ice piece. */
  GB.IcePiece = function (parent, o) {
    const r = rng(o.seed || 1);
    const s = o.size || 34;
    const pts = [];
    const n = 5 + Math.floor(r() * 2);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.4;
      const k = 0.7 + r() * 0.4;
      pts.push([Math.cos(a) * s * k * 0.5, Math.sin(a) * s * k * 0.42]);
    }
    const grp = g(parent);
    GB.path(grp, polyPath(pts), 'rgba(236,244,247,.95)');
    GB.path(grp, polyPath(pts.slice(0, 3).concat([[0, 0]])), 'rgba(255,255,255,.9)');
    GB.line(grp, polyPath(pts), 'rgba(160,190,205,.55)', 1.5);
    return grp;
  };

  /** A bed of ice pieces in an ellipse. */
  GB.IceBed = function (parent, o) {
    o = Object.assign({ cx: 0, cy: 0, rx: 200, ry: 60, n: 40, size: [24, 46], seed: 9 }, o);
    const grp = g(parent, { filter: 'url(#f-paper)' });
    const r = rng(o.seed);
    const pieces = [];
    for (let i = 0; i < o.n; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r());
      const x = o.cx + Math.cos(a) * o.rx * d, y = o.cy + Math.sin(a) * o.ry * d;
      const p = GB.IcePiece(grp, { size: o.size[0] + r() * (o.size[1] - o.size[0]), seed: o.seed * 100 + i });
      p.setAttribute('transform', GB.tf(x, y, r() * 60));
      pieces.push({ g: p, x, y });
    }
    pieces.sort((a, b) => a.y - b.y).forEach((p) => grp.appendChild(p.g));
    grp.pieces = pieces;
    return grp;
  };
})();
