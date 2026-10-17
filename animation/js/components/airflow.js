/* =============================================================================
   Airflow / Wave ribbons — cut-paper streamers for heat (orange) and cooling
   or ventilation (blue). A ribbon is a filled wavy strip that tapers at both
   ends; update(phase) slides it along and fades it in/out.
   ========================================================================== */
(function () {
  const { el, g } = GB;

  /** Wavy tapered strip path from x=0..len. */
  function ribbonPath(len, amp, waves, thick, phase) {
    const top = [], bot = [];
    const n = 48;
    for (let i = 0; i <= n; i++) {
      const u = i / n, x = u * len;
      const taper = Math.sin(Math.PI * u);
      const y = Math.sin(u * waves * Math.PI * 2 + phase) * amp;
      const th = thick * (0.25 + 0.75 * taper);
      top.push([x, y - th / 2]);
      bot.push([x, y + th / 2]);
    }
    return GB.smoothPath(top.concat(bot.reverse()), true);
  }
  GB.ribbonPath = ribbonPath;

  /**
   * GB.Airflow(parent, { x, y, len, amp, waves, thick, color, travel, filter })
   * .update(t, opacity) — t in seconds (drives the drift), opacity 0..1
   */
  GB.Airflow = function (parent, o) {
    o = Object.assign({ x: 0, y: 0, len: 300, amp: 10, waves: 1.5, thick: 9, color: '@cool', travel: 160, speed: 60, filter: 'paper', rot: 0 }, o);
    const outer = g(parent, { transform: GB.tf(o.x, o.y, o.rot) });
    const grp = g(outer, o.filter ? { filter: `url(#f-${o.filter})` } : {});
    const shape = GB.PaperShape(grp, ribbonPath(o.len, o.amp, o.waves, o.thick, 0), o.color, { textureOpacity: 0.35 });
    grp.update = function (t, opacity) {
      if (opacity <= 0.001) { grp.setAttribute('display', 'none'); return; }
      grp.removeAttribute('display');
      const cyc = o.travel > 0 ? ((t * o.speed) % o.travel) / o.travel : 0;      // 0..1 loop
      const fade = Math.sin(Math.PI * cyc);
      grp.setAttribute('transform', `translate(${(cyc * o.travel - o.travel / 2).toFixed(1)},0)`);
      grp.setAttribute('opacity', (opacity * (o.travel > 0 ? 0.25 + 0.75 * fade : 1)).toFixed(3));
      // gentle undulation (re-cut on each pose)
      shape.setD(ribbonPath(o.len, o.amp, o.waves, o.thick, t * 2.2));
    };
    grp.update(0, 0);
    return grp;
  };

  /** A field of ribbons sharing one update. */
  GB.AirflowField = function (parent, specs) {
    const items = specs.map((s) => GB.Airflow(parent, s));
    return {
      items,
      update(t, opacity) { items.forEach((it, i) => it.update(t + i * 0.73, opacity)); }
    };
  };
})();
