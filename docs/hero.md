# Home page: the scroll-driven intro film and the origin clip

## Hero film

The hero is a plain `<video>` that is **never played**. It is pinned with
`position: sticky` for the height of `.hero` (560svh, 400svh in portrait) and
`static/js/hero-film.js` maps the page's scroll position onto `video.currentTime`.
Scrolling is watching, so the whole fifteen seconds is visible however fast
someone moves. This replaces the earlier autoplay, where the film finished before
a visitor had scrolled far enough to see it.

| Path | What |
|---|---|
| `static/defex/assets/defex-intro-v3.mp4` | 1280×720, 30 fps, H.264 High in MP4, silent, 15 s, 450 frames, **every frame a keyframe**, 7.3 MB |
| `static/defex/assets/defex-intro-v3-sm.mp4` | The same film at 854×480, 4.1 MB. Goes to anything whose short side is 820px or less |
| `static/defex/assets/defex-poster-v3.webp` | Frame 0 of the film: the poster, and the fallback wherever the film cannot play |
| `static/defex/assets/defex-poster-final-v3.webp` | The last frame. Swapped in as the poster for reduced-motion visitors, who download no film at all |
| `static/js/hero-film.js` | Scroll-to-frame mapping |

### Sizing

The predecessor was 1920×1080 60 fps VP9 in WebM at **34.5 MB**, with no narrow
build, so a phone on mobile data paid 34.5 MB before reading a word. Three things
came out of that:

- **Resolution.** `.has-scroll-film .hero__film` resolves to about 1180 CSS px
  wide on a 900px-tall desktop viewport, so 1920 was never displayed. 1280 covers
  it at 1× and is close enough at 2×.
- **Frame rate.** The scrub is driven by scroll, not by time. 30 fps over the
  560svh of travel is roughly 8px of scroll per frame, below what anyone resolves
  while scrolling, and it halves the frame count.
- **Codec.** Every frame is a keyframe, so the file is nothing but stills and the
  codec's temporal compression never applies. That also means a near-static shot
  costs full price per frame: seconds 7 to 12 of this film barely move and are the
  most expensive part of it. If the film is ever re-cut, shortening that hold is
  the cheapest megabyte available.

`landing/tests.py::test_hero_assets_stay_within_budget` fails the build if these
grow past 9 MB and 5 MB.

### Why every frame is a keyframe

The scrub is nothing but seeks. On a sparse-GOP file each seek decodes forward
from the previous keyframe; on an all-intra file it decodes one frame. Measured
on the previous encode of this footage, a GOP-1 seek took 29 ms and a sparse-GOP
encode of the same film took 244 ms. The size is the price of that.

`data-fps` on the video element must match the file (30). The scrub seeks to
multiples of `1/FPS`; a value below the file's real rate lands between frames and
most of them never render. `hero-film.js` seeks to `(frame + .5) / FPS` because
container timestamps round, and an exact frame boundary can land on the frame
before. The scrub ends at `duration - 1/FPS`, which is the final-frame hold, not
a bug.

### Re-encoding

```bash
SRC=<the master>
ffmpeg -i "$SRC" -vf "fps=30,scale=1280:720:flags=lanczos" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -g 1 -bf 0 -crf 25 -preset slow \
  -movflags +faststart -an static/defex/assets/defex-intro-v3.mp4
ffmpeg -i "$SRC" -vf "fps=30,scale=854:480:flags=lanczos" \
  -c:v libx264 -profile:v high -pix_fmt yuv420p -g 1 -bf 0 -crf 25 -preset slow \
  -movflags +faststart -an static/defex/assets/defex-intro-v3-sm.mp4
```

`-g 1 -bf 0` is what makes every frame a keyframe. Drop either and the scrub
stutters on seeks.

### Posters

The poster must be frame 0, never the last frame. It is what a slow connection
shows, and an earlier build used the final frame, which made the hero look like
the film had already finished. Regenerate both from the **shipped** file, not the
master, so the poster and the first painted frame are the same pixels:

```bash
ffmpeg -i static/defex/assets/defex-intro-v3.mp4 -vf "select=eq(n\,0)" -vframes 1 f0.png
ffmpeg -sseof -0.1 -i static/defex/assets/defex-intro-v3.mp4 -update 1 -vframes 1 f1.png
cwebp -q 86 f0.png -o static/defex/assets/defex-poster-v3.webp
cwebp -q 86 f1.png -o static/defex/assets/defex-poster-final-v3.webp
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
film download**: `.hero` only becomes 560svh when JS adds `has-scroll-film`.

### Seeking

`hero-film.js` keeps one seek in flight at a time. Assigning `currentTime` on every
scroll frame queues seeks the decoder never catches up with, so a new seek is
only issued once `seeked` has fired. A watchdog clears the flag after 400 ms in
case the event is swallowed. iOS will not paint a seek until the element has
decoded once, so the first pointer or touch event does a muted `play()`/`pause()`
to unlock it.

## Origin clip

`.origin` holds one line of copy and the original vertical clip. It autoplays
muted when scrolled into view, pauses when it leaves, and has a single small
speaker control. The clip carries burned-in captions, so it reads fine with the
sound off. It is the only real footage on the site, which is why the home page
links to it from the "what exists today" band.

| Path | What |
|---|---|
| `static/video/origin.mp4` | 720×1280, 30 fps, H.264 + AAC, 50 s, 9.5 MB, `preload="none"` |
| `static/video/origin-poster.jpg` | Frame at 5.2 s |

## Theme

The whole site is dark in the hero and paper below it. `site.css` holds the
palette. Note that the film's own backdrop is close to `#030303`, not the page's
`#090F15`, so in landscape there is a faint seam where the letterboxed film meets
the section ground. The top and bottom mask gradients hide it at those edges.

## Checks

`python manage.py test` covers the pages, the hero assets and their size budget,
the share card, and byte ranges. `node --check` runs over `hero-film.js` and
`origin.js` in CI.

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

Range requests must stay enabled on the hero MP4s and on `origin.mp4`.
