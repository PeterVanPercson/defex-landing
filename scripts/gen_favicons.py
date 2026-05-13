"""Generate favicon PNG variants from the defex mark (3 vertical dots).

Outputs:
    static/img/favicon-16.png
    static/img/favicon-32.png
    static/img/apple-touch-icon.png  (180x180, with cream background)
"""
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "static" / "img"

CREAM = (239, 235, 228)
INK = (15, 17, 21)
ACCENT = (255, 90, 31)


def render(size, bg=None, padding_ratio=0.18):
    """Render the 3-dot defex mark at the given size."""
    img = Image.new("RGBA", (size, size), bg if bg else (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    pad = int(size * padding_ratio)
    inner = size - 2 * pad
    # Three dots in a vertical column. Source viewBox: 20x64.
    # Scale to inner dimension by height (64 units = inner).
    unit = inner / 64
    r = 7 * unit
    cx = size / 2
    centers_y = [10 * unit + pad, 32 * unit + pad, 54 * unit + pad]
    colors = [INK, ACCENT, INK]
    for cy, fill in zip(centers_y, colors):
        d.ellipse([(cx - r, cy - r), (cx + r, cy + r)], fill=fill)
    return img


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)

    # Transparent favicons (16, 32) — render at 4× then downsample for crispness.
    for s in (16, 32):
        big = render(s * 4, bg=None, padding_ratio=0.22)
        small = big.resize((s, s), Image.LANCZOS)
        small.save(OUT_DIR / f"favicon-{s}.png", "PNG", optimize=True)
        print(f"wrote favicon-{s}.png  ({(OUT_DIR / f'favicon-{s}.png').stat().st_size} B)")

    # Apple touch icon — cream background, 180x180.
    apple = render(180 * 4, bg=CREAM + (255,), padding_ratio=0.32)
    apple_small = apple.resize((180, 180), Image.LANCZOS).convert("RGB")
    apple_small.save(OUT_DIR / "apple-touch-icon.png", "PNG", optimize=True)
    print(f"wrote apple-touch-icon.png  ({(OUT_DIR / 'apple-touch-icon.png').stat().st_size} B)")


if __name__ == "__main__":
    main()
