# Home-page hero: intro film + interactive 3D robot

The hero is the `<defex-robot>` web component in `static/defex/`. It shows the
poster, plays the five-second ray-traced intro (robot → optical zoom into the
eye → "ultra inspection" → return), then crossfades to a live three.js model of
the same robot. Visitors rotate it 360° by moving the mouse across it, dragging
on touch, or with the arrow keys. Space pauses the orbit, R replays the intro.

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

## Serving and caching

Everything is served by WhiteNoise from the Vercel Python function, same as the
rest of `/static/`. Files under `/static/defex/` get
`Cache-Control: public, max-age=86400, s-maxage=31536000` (see
`WHITENOISE_ADD_HEADERS_FUNCTION` in `config/settings.py`), so Vercel's edge
keeps them for a year. The templates append `?v={{ asset_v }}`; **bump
`DEFEX_ASSET_VERSION` in settings (or the env var) whenever a file in
`static/defex/` changes**, otherwise browsers and the edge keep the old one.

## Page integration

`templates/landing/home.html` passes explicit `video-src`, `model-src` and
`poster-src` attributes, so the component does not depend on resolving
`assets/` next to its script URL. The light-DOM `<img>` inside the element is
the no-JS / pre-upgrade fallback. On viewports ≤700px `static/css/site.css`
switches the stage to a square (`--defex-aspect-ratio: 1 / 1`) with a backdrop
gradient tuned to the film's top and bottom edge colours.

## Checking it

`python3 manage.py test` asserts the assets are served with the long-cache
header. For a visual pass without the Chrome extension, run a headless Chrome
with `--use-angle=swiftshader --enable-unsafe-swiftshader` via puppeteer-core
and poll `document.querySelector('defex-robot').getState().phase` until it is
`interactive`, then drag across the stage and confirm `rotationDegrees` changed.
