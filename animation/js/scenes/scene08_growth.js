/* =============================================================================
   SCENE 8 — MYCELIUM GROWTH  (hero scene)
   Rack → slow push toward one mould → a torn paper window opens in its face →
   macro cross-section: tan hemp hurds, white hyphae branching, wrapping and
   bridging until a dense binding network → window closes → back to the rack.
   The hemp never inflates; no mushroom caps.
   ========================================================================== */
(function () {
  const { el, g, seg } = GB;

  const TARGET = 4;
  // growth window (design seconds)
  const GROW_A = 4.4, GROW_Z = 12.8;

  GB.scene('growth', {
    design: 16,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      const rw = GB.RackWorld(root);
      ctx.rw = rw;
      const slot = rw.rack.slots[TARGET];
      const s = GB.RACK.moldScale;
      const D = GB.BOX.d + 2 * GB.MOLD_MARGIN * GB.K, H = GB.BOX.h + 36;
      // world point at the middle of the mould's front face
      ctx.face = { x: slot.x, y: slot.y + (30 + D / 2 + H * 0.5) * s };

      // ---------- macro cross-section (screen space)
      const r = GB.rng(808);
      const hole = GB.blobPoints(0, 0, 1, 1, 72, 0.09, r);
      const holeD = GB.smoothPath(hole, true);
      const clipId = 'growth-hole';
      const cp = el('clipPath', { id: clipId }, GB.defs);
      ctx.holePath = el('path', { d: holeD }, cp);

      const macroClip = g(root, { 'clip-path': `url(#${clipId})` });
      ctx.macroClip = macroClip;
      const macro = g(macroClip);
      ctx.macro = macro;
      // deep, slightly out-of-focus bed of particles
      el('rect', { x: -200, y: -200, width: 2320, height: 1480, style: 'fill:#6d5236' }, macro);
      el('rect', { x: -200, y: -200, width: 2320, height: 1480, style: 'fill:url(#p-hurds);opacity:.35', filter: 'url(#f-blur-s)' }, macro);
      el('rect', { x: -200, y: -200, width: 2320, height: 1480, style: 'fill:rgba(60,40,22,.35)' }, macro);

      const bounds = { x: -60, y: -60, w: 2040, h: 1200 };
      const chips = GB.packChips(bounds, { n: 120, len: [80, 280], wid: [34, 76], gap: 16, seed: 31, tries: 20000 });
      const layers = { under: g(macro), haze: null, over: null };
      layers.haze = g(macro);
      macro.insertBefore(layers.haze, layers.under);
      GB.drawMacroChips(macro, chips);
      layers.over = g(macro);
      ctx.net = GB.MyceliumNetwork(layers, { bounds, chips, seed: 12, seeds: 44, seedSpacing: 130, budget: 26000, maxDensity: 12, felt: 1800 });
      // soft lens vignette inside the window
      el('rect', { x: 0, y: 0, width: 1920, height: 1080, style: 'fill:url(#g-vignette)' }, macroClip);

      // torn rim of the window (paper thickness + cast shadow)
      ctx.rim = g(root, { filter: 'url(#f-lift)' });
      ctx.rimOuter = el('path', { d: holeD, style: 'fill:none;stroke:var(--grey-light);stroke-width:14', 'vector-effect': 'non-scaling-stroke' }, ctx.rim);
      ctx.rimInner = el('path', { d: holeD, style: 'fill:none;stroke:#d9dadb;stroke-width:4', 'vector-effect': 'non-scaling-stroke' }, ctx.rim);

      // "inside the mould" tag
      ctx.tag = g(root);
      const tagLab = GB.PaperLabel(ctx.tag, 'Inni í mótinu · þversnið', { size: 26, className: 'tag-text' });
      tagLab.layout();
      ctx.tagLab = tagLab;
    },
    update(t, ctx) {
      const { rw } = ctx;
      rw.flow.update(t, 0.85 * (1 - seg(t, 1.5, 3)) + 0.85 * seg(t, 14.4, 15.6));

      // camera: push toward the mould face, then pull back at the end
      const pin = seg(t, 0.2, 4.2, 'inOut');
      const pout = seg(t, 13.4, 15.8, 'inOut');
      const k = pin * (1 - pout);
      const s = GB.lerp(0.94, 4.6, k);
      GB.camera(rw.world, GB.lerp(960, ctx.face.x, k), GB.lerp(548, ctx.face.y, k), s);

      // window opens / closes (screen-space radius)
      const open = seg(t, 2.9, 4.7, 'in') * (1 - seg(t, 12.9, 14.3, 'out'));
      const R = open * 1260;
      if (R < 1) {
        ctx.macroClip.setAttribute('display', 'none');
        ctx.rim.setAttribute('display', 'none');
      } else {
        ctx.macroClip.removeAttribute('display');
        ctx.rim.removeAttribute('display');
        const tf = `translate(960,540) scale(${R.toFixed(2)})`;
        ctx.holePath.setAttribute('transform', tf);
        ctx.rimOuter.setAttribute('transform', tf);
        ctx.rimInner.setAttribute('transform', tf);
        // zoom-through: macro grows from small as the window opens, slow push while growing
        const ms = GB.lerp(0.55, 1, seg(t, 2.9, 4.9, 'out')) * GB.lerp(1, 1.07, seg(t, 4.5, 13, 'linear')) * GB.lerp(1, 0.6, seg(t, 12.9, 14.3, 'in'));
        ctx.macro.setAttribute('transform', `translate(960,540) scale(${ms.toFixed(4)}) translate(-960,-540)`);
      }

      // growth progress (never inflates — only threads appear)
      const p = seg(t, GROW_A, GROW_Z, 'sine');
      ctx.net.update(p);

      // tag
      const tv = seg(t, 4.6, 5.2) * (1 - seg(t, 12.4, 12.9));
      GB.place(ctx.tag, 1920 - ctx.tagLab.w - 70 - ctx.tagLab.left, 96 + (1 - tv) * -30, 0.8, 1, tv);
    }
  });
})();
