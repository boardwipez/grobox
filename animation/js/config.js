/* =============================================================================
   GROBOX — film configuration
   -----------------------------------------------------------------------------
   This is the ONLY file you need to touch to re-time the film.

   • duration   – seconds the scene occupies in the final film. Change it freely:
                  every scene is authored on its own internal clock ("design"
                  seconds, see the scene file) and is stretched/compressed to fit.
   • transition – how this scene hands over to the NEXT one:
                  'cut' | 'wipe' | 'wipe-left' | 'strips' | 'fade'
                  (`transitionDuration` = seconds, centred on the boundary)
   • captions   – on-screen copy. `at` / `to` are FRACTIONS of the scene
                  (0 = scene start, 1 = scene end) so they survive re-timing.
   • narration  – reference voice-over text for each scene (not drawn).

   The brief's original durations sum to 2:51. To hit ~2:40 (leaving room for
   ~19 s of live-action intro inside a 3:00 presentation) a few scenes are
   trimmed by 1–2 s; the brief value is noted in each comment.
   ========================================================================== */

window.GB = window.GB || {};

GB.config = {
  // ---- output ---------------------------------------------------------------
  width: 1920,
  height: 1080,

  // Stop-motion stepping: objects advance at this many poses per second
  // ("shooting on twos" at 24 fps = 12). Set 0 for perfectly smooth motion.
  stopMotionFps: 12,

  // Tiny per-pose hand-placement jitter ("boil") in px. 0 disables it.
  boil: 0.7,

  // Render quality. 'high' = full paper shadows & mycelium haze (use for export).
  // 'fast' = hard-edged shadows, no blur haze — for live playback on slow
  // machines. Also switchable from the URL: ?quality=fast
  quality: 'high',

  // Development UI (scene navigator + player chrome).
  // Also switchable from the URL:  ?dev=0   ?ui=0   ?export=1
  devMode: true,
  showPlayerControls: true,
  showCaptions: true,
  autoplay: true,
  loop: false,

  // Wording safety. Only claims listed here may appear on screen.
  // Leave the risky ones false until verified data is supplied.
  claims: {
    bioBased: true,
    madeFromHempAndMycelium: true,
    biologicalEndOfLife: true,
    coatingUnderDevelopment: true,
    // keep OFF unless verified:
    fullyBiodegradable: false,
    waterproof: false,
    compostTimeDays: null,   // e.g. 40 → shows "compostable in 40 days"
    zeroWaste: false
  },

  // ---- scenes ---------------------------------------------------------------
  scenes: [
    {
      id: 'problem', title: 'The problem', duration: 10,           // brief: 10
      transition: 'cut',
      captions: [
        { at: 0.08, to: 0.50, text: 'Seafood needs protection.' },
        { at: 0.62, to: 0.94, text: 'But what happens after the box is used?' }
      ],
      narration: 'Every day, fresh seafood leaves the harbour packed in white foam boxes. They protect the catch — but once used, the foam breaks apart and too often ends up on the shore.'
    },
    {
      id: 'hemp', title: 'Hemp', duration: 12,                       // brief: 13
      transition: 'wipe',
      captions: [
        { at: 0.70, to: 0.97, text: 'The woody hemp stalk becomes our raw material.' }
      ],
      narration: 'Grobox starts with hemp. After harvest, the leaves are separated from the woody stalk — and that stalk is the part we use.'
    },
    {
      id: 'hurds', title: 'Hemp hurds', duration: 12,                // brief: 14
      transition: 'cut',
      captions: [
        { at: 0.18, to: 0.48, text: 'Chopped into hemp hurds' },
        { at: 0.52, to: 0.74, text: 'Screened and cleaned' }
      ],
      narration: 'The stalks are chopped into small woody pieces called hemp hurds, then screened to remove dust.'
    },
    {
      id: 'heat', title: 'Heat treatment', duration: 10,             // brief: 11
      transition: 'wipe-left',
      captions: [
        { at: 0.24, to: 0.60, text: 'Heat-treated for a clean start' },
        { at: 0.72, to: 0.97, text: 'Then cooled' }
      ],
      narration: 'The hurds are heat-treated so the mycelium starts on a clean base, then allowed to cool.'
    },
    {
      id: 'mycelium', title: 'Add mycelium', duration: 13,           // brief: 15
      transition: 'strips',
      captions: [
        { at: 0.16, to: 0.42, text: 'Mycelium culture is added' },
        { at: 0.46, to: 0.74, text: 'and mixed evenly through the hemp' }
      ],
      narration: 'Next, a living mycelium culture — the root network of fungi — is mixed evenly through the hemp.'
    },
    {
      id: 'mold', title: 'Fill the mould', duration: 15,             // brief: 15
      transition: 'cut',
      captions: [
        { at: 0.03, to: 0.20, text: 'A reusable Grobox mould' },
        { at: 0.62, to: 0.80, text: 'Bottom, four walls, hollow centre' },
        { at: 0.82, to: 0.97, text: 'The lid is moulded separately' }
      ],
      narration: 'The mixture is packed into a reusable mould. An inner core forms the hollow centre, giving the box a solid bottom and four thick, insulating walls. The lid is moulded separately.'
    },
    {
      id: 'rack', title: 'Vertical rack', duration: 10,              // brief: 10
      transition: 'cut',
      captions: [
        { at: 0.55, to: 0.97, text: 'Grown vertically — compact use of space' }
      ],
      narration: 'Closed moulds are stacked on vertical racks, with space for air to move around each one.'
    },
    {
      id: 'growth', title: 'Mycelium growth', duration: 16,          // brief: 16  (hero)
      transition: 'wipe',
      captions: [
        { at: 0.30, to: 0.55, text: 'Mycelium threads grow between the hemp pieces' },
        { at: 0.58, to: 0.82, text: 'binding them into one solid material' }
      ],
      narration: 'Inside, the mycelium grows. Fine white threads branch between the hemp pieces, wrap around them and connect them — a natural binder that turns loose fibres into one solid material.'
    },
    {
      id: 'demold', title: 'Demould', duration: 12,                  // brief: 14
      transition: 'cut',
      captions: [
        { at: 0.62, to: 0.96, text: 'A solid, hollow box — with a matching lid' }
      ],
      narration: 'When growth is complete, the mould opens to reveal the box — thick walls, hollow centre — and its matching lid.'
    },
    {
      id: 'dry', title: 'Final heat', duration: 11,                  // brief: 12
      transition: 'cut',
      captions: [
        { at: 0.22, to: 0.62, text: 'Dried to stop growth' },
        { at: 0.64, to: 0.96, text: 'and stabilise the material' }
      ],
      narration: 'A final drying step removes moisture, stops the growth and stabilises the material.'
    },
    {
      id: 'coating', title: 'Bio coating', duration: 11,             // brief: 11
      transition: 'wipe',
      captions: [
        { at: 0.30, to: 0.95, text: 'A thin bio-based moisture-resistant coating', sub: 'under development', claim: 'coatingUnderDevelopment' }
      ],
      narration: 'A very thin bio-based coating, currently under development, helps the box resist moisture.'
    },
    {
      id: 'transport', title: 'Seafood transport', duration: 12,     // brief: 12
      transition: 'wipe-left',
      captions: [
        { at: 0.04, to: 0.30, text: 'Packed with fish and ice' },
        { at: 0.70, to: 0.97, text: 'From Iceland to market' }
      ],
      narration: 'Packed with fish and ice, Grobox carries the catch from Iceland to market.'
    },
    {
      id: 'endoflife', title: 'End of life', duration: 12,           // brief: 12
      transition: 'fade',
      captions: [
        { at: 0.06, to: 0.30, text: 'After use' },
        { at: 0.62, to: 0.97, text: 'Designed for biological end-of-life', claim: 'biologicalEndOfLife' }
      ],
      narration: 'After use, the box can be broken up and returned to a controlled composting process — designed for biological end-of-life.'
    },
    {
      id: 'final', title: 'Final frame', duration: 6,                // brief: 5–6
      transition: 'cut',
      captions: [],
      narration: 'Grobox. Grown to protect. Designed to return.'
    }
  ],

  transitionDuration: 0.9,

  // Final title copy (scene 14).
  title: 'GROBOX',
  tagline: ['Grown to protect.', 'Designed to return.']
};
