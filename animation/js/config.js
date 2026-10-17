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
        { at: 0.08, to: 0.50, text: 'Sjávarafurðir þurfa vernd.' },
        { at: 0.62, to: 0.94, text: 'En hvað verður um kassann eftir notkun?' }
      ],
      narration: 'Á hverjum degi fara ferskar sjávarafurðir frá höfninni í hvítum frauðplastkössum. Þeir vernda aflann — en eftir notkun brotnar frauðið og endar of oft í fjörunni.'
    },
    {
      id: 'hemp', title: 'Hemp', duration: 12,                       // brief: 13
      transition: 'wipe',
      captions: [
        { at: 0.70, to: 0.97, text: 'Trékenndur hampstöngullinn verður að hráefni.' }
      ],
      narration: 'Grobox byrjar á hampi. Eftir uppskeru eru laufin skilin frá trékenndum stönglinum — og það er stöngullinn sem við notum.'
    },
    {
      id: 'hurds', title: 'Hemp hurds', duration: 12,                // brief: 14
      transition: 'cut',
      captions: [
        { at: 0.18, to: 0.48, text: 'Saxaður í hampstikla' },
        { at: 0.52, to: 0.74, text: 'Sigtaðir og hreinsaðir' }
      ],
      narration: 'Stönglarnir eru saxaðir í litla trékennda búta, hampstikla, og síðan sigtaðir til að fjarlægja ryk.'
    },
    {
      id: 'heat', title: 'Heat treatment', duration: 10,             // brief: 11
      transition: 'wipe-left',
      captions: [
        { at: 0.24, to: 0.60, text: 'Hitameðhöndlaðir fyrir hreina byrjun' },
        { at: 0.72, to: 0.97, text: 'Síðan kældir' }
      ],
      narration: 'Hampstiklarnir eru hitameðhöndlaðir svo svepparótin fái hreinan grunn, og síðan látnir kólna.'
    },
    {
      id: 'mycelium', title: 'Add mycelium', duration: 13,           // brief: 15
      transition: 'strips',
      captions: [
        { at: 0.16, to: 0.42, text: 'Svepparót er bætt út í' },
        { at: 0.46, to: 0.74, text: 'og blandað jafnt saman við hampinn' }
      ],
      narration: 'Næst er lifandi svepparót — rótarneti sveppa — blandað jafnt saman við hampinn.'
    },
    {
      id: 'mold', title: 'Fill the mould', duration: 15,             // brief: 15
      transition: 'cut',
      captions: [
        { at: 0.03, to: 0.20, text: 'Endurnýtanlegt Grobox-mót' },
        { at: 0.62, to: 0.80, text: 'Botn, fjórir veggir og holrými' },
        { at: 0.82, to: 0.97, text: 'Lokið er mótað sérstaklega' }
      ],
      narration: 'Blöndunni er þjappað í endurnýtanlegt mót. Innri kjarni myndar holrýmið, svo kassinn fær heilan botn og fjóra þykka, einangrandi veggi. Lokið er mótað sérstaklega.'
    },
    {
      id: 'rack', title: 'Vertical rack', duration: 10,              // brief: 10
      transition: 'cut',
      captions: [
        { at: 0.55, to: 0.97, text: 'Ræktað lóðrétt — rýmið nýtist vel' }
      ],
      narration: 'Lokuðum mótum er raðað í lóðréttar hillur, með rými fyrir loft að leika um hvert þeirra.'
    },
    {
      id: 'growth', title: 'Mycelium growth', duration: 16,          // brief: 16  (hero)
      transition: 'wipe',
      captions: [
        { at: 0.30, to: 0.55, text: 'Þræðir svepparótarinnar vaxa á milli hampstiklanna' },
        { at: 0.58, to: 0.82, text: 'og binda þá saman í heilt efni' }
      ],
      narration: 'Inni í mótinu vex svepparótin. Fínir hvítir þræðir greinast á milli hampstiklanna, vefjast um þá og tengja þá saman — náttúrulegt bindiefni sem gerir lausar trefjar að heilu efni.'
    },
    {
      id: 'demold', title: 'Demould', duration: 12,                  // brief: 14
      transition: 'cut',
      captions: [
        { at: 0.62, to: 0.96, text: 'Heill, holur kassi — og lok í stíl' }
      ],
      narration: 'Þegar vextinum er lokið er mótið opnað og kassinn kemur í ljós — þykkir veggir, holrými — ásamt lokinu.'
    },
    {
      id: 'dry', title: 'Final heat', duration: 11,                  // brief: 12
      transition: 'cut',
      captions: [
        { at: 0.22, to: 0.62, text: 'Þurrkað til að stöðva vöxtinn' },
        { at: 0.64, to: 0.96, text: 'og gera efnið stöðugt' }
      ],
      narration: 'Lokaþurrkun fjarlægir raka, stöðvar vöxtinn og gerir efnið stöðugt.'
    },
    {
      id: 'coating', title: 'Bio coating', duration: 11,             // brief: 11
      transition: 'wipe',
      captions: [
        { at: 0.30, to: 0.95, text: 'Þunn, lífrænt byggð rakavörn', sub: 'í þróun', claim: 'coatingUnderDevelopment' }
      ],
      narration: 'Mjög þunn, lífrænt byggð húð, sem er í þróun, hjálpar kassanum að standast raka.'
    },
    {
      id: 'transport', title: 'Seafood transport', duration: 12,     // brief: 12
      transition: 'wipe-left',
      captions: [
        { at: 0.04, to: 0.30, text: 'Pakkað með fiski og ís' },
        { at: 0.70, to: 0.97, text: 'Frá Íslandi á markað' }
      ],
      narration: 'Með fiski og ís flytur Grobox aflann frá Íslandi á markað.'
    },
    {
      id: 'endoflife', title: 'End of life', duration: 12,           // brief: 12
      transition: 'fade',
      captions: [
        { at: 0.06, to: 0.30, text: 'Eftir notkun' },
        { at: 0.62, to: 0.97, text: 'Hannað til lífræns niðurbrots', claim: 'biologicalEndOfLife' }
      ],
      narration: 'Eftir notkun má brjóta kassann niður og setja hann í stýrða jarðgerð — hannaður til lífræns niðurbrots.'
    },
    {
      id: 'final', title: 'Final frame', duration: 6,                // brief: 5–6
      transition: 'cut',
      captions: [],
      narration: 'Grobox. Ræktað til að vernda. Hannað til að snúa aftur.'
    }
  ],

  transitionDuration: 0.9,

  // Final title copy (scene 14).
  title: 'GROBOX',
  tagline: ['Ræktað til að vernda.', 'Hannað til að snúa aftur.']
};
