# GROBOX — paper stop-motion explainer

A 2 min 42 s, 1920 × 1080 animated explainer for GROBOX, built as a handmade cut-paper
tabletop set in SVG, HTML, CSS and JavaScript. It has no WebGL and no animation library, and
the only runtime dependency is a modern browser.

```
animation/
  index.html            player page (film + controls + dev navigator)
  styles.css            palette & paper settings (CSS variables)
  js/config.js          ← scene order, durations, captions, narration, claims
  js/timeline.js        master timeline, transitions, captions
  js/main.js            boot, preload, player, dev UI, export API
  js/lib/core.js        SVG helpers, easing, seeded random, geometry
  js/components/        PaperShape, PaperShadow, PaperLabel (paper.js), Grobox,
                        Mold, Rack, HempHurd/HempPlant (hemp.js), MyceliumNetwork,
                        Fish, Wave, Airflow, PaperHand, props (trays, chamber, …)
  js/scenes/            scene01_problem.js … scene14_final.js
  assets/paper-textures procedurally generated paper/fibre/hurd textures
  assets/fonts          Space Grotesk + Inter (OFL), embedded in fonts.css
  tools/                export-frames.mjs, make-textures.py, snap.mjs
```

## Run it

Double-click `index.html`. It works from `file://` because fonts are embedded and every
script is a classic script. You can also serve the folder:

```
npm run serve        # http://localhost:8080
```

**Player:** use Play/Pause, Restart, the scrubber (ticks mark scene starts) and Fullscreen.
The keyboard shortcuts are: Space plays or pauses, ←/→ steps 1 s (with Shift, 5 s), `[` and
`]` go to the previous or next scene, `R` restarts and `F` toggles fullscreen.

**Dev navigator** (bottom bar) has Previous scene, Next scene, Replay scene, Play full film and
a scene picker. It shows the scene number, scene name, scene time and film timestamp.

URL switches:

| URL | effect |
| --- | --- |
| `?dev=0` | hide the dev navigator (or set `devMode: false` in `config.js`) |
| `?ui=0` | hide all UI, so the bare film fills the window (for screen capture) |
| `?export=1` | bare 1920×1080 stage, paused, exposes `GROBOX.renderAt(t)` |
| `?scene=growth` or `?scene=8` | start at a scene |
| `?t=95.5` | start at a time in seconds |
| `?quality=fast` | lighter shadows and no mycelium haze, for slow machines |

To turn the dev UI off before handing the film over, set `devMode: false` in `js/config.js`.
Use `showPlayerControls: false` to hide the player bar as well.

## Changing timing

Everything lives in **`js/config.js`**:

```js
{ id: 'growth', title: 'Mycelium growth', duration: 16, transition: 'wipe',
  captions: [{ at: 0.30, to: 0.55, text: 'Mycelium threads grow between the hemp pieces' }],
  narration: '…' }
```

* **`duration`** sets seconds in the final film. You can change it freely. Each scene is
  authored on its own internal clock (`design:` in the scene file), and the timeline stretches
  or compresses it to fit, so no animation code needs rewriting.
* **`transition`** sets the hand-over to the next scene: `cut`, `wipe`, `wipe-left`, `strips`
  (staggered paper strips) or `fade`. `transitionDuration` sets the length of all transitions.
* **`captions`** (Icelandic) are positioned as fractions of the scene (0 to 1), so they stay in sync when
  you re-time. Set `showCaptions: false` to remove all on-screen copy (for example, if the
  voice-over carries it).
* **`showCaptions`** / **`showLabels`** are both `false`: the film carries no boxed text and is
  meant for voice-over. Set either to `true` to bring the captions or in-scene tags back.
* **`narration`** is reference voice-over text for each scene. It is not drawn.
* **`stopMotionFps`** is the number of poses per second (default 12, "on twos" at 24 fps). Set
  it to 0 for perfectly smooth motion. **`boil`** sets the hand-placed jitter in px.

Current runtime is 162 s (2:42). The brief's durations summed to 2:51, so six scenes were
trimmed by 1–2 s each to leave room for about 19 s of live-action intro inside 3:00: Hemp,
Heat and Final heat lost 1 s, and Hurds, Add mycelium and Demould lost 2 s. Each brief value is
noted in a comment in `config.js`.

### Claims / wording

`claims` in `config.js` gates wording. Only safe wording is enabled ("bio-based",
"developed from hemp and mycelium", "designed for biological end-of-life", "coating under
development"). `compostable` ("jarðgeranlegar umbúðir", end-of-life scene) was enabled at the client's request.
`fullyBiodegradable`, `waterproof`, `compostTimeDays` and `zeroWaste` are off, and no scene
shows them. A caption tagged `claim: 'xyz'` only appears when that claim
is `true`.

### Look & feel

Colours, shadow depth, texture strength, grain and playback speed are CSS variables at the top
of `styles.css` (`--shadow-depth`, `--texture-intensity`, `--grain-opacity`, `--anim-speed`, the
palette…). The paper textures are generated, seeded, by `python3 tools/make-textures.py`
(needs Pillow and NumPy).

## Export the final 1920 × 1080 video

Use the frame-accurate exporter rather than screen recording. It renders every frame with
`GROBOX.renderAt(t)`, so the result is identical on any machine, with no dropped frames.

```
cd animation
npm install                       # installs Playwright (once)
npx playwright install chromium   # once, if you don't have it
node tools/export-frames.mjs --mp4               # → export/frames/*.png + export/grobox.mp4
node tools/export-frames.mjs --fps 25 --mp4      # PAL / 25 fps edit
node tools/export-frames.mjs --prores            # ProRes 422 HQ .mov for your editor
node tools/export-frames.mjs --from 82 --to 98   # just one section (here: the growth scene)
```

You need `ffmpeg` on your PATH for `--mp4` and `--prores`; without it you still get the PNG
sequence. Frames between stop-motion poses are duplicated rather than re-rendered, so export
is about twice as fast as the frame count suggests. Use `--workers 4` on a 4+ core machine.

If you prefer a live screen recording (OBS, QuickTime), open `index.html?ui=0` in Chrome, go
fullscreen (`F`) on a 1920 × 1080 display and play. On slower machines add `&quality=fast`.

## Scene map (film time)

| # | scene | start | dur |
| - | ----- | ----- | --- |
| 1 | The problem: harbour, EPS box, foam on the shore | 0:00 | 10 |
| 2 | Hemp: fragment flips to leaf, plant, harvest, stalk | 0:10 | 12 |
| 3 | Hemp hurds: chop, screen, tray | 0:22 | 12 |
| 4 | Heat treatment (orange paper waves), cooling | 0:34 | 10 |
| 5 | Add mycelium: pour + paddle mix, legend | 0:44 | 13 |
| 6 | Fill the mould: exploded view, cross-section, lid mould | 0:57 | 15 |
| 7 | Vertical rack: slide in, pull back | 1:12 | 10 |
| 8 | **Mycelium growth** (hero): push in, torn window, macro growth, out | 1:22 | 16 |
| 9 | Demould: plate, core, lower mould away; box + lid | 1:38 | 12 |
| 10 | Final heat / drying | 1:50 | 11 |
| 11 | Bio coating (spray, matte) | 2:01 | 11 |
| 12 | Seafood transport: pack, pallet, truck, map | 2:12 | 12 |
| 13 | End of life: break, compost tray, water, sprout | 2:24 | 12 |
| 14 | Final frame: GROBOX, tagline, hold | 2:36 | 6 |

## How the hero scene works

`MyceliumNetwork` (`js/components/mycelium.js`) packs irregular hemp-hurd chips, then grows
hyphae once at load with a seeded simulation:

* Tips wander with smooth curvature and branch now and then.
* A tip that meets a chip slides along its edge (wrapping).
* Some tips cross over chips; these are drawn on top.
* Crowded cells stop growth, so the network fills evenly.
* Bridge strands tie neighbouring chips together.
* Late in growth, a felt of short threads and a soft haze densify the web.

`update(p)` reveals the network for growth progress `p` with `stroke-dashoffset`, so the
result is deterministic and scrubbable. The hemp chips never move or swell. To change the
look, edit the options passed in `scene08_growth.js` (`seeds`, `budget`, `felt`, `maxDensity`)
and the `packChips` settings.
