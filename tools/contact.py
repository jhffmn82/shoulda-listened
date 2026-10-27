"""Contact sheets of PixelLab takes for picking: out/takes-<name>.png, each take labelled with its seed."""
import pathlib, sys
from PIL import Image, ImageDraw

ROOT = pathlib.Path(__file__).resolve().parent.parent


def sheet(names, out, scale=3, pattern='still-*.png'):
    rows = []
    for n in names:
        files = sorted((ROOT / 'art' / 'takes' / n).glob(pattern), key=lambda p: p.stat().st_mtime)
        if files: rows.append((n, files))
    cw = max(Image.open(f).width for _, fs in rows for f in fs) * scale + 12
    ch = max(Image.open(f).height for _, fs in rows for f in fs) * scale + 24
    cols = max(len(fs) for _, fs in rows)
    img = Image.new('RGBA', (cols * cw + 90, len(rows) * ch), (46, 46, 70, 255))
    d = ImageDraw.Draw(img)
    for r, (n, fs) in enumerate(rows):
        d.text((4, r * ch + 4), n, fill=(255, 255, 255, 255))
        for c, f in enumerate(fs):
            im = Image.open(f).convert('RGBA')
            img.alpha_composite(im.resize((im.width * scale, im.height * scale), Image.NEAREST), (90 + c * cw, r * ch + 4))
            d.text((90 + c * cw, r * ch + ch - 16), f.stem.split('-')[-1], fill=(255, 230, 120, 255))
    img.save(out)


if __name__ == '__main__':
    groups = [a.split(',') for a in sys.argv[2:]]
    sheet(sum(groups, []), sys.argv[1])
