/* =============================================================================
   SCENE 1 — THE PROBLEM
   Paper harbour: dock, fishing boat, fish on ice in a white EPS box.
   Pan to a rocky shore where white foam fragments wash up. Everything clears
   away except one fragment, which ends centred — scene 2 picks it up there.
   ========================================================================== */
(function () {
  const { el, g, seg, rng, polyPath } = GB;

  // Shared with scene 2 (match cut): hero fragment outline + final placement.
  GB.FOAM_FRAGMENT = [[-46, -34], [-8, -42], [30, -36], [52, -8], [40, 26], [6, 38], [-30, 30], [-54, 4]];
  GB.FRAGMENT_END = { x: 960, y: 520, s: 2.6 };

  function foamPiece(parent, pts, seed) {
    const grp = g(parent);
    GB.PaperShape(grp, polyPath(pts), '#f6f6f2', { texture: 'p-eps', textureOpacity: 0.9 });
    // broken-edge shading
    GB.path(grp, polyPath([pts[3], pts[4], pts[5], [pts[5][0] + 2, pts[5][1] - 8], [pts[4][0] - 6, pts[4][1] - 6]]), 'rgba(200,200,196,.6)');
    return grp;
  }
  GB.foamPiece = foamPiece;

  function randomFragment(r, s) {
    const n = 6 + Math.floor(r() * 3), pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.5;
      const k = s * (0.6 + r() * 0.5);
      pts.push([Math.cos(a) * k, Math.sin(a) * k * 0.8]);
    }
    return pts;
  }

  GB.scene('problem', {
    design: 10,
    build(root, ctx) {
      GB.PaperBackdrop(root, '@paper');
      const world = g(root);
      ctx.world = world;

      // ======================= HARBOUR (x 0..1920) =======================
      const hb = g(world);
      el('rect', { x: -200, y: -100, width: 2200, height: 700, style: 'fill:var(--sky)' }, hb);
      const cloud = g(hb, { filter: 'url(#f-paper)', transform: 'translate(420,130)' });
      GB.PaperShape(cloud, GB.smoothPath(GB.blobPoints(0, 0, 120, 34, 12, 0.35, rng(3)), true), '#fbfaf6');
      GB.Hills(hb, { y: 480, seed: 4 });
      ctx.wavesH = [
        GB.Wave(hb, { y: 470, amp: 5, wl: 220, color: '@ocean-light', seed: 2, speed: 10, x1: 2100 }),
        GB.Wave(hb, { y: 540, amp: 7, wl: 200, color: '@ocean', seed: 3, speed: 16, x1: 2100 }),
        GB.Wave(hb, { y: 640, amp: 9, wl: 240, color: '@ocean-dark', seed: 5, speed: 22, x1: 2100 })
      ];
      ctx.boat = g(hb);
      GB.FishingBoat(ctx.boat);
      // move boat behind the front wave band
      hb.insertBefore(ctx.boat, ctx.wavesH[2]);

      // dock (planks in perspective)
      const dock = g(hb, { filter: 'url(#f-paper)' });
      GB.PaperShape(dock, polyPath([[-60, 1100], [-60, 700], [1500, 700], [1700, 1100]]), '@kraft-light');
      for (let i = 1; i < 9; i++) {
        const x0 = -60 + i * 190, x1 = -60 + i * 190 * 1.13;
        GB.line(dock, `M${x0},700L${x1},1100`, 'rgba(120,85,45,.35)', 3);
      }
      for (let i = 1; i < 4; i++) GB.line(dock, `M-60,${700 + i * 100}L${1500 + i * 50},${700 + i * 100}`, 'rgba(120,85,45,.22)', 2);
      GB.PaperShape(dock, polyPath([[-60, 700], [1500, 700], [1505, 714], [-60, 714]]), '#e3c9a0');
      // bollards
      for (const [bx, by, bs] of [[200, 790, 1], [1380, 770, 0.85]]) {
        const bg = g(hb, { filter: 'url(#f-paper)', transform: GB.tf(bx, by, 0, bs) });
        GB.PaperShape(bg, 'M-40,0 V-110 H40 V0 Q0,16 -40,0Z', '@kraft-dark');
        el('ellipse', { cx: 0, cy: -110, rx: 40, ry: 14, style: 'fill:#b08a5e' }, bg);
        GB.line(bg, 'M-40,-60 Q0,-48 40,-60', 'rgba(70,50,30,.4)', 3);
      }
      // rope coil
      const rope = g(hb, { filter: 'url(#f-paper)', transform: 'translate(250,990)' });
      for (let i = 0; i < 4; i++) el('ellipse', { cx: 0, cy: 0, rx: 150 - i * 24, ry: 56 - i * 9, style: `fill:none;stroke:${i % 2 ? '#c49a62' : '#b4874f'};stroke-width:20` }, rope);

      // EPS box with ice and fish
      const boxG = g(hb, { transform: 'translate(860,650)' });
      ctx.boxG = boxG;
      const eps = GB.EpsBox(boxG, {});
      const ge = eps.geom;
      ctx.ice = GB.IceBed(eps.contents, { cx: 0, cy: ge.iy + ge.id * 0.55, rx: ge.iw * 0.46, ry: ge.id * 0.4, n: 46, seed: 4 });
      ctx.fish = [];
      [[-40, -14, -6, 300], [40, 18, 4, 320], [-10, 42, -2, 290]].forEach(([fx, fy, fr, fl], i) => {
        const f = g(eps.contents);
        GB.Fish(f, { len: fl, seed: i + 1 });
        ctx.fish.push({ g: f, x: fx, y: fy, r: fr });
      });
      ctx.iceTop = GB.IceBed(eps.contents, { cx: 0, cy: ge.iy + ge.id * 0.8, rx: ge.iw * 0.44, ry: ge.id * 0.2, n: 16, seed: 8 });

      // ======================= COAST (x 1920..3840) ======================
      const cs = g(world, { transform: 'translate(1920,0)' });
      ctx.coast = cs;
      el('rect', { x: 0, y: -100, width: 2000, height: 700, style: 'fill:var(--sky)' }, cs);
      const cloud2 = g(cs, { filter: 'url(#f-paper)', transform: 'translate(1350,150)' });
      GB.PaperShape(cloud2, GB.smoothPath(GB.blobPoints(0, 0, 100, 28, 12, 0.35, rng(9)), true), '#fbfaf6');
      GB.Hills(cs, { y: 430, seed: 12, x0: 0, colors: ['@hill-far', '#7e8f7e'] });
      ctx.wavesC = [
        GB.Wave(cs, { y: 420, amp: 5, wl: 220, color: '@ocean-light', seed: 21, speed: 12, x0: 0, x1: 2100 }),
        GB.Wave(cs, { y: 500, amp: 8, wl: 200, color: '@ocean', seed: 22, speed: 18, x0: 0, x1: 2100 })
      ];
      // sand
      const sand = g(cs, { filter: 'url(#f-paper)' });
      GB.PaperShape(sand, GB.wavyBand(0, 2100, 610, 1200, 10, 300, 0.3, 9), '@sand');
      ctx.wash = GB.ShoreWash(cs, { x0: 0, x1: 2100, y: 590, reach: 46 });
      // rocks
      const rocks = g(cs, { filter: 'url(#f-paper)' });
      const rr = rng(33);
      const rockSpecs = [[120, 760, 190], [330, 700, 120], [60, 980, 220], [1600, 690, 170], [1810, 800, 230], [1450, 980, 150], [1900, 620, 140]];
      rockSpecs.forEach(([x, y, s], i) => {
        const pts = [];
        const n = 7;
        for (let k = 0; k < n; k++) {
          const a = Math.PI + (k / (n - 1)) * Math.PI;
          const kk = 0.75 + rr() * 0.4;
          pts.push([x + Math.cos(a) * s * kk, y + Math.sin(a) * s * 0.75 * kk]);
        }
        pts.push([x + s * 0.9, y + s * 0.2], [x - s * 0.9, y + s * 0.2]);
        GB.PaperShape(rocks, polyPath(pts), i % 2 ? '@rock' : '@rock-dark', { textureOpacity: 0.6 });
        GB.path(rocks, polyPath([pts[1], pts[2], pts[3], [x, y - s * 0.2]]), 'rgba(255,255,255,.12)');
      });
      // seaweed
      const weed = g(cs, { filter: 'url(#f-paper)' });
      GB.line(weed, 'M1160,900 C1220,860 1300,880 1380,840 C1420,820 1460,830 1500,800', '@hemp-dark', 10);
      GB.line(weed, 'M1210,880 l-20,-30 M1290,872 l-6,-34 M1380,842 l18,-30', '@hemp-dark', 6);
      // beads
      const beads = g(cs, { filter: 'url(#f-paper)' });
      for (let i = 0; i < 70; i++) {
        const x = 300 + rr() * 1300, y = 650 + rr() * 380;
        el('circle', { cx: x, cy: y, r: 3 + rr() * 4, style: 'fill:#f8f8f4' }, beads);
      }
      ctx.beads = beads;
      // foam fragments arriving with the wash
      ctx.frags = [];
      const fr = rng(55);
      const fragSpecs = [[520, 800, 70], [760, 900, 52], [1080, 760, 90], [1290, 930, 60], [620, 1000, 46], [1420, 720, 44]];
      fragSpecs.forEach(([x, y, s], i) => {
        const fg = g(cs, { filter: 'url(#f-paper)' });
        foamPiece(fg, randomFragment(fr, s), i);
        ctx.frags.push({ g: fg, x, y, rot: (fr() - 0.5) * 50, delay: i * 0.22 });
      });

      // hero fragment (screen-space, survives the clear-out)
      ctx.hero = g(root, { filter: 'url(#f-paper)' });
      foamPiece(ctx.hero, GB.FOAM_FRAGMENT, 99);
      ctx.heroWorld = { x: 1920 + 900, y: 820 };
    },
    update(t, ctx) {
      // stop-motion arrival of fish & ice (0.2 – 2.4)
      const nIce = GB.steps(t, 0.1, 0.9, 6);
      ctx.ice.pieces.forEach((p, i) => GB.show(p.g, i < nIce * 8 ? 1 : 0));
      ctx.fish.forEach((f, i) => {
        const p = seg(t, 0.8 + i * 0.4, 1.3 + i * 0.4, 'out');
        const b = GB.boil('fish' + i, 0.8);
        GB.place(f.g, f.x + b.x, f.y - (1 - p) * 260 + b.y, f.r + b.r, 1, p > 0 ? 1 : 0);
      });
      ctx.iceTop.pieces.forEach((p, i) => GB.show(p.g, t > 2.2 + (i % 4) * 0.1 ? 1 : 0));
      const bb = GB.boil('epsbox', 0.6);
      ctx.boxG.setAttribute('transform', GB.tf(860 + bb.x, 650 + bb.y, bb.r));

      ctx.wavesH.forEach((w) => w.update(t));
      ctx.wavesC.forEach((w) => w.update(t));
      ctx.wash.update(t * 1.4);
      const bob = Math.sin(t * 1.6);
      ctx.boat.setAttribute('transform', GB.tf(1340, 600 + bob * 5, bob * 1.4, 0.82));

      // pan harbour → coast
      const pan = seg(t, 4.9, 6.3, 'inOut');
      const clear = seg(t, 8.5, 9.4, 'in');
      ctx.world.setAttribute('transform', `translate(${(-1920 * pan).toFixed(1)},${(clear * 1250).toFixed(1)})`);

      // fragments wash ashore (stop-motion slide up the sand)
      ctx.frags.forEach((f) => {
        const p = seg(t, 6.3 + f.delay, 7.6 + f.delay, 'out');
        const b = GB.boil('frag' + f.x, 0.6);
        GB.place(f.g, f.x + b.x, f.y + (1 - p) * -170 + b.y, f.rot * p + b.r, 1, seg(t, 6.0 + f.delay, 6.4 + f.delay));
      });

      // hero fragment: arrives with the others, then lifts to the centre
      const hp = seg(t, 6.6, 7.9, 'out');
      const wx = ctx.heroWorld.x - 1920 * pan;
      let x = wx, y = ctx.heroWorld.y + (1 - hp) * -180, s = 1, rot = -14 * hp;
      const lift = seg(t, 8.4, 9.6, 'inOut');
      x = GB.lerp(x, GB.FRAGMENT_END.x, lift);
      y = GB.lerp(y, GB.FRAGMENT_END.y, lift);
      s = GB.lerp(s, GB.FRAGMENT_END.s, lift);
      rot = GB.lerp(rot, 0, lift);
      const hb = GB.boil('hero', lift >= 1 ? 0 : lift > 0 ? 1 : 0.4);
      GB.place(ctx.hero, x + hb.x, y + hb.y, rot, s, t > 4.9 ? seg(t, 6.2, 6.6) : 0);
    }
  });
})();
