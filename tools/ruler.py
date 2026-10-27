"""Shows a picked image big with a 10-pixel ruler, for reading crop lines and mount points: out/ruler-<name>.png"""
import pathlib, sys
from PIL import Image, ImageDraw
ROOT = pathlib.Path(__file__).resolve().parent.parent
for name in sys.argv[1:]:
    p = ROOT / 'art' / 'picked' / f'{name}.png'
    if not p.exists(): p = pathlib.Path(name)
    im = Image.open(p).convert('RGBA'); S = 5 if im.width <= 100 else 3
    out = Image.new('RGBA', (im.width * S + 40, im.height * S + 30), (40, 40, 60, 255))
    out.alpha_composite(im.resize((im.width * S, im.height * S), Image.NEAREST), (40, 30))
    d = ImageDraw.Draw(out)
    for x in range(0, im.width + 1, 10):
        d.line([(40 + x * S, 22), (40 + x * S, out.height)], fill=(255, 80, 80, 90)); d.text((40 + x * S + 1, 4), str(x), fill=(255, 200, 120, 255))
    for y in range(0, im.height + 1, 10):
        d.line([(30, 30 + y * S), (out.width, 30 + y * S)], fill=(80, 200, 255, 90)); d.text((2, 30 + y * S - 6), str(y), fill=(140, 220, 255, 255))
    out.save(ROOT / 'out' / f'ruler-{pathlib.Path(name).stem}.png')
