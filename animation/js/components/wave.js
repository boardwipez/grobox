/* =============================================================================
   Wave — layered cut-paper sea bands, hills and shoreline wash.
   ========================================================================== */
(function () {
  const { el, g, rng } = GB;

  /** Path of a band with a scalloped/wavy top edge from x0..x1, top y, down to yb. */
  function wavyBand(x0, x1, y, yb, amp, wl, phase, jitterSeed) {
    const r = rng(jitterSeed || 1);
    const pts = [];
    for (let x = x0; x <= x1 + wl / 8; x += wl / 8) {
      pts.push([x, y + Math.sin((x / wl) * Math.PI * 2 + phase) * amp + (r() - 0.5) * amp * 0.3]);
    }
    let d = `M${x0},${yb}L${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) d += `L${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`;
    return d + `L${x1 + wl / 8},${yb}Z`;
  }
  GB.wavyBand = wavyBand;

  /**
   * GB.Wave(parent, { y, bottom, amp, wl, color, x0, x1, seed })
   * .update(t) — slides horizontally (stop-motion friendly).
   */
  GB.Wave = function (parent, o) {
    o = Object.assign({ y: 600, bottom: 1200, amp: 8, wl: 180, color: '@ocean', x0: -400, x1: 2400, seed: 1, speed: 14, crest: true, filter: 'paper' }, o);
    const grp = g(parent, o.filter ? { filter: `url(#f-${o.filter})` } : {});
    const band = GB.PaperShape(grp, wavyBand(o.x0, o.x1, o.y, o.bottom, o.amp, o.wl, 0, o.seed), o.color, { textureOpacity: 0.4 });
    let crest = null;
    if (o.crest) {
      crest = GB.line(grp, '', 'rgba(255,255,255,.55)', 3);
    }
    grp.update = function (t) {
      const ph = t * o.speed / o.wl * Math.PI * 2 * 0.25;
      band.setD(wavyBand(o.x0, o.x1, o.y, o.bottom, o.amp, o.wl, ph, o.seed));
      if (crest) {
        let d = '';
        for (let x = o.x0; x < o.x1; x += o.wl) {
          const xx = x + ((t * o.speed) % o.wl);
          const yy = o.y + Math.sin((xx / o.wl) * Math.PI * 2 + ph) * o.amp + 10;
          d += `M${xx.toFixed(1)},${yy.toFixed(1)}q${o.wl * 0.12},-4 ${o.wl * 0.24},0`;
        }
        crest.setAttribute('d', d);
      }
    };
    grp.update(0);
    return grp;
  };

  /** Layered hills (back to front). */
  GB.Hills = function (parent, o) {
    o = Object.assign({ y: 520, colors: ['@hill-far', '@hill'], seed: 4 }, o || {});
    const grp = g(parent);
    const r = rng(o.seed);
    o.colors.forEach((c, li) => {
      const pts = [[o.x0 === undefined ? -200 : o.x0, o.y + 40]];
      let x = o.x0 === undefined ? -200 : o.x0;
      const peaks = o.peaks || [];
      while (x < 2200) {
        x += 120 + r() * 200;
        const h = (li === 0 ? 150 : 90) * (0.4 + r());
        pts.push([x, o.y - h + li * 30]);
        x += 80 + r() * 160;
        pts.push([x, o.y - h * 0.4 + li * 30]);
      }
      pts.push([2200, o.y + 40]);
      const lg = g(grp, { filter: 'url(#f-paper)' });
      GB.PaperShape(lg, GB.smoothPath(pts, true), c, { textureOpacity: 0.45 });
    });
    return grp;
  };

  /** Foam line that washes up and back on a shore (sloped). */
  GB.ShoreWash = function (parent, o) {
    o = Object.assign({ x0: 0, x1: 1920, y: 700, reach: 60, seed: 3 }, o);
    const grp = g(parent, { filter: 'url(#f-paper)' });
    const sheet = GB.PaperShape(grp, '', '@ocean-light', { textureOpacity: 0.35 });
    const foam = GB.PaperShape(grp, '', '#f3f3ef', { textureOpacity: 0.3 });
    grp.update = function (t) {
      const k = 0.5 - 0.5 * Math.cos(t * 0.9); // 0..1 in/out
      const ye = o.y + k * o.reach;
      sheet.setD(wavyBand(o.x0, o.x1, ye - 10, o.y - 60, 6, 140, t * 0.6, o.seed).replace(/Z$/, 'Z'));
      foam.setD(wavyBand(o.x0, o.x1, ye - 8, ye + 6, 7, 110, t * 0.6 + 1, o.seed + 1));
    };
    grp.update(0);
    return grp;
  };
})();
