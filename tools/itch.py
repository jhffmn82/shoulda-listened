"""Everything the itch.io page needs, in out/itch/:

    python tools/itch.py

  shoulda-listened-html5.zip   the game (index.html and js/), to upload as "played in the browser"
  cover.png                    630 x 500, the thumbnail on itch.io's listings
  banner.png                   960 x 270, the page's header image
  screenshot-*.png             1152 x 672, the game at 3x with its scanlines

Needs Playwright (with the installed Chrome) and Pillow. The images are drawn by the game itself.
"""
import base64, io, pathlib, time, zipfile
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'out' / 'itch'
JUMP = """(dx) => { const P = __game.Play; P.hero.x = P.S.encounters[P.next] + dx; P.cam = Math.max(0, P.hero.x - 130); }"""

# Draws the scene as it stands, without the score bar, into a 384 x 224 canvas. The callers
# then crop it and lay the logo over it at whole-pixel scale.
SCENE = """() => {
  const P = __game.Play, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  const hud = P.drawHud; P.drawHud = () => {}; P.draw(x); P.drawHud = hud;
  return c;
}"""
# Just the street at a camera position: no hero, no cars.
STREET = """(cam) => {
  const P = __game.Play, c = document.createElement('canvas'); c.width = W; c.height = H;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  World.drawBack(x, P.S, cam, 0); World.drawGround(x, P.S, cam, 0); World.drawLight(x, P.S, cam);
  return c;
}"""
LOGO = """(scene, w, h, sx, sy, scale, layout) => {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const x = c.getContext('2d'); x.imageSmoothingEnabled = false;
  x.fillStyle = '#0a0a22'; x.fillRect(0, 0, w, h);
  x.drawImage(scene, sx, sy);
  const g = x.createLinearGradient(0, 0, 0, layout.fade);
  g.addColorStop(0, 'rgba(5, 4, 18, .92)'); g.addColorStop(.75, 'rgba(5, 4, 18, .7)'); g.addColorStop(1, 'rgba(5, 4, 18, 0)');
  x.fillStyle = g; x.fillRect(0, 0, w, layout.fade);
  if (layout.dim) { x.fillStyle = `rgba(5, 4, 18, ${layout.dim})`; x.fillRect(0, 0, w, h); }
  let y = layout.top;
  for (const [s, sc, bands] of layout.lines) {
    const t = Font.big(s, sc, BANDS[bands]);
    x.drawImage(t, Math.round(w / 2 - t.width / 2), y); y += t.height + layout.gap;
  }
  // Up to full size, then a CRT's dark line under every row of game pixels.
  const out = document.createElement('canvas'); out.width = w * scale; out.height = h * scale;
  const o = out.getContext('2d'); o.imageSmoothingEnabled = false;
  o.drawImage(c, 0, 0, out.width, out.height);
  o.fillStyle = 'rgba(0, 0, 0, .22)';
  for (let r = scale - 1; r < out.height; r += scale) o.fillRect(0, r, out.width, 1);
  return out.toDataURL('image/png');
}"""


def save_data_url(url, path):
    path.write_bytes(base64.b64decode(url.split(',', 1)[1]))


def build_zip():
    z = OUT / 'shoulda-listened-html5.zip'
    files = [ROOT / 'index.html'] + sorted(p for p in (ROOT / 'js').rglob('*') if p.is_file())
    with zipfile.ZipFile(z, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as f:
        for p in files: f.write(p, p.relative_to(ROOT).as_posix())
    print(f'{z.name}: {len(files)} files, {z.stat().st_size // 1024} KB')


def images():
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        page = browser.new_page(viewport={'width': 1152, 'height': 720})
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.goto((ROOT / 'index.html').as_uri() + '#skip'); time.sleep(1)
        n = [0]

        def shot(name):
            n[0] += 1
            b = page.locator('#screen').bounding_box()
            page.screenshot(path=str(OUT / f'screenshot-{n[0]}-{name}.png'), clip={'x': round(b['x']), 'y': round(b['y']), 'width': 1152, 'height': 672})

        def wait(js, t=20):
            page.wait_for_function(js, timeout=t * 1000)

        # The title screen, with the logo dropped in and INSERT COIN lit.
        page.evaluate('__game.Game.go(__game.Attract, "title")')
        wait('__game.Attract.t > 1.4 && Math.floor(__game.Game.t * 2.4) % 2 === 0'); shot('title')
        # Into a game, with a score worth showing.
        page.keyboard.press('Enter'); time.sleep(3.4)
        page.evaluate('(() => { const P = __game.Play; P.score = 48200; P.inv.calc = 2; P.inv.coffee = true; P.inv.keeper = true; P.kicked = true; })()')
        # The stick-up: hero's hands up, gun out, "YO. POP QUIZ."
        page.evaluate(f'({JUMP})(1)')
        wait('__game.Play.E && __game.Play.E.phase === "talk"')
        page.evaluate('(() => { const E = __game.Play.E; E.line = "YO. POP QUIZ."; E.talkFor = 99; })()'); time.sleep(.5)
        shot('stick-up')
        scene = page.evaluate_handle(SCENE)
        save_data_url(page.evaluate(f'([s]) => ({LOGO})(s, 315, 250, -46, 26, 2, {{ top: 6, gap: 2, fade: 112, lines: [["SHOULDA", 3, "red"], ["LISTENED", 3, "red"], ["TO YOUR MATH TEACHER", 1, "gold"]] }})', [scene]), OUT / 'cover.png')
        street = page.evaluate_handle(f'({STREET})(__game.Play.S.buildings.find(b => b.kind === "near.pawn").x - 40)')
        save_data_url(page.evaluate(f'([s]) => ({LOGO})(s, 320, 90, -32, -26, 3, {{ top: 22, gap: 5, fade: 0, dim: .5, lines: [["SHOULDA LISTENED", 2, "red"], ["TO YOUR MATH TEACHER", 1, "gold"]] }})', [street]), OUT / 'banner.png')
        # A diagram question, with the TI-83 crossing two answers out.
        page.evaluate('__game.Play.E.talkFor = 0')
        wait('__game.Play.E.phase === "quiz"'); time.sleep(.4)
        page.evaluate('(() => { const P = __game.Play, q = __game.Questions.G.triangleAngles(2); q.level = 2; P.E.q = q; P.E.L = P.layout(q); P.E.time = 23.4; })()')
        page.keyboard.press('KeyX'); time.sleep(.6); shot('quiz')
        page.keyboard.press('ABCD'[page.evaluate('__game.Play.E.q.answer')])
        wait('__game.Play.phase === "walk"', 30)
        # A wrong answer, and the Trapper Keeper takes the bullet.
        page.evaluate(f'({JUMP})(1)')
        wait('__game.Play.E && __game.Play.E.phase === "quiz"', 30)
        page.keyboard.press('ABCD'[page.evaluate('(__game.Play.E.q.answer + 1) % 4')])
        wait('__game.Play.E && __game.Play.E.phase === "shot" && __game.Play.E.t > .55'); shot('blocked')
        wait('__game.Play.phase === "walk"', 30)
        # Another wrong answer, and no Trapper Keeper this time.
        page.evaluate(f'({JUMP})(1)')
        wait('__game.Play.E && __game.Play.E.phase === "quiz"', 30)
        page.keyboard.press('ABCD'[page.evaluate('(__game.Play.E.q.answer + 2) % 4')])
        wait('__game.Play.phase === "death" && __game.Play.D.t > 2.6', 30); shot('you-loose')
        page.keyboard.press('KeyZ'); time.sleep(1.2); shot('chalkboard')
        browser.close()
        if errors: print('page errors:', errors)
    for f in sorted(OUT.glob('*.png')):
        print(f'{f.name}: {Image.open(f).size[0]} x {Image.open(f).size[1]}')


if __name__ == '__main__':
    OUT.mkdir(parents=True, exist_ok=True)
    for f in OUT.glob('*.png'): f.unlink()
    build_zip()
    images()
