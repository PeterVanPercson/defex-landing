"""One-shot generator for the Open Graph card image.

Output: static/img/og.png (1200×630, cream + paper grid).
Run from repo root:  python3 scripts/gen_og.py
"""
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "static" / "img" / "og.png"
W, H = 1200, 630

CREAM = (239, 235, 228)
INK = (15, 17, 21)
MUTE = (122, 123, 127)
ACCENT = (255, 90, 31)
GRID = (15, 17, 21, 16)   # ~6% ink

HELV = "/System/Library/Fonts/Helvetica.ttc"
MONO = "/System/Library/Fonts/Menlo.ttc"
SERIF = "/Library/Fonts/Georgia.ttf"
if not Path(SERIF).exists():
    SERIF = "/System/Library/Fonts/Supplemental/Georgia Italic.ttf"
    if not Path(SERIF).exists():
        SERIF = HELV  # fallback


def font(path, size, index=0):
    try:
        return ImageFont.truetype(path, size, index=index)
    except Exception:
        return ImageFont.load_default()


def main():
    img = Image.new("RGB", (W, H), CREAM)

    # paper grid (32px)
    grid = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grid)
    for x in range(0, W, 32):
        gd.line([(x, 0), (x, H)], fill=GRID, width=1)
    for y in range(0, H, 32):
        gd.line([(0, y), (W, y)], fill=GRID, width=1)
    img.paste(grid, (0, 0), grid)

    d = ImageDraw.Draw(img)

    # top-left section marker chip
    f_chip_num = font(HELV, 18, index=1)   # bold
    f_chip_mono = font(MONO, 16)
    d.rectangle([(72, 64), (112, 100)], fill=INK)
    d.text((82, 72), "00", fill=CREAM, font=f_chip_num)
    d.text((128, 76), "DEFEX · FACTORY VISION INFRASTRUCTURE",
           fill=INK, font=f_chip_mono)

    # main headline — "the defect / is the · mark."
    f_head = font(HELV, 160, index=1)   # Helvetica Bold
    f_soft = font(SERIF, 130)           # Georgia (italic fallback)

    d.text((72, 156), "the defect", fill=INK, font=f_head)

    line2_y = 320
    # italic "is the" in serif, muted
    x = 72
    d.text((x, line2_y + 10), "is the", fill=MUTE, font=f_soft)
    bbox_is = d.textbbox((x, line2_y + 10), "is the", font=f_soft)
    x = bbox_is[2] + 24
    d.text((x, line2_y), "mark", fill=INK, font=f_head)
    bbox_mark = d.textbbox((x, line2_y), "mark", font=f_head)
    # period
    d.text((bbox_mark[2] + 4, line2_y), ".", fill=INK, font=f_head)
    # orange dot
    dot_x = bbox_mark[2] + 30
    dot_y = line2_y + 130
    d.ellipse([(dot_x, dot_y), (dot_x + 22, dot_y + 22)], fill=ACCENT)

    # bottom-right url
    f_url = font(MONO, 18)
    url = "defex.app"
    bb = d.textbbox((0, 0), url, font=f_url)
    d.text((W - 72 - (bb[2] - bb[0]), H - 96), url, fill=INK, font=f_url)

    # bottom-left tagline
    f_tag = font(MONO, 15)
    d.text((72, H - 96), "we replace QC inspectors with AI vision",
           fill=MUTE, font=f_tag)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.save(OUT, "PNG", optimize=True)
    print(f"wrote {OUT}  ({OUT.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
