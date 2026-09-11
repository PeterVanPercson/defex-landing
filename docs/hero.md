# Home page: the scroll-driven intro film and the origin clip

## Hero film

The homepage pins a silent video and maps native scroll position to its frames.
The animation is 15 seconds at 60 fps. Its last frame holds before the existing
560svh hero section releases. The page layout and scroll distance are unchanged.

| Path | Purpose |
| --- | --- |
| `static/defex/assets/defex-intro-scroll-v2.webm` | VP9, 1920 × 1080, 60 fps, 15 seconds, 900 frames and 900 keyframes; 34,533,719 bytes |
| `static/defex/assets/defex-first-frame-v2.webp` | Frame 0 of this film; initial poster and no-JavaScript fallback |
| `static/defex/assets/defex-final-frame-v2.webp` | Frame 899; static fallback for reduced-motion visitors |
| `static/js/hero-film.js` | Scroll mapping, one seek in flight, error and codec fallback |

This is the approved attached all-intra export, not the 4.66 MB long-GOP WebM. Every
frame is independently decodable. The exact video blob is also present on `hero-asset-drop`. The previous 8-second MP4s are removed: they
showed a different animation and must not be used as codec or mobile fallbacks.

### Frame timing and fallback

The video declares `data-fps="60"`, which drives the scrub interval. Seek targets
are inside each frame rather than on its boundary because WebM timestamps round
to milliseconds. The final target remains below the 15-second duration.

Only one seek runs at a time; the existing watchdog recovers a missing `seeked`
event. A media error removes the long sticky section. Browsers that cannot decode
VP9 keep the first poster without pinning. Reduced-motion visitors receive the
final still without downloading the video. A future mobile or H.264 alternative
must contain this same 900-frame animation.

All-intra encoding removes catch-up decoding but does not guarantee a rendered
update every 16.7 ms on every device. Validate actual scroll behavior in a browser.

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

## Serving, caching and checks

`vercel.json` explicitly publishes `static/**` with `@vercel/static`. The
filesystem route runs before Django, so the CDN serves video bytes and HTTP
range requests directly. Do not route the hero through the Python function.
WhiteNoise remains the local/other-host static server.

The v2 filenames avoid stale media even if a deployment overrides the asset
version. `DEFEX_ASSET_VERSION` defaults to 59 for the accompanying script update.

Run `python manage.py test`, JavaScript syntax checks, and `collectstatic`.
The smoke workflow boots Gunicorn with production settings, checks the real page
routes, and requires a 206 response with exactly 1024 bytes for a video range.
Do not use Django `runserver` to assess production video seeking. For local
Gunicorn/WhiteNoise checks, send `X-Forwarded-Proto: https` to honor the existing
HTTPS redirect configuration.

Before production, verify the preview's video metadata, initial/middle/final
scroll positions, backward scrolling, and successful byte-range delivery.
