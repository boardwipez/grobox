/* =============================================================================
   Core helpers: SVG creation, easing, deterministic random, geometry.
   Everything here is a pure function of its inputs — no wall-clock time —
   so any frame of the film can be rendered on demand (scrubbing / export).
   ========================================================================== */
(function () {
  const NS = 'http://www.w3.org/2000/svg';
  const XLINK = 'http://www.w3.org/1999/xlink';

  /** Create an SVG element. `attrs.style` may be a string; `parent` optional. */
  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) setAttrs(n, attrs);
    if (parent) parent.appendChild(n);
    return n;
  }

  function setAttrs(n, attrs) {
    for (const k in attrs) {
      const v = attrs[k];
      if (v === undefined || v === null) continue;
      if (k === 'href') { n.setAttribute('href', v); n.setAttributeNS(XLINK, 'xlink:href', v); }
      else if (k === 'text') n.textContent = v;
      else n.setAttribute(k, v);
    }
    return n;
  }

  /** Group helper. */
  function g(parent, attrs) { return el('g', attrs || {}, parent); }

  // ---------------------------------------------------------------- maths ---
  const clamp = (v, a = 0, b = 1) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, p) => a + (b - a) * p;
  const ease = {
    linear: (p) => p,
    in: (p) => p * p * p,
    out: (p) => 1 - Math.pow(1 - p, 3),
    inOut: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    sine: (p) => 0.5 - Math.cos(Math.PI * p) / 2,
    outBack: (p) => { const c1 = 1.5, c3 = c1 + 1; return 1 + c3 * Math.pow(p - 1, 3) + c1 * Math.pow(p - 1, 2); },
    outSoft: (p) => 1 - Math.pow(1 - p, 2),
    inSoft: (p) => p * p
  };

  /** Progress 0..1 of `t` through [a,b] with easing. */
  function seg(t, a, b, e) {
    const p = clamp((t - a) / (b - a));
    return (typeof e === 'function' ? e : ease[e || 'inOut'])(p);
  }

  /** Rise over [a,b], hold, fall over [c,d]. */
  function env(t, a, b, c, d, e) {
    return seg(t, a, b, e) * (1 - seg(t, c, d, e));
  }

  /** Discrete pose index — use for “pop-on” stop-motion beats. */
  function steps(t, a, b, n) {
    if (t <= a) return 0;
    if (t >= b) return n;
    return Math.floor(((t - a) / (b - a)) * n);
  }

  // ------------------------------------------------- deterministic random ---
  function rng(seed) {
    let s = seed >>> 0;
    return function () {
      s = (s + 0x6d2b79f5) >>> 0;
      let t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash(str) {
    let h = 2166136261;
    for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); }
    return h >>> 0;
  }
  /** Gaussian-ish from uniform rng. */
  const gauss = (r) => (r() + r() + r() - 1.5) / 1.5;

  // ------------------------------------------------------------- geometry ---
  const f = (n) => Math.round(n * 10) / 10;

  /** Rounded rectangle with independent x/y radii (for foreshortened tops). */
  function rrPath(x, y, w, h, rx, ry) {
    rx = Math.min(rx, w / 2); ry = Math.min(ry === undefined ? rx : ry, h / 2);
    return `M${f(x + rx)},${f(y)}H${f(x + w - rx)}A${f(rx)},${f(ry)} 0 0 1 ${f(x + w)},${f(y + ry)}` +
      `V${f(y + h - ry)}A${f(rx)},${f(ry)} 0 0 1 ${f(x + w - rx)},${f(y + h)}H${f(x + rx)}` +
      `A${f(rx)},${f(ry)} 0 0 1 ${f(x)},${f(y + h - ry)}V${f(y + ry)}A${f(rx)},${f(ry)} 0 0 1 ${f(x + rx)},${f(y)}Z`;
  }

  /** Visible front band of an extruded rounded rect seen from above-front. */
  function bandPath(x, y, w, d, h, rx, ry) {
    rx = Math.min(rx, w / 2); ry = Math.min(ry, d / 2);
    const yb = y + d;
    return `M${f(x)},${f(yb - ry)}V${f(yb - ry + h)}A${f(rx)},${f(ry)} 0 0 0 ${f(x + rx)},${f(yb + h)}` +
      `H${f(x + w - rx)}A${f(rx)},${f(ry)} 0 0 0 ${f(x + w)},${f(yb - ry + h)}V${f(yb - ry)}` +
      `A${f(rx)},${f(ry)} 0 0 1 ${f(x + w - rx)},${f(yb)}H${f(x + rx)}A${f(rx)},${f(ry)} 0 0 1 ${f(x)},${f(yb - ry)}Z`;
  }

  /** Smooth path through points (quadratic mid-point smoothing). */
  function smoothPath(pts, closed) {
    if (pts.length < 2) return '';
    if (pts.length === 2) return `M${f(pts[0][0])},${f(pts[0][1])}L${f(pts[1][0])},${f(pts[1][1])}`;
    let d = '';
    if (closed) {
      const n = pts.length;
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      let m0 = mid(pts[n - 1], pts[0]);
      d = `M${f(m0[0])},${f(m0[1])}`;
      for (let i = 0; i < n; i++) {
        const p = pts[i], m = mid(p, pts[(i + 1) % n]);
        d += `Q${f(p[0])},${f(p[1])} ${f(m[0])},${f(m[1])}`;
      }
      return d + 'Z';
    }
    d = `M${f(pts[0][0])},${f(pts[0][1])}`;
    for (let i = 1; i < pts.length - 1; i++) {
      const p = pts[i], n = pts[i + 1];
      d += `Q${f(p[0])},${f(p[1])} ${f((p[0] + n[0]) / 2)},${f((p[1] + n[1]) / 2)}`;
    }
    const l = pts[pts.length - 1];
    return d + `L${f(l[0])},${f(l[1])}`;
  }

  /** Polygon path (straight edges). */
  function polyPath(pts) {
    return 'M' + pts.map((p) => f(p[0]) + ',' + f(p[1])).join('L') + 'Z';
  }

  /** Irregular “torn / hand-cut” blob around a centre. */
  function blobPoints(cx, cy, rx, ry, n, jitter, r) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const k = 1 + (r() - 0.5) * jitter;
      pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
    }
    return pts;
  }

  /** Transform string helper. */
  function tf(x, y, rot, sx, sy) {
    let s = `translate(${f(x)},${f(y)})`;
    if (rot) s += ` rotate(${f(rot)})`;
    if (sx !== undefined && (sx !== 1 || (sy !== undefined && sy !== 1))) s += ` scale(${Math.round(sx * 1000) / 1000},${Math.round((sy === undefined ? sx : sy) * 1000) / 1000})`;
    return s;
  }

  /** Set transform + opacity in one go; hides when opacity is ~0. */
  function place(node, x, y, rot, s, opacity) {
    node.setAttribute('transform', tf(x, y, rot || 0, s === undefined ? 1 : s));
    if (opacity !== undefined) show(node, opacity);
  }
  function show(node, opacity) {
    if (opacity <= 0.001) { node.setAttribute('display', 'none'); return; }
    node.removeAttribute('display');
    node.setAttribute('opacity', opacity >= 0.999 ? 1 : Math.round(opacity * 1000) / 1000);
  }

  /** Camera: frame (cx,cy) at screen centre with zoom s. */
  function camera(node, cx, cy, s, rot) {
    node.setAttribute('transform', `translate(960,540) scale(${s}) ${rot ? `rotate(${rot})` : ''} translate(${f(-cx)},${f(-cy)})`);
  }

  /** Stop-motion “boil”: tiny deterministic jitter that changes each pose. */
  function boil(id, amp) {
    const a = (amp === undefined ? 1 : amp) * GB.config.boil;
    if (!a) return { x: 0, y: 0, r: 0 };
    const r = rng(hash(id) ^ (GB.frame * 2654435761));
    return { x: (r() - 0.5) * 2 * a, y: (r() - 0.5) * 2 * a, r: (r() - 0.5) * 0.25 * a };
  }

  Object.assign(GB, {
    NS, el, setAttrs, g, clamp, lerp, ease, seg, env, steps, rng, hash, gauss,
    rrPath, bandPath, smoothPath, polyPath, blobPoints, tf, place, show, camera, boil, fmt: f,
    frame: 0
  });
})();
