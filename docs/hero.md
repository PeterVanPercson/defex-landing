# Home-page hero: intro film + interactive 3D robot

The hero is the `<defex-robot>` web component in `static/defex/`. It shows the
poster, plays the five-second ray-traced intro (robot → optical zoom into the
eye → "ultra inspection" → return), then crossfades to a live three.js model of
the same robot. Visitors rotate it by dragging or using the arrow keys after the scroll sequence.

## Files

| Path | What |
|---|---|
| `static/defex/defex-robot.js` | The component, three.js and the Meshopt decoder bundled (classic script, defines `<defex-robot>`) |
| `static/defex/assets/defex-intro.mp4` | 1920×1080, 30 fps, H.264, silent, 5 s, faststart |
| `static/defex/assets/defex-robot.glb` | 217k-triangle model, 14 material groups, Meshopt-compressed |
| `static/defex/assets/defex-poster.jpg` | Frame 0 of the film |
| `static/defex/*LICENSE*.txt`, `*.LEGAL.txt` | three.js / meshoptimizer notices (MIT) |
| `static/img/og.jpg` | Social card: 1200×630 crop of the "ultra inspection" still |

Editable sources live outside the repo (Blender scenes, render plates, the
compositor and the component source):
`~/Downloads/defex-ultra-inspection-source/` (film) and
`~/Downloads/bf2b8420-4670-4b2b-96c9-5a121c71cc01/` (component, `npm ci && npm run build`).

## Interaction

The opening plays automatically to the lens at 1.65 seconds. Scrolling through
`.hero` then seeks through the rest of the film, reveals the headline, and
hands off to the live model. Scrolling back restores the corresponding film
frame. Hover tracking and automatic orbit are disabled; drag and arrow keys
rotate the model after the handoff. Replay/Pause controls and the toolbar gap
are hidden. Reduced-motion visitors see the still model and headline without
the extended sticky scroll section.

The page and the feathered, frameless stage share a neutral gray background.
`static/js/robot-scroll.js` maps page progress to `setScrollProgress()` and the
headline opacity. `frontend/robot/defex-robot.js` is the editable component.

## Build and checks

Run `npm ci --prefix frontend/robot`, then
`npm run build --prefix frontend/robot`. Commit the generated component and
license notice in `static/defex/`. Run
`node --test frontend/robot/defex-robot.test.js` and `python manage.py test`.

## Serving and caching

WhiteNoise serves the assets through the existing Vercel Python function.
`DEFEX_ASSET_VERSION` is appended to media/component URLs; bump its default
and any environment override whenever those assets change. The CSS also has
an explicit version in `templates/base.html`.
