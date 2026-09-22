# Home page: the scroll-driven intro film and the origin clip

## Hero film

The hero is pinned with `position: sticky` for the height of `.hero` (280svh,
220svh in portrait) and `static/js/hero-film.js` maps the page's scroll position
onto a frame of the film. Scrolling is watching, so the whole fifteen seconds is
visible however fast someone moves. This replaces the earlier autoplay, where the
film finished before a visitor had scrolled far enough to see it.

### The stills (what every current browser gets)

Since asset version 132 the film is **450 AVIF stills** drawn on a `<canvas>`
(`#frames`), one for every second frame of the 60 fps master, under
`static/defex/frames/1920/f0000.avif … f0449.avif` (1920×1080, 9.3 MB) and
`static/defex/frames/1440/` (1440×810, for anything whose short side is 820px or
less). The frame shown is a pure function of the scroll position, computed on
every animation frame: nothing is seeked, nothing is buffered, nothing waits on
a decoder. The old `<video>` scrub is still in the file as the fallback for a
browser that cannot decode AVIF (the first still failing to load is the probe),
and is what the mock-DOM tests exercise.

Why the change. Traced on the real GPU (`--use-angle=metal`, headless Chromium
1243, 1440×900 at 2×), the video scrub landed each seek in 6 ms, which sounds
fine, but:

| | seek-scrubbed `<video>` | stills on a canvas |
|---|---|---|
| main-thread `Paint` events in a 15 s trackpad scroll of the hero | 505 (the masked video repainted on every seek) | 4 |
| distinct frames shown for 1357 px of trackpad travel | ~80 | 190, one per display frame |
| film frames per 100 px mouse click | one jump of ~31 | steps of ≤ 8, glided over ~110 ms |
| CLS on load | 0.099 (`.hero` grew to 280svh when the deferred script ran) | 0 (the class is set by an inline script in `<head>`) |
| a fast flick past the film | seeks into an unbuffered range stall up to 400 ms | the nearest loaded still stands in |
| Safari, Firefox | seek latency and GOP decode differ per engine | identical everywhere |

The stills stream in coarse to fine (every 32nd frame, then the 16ths, the 8ths
and so on, six in flight, the frames just ahead of the scroll first), so a fast
first scroll finds a frame every few hundred pixels within a second and the gaps
fill as it goes. Only the window around the shown frame is decoded
(`img.decode()` ahead of time); the browser's own image cache holds the rest
compressed, about 9 MB, which is less than the MP4 was.

**Every mouse is a different speed.** A trackpad or Magic Mouse sends a dense
stream of small fractional deltas; a notched wheel sends one whole step of 53,
100 or 120 px per click, which most browsers animate over ~150 ms but not all,
and not on every setting; touch has its own momentum; keys and anchors jump.
`hero-film.js` classifies the input from the `wheel` events it sees
(`deltaMode`, whole-number deltas of 40 px or more with 30 ms or more between
them, `wheelDeltaY` in multiples of 120) and from `touchstart`/`keydown`, and
follows the scroll through an exponential lag whose time constant depends on
the class: 45 ms for precise input (near-literal), 110 ms for a notched wheel
(so one click's 15 frames glide rather than jump), 60 ms for keys. A jump of
more than 60 frames (an anchor, Home, a scrollbar drag) snaps instead of
gliding through two seconds of film.

The top and bottom dissolve of the film's box is two gradient bands
(`.hero__screen::before/::after`) laid over it, **not** a `mask-image` on the
element: a mask on a `<video>` or a `<canvas>` makes Chrome paint the element
itself through the mask on the main thread for every new frame, and that was
most of what the page did while the hero scrolled.

Encoding the stills, from the master, never from a shipped file:

```bash
SRC=~/Downloads/defex-intro.mp4
mkdir -p png1920 png1440
ffmpeg -i "$SRC" -vf "select='not(mod(n\,2))',scale=1920:1080" -vsync vfr -start_number 0 png1920/f%04d.png
ffmpeg -i "$SRC" -vf "select='not(mod(n\,2))',scale=1440:810:flags=lanczos" -vsync vfr -start_number 0 png1440/f%04d.png
for f in png1920/*.png; do b=$(basename "$f" .png); ffmpeg -y -i "$f" -c:v libsvtav1 -crf 33 -preset 5 -svtav1-params tune=0:film-grain=0 -pix_fmt yuv420p -f avif static/defex/frames/1920/$b.avif; done
for f in png1440/*.png; do b=$(basename "$f" .png); ffmpeg -y -i "$f" -c:v libsvtav1 -crf 35 -preset 5 -svtav1-params tune=0:film-grain=0 -pix_fmt yuv420p -f avif static/defex/frames/1440/$b.avif; done
```

Measured on this footage (decoded by Chrome, scored by ffmpeg against the PNG
source, the same path for every row, so the numbers compare with each other
and not with the SSIM table below): AVIF at crf 30 scored 0.934–0.967 SSIM and
42–45 dB at ~29 KB a frame; WebP at q75 scored 0.888–0.924 and 33 dB at ~58 KB.
At crf 33 the 1920 set is 9.3 MB. `landing/tests.py::test_hero_stills_stay_within_budget`
caps the two sets at 11 MB and 8 MB and pins the count at 450.

`data-frame-count`, `data-frame-size`, `data-frame-size-sm`, `data-frames` and
`data-frames-sm` on the `<video>` tell the script what is there. The count is
what maps scroll to frame, so it must match the files.

### The video (the fallback)

| Path | What |
|---|---|
| `static/defex/assets/defex-intro-v4.mp4` | 1920×1080, 60 fps, H.264 High in MP4, silent, 15 s, 900 frames, **GOP 12**, 12.4 MB |
| `static/defex/assets/defex-intro-v4-sm.mp4` | The same film at 1440×810, 7.0 MB. Goes to anything whose short side is 820px or less |
| `static/defex/assets/defex-poster-v4.webp` | Frame 0 of the film: the poster, and the fallback wherever the film cannot play |
| `static/defex/assets/defex-poster-final-v4.webp` | The last frame. Swapped in as the poster for reduced-motion visitors, who download no film at all |
| `static/js/hero-film.js` | Scroll-to-frame mapping |

Encode from the master at `~/Downloads/defex-intro.mp4` (1920×1080, 60 fps, sparse
GOP, 9.5 MB), never from a shipped file. Everything under `static/` is a
generation down from it.

### Sizing, and why it is not all-intra any more

The predecessor was 1920×1080 60 fps VP9, all-intra, at **34.5 MB**, with no
narrow build. The reasoning recorded here was that the scrub is nothing but
seeks, so every frame had to be a keyframe. That was tested against only one
alternative: an encode with 8 keyframes in 900 frames, whose seeks took 244 ms.
Nothing in between was ever measured, and the middle is where this lives.

Measured on this footage, against the master, at a fixed CRF:

| Encode | SSIM vs master | Size |
|---|---|---|
| VP9 1080p60 all-intra (what shipped) | 0.99557 | 32.9 MB |
| H.264 1080p60 all-intra | 0.99484 | 31.6 MB |
| H.264 1080p60 GOP 4 | 0.99566 | 16.1 MB |
| **H.264 1080p60 GOP 12 (shipped)** | **0.99584** | **12.4 MB** |
| H.264 720p30 all-intra | 0.99043 | 7.3 MB |

A moderate GOP is not a quality compromise. It scores *higher* than all-intra at
the same CRF, because the bits all-intra spends re-encoding a near-static shot
buy nothing, and it is a third of the size. Dropping resolution or frame rate,
by contrast, is a real and visible loss: the 720p30 row is the worst of the set
and it is the one a Retina display exposes, because the film renders at about
1180 CSS px, which is 2360 device px at 2×.

Seeking was then A/B tested on the real page in Chrome, sweeping the hero slowly
and with a hard flick, comparing the shipped GOP 12 file against the same film
all-intra:

| | GOP 12 | all-intra |
|---|---|---|
| Median lag behind the scroll | 0.053 s | 0.053 s |
| Worst lag | 0.093 s | 0.093 s |
| Frames dropped | 0 | 0 |

Identical. The residual lag is the `EASE` smoothing in `hero-film.js`, not the
decoder. GOP 12 decodes more frames per seek (3447 against 1458 over the same
sweep) and it costs nothing measurable.

So: **hold 1920×1080 and 60 fps, and buy the size back from the GOP.** If the
film ever needs to be smaller again, raise the GOP or re-cut the near-static
hold at seconds 7 to 12. Do not drop the resolution or the frame rate.

`landing/tests.py::test_hero_assets_stay_within_budget` caps these at 14 MB and
8 MB.

### Frame rate

`data-fps` on the video element must match the file (60). The video scrub seeks to
multiples of `1/FPS`; a value below the file's real rate lands between frames and
most of them never render. At 60 fps over the 280svh of travel the scrub advances
a frame roughly every 4px of scroll, which is what keeps a slow drag smooth. `hero-film.js` seeks to `(frame + .5) / FPS` because
container timestamps round, and an exact frame boundary can land on the frame
before. The scrub ends at `duration - 1/FPS`, which is the final-frame hold, not
a bug.

### Re-encoding

```bash
SRC=~/Downloads/defex-intro.mp4
ffmpeg -i "$SRC" -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -x264-params "keyint=12:min-keyint=12:scenecut=0:bframes=0" -crf 19 -preset veryslow \
  -movflags +faststart -an static/defex/assets/defex-intro-v4.mp4
ffmpeg -i "$SRC" -vf "scale=1440:810:flags=lanczos" -c:v libx264 -profile:v high -pix_fmt yuv420p \
  -x264-params "keyint=12:min-keyint=12:scenecut=0:bframes=0" -crf 20 -preset veryslow \
  -movflags +faststart -an static/defex/assets/defex-intro-v4-sm.mp4
```

`bframes=0` matters: B-frames are decoded out of order and a seek has to resolve
them, which is exactly the cost the scrub cannot pay. `keyint` is the dial for
size. `scenecut=0` keeps the interval fixed so the worst-case seek is bounded.

### Posters

The poster must be frame 0, never the last frame. It is what a slow connection
shows, and an earlier build used the final frame, which made the hero look like
the film had already finished. Regenerate both from the **shipped** file, not the
master, so the poster and the first painted frame are the same pixels:

```bash
ffmpeg -i static/defex/assets/defex-intro-v4.mp4 -vf "select=eq(n\,0)" -vframes 1 f0.png
ffmpeg -sseof -0.1 -i static/defex/assets/defex-intro-v4.mp4 -update 1 -vframes 1 f1.png
cwebp -q 90 f0.png -o static/defex/assets/defex-poster-v4.webp
cwebp -q 90 f1.png -o static/defex/assets/defex-poster-final-v4.webp
```

(Homebrew's ffmpeg is built without a WebP encoder, hence the two steps.)

### Browser support

H.264 High profile in MP4 decodes in every current browser, in every in-app
webview, and in hardware on effectively every phone. The previous file was VP9 in
WebM, which Safari before 14.1, iOS before 17.4 and most in-app webviews cannot
decode, so anyone opening a shared link from Telegram, LinkedIn or X got a static
poster and nothing else. The `data-type` gate in `hero-film.js` is kept as a guard
for whatever ships next, but with MP4 it should never fire.

### What runs for every visitor

The topbar is dark over the hero and paper once past it, driven by the
`past-hero` class. That wiring sits **above** the early returns in
`hero-film.js`, because it is true whether or not the visitor gets a film. When it
lived inside the film branch, reduced-motion visitors and anyone whose browser
could not decode the file read the whole page through a dark bar sitting on the
paper ground.

Reduced-motion visitors get the final-frame poster, no sticky section and **no
film download**: `.hero` only becomes 280svh with `has-scroll-film`, which an
inline script in `home.html`'s head adds before first paint (so the page does
not shift when the deferred script gets round to it) and which `hero-film.js`
removes again if the film cannot run.

### Seeking

`hero-film.js` keeps one seek in flight at a time. Assigning `currentTime` on every
scroll frame queues seeks the decoder never catches up with, so a new seek is
only issued once `seeked` has fired. A watchdog clears the flag after 400 ms in
case the event is swallowed. iOS will not paint a seek until the element has
decoded once, so the first pointer or touch event does a muted `play()`/`pause()`
to unlock it.

## Theme

The whole site is dark in the hero and paper below it. `site.css` holds the
palette. Note that the film's own backdrop is close to `#030303`, not the page's
`#090F15`, so in landscape there is a faint seam where the letterboxed film meets
the section ground. The top and bottom mask gradients hide it at those edges.

## Checks

`python manage.py test` covers the pages, the hero assets and their size budget,
the share card, and byte ranges. `node --check` runs over the front-end scripts in CI.

Test the scrub under `DEBUG=False` and gunicorn, never `runserver`: the dev
server does not serve byte ranges, so the video reports `seekable: [0, 0]` and
sits frozen at 0 s however far you scroll. With `DEBUG=False`,
`SECURE_SSL_REDIRECT` is on, so local requests need
`-H "X-Forwarded-Proto: https"` or they 301.

## Serving and caching

`vercel.json` publishes `static/**` through `@vercel/static`, so **/static/ never
reaches Django in production** and WhiteNoise's `WHITENOISE_ADD_HEADERS_FUNCTION`
does not run there. It still runs under gunicorn and in the tests, which is what
`test_pages_and_analyze` asserts against.

Because of that, cache headers for production live in `vercel.json`, not in
`settings.py`. There are two header routes and **order matters**: the general
`/static/(.*)` rule is listed first and the `/static/defex/(.*)` rule second, so
the more specific one overwrites it (both carry `"continue": true`, and the last
matching rule wins). Before the general rule existed, `site.css` and
`hero-film.js` came back `max-age=0, must-revalidate` and revalidated on every
single visit.

`DEFEX_ASSET_VERSION` is appended to every asset URL. Bump its default **and any
Vercel environment-variable override** whenever a file changes; an override
pinned to an old number silently serves stale assets. The share card
(`static/img/og.jpg`) carries it too, because Telegram, LinkedIn and X cache
`og:image` hard and will otherwise keep showing the previous card.

Range requests must stay enabled on the hero MP4s. The stills sit under
`static/defex/`, so the second header route covers them too (a day at the
browser, a year at the edge).
