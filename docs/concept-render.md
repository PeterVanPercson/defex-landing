# Prototype concept animation

The video in the Why us page is an illustrative 3D concept, not footage of
working hardware. Its visible label remains “Concept render.”

`scripts/render_concept.py` builds the model, materials, lighting and motion
in Blender 4.5. The scene uses no external models or textures. It saves an
editable `.blend` file along with the rendered frames.

```sh
blender --background --factory-startup --python scripts/render_concept.py -- \
  --output /path/to/render --animation
```

For a single view, replace `--animation` with `--frame 115`. An optional
`--scale 50` renders at half resolution. The default is 1920 × 1080.

The six-second sequence runs at 30 fps:

- Frames 1–59: the gripper lowers the connector into its fixture.
- Frames 60–139: the test indicator changes from amber to green.
- Frames 140–180: the fingers open and the gripper retracts.

These timings match the existing scroll checkpoints in `static/js/why.js`.
Identical held frames reuse the same render. The website receives only the
compressed video and two WebP stills; it does not run Blender or load a 3D
model in the browser.

The delivered framing crops around the tool and fixture. Encode it with
H.264, a short GOP and fast-start metadata for seeking:

```sh
ffmpeg -framerate 30 -i /path/to/render/frames/frame-%04d.png \
  -c:v libx264 -preset slow -crf 25 -g 6 -keyint_min 6 -sc_threshold 0 \
  -vf 'crop=1680:945:120:135:exact=1,scale=1920:1080:out_color_matrix=bt709' \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 \
  -pix_fmt yuv420p -movflags +faststart -an static/why/story.mp4
cwebp -q 80 -m 6 -crop 120 135 1680 945 -resize 1920 1080 \
  /path/to/render/frames/frame-0001.png \
  -o static/why/story-first.webp
cwebp -q 80 -m 6 -crop 120 135 1680 945 -resize 1920 1080 \
  /path/to/render/frames/frame-0115.png \
  -o static/why/story-lit.webp
```

Keep the video below 2 MiB and each still below 80 KiB. Inspect the encoded
result, mobile framing, scroll seeking and reduced-motion fallback before
shipping. Bump `DEFEX_ASSET_VERSION` whenever these files change.

For local playback checks, run Django with `--nostatic` so WhiteNoise serves
the video with byte-range responses. Django's development static handler
does not support the seeking behavior used here.

```sh
DEBUG=True python manage.py runserver --nostatic
```
