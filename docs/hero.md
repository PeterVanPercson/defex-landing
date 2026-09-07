# Home page: the scroll-driven intro film and the origin clip

## Hero film

The hero is a plain `<video>` that is **never played**. It is pinned with
`position: sticky` for the height of `.hero` (420svh) and `static/js/hero-film.js`
maps the page's scroll position onto `video.currentTime`. Scrolling is watching,
so the whole eight seconds is visible however fast someone moves. This replaces
the earlier autoplay, where the film finished before a visitor had scrolled far
enough to see it.

| Path | What |
|---|---|
| `static/defex/assets/defex-intro-scroll.mp4` | 1440×810, 24 fps, H.264, silent, 8 s, **every frame a keyframe** |
| `static/defex/assets/defex-final-frame.webp` | Lossless frame 191, the poster and the no-JS fallback |
| `static/js/hero-film.js` | Scroll-to-frame mapping and the cadence lock |

### Why the film is re-encoded

The approved Cycles master (`~/Downloads/fec9355a-fff3-445f-b6da-b364b29bf786/dist/assets/defex-intro.mp4`,
1920×1080, SHA-256 `fc894f8b…`) has **one keyframe in 192 frames**. Seeking it
means decoding from frame 0 every time, which makes scrubbing unusable. The
shipped file is that master re-encoded all-intra (`-g 1`) at 1440 wide, CRF 22:
4.6 MB, 192 keyframes, instant seeks. Downscaling 25% and holding CRF low keeps
banding out of the dark gradients, which matters more here than pixel count.

The master is **not** byte-identical to what ships. It is preserved in the
package folder above and in this repo's git history, and is the file to re-encode
from if the scrub settings ever change. Do not treat `ASSET_MANIFEST.json` as a
check on the shipped file.

### Cadence

While the film is catching up it advances at a fixed ceiling, and that ceiling
has to divide the display refresh. At 1.35x on a 60Hz screen a frame was held
for 1.85 refreshes, so frames alternated 2, 1, 2, 2, 1 and stuttered even though
every frame was present. `hero-film.js` measures the refresh rate over 24
animation frames, snaps it to the nearest common value, and picks the ceiling so
`24 * rate` divides it exactly: 1.25 on 60/90/120/240Hz, 1.2 on 144Hz. In the
rate-limited branch it steps in whole refresh intervals rather than by the
measured delta, so a dropped frame cannot break the cadence. No pixels change.

### Seeking

`hero-film.js` keeps one seek in flight at a time. Assigning `currentTime` on every
scroll frame queues seeks the decoder never catches up with, so a new seek is
only issued once `seeked` has fired. iOS will not paint a seek until the element
has decoded once, so the first pointer or touch event does a muted
`play()`/`pause()` to unlock it.

Reduced-motion visitors get the last frame and no sticky section: `.hero` only
becomes 420svh when JS adds `has-scroll-film` to `<html>`.

## Origin clip

`.origin` holds one line of copy and the original vertical clip. It autoplays
muted when scrolled into view, pauses when it leaves, and has a single small
speaker control. The clip carries burned-in captions, so it reads fine with the
sound off.

| Path | What |
|---|---|
| `static/video/origin.mp4` | 720×1280, 30 fps, H.264 + AAC, 50 s, 9.5 MB, `preload="none"` |
| `static/video/origin-poster.jpg` | Frame at 5.2 s |

Source: `~/Downloads/CE9E6CF1-C530-4B81-B74A-FA25AE5C8F1E.MP4`, 2160×3840 HEVC
60 fps, 331 MB. HEVC does not play in Firefox or much of Chrome, so H.264 is not
optional here.

## Theme

The whole site is dark. `--bg: #090F15` is the film's own backdrop colour, so the
hero carries no seam against the page, and `--ink: #EAE8E3` is the robot's warm
ceramic. `site.css` holds the palette; `landing.css` re-declares the same tokens
for `/quality-review/`, which loads it after `site.css`.

## Checks

`python manage.py test` covers the page, both videos and the asset headers.
`node --check` runs over `hero-film.js` and `origin.js` in CI. Verify by hand that the film tracks
the scroll smoothly and that the speaker control unmutes.

## Serving and caching

WhiteNoise serves the assets through the existing Vercel Python function.
`DEFEX_ASSET_VERSION` is appended to media URLs; bump its default and any
environment override whenever those assets change. `site.css` has its own
version in `templates/base.html`. Range requests must stay enabled on both MP4s.
