"""Makes the game's sprites in PixelLab (https://api.pixellab.ai/v2) and packs them for the game.

The key is read from PIXELLAB_API_KEY, else from .secrets/pixellab-api-key.txt, and never printed.
Every request is logged, one line each, in art/calls.jsonl.

    python -I tools/pixellab.py balance                 # credits left (free)
    python -I tools/pixellab.py stills [name ...] [--takes 3]
                                                        # art/takes/<name>/still-<seed>.png for every asset in ART
    python -I tools/pixellab.py pick <name> <seed>      # art/picked/<name>.png is the take to use
    python -I tools/pixellab.py anims [name ...]        # animate the picked stills: art/takes/<name>/<clip>-<seed>.png strips
    python -I tools/pixellab.py pack                    # art/picked + the latest strips -> js/data/sprites.js
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
                 text=f'{HERO}, standing, side view facing right, full body, {STYLE}',
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
    'rat': dict(size=(32, 32), view='side', direction='east', text=f'gray city rat running to the right, side view, {STYLE}',
                clips={'run': ('scurrying fast', 4)}),
}


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
    body = {'description': a['text'], 'image_size': {'width': a['size'][0], 'height': a['size'][1]}, 'no_background': True,
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


# ---- Packing: every picked still and the newest strip of each clip into one atlas, embedded in js/data/sprites.js.

def bbox(im):
    return im.getchannel('A').point(lambda a: 255 if a > 40 else 0).getbbox()


def pack():
    picked = ART / 'picked'
    frames, sheets = {}, []
    for p in sorted(picked.glob('*.png')):
        name = p.stem
        im = Image.open(p).convert('RGBA')
        bb = bbox(im) or (0, 0, im.width, im.height)
        # The anchor: the bottom middle of what's drawn (feet on the ground; a car's tires).
        ax, ay = (bb[0] + bb[2]) // 2, bb[3] - 1
        clips = {'still': [im]}
        for clip in ASSETS.get(name, {}).get('clips', {}):
            strips = sorted((ART / 'takes' / name).glob(f'{clip}-*.png'), key=lambda q: q.stat().st_mtime)
            chosen = picked / f'{name}.{clip}.png'
            src = chosen if chosen.exists() else (strips[-1] if strips else None)
            if src:
                s = Image.open(src).convert('RGBA')
                clips[clip] = [s.crop((i * im.width, 0, (i + 1) * im.width, im.height)) for i in range(s.width // im.width)]
        for clip, ims in clips.items():
            frames[f'{name}.{clip}'] = {'n': len(ims), 'w': im.width, 'h': im.height, 'ax': ax, 'ay': ay}
            sheets.append((f'{name}.{clip}', ims))
        if name.startswith('gunman'):
            # The muzzle: the leftmost drawn pixel in the gun's rows of the still.
            a = im.getchannel('A').load()
            mx = next((x for x in range(im.width) for y in range(im.height) if a[x, y] > 40), 0)
            my = next((y for y in range(im.height) if a[mx, y] > 40), 0)
            frames[f'{name}.still'].update(mx=mx, my=my)
    # Shelf-pack the strips.
    W = 1024
    x = y = rowh = 0
    place = {}
    for key, ims in sheets:
        w, h = ims[0].width * len(ims), ims[0].height
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
        '// Made by tools/pixellab.py pack from art/picked: the PixelLab sprites, one atlas.\n'
        f'const SPRITE_ATLAS = {{ png: "data:image/png;base64,{data}",\n  frames: {json.dumps(frames, indent=1)} }};\n')
    atlas.save(ART / 'atlas.png')
    print(f'packed {len(frames)} clips, atlas {atlas.width} x {atlas.height}, {len(data) // 1024} KB')


def main():
    args = sys.argv[1:]
    if not args: raise SystemExit(__doc__)
    takes = int(args[args.index('--takes') + 1]) if '--takes' in args else 3
    names = [a for a in args[1:] if a in ASSETS]
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


if __name__ == '__main__':
    main()
