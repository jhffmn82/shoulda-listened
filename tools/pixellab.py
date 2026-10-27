"""Makes the game's sprites in PixelLab (https://api.pixellab.ai/v2) and packs them for the game.

The key is read from PIXELLAB_API_KEY, else from .secrets/pixellab-api-key.txt, and never printed.
Every request is logged, one line each, in art/calls.jsonl.

    python tools/pixellab.py balance                 # credits left (free)
    python tools/pixellab.py stills [name ...] [--takes 3]
                                                        # art/takes/<name>/still-<seed>.png for every asset in ART
    python tools/pixellab.py pick <name> <seed>      # art/picked/<name>.png is the take to use
    python tools/pixellab.py anims [name ...]        # animate the picked stills: art/takes/<name>/<clip>-<seed>.png strips
    python tools/pixellab.py pack                    # art/picked + the latest strips -> js/data/sprites.js
"""
import base64, io, json, os, pathlib, sys, threading, time, urllib.error, urllib.request
from concurrent.futures import ThreadPoolExecutor, as_completed
from PIL import Image

API = 'https://api.pixellab.ai/v2'
ROOT = pathlib.Path(__file__).resolve().parent.parent
ART = ROOT / 'art'
LOG = threading.Lock()

STYLE = '16-bit 1990s arcade beat em up sprite, crisp pixel art, bold black outline, night city lighting'
HERO = ('teenage boy, brown leather jacket over a white t-shirt, blue jeans, white high-top sneakers with a red stripe, '
        'brown swept-back hair')
GUNMAN = 'thug with a black knit beanie, thick mustache and an olive green army jacket'
# Every sprite: size is the canvas PixelLab draws on; clips animate the picked still (frames are even, 4 to 16).
ASSETS = {
    'hero': dict(size=(80, 80), view='side', direction='east',
                 text=f'{HERO}, full body, seen from the side in profile, facing right, arms relaxed at his sides, {STYLE}',
                 clips={'walk': ('walking forward at a steady pace, arms swinging', 8),
                        'idle': ('standing still, breathing, slight bob', 4),
                        'hands': ('raises both hands above his head in surrender, trembling with fear', 6),
                        'shot': ('is shot in the chest, jerks backward and falls flat on his back on the ground', 10),
                        'kick': ('a quick front kick with his right leg, then back to standing', 6),
                        'cheer': ('jumps and pumps his fist in the air, celebrating', 6)}),
    'gunman': dict(size=(64, 64), view='side', direction='west',
                   text=f'{GUNMAN}, waist up, leaning out to the left, arm straight out aiming a black pistol to the left, side view, {STYLE}',
                   clips={'fire': ('fires the pistol once, the arm kicks up with recoil, then aims again', 4),
                          'nod': ('lowers the pistol and nods slowly', 4)}),
    'gunman-water': dict(size=(64, 64), view='side', direction='west',
                         text=f'{GUNMAN}, waist up, leaning out to the left, aiming a big neon green and orange toy water pistol to the left, side view, {STYLE}',
                         clips={'fire': ('squirts the water pistol once, then aims again', 4),
                                'nod': ('lowers the water pistol and nods slowly', 4)}),
    'sedan': dict(size=(192, 80), view='side', direction='west',
                  text=f'black 1990s four-door sedan, boxy, chrome trim, side view facing left, no people, {STYLE}'),
    'taxi': dict(size=(192, 80), view='side', direction='west',
                 text=f'yellow 1990s New York City taxi cab sedan with a roof light, side view facing left, no people, {STYLE}'),
    'can': dict(size=(32, 32), text=f'dented metal city trash can with a lid, side view, {STYLE}'),
    'can-down': dict(size=(32, 32), text=f'metal trash can knocked over on its side, garbage spilling out, side view, {STYLE}'),
    'hydrant': dict(size=(32, 32), text=f'red fire hydrant, side view, {STYLE}'),
    'meter': dict(size=(32, 48), text=f'old parking meter on a pole, side view, {STYLE}'),
    'newsbox': dict(size=(32, 32), text=f'blue metal newspaper vending box, side view, {STYLE}'),
    'payphone': dict(size=(32, 64), text=f'1990s silver pay phone on a pole with a blue sign, side view, {STYLE}'),
    'mailbox': dict(size=(32, 32), text=f'blue street mailbox, side view, {STYLE}'),
    'lamp': dict(size=(48, 128), text=f'tall dark green city street lamp with a curved arm and a glowing lamp, side view, {STYLE}'),
    'calc': dict(size=(32, 32), text=f'black graphing calculator with a gray screen, item icon, {STYLE}'),
    'coffee': dict(size=(32, 32), text=f'blue and white paper coffee cup with a lid, steam rising, item icon, {STYLE}'),
    'keeper': dict(size=(32, 32), text=f'neon pink teal and yellow 1990s three-ring binder, item icon, {STYLE}'),
    'cash': dict(size=(32, 32), text=f'a folded green dollar bill, item icon, {STYLE}'),
    'rat': dict(size=(32, 32), view='side', direction='east',
                text=f'small gray city rat, a rodent on four legs with a long pink tail, running to the right, side view, {STYLE}',
                clips={'run': ('scurrying fast on four legs', 4)}),
}
# The city: building fronts stand on the sidewalk side by side; the sky and rooftops scroll behind them.
CITY = ('very detailed 1990s arcade side-scroller background art in the style of Final Fight and Streets of Rage, '
        'gritty New York street at night, front view facade, flat side-scroller perspective')
SHOP = 'front facade of a two-story old brick building; the ground floor is'
UP = 'one floor of lit and dark apartment windows above, cornice on top'
for name, size, text in [
    ('b-liquor', (160, 160), f'{SHOP} a liquor store with a yellow sign, a barred display window full of bottles and a red neon beer sign, a metal door; {UP}, fire escape'),
    ('b-bodega', (160, 160), f'{SHOP} a corner bodega with a red awning, fruit crates out front, a lit window covered in lottery and soda ads; {UP}'),
    ('b-pizza', (160, 160), f'{SHOP} a pizza parlor with a red and white striped awning, a neon open sign and a pizza oven glow inside; {UP}'),
    ('b-video', (160, 160), f'{SHOP} a video rental store with movie posters in the bright windows and a blue sign; {UP}, fire escape'),
    ('b-laundry', (160, 160), f'{SHOP} a laundromat with rows of washing machines behind big bright windows; {UP}'),
    ('b-barber', (144, 160), f'{SHOP} a barber shop with a red white and blue barber pole and a barber chair in the window; {UP}'),
    ('b-pawn', (144, 160), f'{SHOP} a pawn shop with security bars, a gold sign, guitars and jewelry in the window; {UP}'),
    ('b-arcade', (160, 160), f'{SHOP} a video arcade glowing with neon, arcade cabinets visible inside; {UP}'),
    ('b-chinese', (144, 160), f'{SHOP} a chinese takeout restaurant with a red sign, paper lanterns and a lit menu board; {UP}'),
    ('b-closed', (144, 160), f'{SHOP} a closed shop behind a metal roll-down security gate covered in colorful graffiti; {UP}, fire escape'),
    ('b-brownstone', (128, 160), 'front of a brownstone townhouse with a tall stoop staircase, black iron railings, lit lamps by the door, tall windows'),
    ('b-home', (128, 160), 'front of a cozy brownstone townhouse with warm light in every window, a welcoming lit front door at the top of the stoop, flower pots'),
    ('b-lot', (160, 160), 'a vacant lot behind a chain-link fence with barbed wire, weeds and rubble, and a big billboard on tall posts lit by two lamps'),
    ('b-alley', (48, 160), 'a narrow dark alley between two buildings with a green dumpster, trash bags and a fire escape ladder'),
]:
    ASSETS[name] = dict(size=size, view='side', text=f'{text}, {CITY}')
ASSETS['sky'] = dict(size=(400, 148), nobg=False, text='night city skyline panorama: distant skyscrapers with tiny lit windows, an art deco spire, '
                     f'a suspension bridge with strings of lights over a dark river, a full moon, a purple and navy night sky with stars, {CITY}')
ASSETS['roofs'] = dict(size=(200, 120), text='a row of old city tenement rooftops at night seen from the street, wooden rooftop water towers, '
                       f'chimneys, tv antennas, a few lit windows, dark blue and purple, {CITY}')
ASSETS['sidewalk'] = dict(size=(400, 76), nobg=False, text='side view of a city sidewalk of concrete slabs, the curb, and dark asphalt street below it at night, '
                          f'cracks, gum stains, a storm drain, wet reflections of streetlights, a long horizontal strip, {CITY}')


def key():
    k = os.environ.get('PIXELLAB_API_KEY')
    f = ROOT / '.secrets' / 'pixellab-api-key.txt'
    if not k and f.exists():
        k = f.read_text().strip()
    if not k:
        raise SystemExit('No PixelLab key: set PIXELLAB_API_KEY or put it in .secrets/pixellab-api-key.txt')
    return k


def call(method, path, body=None):
    data = json.dumps(body).encode() if body is not None else None
    fails = waits = 0
    while True:
        req = urllib.request.Request(API + path, method=method, data=data)
        req.add_header('Authorization', 'Bearer ' + key())
        req.add_header('Content-Type', 'application/json')
        try:
            with urllib.request.urlopen(req, timeout=180) as r:
                out = json.loads(r.read())
            log({'t': time.strftime('%Y-%m-%d %H:%M:%S'), 'call': f'{method} {path}', 'body': {k: v for k, v in (body or {}).items() if k not in ('first_frame', 'last_frame')}})
            return out
        except urllib.error.HTTPError as e:
            msg = e.read().decode(errors='replace')[:500]
            if e.code == 429 and 'concurrent' in msg and waits < 240:   # the account's job cap: wait for a slot
                waits += 1; time.sleep(30); continue
            if e.code in (429, 500, 502, 503, 504) and fails < 5:
                fails += 1; time.sleep(10 * fails); continue
            raise RuntimeError(f'{method} {path} -> {e.code}: {msg}')
        except (urllib.error.URLError, TimeoutError, ConnectionError):
            if fails < 5:
                fails += 1; time.sleep(10 * fails); continue
            raise


def log(entry):
    ART.mkdir(exist_ok=True)
    with LOG, open(ART / 'calls.jsonl', 'a') as f:
        f.write(json.dumps(entry) + '\n')


def b64(img):
    buf = io.BytesIO(); img.save(buf, 'PNG')
    return {'type': 'base64', 'base64': base64.b64encode(buf.getvalue()).decode(), 'format': 'png'}


def images(resp):
    imgs = resp.get('images') or ([resp['image']] if resp.get('image') else [])
    return [Image.open(io.BytesIO(base64.b64decode(i['base64'] if isinstance(i, dict) else i))).convert('RGBA') for i in imgs]


def job(path, body):
    """A request that may come back at once or as a background job to poll."""
    r = call('POST', path, body)
    jid = r.get('background_job_id')
    if not jid:
        return images(r.get('data', r)), r.get('usage')
    t0 = time.time()
    while True:
        time.sleep(4)
        r = call('GET', f'/background-jobs/{jid}')
        if r.get('status') == 'completed':
            break
        if r.get('status') in ('failed', 'cancelled'):
            raise RuntimeError(json.dumps(r)[:800])
        if time.time() - t0 > 1800:
            raise RuntimeError('timeout ' + jid)
    return images(r.get('last_response') or {}), r.get('usage')


def still(name, k):
    a = ASSETS[name]
    seed = (int(time.time() * 1000) + k * 7919) % 2_000_000_000
    body = {'description': a['text'], 'image_size': {'width': a['size'][0], 'height': a['size'][1]}, 'no_background': a.get('nobg', True),
            'seed': seed, 'outline': 'single color black outline', 'shading': 'medium shading', 'detail': 'medium detail'}
    if a.get('view'): body['view'] = a['view']
    if a.get('direction'): body['direction'] = a['direction']
    imgs, usage = job('/create-image-pixflux', body)
    d = ART / 'takes' / name; d.mkdir(parents=True, exist_ok=True)
    imgs[0].save(d / f'still-{seed}.png')
    return f'{name} still-{seed} {usage}'


def anim(name, clip, k):
    action, frames = ASSETS[name]['clips'][clip]
    first = Image.open(ART / 'picked' / f'{name}.png').convert('RGBA')
    seed = (int(time.time() * 1000) + k * 7919) % 2_000_000_000
    last = first if clip in ('idle', 'kick', 'fire', 'walk') else None
    body = {'first_frame': b64(first), 'action': action, 'frame_count': frames, 'seed': seed, 'no_background': True, 'drift_threshold': 0}
    if last is not None: body['last_frame'] = b64(last)
    imgs, usage = job('/animate-with-text-v3', body)
    if not imgs: raise RuntimeError(f'{name} {clip}: no frames')
    w, h = imgs[0].size
    strip = Image.new('RGBA', (w * len(imgs), h))
    for i, im in enumerate(imgs): strip.alpha_composite(im, (i * w, 0))
    d = ART / 'takes' / name; d.mkdir(parents=True, exist_ok=True)
    strip.save(d / f'{clip}-{seed}.png')
    return f'{name} {clip}-{seed} {len(imgs)} frames {usage}'


def run_all(tasks):
    with ThreadPoolExecutor(4) as ex:
        futs = {ex.submit(*t): t for t in tasks}
        for f in as_completed(futs):
            try: print(f.result(), flush=True)
            except Exception as e: print('FAIL', futs[f][1:], str(e)[:300], flush=True)


# ---- Packing: the picks, in one atlas embedded in js/data/sprites.js.
# Each entry: key, source under art/ (a glob picks the newest match), and options:
#   anchor (x, y) in the frame (default: the bottom middle of what's drawn in frame 1),
#   crop (x0, y0, x1, y1), trim (cut to what's drawn), mirror.
SHEET = [
    ('hero.walk', 'takes/hero/walking-east-2fecd4ec.png', {}),
    ('hero.idle', ['takes/hero/breathing-idle-east-*.png', 'picked/hero-east.png'], {}),
    ('hero.hands', 'takes/hero/hands-*.png', {}),
    ('hero.kick', 'takes/hero/kick-e-*.png', {}),
    ('hero.shot', 'takes/hero/shot-e-*.png', {}),
    ('hero.cheer', 'takes/hero/cheer-*.png', {}),
    ('gunman.aim', 'picked/gunman.png', {'anchor': (40, 40)}),
    ('gunman.fire', 'takes/gunman/fire-*.png', {'anchor': (40, 40)}),
    ('gunman.nod', 'takes/gunman/nod-*.png', {'anchor': (40, 40)}),
    ('water.aim', 'picked/gunman-water.png', {'anchor': (34, 40)}),
    ('water.fire', 'takes/gunman-water/fire-*.png', {'anchor': (34, 40)}),
    ('water.nod', 'takes/gunman-water/nod-*.png', {'anchor': (34, 40)}),
    ('car.sedan', 'picked/sedan.png', {'anchor': (0, 63), 'mount': (86, 46), 'sill': 34}),
    ('car.taxi', 'picked/taxi.png', {'anchor': (0, 63)}),
] + [(f'prop.{n}', f'picked/{n}.png', {'trim': True}) for n in
     ['can', 'can-down', 'hydrant', 'meter', 'newsbox', 'payphone', 'mailbox', 'lamp', 'calc', 'coffee', 'keeper', 'cash', 'rat']] + [
    ('bg.sky', 'picked/sky.png', {'crop': (0, 4, 400, 144)}),
    ('bg.roofs', 'picked/roofs.png', {'trim': True}),
    ('bg.sidewalk', 'picked/sidewalk.png', {'crop': (0, 22, 400, 60)}),
] + [(f'mid.{n[2:]}', f'picked/{n}.png', {'trim': True}) for n in
     ['b-liquor', 'b-bodega', 'b-pizza', 'b-video', 'b-laundry', 'b-barber', 'b-pawn', 'b-arcade', 'b-chinese', 'b-closed', 'b-brownstone', 'b-home', 'b-lot', 'b-alley']]
# Near storefronts: crop to the building, bottom edge on the sidewalk line (filled in after picking).
NEAR = {'liquor': (0, 0, 224, 133),
        'bodega': (0, 0, 224, 136),
        'pizza': (0, 0, 224, 135),
        'video': (0, 0, 224, 136),
        'laundry': (0, 0, 224, 135),
        'barber': (0, 0, 192, 136),
        'pawn': (0, 0, 192, 129),
        'arcade': (0, 0, 224, 136),
        'chinese': (0, 0, 192, 135),
        'closed': (0, 0, 192, 133),
        'brownstone': (0, 0, 160, 133),
        'home': (0, 0, 160, 134),
        'lot': (0, 0, 256, 133),
        'alley': (0, 0, 64, 136)}


def source(spec):
    for pat in (spec if isinstance(spec, list) else [spec]):
        hits = sorted(ART.glob(pat), key=lambda q: q.stat().st_mtime)
        if hits: return hits[-1]
    return None


def bbox(im, cut=40):
    return im.getchannel('A').point(lambda a: 255 if a > cut else 0).getbbox()


def pack():
    sheets, frames = [], {}
    entries = SHEET + [(f'near.{n}', f'picked/n-{n}.png', {'crop': c}) for n, c in NEAR.items()]
    for key, spec, o in entries:
        src = source(spec)
        if not src:
            print('missing', key); continue
        im = Image.open(src).convert('RGBA')
        fw = im.height if im.width >= 2 * im.height and im.width % im.height == 0 and not key.startswith(('bg.', 'mid.', 'near.')) else im.width
        ims = [im.crop((i * fw, 0, (i + 1) * fw, im.height)) for i in range(im.width // fw)]
        if o.get('crop'): ims = [i.crop(o['crop']) for i in ims]
        if o.get('trim'):
            bb = bbox(ims[0], 10); ims = [i.crop(bb) for i in ims]
        bb = bbox(ims[0]) or (0, 0, ims[0].width, ims[0].height)
        ax, ay = o.get('anchor') or ((bb[0] + bb[2]) // 2, bb[3] - 1)
        f = {'n': len(ims), 'w': ims[0].width, 'h': ims[0].height, 'ax': ax, 'ay': ay}
        for k in ('mount', 'sill'):
            if k in o: f[k] = o[k]
        if key.startswith(('gunman.aim', 'water.aim')):
            a = ims[0].getchannel('A').load()
            mx = next(x for x in range(ims[0].width) if any(a[x, y] > 40 for y in range(ims[0].height)))
            f['mx'], f['my'] = mx, next(y for y in range(ims[0].height) if a[mx, y] > 40)
        frames[key] = f
        sheets.append((key, ims))
    W = 2048
    x = y = rowh = 0
    place = {}
    for key, ims in sorted(sheets, key=lambda kv: -kv[1][0].height):
        w, h = ims[0].width * len(ims), ims[0].height
        if w > W: raise SystemExit(f'{key} is {w} px wide, wider than the {W} px atlas')
        if x + w > W: x, y, rowh = 0, y + rowh, 0
        place[key] = (x, y); x += w; rowh = max(rowh, h)
    atlas = Image.new('RGBA', (W, y + rowh))
    for key, ims in sheets:
        px, py = place[key]
        for i, im in enumerate(ims): atlas.alpha_composite(im, (px + i * im.width, py))
        frames[key].update(x=px, y=py)
    buf = io.BytesIO(); atlas.save(buf, 'PNG', optimize=True)
    out = ROOT / 'js' / 'data'; out.mkdir(exist_ok=True)
    data = base64.b64encode(buf.getvalue()).decode()
    (out / 'sprites.js').write_text(
        '// Made by tools/pixellab.py pack: the PixelLab sprites and backgrounds in one atlas.\n'
        f'const SPRITE_ATLAS = {{ png: "data:image/png;base64,{data}",\n  frames: {json.dumps(frames)} }};\n')
    atlas.save(ART / 'atlas.png')
    print(f'packed {len(frames)} entries, atlas {atlas.width} x {atlas.height}, {len(data) // 1024} KB')


def main():
    args = sys.argv[1:]
    if not args: raise SystemExit(__doc__)
    takes = int(args[args.index('--takes') + 1]) if '--takes' in args else 3
    names = [a for a in args[1:] if a in ASSETS]
    unknown = [a for a in args[1:] if a not in ASSETS and not a.startswith('--') and not a.isdigit()]
    if args[0] in ('stills', 'anims') and unknown:
        raise SystemExit(f'unknown assets: {unknown}')    # never fall back to making everything
    if args[0] == 'balance':
        print(json.dumps(call('GET', '/balance'), indent=1))
    elif args[0] == 'stills':
        run_all([(still, n, k) for n in (names or ASSETS) for k in range(takes)])
    elif args[0] == 'pick':
        name, seed = args[1], args[2]
        src = next((ART / 'takes' / name).glob(f'*{seed}*.png'))
        (ART / 'picked').mkdir(parents=True, exist_ok=True)
        dest = ART / 'picked' / (f'{name}.png' if src.stem.startswith('still') else f'{name}.{src.stem.split("-")[0]}.png')
        Image.open(src).save(dest)
        print('picked', src.name, '->', dest.name)
    elif args[0] == 'anims':
        run_all([(anim, n, c, 0) for n in (names or ASSETS) if (ART / 'picked' / f'{n}.png').exists() for c in ASSETS[n].get('clips', {})])
    elif args[0] == 'pack':
        pack()
    else:
        raise SystemExit(__doc__)



# ---- Characters: a 4-direction character keeps the picked look and gives a true side profile for template walks.

def fetch(url):
    # PixelLab's file host turns away Python's default user agent.
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (shoulda-listened art tools)'})
    with urllib.request.urlopen(req, timeout=120) as r:
        return Image.open(io.BytesIO(r.read())).convert('RGBA')


def wait_job(jid):
    t0 = time.time()
    while True:
        time.sleep(5)
        r = call('GET', f'/background-jobs/{jid}')
        if r.get('status') == 'completed': return r
        if r.get('status') in ('failed', 'cancelled'): raise RuntimeError(json.dumps(r)[:800])
        if time.time() - t0 > 1800: raise RuntimeError('timeout ' + jid)


def character(name):
    """Create the 4-direction character from art/picked/<name>.png as its south view; saves its id and rotations."""
    a = ASSETS[name]
    south = Image.open(ART / 'picked' / f'{name}.png').convert('RGBA')
    r = call('POST', '/create-character-with-4-directions', {
        'description': a['text'].split(', full body')[0], 'image_size': {'width': south.width, 'height': south.height}, 'view': 'side',
        'outline': 'single color black outline', 'shading': 'medium shading', 'detail': 'medium detail', 'directions': {'south': b64(south)}})
    cid = r['character_id']
    wait_job(r['background_job_id'])
    c = call('GET', f'/characters/{cid}')
    d = ART / 'takes' / name; d.mkdir(parents=True, exist_ok=True)
    for direction, url in (c.get('rotation_urls') or {}).items():
        if url: fetch(url).save(d / f'rot-{direction}.png')
    (d / 'character.json').write_text(json.dumps({'id': cid, 'usage': r.get('usage')}, indent=1))
    return cid


def template_anim(name, template, direction='east'):
    cid = json.loads((ART / 'takes' / name / 'character.json').read_text())['id']
    r = call('POST', '/animate-character', {'character_id': cid, 'mode': 'template', 'template_animation_id': template, 'directions': [direction]})
    for jid in r.get('background_job_ids') or [r['background_job_id']]: wait_job(jid)
    c = call('GET', f'/characters/{cid}')
    (ART / 'takes' / name / 'character-full.json').write_text(json.dumps(c, indent=1)[:200000])
    return r.get('usage')


def save_char_anims(name):
    """Download every animation of the character as strips: art/takes/<name>/<type>-<group>.png."""
    cid = json.loads((ART / 'takes' / name / 'character.json').read_text())['id']
    c = call('GET', f'/characters/{cid}')
    out = []
    for g in c.get('animations') or []:
        for dset in g['directions']:
            ims = [fetch(u) for u in dset['frames']]
            w, h = ims[0].size
            strip = Image.new('RGBA', (w * len(ims), h))
            for i, im in enumerate(ims): strip.alpha_composite(im, (i * w, 0))
            f = ART / 'takes' / name / f"{g['animation_type']}-{dset['direction']}-{g['animation_group_id'][:8]}.png"
            strip.save(f); out.append(f.name)
    return out


# ---- Close-ups: storefronts at the hero's scale (a door a little taller than he is), the near layer of the street.
CLOSE = ('close-up of a street-level storefront seen straight on, flat front view, the shop door is tall, '
         'the bottom of the brick apartment windows above shows at the top, sidewalk edge at the bottom')
for name, size, text in [
    ('n-liquor', (224, 160), 'a liquor store with a yellow LIQUOR sign, a barred display window full of bottles, a red neon BEER sign, a metal door'),
    ('n-bodega', (224, 160), 'a corner bodega with a red awning, fruit crates out front, a lit window covered in lottery and soda ads, an ice cream sticker on the door'),
    ('n-pizza', (224, 160), 'a pizza parlor with a red and white striped awning, a PIZZA sign, a neon OPEN sign, a counter and a pizza oven glowing inside'),
    ('n-video', (224, 160), 'a video rental store with a blue VIDEO sign and movie posters in the bright windows, shelves of tapes inside'),
    ('n-laundry', (224, 160), 'a laundromat with a teal sign and rows of round washing machines behind big bright windows'),
    ('n-barber', (192, 160), 'a barber shop with a spinning red white and blue barber pole beside the door and a barber chair in the window'),
    ('n-pawn', (192, 160), 'a pawn shop with a gold PAWN sign, security bars, guitars, radios and jewelry in the window'),
    ('n-arcade', (224, 160), 'a video arcade with a glowing ARCADE sign, neon lights, rows of arcade cabinets visible inside'),
    ('n-chinese', (192, 160), 'a chinese takeout restaurant with a red sign, red paper lanterns and a lit menu board in the window'),
    ('n-closed', (192, 160), 'a closed shop behind a metal roll-down security gate covered in colorful graffiti, a faded sign above'),
    ('n-brownstone', (160, 160), 'the front stoop of a brownstone townhouse: stone steps up to a heavy wooden door, black iron railings, a lamp beside the door, a basement window under the stoop'),
    ('n-home', (160, 160), 'the front stoop of a cozy brownstone townhouse: stone steps up to a welcoming lit front door, a glowing lamp, flower pots on the steps, warm lit windows'),
    ('n-lot', (256, 160), 'a vacant lot behind a chain-link fence with barbed wire on top, weeds, rubble and an old tire, open to the night sky'),
    ('n-alley', (64, 160), 'the mouth of a narrow dark alley between two brick walls with a green dumpster, trash bags and a fire escape ladder'),
]:
    ASSETS[name] = dict(size=size, view='side', text=f'{CLOSE}: {text}, {CITY}')


if __name__ == '__main__':
    main()
