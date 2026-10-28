"""Tests the question banks in headless Chrome (tools/qtest.html loads them without the game).

    python tools/qtest.py                       # self-test every grade: prints anything malformed or that won't fit
    python tools/qtest.py 2 k --n 500           # just these grades, more samples per kind
    python tools/qtest.py 2 --sheet             # out/qtest/2-N.png: every kind's quiz panel, as the game draws it
    python tools/qtest.py 2 --sheet --board     # the chalkboards instead
    python tools/qtest.py 2 --sheet --kinds clock,coins --all    # some kinds, at all four difficulties

Grade ids: k, 1 to 8, hs, sat. Needs Playwright (with the installed Chrome) and Pillow.
"""
import base64, io, json, pathlib, sys
from PIL import Image
from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'out' / 'qtest'


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    args = sys.argv[1:]
    opt = lambda k, d=None: args[args.index(k) + 1] if k in args else d
    skip = {opt('--n'), opt('--kinds'), opt('--level')}
    ids = [a for a in args if not a.startswith('--') and a not in skip]
    with sync_playwright() as p:
        browser = p.chromium.launch(channel='chrome', headless=True)
        page = browser.new_page()
        errors = []
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('console', lambda m: m.type == 'error' and errors.append(m.text))
        page.goto((ROOT / 'tools' / 'qtest.html').as_uri())
        page.wait_for_function('window.ready === true', timeout=20000)
        if errors: print('page errors:', *errors, sep='\n  ')
        if '--sheet' in args:
            OUT.mkdir(parents=True, exist_ok=True)
            o = {'board': '--board' in args, 'all': '--all' in args, 'kinds': (opt('--kinds') or '').split(',') if opt('--kinds') else [],
                 'level': int(opt('--level')) if opt('--level') else 0}
            for gid in ids or ['sat']:
                cells = [Image.open(io.BytesIO(base64.b64decode(u.split(',')[1]))) for u in page.evaluate('([id, o]) => cells(id, o)', [gid, o])]
                tag = '-board' if o['board'] else ''
                for f in OUT.glob(f'{gid}-*.png'):
                    if f.stem.endswith('-board') == bool(tag): f.unlink()
                for n in range(0, len(cells), 4):
                    sheet = Image.new('RGB', (384 * 2 * 2 + 8, 224 * 2 * 2 + 8), (10, 10, 20))
                    for i, c in enumerate(cells[n:n + 4]):
                        sheet.paste(c.resize((768, 448), Image.NEAREST), ((i % 2) * 776, (i // 2) * 456))
                    path = OUT / f'{gid}-{n // 4 + 1}{tag}.png'
                    sheet.save(path)
                print(f'{gid}: {len(cells)} samples in {(len(cells) + 3) // 4} sheets, out/qtest/{gid}-*.png')
        else:
            print(json.dumps(page.evaluate('grades()')))
            bad = page.evaluate('([ids, n]) => selfTest(ids, n)', [ids, int(opt('--n', 300))])
            print('problems:', len(bad))
            for b in bad: print(json.dumps(b, ensure_ascii=False))
        browser.close()


if __name__ == '__main__':
    main()
