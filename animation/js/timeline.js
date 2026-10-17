/* =============================================================================
   Master timeline
   - Lays scenes end-to-end from GB.config.scenes (durations live ONLY there).
   - render(t) is a pure function of t: it shows the right scene, maps global
     time → the scene's own design clock, draws transitions and captions.
   - Stop-motion: time is quantised to config.stopMotionFps poses per second.
   ========================================================================== */
(function () {
  const { el, g, seg, clamp } = GB;

  GB.SCENES = {};
  /** Register a scene module: GB.scene('rack', { design: 10, build(root, ctx), update(t, ctx) }) */
  GB.scene = function (id, def) { GB.SCENES[id] = def; };

  /** Stand-in for a scene whose module is missing (keeps the film playable). */
  GB.placeholderScene = function (s) {
    console.warn('No scene module for "' + s.id + '" — using placeholder');
    return {
      design: s.duration,
      build(root) {
        GB.PaperBackdrop(root, '@paper');
        el('text', { x: 960, y: 540, 'text-anchor': 'middle', 'font-size': 60, class: 'cap-text', style: 'fill:var(--ink-soft)', text: s.title }, root);
      },
      update() {}
    };
  };

  class Timeline {
    constructor(svg) {
      this.svg = svg;
      this.cfg = GB.config;
      this.sceneLayer = g(svg, { id: 'scenes' });
      this.transLayer = g(svg, { id: 'transitions' });
      this.capLayer = g(svg, { id: 'captions' });
      this.items = [];
      let t = 0;
      this.cfg.scenes.forEach((s, i) => {
        const mod = GB.SCENES[s.id] || GB.placeholderScene(s);
        this.items.push({ i, cfg: s, mod, start: t, end: t + s.duration });
        t += s.duration;
      });
      this.total = t;
      this.current = -1;
    }

    build() {
      for (const it of this.items) {
        it.root = g(this.sceneLayer, { id: 'scene-' + it.cfg.id, class: 'scene', display: 'none' });
        it.ctx = { root: it.root, cfg: it.cfg, duration: it.cfg.duration, design: it.mod.design };
        it.mod.build(it.root, it.ctx);
      }
      this.buildTransitions();
      this.buildCaptions();
    }

    // ------------------------------------------------------------ captions
    buildCaptions() {
      const claims = this.cfg.claims || {};
      for (const it of this.items) {
        it.captions = [];
        for (const c of it.cfg.captions || []) {
          if (c.claim && !claims[c.claim]) continue;
          const holder = g(this.capLayer, { display: 'none' });
          const lab = GB.PaperLabel(holder, c.text, { size: 40, sub: c.sub });
          it.captions.push({ c, holder, lab });
        }
      }
      // layout once fonts are ready (main.js waits for fonts before build)
      for (const it of this.items) for (const cp of it.captions) cp.lab.layout();
    }

    renderCaptions(it, lt) {
      // hide all other scenes' captions
      for (const other of this.items) if (other !== it) for (const cp of other.captions) cp.holder.setAttribute('display', 'none');
      const show = this.cfg.showCaptions;
      const p = lt / it.ctx.design; // fraction of scene
      for (const cp of it.captions) {
        const a = cp.c.at, z = cp.c.to;
        const fadeF = 0.4 / it.cfg.duration; // 0.4 s in/out
        const vis = show ? seg(p, a, a + fadeF, 'out') * (1 - seg(p, z - fadeF, z, 'in')) : 0;
        if (vis <= 0) { cp.holder.setAttribute('display', 'none'); continue; }
        cp.holder.removeAttribute('display');
        const x = 150, y = 1004 - cp.lab.bottom + (1 - vis) * 36;
        const rot = -0.6 + (GB.hash(cp.c.text) % 10) / 10 * 1.2;
        cp.holder.setAttribute('transform', GB.tf(x, y, rot));
        cp.holder.setAttribute('opacity', vis.toFixed(3));
      }
    }

    // ---------------------------------------------------------- transitions
    buildTransitions() {
      const L = this.transLayer;
      // big torn sheet (wipe)
      const r = GB.rng(901);
      const S = 2500, edge = [];
      for (let y = -60; y <= 1140; y += 30) edge.push([(r() - 0.5) * 26, y]);
      const right = edge.map(([x, y]) => [S + (r() - 0.5) * 26, y]).reverse();
      this.sheet = g(L, { display: 'none', filter: 'url(#f-lift)' });
      GB.PaperShape(this.sheet, GB.polyPath(edge.concat(right)), '@paper-2');
      this.sheet.W = S;
      // strips
      this.strips = g(L, { display: 'none' });
      const cols = ['@kraft-light', '@paper-2', '@beige', '@hemp-pale'];
      this.stripEls = cols.map((c, i) => {
        const sg = g(this.strips, { filter: 'url(#f-lift)' });
        const pts = [];
        const y0 = i * 280 - 20, y1 = y0 + 320;
        for (let x = 0; x <= 2200; x += 40) pts.push([x, y0 + (r() - 0.5) * 16]);
        for (let x = 2200; x >= 0; x -= 40) pts.push([x, y1 + (r() - 0.5) * 16]);
        GB.PaperShape(sg, GB.polyPath(pts), c);
        return sg;
      });
      // fade
      this.fadeRect = el('rect', { x: 0, y: 0, width: 1920, height: 1080, style: 'fill:var(--paper)', display: 'none' }, L);
    }

    renderTransition(tq) {
      this.sheet.setAttribute('display', 'none');
      this.strips.setAttribute('display', 'none');
      this.fadeRect.setAttribute('display', 'none');
      const D = this.cfg.transitionDuration;
      for (let k = 0; k < this.items.length - 1; k++) {
        const it = this.items[k];
        const type = it.cfg.transition || 'cut';
        if (type === 'cut') continue;
        const b = it.end;
        if (tq < b - D / 2 || tq > b + D / 2) continue;
        const p = (tq - (b - D / 2)) / D; // 0..1, 0.5 = boundary
        if (type === 'wipe' || type === 'wipe-left') {
          const dir = type === 'wipe' ? 1 : -1;
          const W = this.sheet.W;
          // leading edge travels from off-screen to cover, then trailing edge leaves
          const a = p < 0.5 ? GB.ease.out(p * 2) : 1 + GB.ease.in((p - 0.5) * 2);
          let x;
          if (dir > 0) x = GB.lerp(1960, -290, Math.min(a, 1)) - (a > 1 ? (a - 1) * (W - 1920 + 340) : 0);
          else x = GB.lerp(-W - 40, -W + 1920 + 290, Math.min(a, 1)) + (a > 1 ? (a - 1) * (W - 1920 + 340) : 0);
          this.sheet.removeAttribute('display');
          this.sheet.setAttribute('transform', `translate(${x.toFixed(1)},0)`);
        } else if (type === 'strips') {
          this.strips.removeAttribute('display');
          this.stripEls.forEach((s, i) => {
            const d = i * 0.08;
            const pin = clamp((p - d) / 0.42), pout = clamp((p - 0.5 - d) / 0.42);
            const x = GB.lerp(-2240, -140, GB.ease.out(pin)) + GB.ease.in(pout) * 2240;
            s.setAttribute('transform', `translate(${x.toFixed(1)},0)`);
          });
        } else if (type === 'fade') {
          const o = 1 - Math.abs(p - 0.5) * 2;
          GB.show(this.fadeRect, GB.ease.sine(clamp(o * 1.25)));
        }
      }
    }

    // --------------------------------------------------------------- render
    sceneAt(t) {
      for (const it of this.items) if (t < it.end) return it;
      return this.items[this.items.length - 1];
    }

    quantise(t) {
      const fps = this.cfg.stopMotionFps;
      if (!fps) { GB.frame = Math.floor(t * 60); return t; }
      GB.frame = Math.floor(t * fps + 1e-6);
      return GB.frame / fps;
    }

    render(t) {
      t = clamp(t, 0, this.total - 1e-4);
      const tq = this.quantise(t);
      const it = this.sceneAt(tq);
      if (this.current !== it.i) {
        if (this.current >= 0) this.items[this.current].root.setAttribute('display', 'none');
        it.root.removeAttribute('display');
        this.current = it.i;
      }
      const lt = (tq - it.start) * (it.ctx.design / it.cfg.duration);
      it.mod.update(Math.min(lt, it.ctx.design), it.ctx);
      this.renderTransition(tq);
      this.renderCaptions(it, lt);
      return { scene: it, local: tq - it.start, frame: GB.frame };
    }
  }

  GB.Timeline = Timeline;
})();
