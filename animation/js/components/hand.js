/* =============================================================================
   PaperHand — simple cut-paper hand with a hemp-green sleeve (as in the
   reference boards). Origin = centre of the palm; the sleeve extends toward
   +x (hand reaching in from the right). Use rotate/scale(-1,1) to mirror.
   ========================================================================== */
(function () {
  const { g } = GB;

  GB.PaperHand = function (parent, o) {
    o = Object.assign({ pose: 'grip', scale: 1, filter: 'paper' }, o || {});
    const grp = g(parent, o.filter ? { filter: `url(#f-${o.filter})` } : {});
    const inner = g(grp, { transform: `scale(${o.scale})` });
    // sleeve
    GB.PaperShape(inner, 'M40,-46 L330,-58 L330,58 L40,50 Q30,0 40,-46Z', '#4e6a55', { textureOpacity: 0.4 });
    GB.path(inner, 'M40,-46 Q30,0 40,50 L56,50 Q46,0 56,-46Z', '#425b48');
    // palm
    if (o.pose === 'grip') {
      GB.PaperShape(inner, 'M44,-36 C10,-46 -34,-40 -52,-22 C-62,-8 -60,14 -48,26 C-30,40 10,44 44,34Z', '@skin', { textureOpacity: 0.35 });
      // curled fingers (front)
      for (let i = 0; i < 4; i++) {
        const y = -26 + i * 15;
        GB.path(inner, `M-40,${y} q-22,2 -22,8 q0,6 22,6Z`, '@skin-dark', { opacity: 0.9 });
      }
      // thumb
      GB.PaperShape(inner, 'M-10,-40 C-30,-62 -58,-64 -66,-52 C-70,-44 -48,-38 -30,-28Z', '@skin', { textureOpacity: 0.35 });
    } else {
      // open / pointing
      GB.PaperShape(inner, 'M44,-34 L-20,-38 L-92,-30 Q-100,-22 -92,-16 L-30,-14 L-90,-6 Q-98,2 -90,8 L-26,10 L-80,20 Q-86,28 -78,32 L-10,34 L44,32Z', '@skin', { textureOpacity: 0.35 });
      GB.PaperShape(inner, 'M0,-36 C-14,-60 -40,-66 -48,-56 C-52,-48 -30,-42 -16,-30Z', '@skin', { textureOpacity: 0.35 });
    }
    return grp;
  };
})();
